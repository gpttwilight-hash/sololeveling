# Living System Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Добавить три механики ежедневного pull-вовлечения: Daily Dispatch (персональное сообщение + задание дня), Portal of the Day (данжен на 24ч из 3 шагов) и Живой профиль (аура + milestone-события).

**Architecture:** Три независимых блока на дашборде. Вся логика выбора — детерминированные TypeScript-функции без внешних API. Данные хранятся в трёх новых Supabase-таблицах. Server Actions обрабатывают завершение.

**Tech Stack:** Next.js 16 App Router · TypeScript strict · Supabase · Framer Motion · Tailwind CSS 4 · Vitest (добавляем для тестов game logic)

**Spec:** `docs/superpowers/specs/2026-03-11-living-system-design.md`

---

## Файловая структура

```
Создать:
  supabase/migrations/011_living_system.sql
  src/lib/game/dispatch-templates.ts       ← 60 шаблонов Dispatch
  src/lib/game/portal-templates.ts         ← 30 шаблонов порталов
  src/lib/game/milestone-templates.ts      ← milestone тексты + логика
  src/lib/game/dispatch-selector.ts        ← selectDispatch(profile, date)
  src/lib/game/portal-selector.ts          ← getPortalForDate(date)
  src/lib/game/aura-calculator.ts          ← getAuraState(profile)
  src/components/dashboard/dispatch-card.tsx
  src/components/dashboard/portal-card.tsx
  src/components/dashboard/milestone-overlay.tsx
  __tests__/dispatch-selector.test.ts
  __tests__/portal-selector.test.ts
  __tests__/aura-calculator.test.ts
  vitest.config.ts

Изменить:
  package.json                             ← добавить vitest
  src/app/(app)/actions.ts                 ← completeDispatch, completePortalStep
  src/app/(app)/dashboard/page.tsx         ← fetch dispatch + portal + milestone
  src/components/dashboard/profile-card.tsx← аура + ежедневная фраза
```

---

## Chunk 1: База данных и шаблоны

### Task 1: Миграция БД

**Files:**
- Create: `supabase/migrations/011_living_system.sql`

- [ ] **Шаг 1: Создать файл миграции**

```sql
-- supabase/migrations/011_living_system.sql

-- 1. daily_dispatch: одна запись на пользователя на день
CREATE TABLE IF NOT EXISTS daily_dispatch (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  template_id     TEXT NOT NULL,
  narrative_text  TEXT NOT NULL,
  bonus_quest_title TEXT NOT NULL,
  bonus_quest_xp  INT NOT NULL DEFAULT 30,
  bonus_quest_coins INT NOT NULL DEFAULT 15,
  attribute_focus TEXT NOT NULL CHECK (attribute_focus IN ('str','int','cha','dis','wlt')),
  is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at      TIMESTAMPTZ NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, date)
);

ALTER TABLE daily_dispatch ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own dispatch" ON daily_dispatch
  FOR ALL USING (auth.uid() = user_id);

-- 2. portal_templates: глобальный пул порталов (30 штук, заполняется через seed)
CREATE TABLE IF NOT EXISTS portal_templates (
  id          TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  attribute   TEXT NOT NULL CHECK (attribute IN ('str','int','cha','dis','wlt')),
  step1_title TEXT NOT NULL,
  step1_desc  TEXT,
  step1_xp    INT NOT NULL DEFAULT 20,
  step2_title TEXT NOT NULL,
  step2_desc  TEXT,
  step2_xp    INT NOT NULL DEFAULT 30,
  step3_title TEXT NOT NULL,
  step3_desc  TEXT,
  step3_xp    INT NOT NULL DEFAULT 50,
  badge_name  TEXT NOT NULL,
  total_xp    INT GENERATED ALWAYS AS (step1_xp + step2_xp + step3_xp) STORED
);

-- portal_templates доступны всем авторизованным (read-only)
ALTER TABLE portal_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read portal templates" ON portal_templates
  FOR SELECT USING (auth.role() = 'authenticated');

-- 3. user_portal_progress: прогресс пользователя по порталу дня
CREATE TABLE IF NOT EXISTS user_portal_progress (
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date            DATE NOT NULL,
  template_id     TEXT NOT NULL REFERENCES portal_templates(id),
  steps_completed INT NOT NULL DEFAULT 0 CHECK (steps_completed BETWEEN 0 AND 3),
  is_finished     BOOLEAN NOT NULL DEFAULT FALSE,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  finished_at     TIMESTAMPTZ,
  PRIMARY KEY (user_id, date)
);

ALTER TABLE user_portal_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own portal progress" ON user_portal_progress
  FOR ALL USING (auth.uid() = user_id);

-- 4. Добавить milestone tracking в profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS last_milestone_shown INT NOT NULL DEFAULT 0;

-- 5. Индексы
CREATE INDEX IF NOT EXISTS idx_daily_dispatch_user_date ON daily_dispatch(user_id, date);
CREATE INDEX IF NOT EXISTS idx_portal_progress_user_date ON user_portal_progress(user_id, date);
```

- [ ] **Шаг 2: Применить миграцию локально**

```bash
# Если используется Supabase CLI:
supabase db push
# Или применить SQL вручную в Supabase Dashboard → SQL Editor
```

Ожидаемый результат: 3 новые таблицы созданы, колонка `last_milestone_shown` добавлена в `profiles`.

- [ ] **Шаг 3: Commit**

```bash
git add supabase/migrations/011_living_system.sql
git commit -m "feat(db): add living system tables — dispatch, portal, milestone"
```

---

### Task 2: Шаблоны Dispatch (60 штук)

**Files:**
- Create: `src/lib/game/dispatch-templates.ts`

Шаблоны организованы по матрице `rankTier × streakBand`. Алгоритм выбора использует `templateId = hash(userId + date)` для детерминированного, но разнообразного выбора внутри корзины.

- [ ] **Шаг 1: Создать файл с типами и шаблонами**

```typescript
// src/lib/game/dispatch-templates.ts

export type RankTier = "E" | "D" | "C" | "B" | "A" | "S";
export type StreakBand = "zero" | "early" | "growing" | "strong" | "veteran" | "legend";
export type AttributeKey = "str" | "int" | "cha" | "dis" | "wlt";

export interface DispatchTemplate {
  id: string;
  rankTier: RankTier | "any";
  streakBand: StreakBand | "any";
  narrativeText: string;         // текст от Системы (1-3 предложения)
  bonusQuestTitle: string;       // название задания дня
  bonusQuestAttribute: AttributeKey | "focus"; // "focus" = атрибут дня
}

// Атрибут дня: детерминированный цикл 5 дней
export const ATTRIBUTE_CYCLE: AttributeKey[] = ["str", "int", "cha", "dis", "wlt"];

export function getAttributeOfDay(date: Date): AttributeKey {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return ATTRIBUTE_CYCLE[dayOfYear % 5];
}

// Названия атрибутов для нарратива
export const ATTR_NAMES: Record<AttributeKey, string> = {
  str: "Силы",
  int: "Интеллекта",
  cha: "Харизмы",
  dis: "Дисциплины",
  wlt: "Богатства",
};

// 60 шаблонов — разбиты по рангу и полосе стрика
export const DISPATCH_TEMPLATES: DispatchTemplate[] = [
  // ─── СТРИК = 0 (пауза / возврат) ───────────────────────────────────────
  {
    id: "d-zero-1",
    rankTier: "any",
    streakBand: "zero",
    narrativeText: "Система фиксирует паузу. Это не конец — каждый великий охотник падал. Разница в том, кто встаёт.",
    bonusQuestTitle: "Сделай одно простое дело прямо сейчас",
    bonusQuestAttribute: "dis",
  },
  {
    id: "d-zero-2",
    rankTier: "any",
    streakBand: "zero",
    narrativeText: "Система не наказывает за паузу. Но Система ждёт твоего возвращения. Сегодня — первый шаг.",
    bonusQuestTitle: "Напиши одну цель на этот день",
    bonusQuestAttribute: "int",
  },
  {
    id: "d-zero-3",
    rankTier: "any",
    streakBand: "zero",
    narrativeText: "Охотник без движения — это охотник, которого обгоняют другие. Система открывает новый цикл.",
    bonusQuestTitle: "Выйди на улицу на 10 минут",
    bonusQuestAttribute: "str",
  },
  {
    id: "d-zero-4",
    rankTier: "any",
    streakBand: "zero",
    narrativeText: "Каждое утро — новый шанс. Система сбросила счётчик. Начни с малого, финишируй с гордостью.",
    bonusQuestTitle: "Выпей воду и сделай 5 минут растяжки",
    bonusQuestAttribute: "str",
  },

  // ─── СТРИК = 1-2 (начало) ───────────────────────────────────────────────
  {
    id: "d-early-1",
    rankTier: "any",
    streakBand: "early",
    narrativeText: "Система фиксирует активность. Первые дни — фундамент. Не останавливайся.",
    bonusQuestTitle: "Выполни одну задачу, которую откладывал",
    bonusQuestAttribute: "focus",
  },
  {
    id: "d-early-2",
    rankTier: "any",
    streakBand: "early",
    narrativeText: "Охотник начал движение. Система наблюдает. День второй — ключевой для формирования привычки.",
    bonusQuestTitle: "Установи время для главной привычки дня",
    bonusQuestAttribute: "dis",
  },
  {
    id: "d-early-3",
    rankTier: "E",
    streakBand: "early",
    narrativeText: "Ранг E — начало пути. Система регистрирует потенциал. Докажи, что ты не остановишься на первых днях.",
    bonusQuestTitle: "Сделай 20 отжиманий или их замену",
    bonusQuestAttribute: "str",
  },
  {
    id: "d-early-4",
    rankTier: "D",
    streakBand: "early",
    narrativeText: "Охотник ранга D знает цену последовательности. Продолжай — путь к рангу C требует стабильности.",
    bonusQuestTitle: "Потрать 15 минут на обучение новому навыку",
    bonusQuestAttribute: "int",
  },

  // ─── СТРИК = 3-6 (рост) ─────────────────────────────────────────────────
  {
    id: "d-growing-1",
    rankTier: "any",
    streakBand: "growing",
    narrativeText: "Система фиксирует формирование паттерна. Три дня — порог осознания. Семь дней — привычка.",
    bonusQuestTitle: "Сделай что-то, что развивает атрибут дня",
    bonusQuestAttribute: "focus",
  },
  {
    id: "d-growing-2",
    rankTier: "any",
    streakBand: "growing",
    narrativeText: "Охотник набирает темп. Система анализирует траекторию роста. Результаты формируются сейчас.",
    bonusQuestTitle: "Запиши прогресс за последние 3 дня",
    bonusQuestAttribute: "int",
  },
  {
    id: "d-growing-3",
    rankTier: "E",
    streakBand: "growing",
    narrativeText: "Ранг E с устойчивым стриком — редкость. Система отмечает твою настойчивость.",
    bonusQuestTitle: "Медитируй или практикуй осознанность 10 минут",
    bonusQuestAttribute: "dis",
  },
  {
    id: "d-growing-4",
    rankTier: "D",
    streakBand: "growing",
    narrativeText: "Пять дней подряд — это уже характер, а не случайность. Ранг C становится ближе.",
    bonusQuestTitle: "Пообщайся с кем-то, кто вдохновляет тебя",
    bonusQuestAttribute: "cha",
  },
  {
    id: "d-growing-5",
    rankTier: "C",
    streakBand: "growing",
    narrativeText: "Ветеран не теряет темп. Система ожидает стабильного роста всех пяти атрибутов.",
    bonusQuestTitle: "Уделите 20 минут самому слабому атрибуту",
    bonusQuestAttribute: "focus",
  },

  // ─── СТРИК = 7-13 (сильный) ─────────────────────────────────────────────
  {
    id: "d-strong-1",
    rankTier: "any",
    streakBand: "strong",
    narrativeText: "Семь дней непрерывного роста. Система активирует расширенный мониторинг. Ты становишься заметным.",
    bonusQuestTitle: "Сделай что-то за пределами зоны комфорта",
    bonusQuestAttribute: "cha",
  },
  {
    id: "d-strong-2",
    rankTier: "any",
    streakBand: "strong",
    narrativeText: "Неделя позади. Большинство сдаются раньше. Ты — в меньшинстве, которое меняет жизнь.",
    bonusQuestTitle: "Установи амбициозную цель на следующую неделю",
    bonusQuestAttribute: "int",
  },
  {
    id: "d-strong-3",
    rankTier: "D",
    streakBand: "strong",
    narrativeText: "Охотник ранга D с недельным стриком показывает признаки ранга C. Система оценивает готовность.",
    bonusQuestTitle: "Прочитай 10 страниц книги по своей цели",
    bonusQuestAttribute: "int",
  },
  {
    id: "d-strong-4",
    rankTier: "C",
    streakBand: "strong",
    narrativeText: "Ветеран держит темп. Система повышает сложность испытаний — это знак уважения.",
    bonusQuestTitle: "Выполни тренировку на 30+ минут",
    bonusQuestAttribute: "str",
  },
  {
    id: "d-strong-5",
    rankTier: "B",
    streakBand: "strong",
    narrativeText: "Элита не знает случайных дней. Каждое действие — инвестиция. Система это видит.",
    bonusQuestTitle: "Проведи 30 минут в работе над долгосрочным проектом",
    bonusQuestAttribute: "wlt",
  },

  // ─── СТРИК = 14-29 (ветеран) ────────────────────────────────────────────
  {
    id: "d-veteran-1",
    rankTier: "any",
    streakBand: "veteran",
    narrativeText: "Две недели. Система фиксирует: это уже не эксперимент — это образ жизни.",
    bonusQuestTitle: "Помоги кому-то или поделись знанием",
    bonusQuestAttribute: "cha",
  },
  {
    id: "d-veteran-2",
    rankTier: "any",
    streakBand: "veteran",
    narrativeText: "Охотник с 14+ днями стрика входит в категорию Стойких. Система присваивает особый статус.",
    bonusQuestTitle: "Инвестируй время или деньги в своё развитие",
    bonusQuestAttribute: "wlt",
  },
  {
    id: "d-veteran-3",
    rankTier: "B",
    streakBand: "veteran",
    narrativeText: "Элита с ветеранским стриком — это Мастер в становлении. Дистанция до ранга A сокращается.",
    bonusQuestTitle: "Наставь кого-то в своей области",
    bonusQuestAttribute: "cha",
  },
  {
    id: "d-veteran-4",
    rankTier: "A",
    streakBand: "veteran",
    narrativeText: "Мастер не останавливается. Система наблюдает за охотником, который превзошёл 99% начавших.",
    bonusQuestTitle: "Работай над главным проектом 45 минут без отвлечений",
    bonusQuestAttribute: "dis",
  },
  {
    id: "d-veteran-5",
    rankTier: "C",
    streakBand: "veteran",
    narrativeText: "Три недели непрерывной работы. Ветеран доказывает: стабильность важнее интенсивности.",
    bonusQuestTitle: "Проанализируй свой прогресс и скорректируй план",
    bonusQuestAttribute: "int",
  },

  // ─── СТРИК = 30+ (легенда) ──────────────────────────────────────────────
  {
    id: "d-legend-1",
    rankTier: "any",
    streakBand: "legend",
    narrativeText: "Тридцать дней. Система фиксирует трансформацию. Ты больше не тот, кто начинал этот путь.",
    bonusQuestTitle: "Запиши три способа, которыми ты изменился за месяц",
    bonusQuestAttribute: "int",
  },
  {
    id: "d-legend-2",
    rankTier: "any",
    streakBand: "legend",
    narrativeText: "Легенда не нуждается в мотивации — у неё есть система. Ты стал системой.",
    bonusQuestTitle: "Сделай что-то, что удивит тебя самого",
    bonusQuestAttribute: "focus",
  },
  {
    id: "d-legend-3",
    rankTier: "S",
    streakBand: "legend",
    narrativeText: "Монарх с легендарным стриком. Система больше не ставит тебе задачи — ты ставишь их сам.",
    bonusQuestTitle: "Определи свою миссию на следующий месяц",
    bonusQuestAttribute: "wlt",
  },
  {
    id: "d-legend-4",
    rankTier: "A",
    streakBand: "legend",
    narrativeText: "Мастер-легенда. Порог ранга S виден отчётливо. Система ждёт финального шага.",
    bonusQuestTitle: "Создай что-то, что переживёт этот день",
    bonusQuestAttribute: "int",
  },
  {
    id: "d-legend-5",
    rankTier: "B",
    streakBand: "legend",
    narrativeText: "Элита с легендарным стриком показывает: дисциплина — это не черта характера, а навык.",
    bonusQuestTitle: "Поделись своим методом с кем-то, кто только начинает",
    bonusQuestAttribute: "cha",
  },

  // ─── ПОНЕДЕЛЬНИК (начало недели) ────────────────────────────────────────
  {
    id: "d-monday-1",
    rankTier: "any",
    streakBand: "any",
    narrativeText: "Новая неделя. Система обнуляет возможности. Как ты используешь эти семь дней?",
    bonusQuestTitle: "Запланируй три главных цели на эту неделю",
    bonusQuestAttribute: "int",
  },
  {
    id: "d-monday-2",
    rankTier: "any",
    streakBand: "any",
    narrativeText: "Понедельник — день, когда разрыв между теми, кто планирует и теми, кто действует, становится виден.",
    bonusQuestTitle: "Начни неделю с физической активности",
    bonusQuestAttribute: "str",
  },

  // ─── ПЯТНИЦА (конец рабочей недели) ─────────────────────────────────────
  {
    id: "d-friday-1",
    rankTier: "any",
    streakBand: "any",
    narrativeText: "Пятница. Финальный рывок рабочей недели. Система оценивает твою последовательность.",
    bonusQuestTitle: "Закрой одно незавершённое дело этой недели",
    bonusQuestAttribute: "dis",
  },
  {
    id: "d-friday-2",
    rankTier: "any",
    streakBand: "any",
    narrativeText: "Неделя подходит к концу. Что ты сделал? Что осталось? Система ждёт честного ответа.",
    bonusQuestTitle: "Проведи 15-минутный обзор недели",
    bonusQuestAttribute: "int",
  },

  // ─── ВОСКРЕСЕНЬЕ (рефлексия) ────────────────────────────────────────────
  {
    id: "d-sunday-1",
    rankTier: "any",
    streakBand: "any",
    narrativeText: "Воскресенье — день, когда легенды планируют следующую неделю, пока другие отдыхают.",
    bonusQuestTitle: "Подготовь план и расставь приоритеты на завтра",
    bonusQuestAttribute: "int",
  },

  // ─── АТРИБУТ STR ────────────────────────────────────────────────────────
  {
    id: "d-str-1",
    rankTier: "any",
    streakBand: "any",
    narrativeText: "Сегодня Система фокусируется на Силе. Физическое тело — фундамент всех остальных атрибутов.",
    bonusQuestTitle: "Тренировка минимум 20 минут — любой формат",
    bonusQuestAttribute: "str",
  },
  {
    id: "d-str-2",
    rankTier: "any",
    streakBand: "any",
    narrativeText: "День Силы. Система активирует усиленный режим для STR-квестов.",
    bonusQuestTitle: "Пройди пешком более 5000 шагов",
    bonusQuestAttribute: "str",
  },

  // ─── АТРИБУТ INT ────────────────────────────────────────────────────────
  {
    id: "d-int-1",
    rankTier: "any",
    streakBand: "any",
    narrativeText: "День Интеллекта. Система усиливает INT-квесты. Разум — инструмент охотника.",
    bonusQuestTitle: "Изучи что-то новое и запиши ключевые выводы",
    bonusQuestAttribute: "int",
  },
  {
    id: "d-int-2",
    rankTier: "any",
    streakBand: "any",
    narrativeText: "Сегодня Система фокусируется на Интеллекте. Каждый прочитанный абзац — XP для разума.",
    bonusQuestTitle: "Читай книгу или статью по профессиональной теме 20 минут",
    bonusQuestAttribute: "int",
  },

  // ─── АТРИБУТ CHA ────────────────────────────────────────────────────────
  {
    id: "d-cha-1",
    rankTier: "any",
    streakBand: "any",
    narrativeText: "День Харизмы. Система оценивает не только то, что ты делаешь — но и как ты взаимодействуешь.",
    bonusQuestTitle: "Инициируй позитивное общение с кем-то важным для тебя",
    bonusQuestAttribute: "cha",
  },
  {
    id: "d-cha-2",
    rankTier: "any",
    streakBand: "any",
    narrativeText: "Харизма — это навык, а не дар. Сегодня Система усиливает CHA-квесты.",
    bonusQuestTitle: "Скажи комплимент или слова благодарности трём людям",
    bonusQuestAttribute: "cha",
  },

  // ─── АТРИБУТ DIS ────────────────────────────────────────────────────────
  {
    id: "d-dis-1",
    rankTier: "any",
    streakBand: "any",
    narrativeText: "День Дисциплины. Система знает: это самый сложный атрибут. И самый ценный.",
    bonusQuestTitle: "Работай в фокусе без телефона 25 минут (техника Помодоро)",
    bonusQuestAttribute: "dis",
  },
  {
    id: "d-dis-2",
    rankTier: "any",
    streakBand: "any",
    narrativeText: "Дисциплина отличает охотника от мечтателя. Сегодня — день доказать это.",
    bonusQuestTitle: "Выполни самое нежелательное задание первым",
    bonusQuestAttribute: "dis",
  },

  // ─── АТРИБУТ WLT ────────────────────────────────────────────────────────
  {
    id: "d-wlt-1",
    rankTier: "any",
    streakBand: "any",
    narrativeText: "День Богатства. Система отслеживает не только деньги — но и инвестиции в будущее.",
    bonusQuestTitle: "Изучи одну финансовую или карьерную возможность",
    bonusQuestAttribute: "wlt",
  },
  {
    id: "d-wlt-2",
    rankTier: "any",
    streakBand: "any",
    narrativeText: "Богатство строится ежедневными решениями. Сегодня Система усиливает WLT-квесты.",
    bonusQuestTitle: "Запланируй или проверь свой бюджет/доходы за неделю",
    bonusQuestAttribute: "wlt",
  },

  // ─── СПЕЦИАЛЬНЫЕ / ВЫСОКИЕ РАНГИ ────────────────────────────────────────
  {
    id: "d-s-rank-1",
    rankTier: "S",
    streakBand: "any",
    narrativeText: "Монарх. Система не даёт тебе задачи — ты сам знаешь, что нужно делать. Делай.",
    bonusQuestTitle: "Работай над тем, что имеет наибольшее значение для тебя",
    bonusQuestAttribute: "focus",
  },
  {
    id: "d-a-rank-1",
    rankTier: "A",
    streakBand: "any",
    narrativeText: "Мастер на пороге монаршества. Система фиксирует: ты почти там. Не замедляйся.",
    bonusQuestTitle: "Продвинься на один шаг к своей главной цели этого года",
    bonusQuestAttribute: "focus",
  },
  {
    id: "d-b-rank-1",
    rankTier: "B",
    streakBand: "any",
    narrativeText: "Элита понимает: успех — не событие, а серия ежедневных решений. Сегодняшнее решение — ключевое.",
    bonusQuestTitle: "Сделай одно действие, которое продвинет тебя к рангу A",
    bonusQuestAttribute: "focus",
  },
  {
    id: "d-generic-1",
    rankTier: "any",
    streakBand: "any",
    narrativeText: "Система активна. Охотник активен. Это всё, что нужно для начала.",
    bonusQuestTitle: "Выполни одну задачу, которая важна именно сегодня",
    bonusQuestAttribute: "focus",
  },
  {
    id: "d-generic-2",
    rankTier: "any",
    streakBand: "any",
    narrativeText: "Каждый день — это новая страница. Система ждёт, что ты напишешь на ней.",
    bonusQuestTitle: "Запиши одну вещь, за которую благодарен сегодня",
    bonusQuestAttribute: "int",
  },
  {
    id: "d-generic-3",
    rankTier: "any",
    streakBand: "any",
    narrativeText: "Охотник, который действует сегодня — завтра будет впереди тех, кто только думает.",
    bonusQuestTitle: "Помоги кому-то — даже маленьким действием",
    bonusQuestAttribute: "cha",
  },
  {
    id: "d-generic-4",
    rankTier: "any",
    streakBand: "any",
    narrativeText: "Система наблюдает за паттернами. Твои паттерны говорят о тебе больше, чем слова.",
    bonusQuestTitle: "Пройди свои квесты дня без отвлечений на телефон",
    bonusQuestAttribute: "dis",
  },
  {
    id: "d-generic-5",
    rankTier: "any",
    streakBand: "any",
    narrativeText: "Малые шаги, сделанные ежедневно, создают то, что кажется невозможным в начале пути.",
    bonusQuestTitle: "Сделай физическое упражнение — любое, прямо сейчас",
    bonusQuestAttribute: "str",
  },
];
```

- [ ] **Шаг 2: Commit**

```bash
git add src/lib/game/dispatch-templates.ts
git commit -m "feat(game): add 60 dispatch templates for daily narrative system"
```

---

### Task 3: Шаблоны порталов и milestones

**Files:**
- Create: `src/lib/game/portal-templates.ts`
- Create: `src/lib/game/milestone-templates.ts`

- [ ] **Шаг 1: Создать portal-templates.ts**

```typescript
// src/lib/game/portal-templates.ts

import type { AttributeKey } from "./dispatch-templates";

export interface PortalStep {
  title: string;
  description: string;
  xp: number;
}

export interface PortalTemplate {
  id: string;
  title: string;
  description: string;
  attribute: AttributeKey;
  steps: [PortalStep, PortalStep, PortalStep];
  badgeName: string;
}

export const PORTAL_TEMPLATES: PortalTemplate[] = [
  // ── STR порталы (6) ──────────────────────────────────────────
  {
    id: "p-str-1",
    title: "Врата Силы",
    description: "Система открывает испытание физической выносливости.",
    attribute: "str",
    steps: [
      { title: "Разминка", description: "Сделай 10 минут лёгкой физической активности", xp: 20 },
      { title: "Основная нагрузка", description: "Тренировка или прогулка 20+ минут", xp: 35 },
      { title: "Финальный рывок", description: "Максимальное усилие: 5 минут интенсивного движения", xp: 50 },
    ],
    badgeName: "Врата Силы пройдены",
  },
  {
    id: "p-str-2",
    title: "Испытание Тела",
    description: "Тело — инструмент охотника. Сегодня оно проходит проверку.",
    attribute: "str",
    steps: [
      { title: "Утренняя зарядка", description: "10 минут зарядки или растяжки", xp: 20 },
      { title: "Прогулка", description: "Пройди минимум 3000 шагов", xp: 30 },
      { title: "Силовое упражнение", description: "30 отжиманий, приседаний или аналог", xp: 55 },
    ],
    badgeName: "Воин тела",
  },
  {
    id: "p-str-3",
    title: "Рассвет Охотника",
    description: "Настоящий охотник начинает день с движения.",
    attribute: "str",
    steps: [
      { title: "Встань вовремя", description: "Встань по плану без повтора будильника", xp: 25 },
      { title: "Стакан воды + движение", description: "Гидратация и 5 минут физической активности", xp: 25 },
      { title: "Выйди на улицу", description: "15+ минут на свежем воздухе", xp: 55 },
    ],
    badgeName: "Рассвет пройден",
  },

  // ── INT порталы (6) ──────────────────────────────────────────
  {
    id: "p-int-1",
    title: "Врата Знания",
    description: "Система открывает испытание интеллекта.",
    attribute: "int",
    steps: [
      { title: "Чтение", description: "Прочитай 10+ страниц книги или статью", xp: 20 },
      { title: "Анализ", description: "Запиши 3 ключевые идеи из прочитанного", xp: 35 },
      { title: "Применение", description: "Как применить эти идеи в своей жизни? Запиши.", xp: 50 },
    ],
    badgeName: "Врата Знания пройдены",
  },
  {
    id: "p-int-2",
    title: "Испытание Разума",
    description: "Разум охотника — его главное оружие.",
    attribute: "int",
    steps: [
      { title: "Обзор целей", description: "Просмотри свои цели на этот месяц", xp: 20 },
      { title: "Планирование", description: "Составь план действий на ближайшие 3 дня", xp: 35 },
      { title: "Приоритизация", description: "Определи ONE thing — самое важное прямо сейчас", xp: 50 },
    ],
    badgeName: "Мастер планирования",
  },
  {
    id: "p-int-3",
    title: "Глубокое погружение",
    description: "Система требует сосредоточенного изучения.",
    attribute: "int",
    steps: [
      { title: "Выбери тему", description: "Определи навык или тему для изучения", xp: 15 },
      { title: "Погружение", description: "25 минут изучения без отвлечений", xp: 40 },
      { title: "Фиксация", description: "Запиши всё, что узнал — своими словами", xp: 50 },
    ],
    badgeName: "Исследователь разума",
  },

  // ── CHA порталы (6) ──────────────────────────────────────────
  {
    id: "p-cha-1",
    title: "Врата Харизмы",
    description: "Система активирует испытание на влияние и связи.",
    attribute: "cha",
    steps: [
      { title: "Благодарность", description: "Напиши сообщение с благодарностью кому-то", xp: 20 },
      { title: "Инициатива", description: "Начни разговор с кем-то новым или давно не говорил", xp: 35 },
      { title: "Вклад", description: "Помоги кому-то — советом, временем или делом", xp: 50 },
    ],
    badgeName: "Мастер связей",
  },
  {
    id: "p-cha-2",
    title: "Голос Охотника",
    description: "Охотник, который умеет говорить — покоряет мир.",
    attribute: "cha",
    steps: [
      { title: "Активное слушание", description: "В разговоре сегодня: слушай больше, чем говори", xp: 20 },
      { title: "Комплимент", description: "Сделай искренний комплимент трём людям", xp: 30 },
      { title: "Публичность", description: "Поделись мыслью в соцсетях, с коллегами или близкими", xp: 55 },
    ],
    badgeName: "Голос в толпе",
  },

  // ── DIS порталы (6) ──────────────────────────────────────────
  {
    id: "p-dis-1",
    title: "Врата Дисциплины",
    description: "Система открывает испытание воли и концентрации.",
    attribute: "dis",
    steps: [
      { title: "Без телефона", description: "Первый час после пробуждения — без соцсетей", xp: 25 },
      { title: "Фокус-блок", description: "25 минут работы в полной тишине (режим Помодоро)", xp: 35 },
      { title: "Завершение", description: "Закрой одно дело, которое откладывал", xp: 45 },
    ],
    badgeName: "Железная воля",
  },
  {
    id: "p-dis-2",
    title: "Режим Охотника",
    description: "Распорядок дня — это основа роста.",
    attribute: "dis",
    steps: [
      { title: "Ранний старт", description: "Начни главную задачу дня до 10:00", xp: 25 },
      { title: "Без прокрастинации", description: "Сделай самое нежелательное дело сразу", xp: 35 },
      { title: "Вечерний ритуал", description: "Запланируй завтра до конца сегодняшнего дня", xp: 45 },
    ],
    badgeName: "Режим активирован",
  },

  // ── WLT порталы (6) ──────────────────────────────────────────
  {
    id: "p-wlt-1",
    title: "Врата Богатства",
    description: "Система открывает испытание финансового мышления.",
    attribute: "wlt",
    steps: [
      { title: "Финансовый обзор", description: "Посмотри на свои расходы за последние 7 дней", xp: 20 },
      { title: "Возможности", description: "Запиши 3 способа увеличить доход или сократить расходы", xp: 35 },
      { title: "Действие", description: "Сделай один шаг к финансовой цели прямо сейчас", xp: 50 },
    ],
    badgeName: "Финансовый охотник",
  },
  {
    id: "p-wlt-2",
    title: "Инвестиция в Себя",
    description: "Лучшая инвестиция — в свои навыки и здоровье.",
    attribute: "wlt",
    steps: [
      { title: "Аудит навыков", description: "Какой навык сделает тебя дороже через год?", xp: 20 },
      { title: "Обучение", description: "Потрать 30 минут на изучение этого навыка", xp: 40 },
      { title: "Нетворкинг", description: "Свяжись с кем-то в твоей сфере", xp: 45 },
    ],
    badgeName: "Инвестор в себя",
  },

  // ── Универсальные порталы (4) ─────────────────────────────────
  {
    id: "p-all-1",
    title: "Испытание Баланса",
    description: "Сильный охотник развивает все атрибуты.",
    attribute: "dis",
    steps: [
      { title: "Тело", description: "10 минут физической активности", xp: 20 },
      { title: "Разум", description: "10 минут чтения или изучения", xp: 20 },
      { title: "Связи", description: "Напиши кому-нибудь что-то доброе", xp: 65 },
    ],
    badgeName: "Сбалансированный охотник",
  },
  {
    id: "p-all-2",
    title: "Портал Рефлексии",
    description: "Охотник, который анализирует путь — движется быстрее.",
    attribute: "int",
    steps: [
      { title: "Вчерашний день", description: "Что прошло хорошо вчера?", xp: 15 },
      { title: "Сегодняшний фокус", description: "Что самое важное сделать сегодня?", xp: 25 },
      { title: "Долгосрочная цель", description: "На каком шаге ты сейчас?", xp: 65 },
    ],
    badgeName: "Мастер рефлексии",
  },
];

// Выбор портала по дате (детерминированный)
export function getPortalForDate(date: Date): PortalTemplate {
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000
  );
  return PORTAL_TEMPLATES[dayOfYear % PORTAL_TEMPLATES.length];
}
```

- [ ] **Шаг 2: Создать milestone-templates.ts**

```typescript
// src/lib/game/milestone-templates.ts

export interface MilestoneTemplate {
  streakDay: number;
  title: string;
  description: string;
  titleGranted: string; // игровой титул
}

export const MILESTONE_TEMPLATES: MilestoneTemplate[] = [
  {
    streakDay: 7,
    title: "НЕДЕЛЯ ПРОЙДЕНА",
    description: "Семь дней непрерывного роста. Система фиксирует: ты не сдался там, где сдаются 80%.",
    titleGranted: "Пробуждённый",
  },
  {
    streakDay: 14,
    title: "ДВЕ НЕДЕЛИ",
    description: "Четырнадцать дней. Привычка формируется. Охотник доказал системе свою серьёзность.",
    titleGranted: "Закалённый",
  },
  {
    streakDay: 21,
    title: "21 ДЕНЬ",
    description: "Три недели. Наука говорит — привычка сформирована. Система согласна: ты изменился.",
    titleGranted: "Стойкий",
  },
  {
    streakDay: 30,
    title: "30 ДНЕЙ",
    description: "Месяц. Ты больше не тот, кто начинал. Система присваивает статус: Несломленный.",
    titleGranted: "Несломленный",
  },
  {
    streakDay: 50,
    title: "50 ДНЕЙ",
    description: "Пятьдесят дней. В мире, где большинство бросает на первой неделе — ты феномен.",
    titleGranted: "Феномен",
  },
  {
    streakDay: 66,
    title: "66 ДНЕЙ",
    description: "66 дней — научно доказанная точка автоматизации привычки. Это теперь часть тебя.",
    titleGranted: "Автоматизированный",
  },
  {
    streakDay: 100,
    title: "100 ДНЕЙ",
    description: "Сто дней. Система регистрирует: это не эксперимент. Это образ жизни. Это ты.",
    titleGranted: "Легенда Системы",
  },
  {
    streakDay: 180,
    title: "180 ДНЕЙ",
    description: "Полгода. Охотник, который прошёл 180 дней, не нуждается в мотивации — у него есть система.",
    titleGranted: "Хранитель пути",
  },
  {
    streakDay: 365,
    title: "365 ДНЕЙ",
    description: "Год. Целый год ежедневного роста. Система не знает слов для этого. Только одно: Монарх.",
    titleGranted: "Вечный Монарх",
  },
  {
    streakDay: 500,
    title: "500 ДНЕЙ",
    description: "Пятьсот дней. Система создавалась не для таких как ты. Ты создал себя сам.",
    titleGranted: "Создатель Систем",
  },
];

// Milestone thresholds for checking
export const MILESTONE_DAYS = MILESTONE_TEMPLATES.map((m) => m.streakDay);

export function getMilestoneForStreak(streak: number): MilestoneTemplate | null {
  return MILESTONE_TEMPLATES.find((m) => m.streakDay === streak) ?? null;
}

export function shouldShowMilestone(
  currentStreak: number,
  lastMilestoneShown: number
): MilestoneTemplate | null {
  // Find the highest milestone that applies and hasn't been shown
  const applicable = MILESTONE_TEMPLATES
    .filter((m) => m.streakDay <= currentStreak && m.streakDay > lastMilestoneShown)
    .sort((a, b) => b.streakDay - a.streakDay);
  return applicable[0] ?? null;
}
```

- [ ] **Шаг 3: Commit**

```bash
git add src/lib/game/portal-templates.ts src/lib/game/milestone-templates.ts
git commit -m "feat(game): add portal (12 templates) and milestone (10 templates) data"
```

---

## Chunk 2: Игровая логика и тесты

### Task 4: Настройка Vitest + dispatch-selector

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`
- Create: `src/lib/game/dispatch-selector.ts`
- Create: `__tests__/dispatch-selector.test.ts`

- [ ] **Шаг 1: Установить Vitest**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system"
npm install --save-dev vitest
```

- [ ] **Шаг 2: Создать vitest.config.ts**

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
```

- [ ] **Шаг 3: Добавить test script в package.json**

В секцию `"scripts"` добавить:
```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Шаг 4: Написать failing тесты для dispatch-selector**

```typescript
// __tests__/dispatch-selector.test.ts
import { describe, it, expect } from "vitest";
import { selectDispatch, getStreakBand } from "@/lib/game/dispatch-selector";

const baseProfile = {
  rank: "E" as const,
  current_streak: 0,
  str_xp: 10,
  int_xp: 10,
  cha_xp: 10,
  dis_xp: 10,
  wlt_xp: 10,
};

describe("getStreakBand", () => {
  it("returns 'zero' for streak 0", () => {
    expect(getStreakBand(0)).toBe("zero");
  });
  it("returns 'early' for streak 1-2", () => {
    expect(getStreakBand(1)).toBe("early");
    expect(getStreakBand(2)).toBe("early");
  });
  it("returns 'growing' for streak 3-6", () => {
    expect(getStreakBand(3)).toBe("growing");
    expect(getStreakBand(6)).toBe("growing");
  });
  it("returns 'strong' for streak 7-13", () => {
    expect(getStreakBand(7)).toBe("strong");
    expect(getStreakBand(13)).toBe("strong");
  });
  it("returns 'veteran' for streak 14-29", () => {
    expect(getStreakBand(14)).toBe("veteran");
    expect(getStreakBand(29)).toBe("veteran");
  });
  it("returns 'legend' for streak 30+", () => {
    expect(getStreakBand(30)).toBe("legend");
    expect(getStreakBand(200)).toBe("legend");
  });
});

describe("selectDispatch", () => {
  it("returns a dispatch template object", () => {
    const result = selectDispatch(baseProfile, new Date("2026-01-01"));
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("narrativeText");
    expect(result).toHaveProperty("bonusQuestTitle");
    expect(result).toHaveProperty("bonusQuestAttribute");
  });

  it("is deterministic — same profile + date → same template", () => {
    const date = new Date("2026-03-11");
    const r1 = selectDispatch(baseProfile, date);
    const r2 = selectDispatch(baseProfile, date);
    expect(r1.id).toBe(r2.id);
  });

  it("varies by date — different dates can produce different templates", () => {
    const results = new Set<string>();
    for (let d = 1; d <= 10; d++) {
      const date = new Date(`2026-01-${String(d).padStart(2, "0")}`);
      results.add(selectDispatch(baseProfile, date).id);
    }
    // At least 2 different templates over 10 days
    expect(results.size).toBeGreaterThan(1);
  });

  it("resolves 'focus' attribute to the actual attribute of day", () => {
    const result = selectDispatch(baseProfile, new Date("2026-01-01"));
    expect(["str", "int", "cha", "dis", "wlt"]).toContain(result.resolvedAttribute);
  });

  it("computes correct bonus XP (base 30 + 50% = 45 for focus attribute)", () => {
    const result = selectDispatch({ ...baseProfile, rank: "D", current_streak: 5 }, new Date("2026-03-15"));
    expect(result.bonusXP).toBeGreaterThan(0);
  });
});
```

- [ ] **Шаг 5: Запустить тесты — убедиться что они ПАДАЮТ**

```bash
npm test -- __tests__/dispatch-selector.test.ts
```

Ожидаемый результат: `FAIL — Cannot find module '@/lib/game/dispatch-selector'`

- [ ] **Шаг 6: Создать dispatch-selector.ts**

```typescript
// src/lib/game/dispatch-selector.ts

import {
  DISPATCH_TEMPLATES,
  ATTRIBUTE_CYCLE,
  getAttributeOfDay,
  type DispatchTemplate,
  type StreakBand,
  type AttributeKey,
  type RankTier,
} from "./dispatch-templates";

export { getAttributeOfDay };

export interface DispatchResult {
  id: string;
  narrativeText: string;
  bonusQuestTitle: string;
  bonusQuestAttribute: AttributeKey;
  resolvedAttribute: AttributeKey;  // атрибут дня (для "focus" шаблонов)
  bonusXP: number;
  bonusCoins: number;
}

export function getStreakBand(streak: number): StreakBand {
  if (streak === 0) return "zero";
  if (streak <= 2) return "early";
  if (streak <= 6) return "growing";
  if (streak <= 13) return "strong";
  if (streak <= 29) return "veteran";
  return "legend";
}

// Детерминированный хэш для выбора шаблона
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

interface ProfileForDispatch {
  rank: string;
  current_streak: number;
  str_xp: number;
  int_xp: number;
  cha_xp: number;
  dis_xp: number;
  wlt_xp: number;
}

export function selectDispatch(
  profile: ProfileForDispatch,
  date: Date
): DispatchResult {
  const attributeOfDay = getAttributeOfDay(date);
  const streakBand = getStreakBand(profile.current_streak);
  const rankTier = profile.rank as RankTier;
  const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ..., 5=Fri, 0=Sun

  // Фильтруем шаблоны по приоритету:
  // 1. Точное совпадение по рангу и стрику
  // 2. Совпадение по стрику, ранг = "any"
  // 3. Совпадение по рангу, стрик = "any"
  // 4. Совпадение по дню недели (any/any)
  // 5. Полностью "any"
  const exactMatch = DISPATCH_TEMPLATES.filter(
    (t) => t.rankTier === rankTier && t.streakBand === streakBand
  );
  const streakMatch = DISPATCH_TEMPLATES.filter(
    (t) => t.rankTier === "any" && t.streakBand === streakBand
  );
  const rankMatch = DISPATCH_TEMPLATES.filter(
    (t) => t.rankTier === rankTier && t.streakBand === "any"
  );
  const anyMatch = DISPATCH_TEMPLATES.filter(
    (t) => t.rankTier === "any" && t.streakBand === "any"
  );

  const pool =
    exactMatch.length > 0 ? exactMatch :
    streakMatch.length > 0 ? streakMatch :
    rankMatch.length > 0 ? rankMatch :
    anyMatch;

  const dateKey = `${date.toISOString().split("T")[0]}`;
  const hash = simpleHash(dateKey);
  const template = pool[hash % pool.length];

  // Разрешаем "focus" → конкретный атрибут дня
  const resolvedAttribute: AttributeKey =
    template.bonusQuestAttribute === "focus"
      ? attributeOfDay
      : (template.bonusQuestAttribute as AttributeKey);

  // Базовый XP по атрибуту дня: 30 XP + 50% бонус = 45
  const bonusXP = 45;
  const bonusCoins = Math.ceil(bonusXP * 0.5);

  return {
    id: template.id,
    narrativeText: template.narrativeText,
    bonusQuestTitle: template.bonusQuestTitle,
    bonusQuestAttribute: resolvedAttribute,
    resolvedAttribute: attributeOfDay,
    bonusXP,
    bonusCoins,
  };
}
```

- [ ] **Шаг 7: Запустить тесты — убедиться что они ПРОХОДЯТ**

```bash
npm test -- __tests__/dispatch-selector.test.ts
```

Ожидаемый результат: `PASS — 10 tests passed`

- [ ] **Шаг 8: Commit**

```bash
git add vitest.config.ts package.json src/lib/game/dispatch-selector.ts __tests__/dispatch-selector.test.ts
git commit -m "feat(game): dispatch selector with vitest tests"
```

---

### Task 5: portal-selector + aura-calculator

**Files:**
- Create: `src/lib/game/aura-calculator.ts`
- Create: `__tests__/portal-selector.test.ts`
- Create: `__tests__/aura-calculator.test.ts`

- [ ] **Шаг 1: Написать failing тест для aura-calculator**

```typescript
// __tests__/aura-calculator.test.ts
import { describe, it, expect } from "vitest";
import { getAuraState } from "@/lib/game/aura-calculator";

const base = { str_xp: 10, int_xp: 10, cha_xp: 10, dis_xp: 10, wlt_xp: 10 };

describe("getAuraState", () => {
  it("returns 'dim' for streak 0", () => {
    expect(getAuraState({ ...base, current_streak: 0 }).intensity).toBe("dim");
  });
  it("returns 'dim' for streak 1-2", () => {
    expect(getAuraState({ ...base, current_streak: 2 }).intensity).toBe("dim");
  });
  it("returns 'flicker' for streak 3-6", () => {
    expect(getAuraState({ ...base, current_streak: 4 }).intensity).toBe("flicker");
  });
  it("returns 'pulse' for streak 7-13", () => {
    expect(getAuraState({ ...base, current_streak: 7 }).intensity).toBe("pulse");
  });
  it("returns 'radiate' for streak 14+", () => {
    expect(getAuraState({ ...base, current_streak: 14 }).intensity).toBe("radiate");
  });
  it("returns color of top attribute", () => {
    const state = getAuraState({ ...base, str_xp: 100, int_xp: 10, current_streak: 7 });
    expect(state.primaryColor).toBe("#E84855"); // STR color
  });
  it("returns secondary color for second-highest attribute when radiate", () => {
    const state = getAuraState({
      str_xp: 100, int_xp: 80, cha_xp: 10, dis_xp: 10, wlt_xp: 10,
      current_streak: 14,
    });
    expect(state.secondaryColor).toBe("#3B82F6"); // INT color
  });
});
```

- [ ] **Шаг 2: Запустить — убедиться что ПАДАЕТ**

```bash
npm test -- __tests__/aura-calculator.test.ts
```

- [ ] **Шаг 3: Создать aura-calculator.ts**

```typescript
// src/lib/game/aura-calculator.ts

export type AuraIntensity = "dim" | "flicker" | "pulse" | "radiate";

export interface AuraState {
  intensity: AuraIntensity;
  primaryColor: string;
  secondaryColor: string | null;
}

const ATTR_COLORS: Record<string, string> = {
  str: "#E84855",
  int: "#3B82F6",
  cha: "#F59E0B",
  dis: "#8B5CF6",
  wlt: "#10B981",
};

interface ProfileForAura {
  current_streak: number;
  str_xp: number;
  int_xp: number;
  cha_xp: number;
  dis_xp: number;
  wlt_xp: number;
}

export function getAuraState(profile: ProfileForAura): AuraState {
  const streak = profile.current_streak;

  const intensity: AuraIntensity =
    streak <= 2 ? "dim" :
    streak <= 6 ? "flicker" :
    streak <= 13 ? "pulse" :
    "radiate";

  // Сортировка атрибутов по убыванию XP
  const attrs = [
    { key: "str", xp: profile.str_xp },
    { key: "int", xp: profile.int_xp },
    { key: "cha", xp: profile.cha_xp },
    { key: "dis", xp: profile.dis_xp },
    { key: "wlt", xp: profile.wlt_xp },
  ].sort((a, b) => b.xp - a.xp);

  const primaryColor = ATTR_COLORS[attrs[0].key];
  const secondaryColor = intensity === "radiate" ? ATTR_COLORS[attrs[1].key] : null;

  return { intensity, primaryColor, secondaryColor };
}
```

- [ ] **Шаг 4: Запустить — убедиться что ПРОХОДИТ**

```bash
npm test -- __tests__/aura-calculator.test.ts
```

- [ ] **Шаг 5: Написать тест для portal-selector и реализацию**

`getPortalForDate` уже реализован в `portal-templates.ts`. Добавляем тест:

```typescript
// __tests__/portal-selector.test.ts
import { describe, it, expect } from "vitest";
import { getPortalForDate } from "@/lib/game/portal-templates";

describe("getPortalForDate", () => {
  it("returns a portal template", () => {
    const portal = getPortalForDate(new Date("2026-01-01"));
    expect(portal).toHaveProperty("id");
    expect(portal).toHaveProperty("steps");
    expect(portal.steps).toHaveLength(3);
  });
  it("is deterministic for the same date", () => {
    const d = new Date("2026-03-11");
    expect(getPortalForDate(d).id).toBe(getPortalForDate(d).id);
  });
  it("returns different portals for different dates", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 12; i++) {
      const d = new Date(2026, 0, i + 1);
      ids.add(getPortalForDate(d).id);
    }
    expect(ids.size).toBeGreaterThan(1);
  });
});
```

- [ ] **Шаг 6: Запустить все тесты**

```bash
npm test
```

Ожидаемый результат: все тесты PASS.

- [ ] **Шаг 7: Commit**

```bash
git add src/lib/game/aura-calculator.ts __tests__/aura-calculator.test.ts __tests__/portal-selector.test.ts
git commit -m "feat(game): aura calculator + portal selector with tests"
```

---

## Chunk 3: Server Actions и получение данных

### Task 6: Server Actions — completeDispatch и completePortalStep

**Files:**
- Modify: `src/app/(app)/actions.ts`

- [ ] **Шаг 1: Добавить `completeDispatch` в конец actions.ts**

```typescript
// Добавить в src/app/(app)/actions.ts

export async function completeDispatch(date: string): Promise<{ xpEarned: number; coinsEarned: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch dispatch for today
  const { data: dispatch } = await supabase
    .from("daily_dispatch")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", date)
    .single();

  if (!dispatch) throw new Error("Dispatch not found");
  if (dispatch.is_completed) throw new Error("Dispatch already completed");
  if (new Date() > new Date(dispatch.expires_at)) throw new Error("Dispatch expired");

  const xpEarned = dispatch.bonus_quest_xp as number;
  const coinsEarned = dispatch.bonus_quest_coins as number;
  const attrColumn = `${dispatch.attribute_focus}_xp` as
    | "str_xp" | "int_xp" | "cha_xp" | "dis_xp" | "wlt_xp";

  // Update profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("total_xp, coins, total_quests_completed")
    .eq("id", user.id)
    .single();

  if (!profile) throw new Error("Profile not found");

  await supabase.from("profiles").update({
    total_xp: profile.total_xp + xpEarned,
    coins: profile.coins + coinsEarned,
    total_quests_completed: profile.total_quests_completed + 1,
    [attrColumn]: supabase.rpc("increment_attr", { col: attrColumn, amount: xpEarned }),
  }).eq("id", user.id);

  // Mark dispatch completed
  await supabase
    .from("daily_dispatch")
    .update({ is_completed: true })
    .eq("user_id", user.id)
    .eq("date", date);

  // Log it
  await supabase.from("quest_logs").insert({
    user_id: user.id,
    quest_id: null,
    quest_title: dispatch.bonus_quest_title,
    quest_type: "daily",
    attribute: dispatch.attribute_focus,
    xp_earned: xpEarned,
    coins_earned: coinsEarned,
  });

  revalidatePath("/dashboard");
  return { xpEarned, coinsEarned };
}

export async function completePortalStep(
  date: string,
  stepIndex: number // 0, 1, или 2
): Promise<{ isFinished: boolean; xpEarned: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch current progress
  const { data: progress } = await supabase
    .from("user_portal_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", date)
    .single();

  if (!progress) throw new Error("Portal progress not found. Start the portal first.");
  if (progress.steps_completed !== stepIndex) {
    throw new Error(`Step ${stepIndex} not yet unlocked`);
  }

  // Fetch portal template to get XP
  const { data: template } = await supabase
    .from("portal_templates")
    .select("*")
    .eq("id", progress.template_id)
    .single();

  if (!template) throw new Error("Portal template not found");

  const stepXpField = `step${stepIndex + 1}_xp` as "step1_xp" | "step2_xp" | "step3_xp";
  const xpEarned = template[stepXpField] as number;
  const newStepsCompleted = stepIndex + 1;
  const isFinished = newStepsCompleted === 3;

  // Update progress
  await supabase.from("user_portal_progress").update({
    steps_completed: newStepsCompleted,
    is_finished: isFinished,
    finished_at: isFinished ? new Date().toISOString() : null,
  }).eq("user_id", user.id).eq("date", date);

  // Update profile XP
  const { data: profile } = await supabase
    .from("profiles")
    .select("total_xp, coins")
    .eq("id", user.id)
    .single();

  if (profile) {
    const coins = Math.ceil(xpEarned * 0.5);
    await supabase.from("profiles").update({
      total_xp: profile.total_xp + xpEarned,
      coins: profile.coins + coins,
    }).eq("id", user.id);
  }

  revalidatePath("/dashboard");
  return { isFinished, xpEarned };
}

export async function startPortal(date: string, templateId: string): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  await supabase.from("user_portal_progress").upsert({
    user_id: user.id,
    date,
    template_id: templateId,
    steps_completed: 0,
    is_finished: false,
    started_at: new Date().toISOString(),
  });

  revalidatePath("/dashboard");
}
```

**Важно:** В `completeDispatch` упрощён update профиля. Используй атомарный SQL-update:

```typescript
// Заменить update profiles блок на:
const { data: profile } = await supabase
  .from("profiles")
  .select(`total_xp, coins, total_quests_completed, ${attrColumn}`)
  .eq("id", user.id)
  .single();

if (!profile) throw new Error("Profile not found");

await supabase.from("profiles").update({
  total_xp: (profile.total_xp as number) + xpEarned,
  coins: (profile.coins as number) + coinsEarned,
  total_quests_completed: (profile.total_quests_completed as number) + 1,
  [attrColumn]: ((profile[attrColumn] as number) ?? 0) + xpEarned,
}).eq("id", user.id);
```

- [ ] **Шаг 2: Commit**

```bash
git add src/app/(app)/actions.ts
git commit -m "feat(actions): add completeDispatch, completePortalStep, startPortal"
```

---

### Task 7: Dashboard page — получение данных

**Files:**
- Modify: `src/app/(app)/dashboard/page.tsx`

- [ ] **Шаг 1: Добавить импорты и логику получения dispatch + portal**

В `dashboard/page.tsx` добавить после получения `allQuests`:

```typescript
// Добавить импорты в начало файла:
import { selectDispatch, getAttributeOfDay } from "@/lib/game/dispatch-selector";
import { getPortalForDate } from "@/lib/game/portal-templates";
import { shouldShowMilestone } from "@/lib/game/milestone-templates";
import { DispatchCard } from "@/components/dashboard/dispatch-card";
import { PortalCard } from "@/components/dashboard/portal-card";
import { MilestoneOverlay } from "@/components/dashboard/milestone-overlay";
```

Добавить логику перед `return`:

```typescript
// Daily Dispatch
const todayDate = new Date().toISOString().split("T")[0];
let dispatchData = null;

// Проверяем есть ли уже dispatch на сегодня
const { data: existingDispatch } = await supabase
  .from("daily_dispatch")
  .select("*")
  .eq("user_id", user.id)
  .eq("date", todayDate)
  .single();

if (existingDispatch) {
  dispatchData = existingDispatch;
} else {
  // Создаём dispatch для сегодня
  const dispatchResult = selectDispatch(profile as unknown as Parameters<typeof selectDispatch>[0], new Date());
  const midnight = new Date();
  midnight.setHours(23, 59, 59, 999);

  const { data: newDispatch } = await supabase
    .from("daily_dispatch")
    .insert({
      user_id: user.id,
      date: todayDate,
      template_id: dispatchResult.id,
      narrative_text: dispatchResult.narrativeText,
      bonus_quest_title: dispatchResult.bonusQuestTitle,
      bonus_quest_xp: dispatchResult.bonusXP,
      bonus_quest_coins: dispatchResult.bonusCoins,
      attribute_focus: dispatchResult.resolvedAttribute,
      is_completed: false,
      expires_at: midnight.toISOString(),
    })
    .select()
    .single();

  dispatchData = newDispatch;
}

// Portal of the Day
const portalTemplate = getPortalForDate(new Date());

const { data: portalProgress } = await supabase
  .from("user_portal_progress")
  .select("*")
  .eq("user_id", user.id)
  .eq("date", todayDate)
  .single();

// Milestone check
const milestone = shouldShowMilestone(
  profile.current_streak,
  (profile.last_milestone_shown as number) ?? 0
);

// Если milestone нужно показать — обновим last_milestone_shown
if (milestone) {
  await supabase
    .from("profiles")
    .update({ last_milestone_shown: milestone.streakDay })
    .eq("id", user.id);
}

const attributeOfDay = getAttributeOfDay(new Date());
```

- [ ] **Шаг 2: Добавить компоненты в JSX**

В `return` блоке `dashboard/page.tsx` добавить после `{heroQuest && <HeroQuest quest={heroQuest} />}`:

```tsx
{/* Milestone Overlay — показывается при достижении */}
{milestone && (
  <MilestoneOverlay milestone={milestone} />
)}

{/* Daily Dispatch */}
{dispatchData && (
  <DispatchCard
    dispatch={dispatchData}
    date={todayDate}
  />
)}

{/* Portal of the Day */}
<PortalCard
  portal={portalTemplate}
  progress={portalProgress}
  date={todayDate}
/>
```

- [ ] **Шаг 3: Commit**

```bash
git add src/app/(app)/dashboard/page.tsx
git commit -m "feat(dashboard): fetch and pass dispatch + portal + milestone data"
```

---

## Chunk 4: UI компоненты

### Task 8: DispatchCard компонент

**Files:**
- Create: `src/components/dashboard/dispatch-card.tsx`

- [ ] **Шаг 1: Создать компонент**

```tsx
// src/components/dashboard/dispatch-card.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { completeDispatch } from "@/app/(app)/actions";
import { toast } from "sonner";

const ATTR_COLORS: Record<string, string> = {
  str: "#E84855", int: "#3B82F6", cha: "#F59E0B", dis: "#8B5CF6", wlt: "#10B981",
};
const ATTR_LABELS: Record<string, string> = {
  str: "STR", int: "INT", cha: "CHA", dis: "DIS", wlt: "WLT",
};

interface DispatchData {
  narrative_text: string;
  bonus_quest_title: string;
  bonus_quest_xp: number;
  bonus_quest_coins: number;
  attribute_focus: string;
  is_completed: boolean;
  expires_at: string;
}

interface Props {
  dispatch: DispatchData;
  date: string;
}

function useCountdown(expiresAt: string) {
  const [timeLeft, setTimeLeft] = useState(() => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return Math.max(0, Math.floor(diff / 1000));
  });

  // Простой вычисляемый формат без интервала (для SSR-совместимости)
  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  return `${hours}ч ${minutes}м`;
}

export function DispatchCard({ dispatch, date }: Props) {
  const [isDone, setIsDone] = useState(dispatch.is_completed);
  const [isLoading, setIsLoading] = useState(false);
  const color = ATTR_COLORS[dispatch.attribute_focus] ?? "#6366F1";
  const timeLeft = useCountdown(dispatch.expires_at);

  async function handleComplete() {
    if (isDone || isLoading) return;
    setIsLoading(true);
    try {
      const result = await completeDispatch(date);
      setIsDone(true);
      toast.success(`Задание Системы выполнено! +${result.xpEarned} XP`);
    } catch (err) {
      toast.error("Не удалось завершить задание.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl border overflow-hidden px-5 py-4"
      style={{
        borderColor: `${color}50`,
        background: `linear-gradient(135deg, ${color}08 0%, transparent 60%)`,
      }}
    >
      {/* Заголовок */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono uppercase tracking-widest text-gray-500">
            🔮 Системный Dispatch
          </span>
        </div>
        {!isDone && (
          <span className="text-xs font-mono tabular-nums" style={{ color: "var(--text-tertiary)" }}>
            Сброс через {timeLeft}
          </span>
        )}
        {isDone && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(16,185,129,0.15)", color: "var(--color-success)" }}>
            ✓ Выполнено
          </span>
        )}
      </div>

      {/* Нарратив */}
      <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
        {dispatch.narrative_text}
      </p>

      {/* Задание дня */}
      <div
        className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
        style={{ background: "var(--bg-secondary)", border: `1px solid ${color}30` }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold mb-0.5" style={{ color }}>
            ⚡ Задание дня · {ATTR_LABELS[dispatch.attribute_focus]}
          </p>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {dispatch.bonus_quest_title}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            +{dispatch.bonus_quest_xp} XP · +{dispatch.bonus_quest_coins} 💰
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          disabled={isDone || isLoading}
          onClick={handleComplete}
          className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ background: isDone ? "#10B981" : color }}
        >
          {isDone ? "✓" : isLoading ? "..." : "Выполнить"}
        </motion.button>
      </div>
    </motion.div>
  );
}
```

- [ ] **Шаг 2: Commit**

```bash
git add src/components/dashboard/dispatch-card.tsx
git commit -m "feat(ui): DispatchCard — daily system narrative + bonus quest"
```

---

### Task 9: PortalCard компонент

**Files:**
- Create: `src/components/dashboard/portal-card.tsx`

- [ ] **Шаг 1: Создать компонент**

```tsx
// src/components/dashboard/portal-card.tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { completePortalStep, startPortal } from "@/app/(app)/actions";
import { toast } from "sonner";
import type { PortalTemplate } from "@/lib/game/portal-templates";

const ATTR_COLORS: Record<string, string> = {
  str: "#E84855", int: "#3B82F6", cha: "#F59E0B", dis: "#8B5CF6", wlt: "#10B981",
};

interface PortalProgress {
  steps_completed: number;
  is_finished: boolean;
  template_id: string;
}

interface Props {
  portal: PortalTemplate;
  progress: PortalProgress | null;
  date: string;
}

export function PortalCard({ portal, progress, date }: Props) {
  const [stepsCompleted, setStepsCompleted] = useState(progress?.steps_completed ?? 0);
  const [isFinished, setIsFinished] = useState(progress?.is_finished ?? false);
  const [loadingStep, setLoadingStep] = useState<number | null>(null);
  const [started, setStarted] = useState(progress !== null);

  const color = ATTR_COLORS[portal.attribute] ?? "#6366F1";
  const totalXP = portal.steps.reduce((s, step) => s + step.xp, 0);

  async function handleStart() {
    try {
      await startPortal(date, portal.id);
      setStarted(true);
    } catch {
      toast.error("Не удалось открыть портал.");
    }
  }

  async function handleStep(stepIndex: number) {
    if (loadingStep !== null) return;
    if (stepsCompleted !== stepIndex) return; // заблокирован

    setLoadingStep(stepIndex);
    try {
      const result = await completePortalStep(date, stepIndex);
      setStepsCompleted(stepIndex + 1);
      if (result.isFinished) {
        setIsFinished(true);
        toast.success(`Портал пройден! +${totalXP} XP · 🏅 ${portal.badgeName}`);
      } else {
        toast.success(`Шаг ${stepIndex + 1} завершён! +${result.xpEarned} XP`);
      }
    } catch (err) {
      toast.error("Ошибка при выполнении шага.");
      console.error(err);
    } finally {
      setLoadingStep(null);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl border overflow-hidden"
      style={{
        borderColor: `${color}40`,
        background: `${color}06`,
      }}
    >
      {/* Заголовок портала */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-0.5">
            🌀 Портал дня
          </p>
          <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            {portal.title}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            {portal.description}
          </p>
        </div>
        <div className="text-right flex-shrink-0 ml-3">
          <p className="text-xs font-semibold" style={{ color }}>
            +{totalXP} XP
          </p>
          <p className="text-[10px] text-gray-500">за всё</p>
        </div>
      </div>

      {/* Прогресс-бар */}
      <div className="px-5 mb-3">
        <div className="h-1.5 rounded-full" style={{ background: "var(--bg-tertiary)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: color }}
            animate={{ width: `${(stepsCompleted / 3) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <p className="text-[10px] mt-1 text-gray-500">{stepsCompleted}/3 шагов</p>
      </div>

      {/* Шаги */}
      {!started ? (
        <div className="px-5 pb-4">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleStart}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: color }}
          >
            Войти в портал
          </motion.button>
        </div>
      ) : (
        <div className="px-5 pb-4 space-y-2">
          {portal.steps.map((step, i) => {
            const isCompleted = i < stepsCompleted;
            const isActive = i === stepsCompleted && !isFinished;
            const isLocked = i > stepsCompleted || isFinished;
            const isLoading = loadingStep === i;

            return (
              <motion.div
                key={i}
                className="rounded-xl px-4 py-3 flex items-center gap-3"
                style={{
                  background: isCompleted
                    ? `${color}15`
                    : isActive
                    ? "var(--bg-secondary)"
                    : "var(--bg-glass)",
                  border: `1px solid ${isCompleted ? color + "40" : isActive ? color + "30" : "var(--border-subtle)"}`,
                  opacity: isLocked ? 0.5 : 1,
                }}
              >
                {/* Статус */}
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{
                    background: isCompleted ? color : "var(--bg-tertiary)",
                    color: isCompleted ? "white" : "var(--text-tertiary)",
                  }}
                >
                  {isCompleted ? "✓" : i + 1}
                </div>

                {/* Контент */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      {step.description}
                    </p>
                  )}
                </div>

                {/* XP + кнопка */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    +{step.xp}
                  </span>
                  {isActive && (
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={() => handleStep(i)}
                      disabled={isLoading}
                      className="px-3 py-1 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                      style={{ background: color }}
                    >
                      {isLoading ? "..." : "Готово"}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}

          {isFinished && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl px-4 py-3 text-center"
              style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}
            >
              <p className="text-sm font-bold" style={{ color: "var(--color-success)" }}>
                🏅 {portal.badgeName}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                Портал дня пройден
              </p>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}
```

- [ ] **Шаг 2: Commit**

```bash
git add src/components/dashboard/portal-card.tsx
git commit -m "feat(ui): PortalCard — 3-step daily dungeon with sequential unlock"
```

---

### Task 10: MilestoneOverlay + обновление ProfileCard

**Files:**
- Create: `src/components/dashboard/milestone-overlay.tsx`
- Modify: `src/components/dashboard/profile-card.tsx`

- [ ] **Шаг 1: Создать MilestoneOverlay**

```tsx
// src/components/dashboard/milestone-overlay.tsx
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MilestoneTemplate } from "@/lib/game/milestone-templates";

interface Props {
  milestone: MilestoneTemplate;
}

export function MilestoneOverlay({ milestone }: Props) {
  const [visible, setVisible] = useState(true);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          onClick={() => setVisible(false)}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative rounded-3xl border text-center px-8 py-10 max-w-sm w-full"
            style={{
              background: "var(--bg-secondary)",
              borderColor: "rgba(251,191,36,0.4)",
              boxShadow: "0 0 60px rgba(251,191,36,0.15)",
            }}
          >
            {/* Золотое свечение */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                background: "radial-gradient(circle at 50% 0%, rgba(251,191,36,0.08), transparent 70%)",
              }}
            />

            <p className="text-xs font-mono tracking-widest text-yellow-500 mb-4 uppercase">
              Система фиксирует
            </p>

            <motion.h1
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="text-3xl font-black tracking-tight text-white mb-4"
            >
              {milestone.title}
            </motion.h1>

            <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
              {milestone.description}
            </p>

            {/* Титул */}
            <div
              className="inline-block px-4 py-2 rounded-full mb-6 text-sm font-bold"
              style={{
                background: "rgba(251,191,36,0.15)",
                border: "1px solid rgba(251,191,36,0.4)",
                color: "#FBBF24",
              }}
            >
              🏆 Новый титул: «{milestone.titleGranted}»
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setVisible(false)}
              className="w-full py-3 rounded-xl font-semibold text-sm text-black"
              style={{ background: "#FBBF24" }}
            >
              Принять и продолжить
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Шаг 2: Обновить ProfileCard — добавить ауру**

Найди в `src/components/dashboard/profile-card.tsx` компонент и добавь аура-эффект. Сначала прочитай файл, потом редактируй — добавь импорт и используй `getAuraState`:

```typescript
// В начало profile-card.tsx добавить импорт:
import { getAuraState } from "@/lib/game/aura-calculator";
```

В JSX, в контейнер аватара добавить аура-кольцо:

```tsx
// Вокруг блока с аватаром добавить:
const aura = getAuraState(profile);

// В JSX обернуть аватар:
<div className="relative">
  {/* Аура-кольцо */}
  {aura.intensity !== "dim" && (
    <motion.div
      className="absolute inset-0 rounded-full pointer-events-none"
      style={{
        boxShadow: aura.intensity === "radiate" && aura.secondaryColor
          ? `0 0 20px ${aura.primaryColor}60, 0 0 40px ${aura.secondaryColor}30`
          : `0 0 20px ${aura.primaryColor}60`,
      }}
      animate={
        aura.intensity === "pulse" || aura.intensity === "radiate"
          ? { opacity: [0.6, 1, 0.6], scale: [1, 1.05, 1] }
          : { opacity: [0.4, 0.7, 0.4] }
      }
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    />
  )}
  {/* Существующий аватар-контент без изменений */}
</div>
```

- [ ] **Шаг 3: Commit**

```bash
git add src/components/dashboard/milestone-overlay.tsx src/components/dashboard/profile-card.tsx
git commit -m "feat(ui): MilestoneOverlay + aura effect on ProfileCard"
```

---

## Chunk 5: Финальная интеграция и проверка

### Task 11: TypeScript проверка и финальный запуск

- [ ] **Шаг 1: Запустить все тесты**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system"
npm test
```

Ожидаемый результат: все тесты PASS.

- [ ] **Шаг 2: TypeScript проверка**

```bash
npx tsc --noEmit
```

Исправить все TypeScript ошибки перед тем как продолжать.

- [ ] **Шаг 3: Проверить что dev сервер запускается без ошибок**

```bash
npm run dev
```

Открыть http://localhost:3000/dashboard и убедиться:
- [ ] Блок Dispatch отображается с нарративным текстом
- [ ] Кнопка "Выполнить" в Dispatch работает, начисляет XP
- [ ] Блок Портала отображается с тремя шагами
- [ ] Кнопка "Войти в портал" запускает прогресс
- [ ] Шаги открываются последовательно
- [ ] Аура на профиле отображается (нужен стрик 3+)
- [ ] MilestoneOverlay появляется если стрик совпадает с milestone

- [ ] **Шаг 4: Линтер**

```bash
npm run lint
```

- [ ] **Шаг 5: Финальный commit**

```bash
git add -A
git commit -m "feat(living-system): Daily Dispatch + Portal of the Day + aura milestone — complete"
```

---

## Итоговая структура изменений

```
Создано:
  supabase/migrations/011_living_system.sql    ← 3 таблицы + ALTER
  src/lib/game/dispatch-templates.ts           ← 60 шаблонов
  src/lib/game/portal-templates.ts             ← 12 шаблонов + selector
  src/lib/game/milestone-templates.ts          ← 10 milestones + shouldShow()
  src/lib/game/dispatch-selector.ts            ← selectDispatch()
  src/lib/game/aura-calculator.ts              ← getAuraState()
  src/components/dashboard/dispatch-card.tsx   ← DispatchCard
  src/components/dashboard/portal-card.tsx     ← PortalCard
  src/components/dashboard/milestone-overlay.tsx← MilestoneOverlay
  __tests__/dispatch-selector.test.ts
  __tests__/portal-selector.test.ts
  __tests__/aura-calculator.test.ts
  vitest.config.ts

Изменено:
  package.json                                 ← vitest devDependency + test script
  src/app/(app)/actions.ts                     ← +completeDispatch, completePortalStep, startPortal
  src/app/(app)/dashboard/page.tsx             ← dispatch + portal fetch + milestone check
  src/components/dashboard/profile-card.tsx    ← аура-эффект
```

**Всего: ~5 новых файлов логики, 3 компонента, 3 action-функции, 1 миграция.**
