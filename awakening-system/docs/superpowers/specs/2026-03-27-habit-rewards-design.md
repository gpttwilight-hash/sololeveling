# Habit Rewards — Design Spec

## Summary

Расширение системы квестов для поддержки гибкой недельной частоты и персональных наград за привычки. Не создаём новую сущность — привычка = recurring daily квест с частотой и наградой.

## Решения

| Вопрос | Решение |
|--------|---------|
| Привычка vs квест | Расширяем квесты, не создаём отдельную сущность |
| Цикл | Неделя (пн 00:00 — вс 23:59) |
| Частота | `frequency_per_week` (1–7) на daily квестах с `is_recurring: true` |
| Награда | Текст + эмодзи, привязана к квесту |
| Получение награды | Кнопка "Забрать" + логирование в `reward_logs` |
| Невыполнение | Сброс счётчика + streak успешных недель |
| Хранение прогресса | Поля настроек в `quests`, история в `habit_weeks` |

## 1. Модель данных

### Новые поля в `quests`

| Поле | Тип | Default | Описание |
|------|-----|---------|----------|
| `frequency_per_week` | INTEGER | 7 | 1–7, только для `type='daily'` + `is_recurring=true` |
| `reward_emoji` | TEXT | NULL | Эмодзи награды ("💆"), null = нет награды |
| `reward_title` | TEXT | NULL | Название награды ("Массаж"), null = нет награды |

`frequency_per_week = 7` — обратная совместимость с текущим поведением (каждый день).

### Новая таблица `habit_weeks`

```sql
CREATE TABLE habit_weeks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id      UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start    DATE NOT NULL,              -- всегда понедельник
  target        INTEGER NOT NULL,           -- snapshot frequency_per_week
  completions   INTEGER NOT NULL DEFAULT 0,
  is_success    BOOLEAN NOT NULL DEFAULT FALSE,
  reward_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  claimed_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),

  UNIQUE(quest_id, week_start)
);
```

- `target` — снапшот `frequency_per_week` на момент создания записи. Защита от изменения частоты задним числом.
- RLS: `auth.uid() = user_id` (SELECT, INSERT, UPDATE).

### Расширение `reward_logs`

Новое поле:

| Поле | Тип | Default | Описание |
|------|-----|---------|----------|
| `source` | TEXT | `'shop'` | `'shop'` или `'habit'` — откуда пришла награда |

## 2. Логика недельного цикла

### Определение недели

```typescript
function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=вс, 1=пн
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d.toISOString().split("T")[0];
}
```

### Ленивое создание `habit_weeks`

Записи создаются не по крону, а при первом взаимодействии на новой неделе (загрузка страницы квестов или завершение квеста):

1. Для каждого daily recurring квеста: есть ли `habit_weeks` с текущим `week_start`?
2. Нет → INSERT с `target = quest.frequency_per_week`, `completions = 0`
3. Есть → используем существующую

Расширяет текущую логику daily reset на странице квестов.

### Сброс квестов

Текущая логика: при загрузке страницы → сбросить `is_completed` для recurring daily квестов, где `last_reset_date < today`.

Расширение: если `frequency_per_week < 7`, квест сбрасывается **только если** на текущей неделе completions < target. Если цель достигнута (3/3) — квест остаётся выполненным до конца недели.

### Инкремент при завершении квеста

В `completeQuest` action, после успешного завершения daily recurring квеста:

1. Ensure `habit_weeks` запись существует для текущей недели
2. INCREMENT `completions` на 1
3. Если `completions >= target` → SET `is_success = true`

### Streak

Семантика streak зависит от `frequency_per_week`:

**Для `frequency_per_week < 7`** (привычки с целью): streak = количество успешных недель подряд. При создании новой записи `habit_weeks` на новой неделе — проверяем предыдущую:
- Предыдущая `is_success = true` → `quest.streak += 1`
- Предыдущая `is_success = false` или нет записи → `quest.streak = 0`

**Для `frequency_per_week = 7`** (каждый день): streak работает как сейчас — инкрементируется при каждом выполнении, сбрасывается при пропуске дня. `habit_weeks` всё равно создаётся (для единообразия данных), но streak считается по-старому.

Это сохраняет обратную совместимость для существующих ежедневных квестов.

### Пример жизненного цикла

```
Квест: "Зал" (3 раза/нед), награда: 💆 Массаж

Пн: 0/3 — квест доступен
Вт: Выполнил → 1/3, квест сбросился (is_completed = false)
Чт: Выполнил → 2/3, квест сбросился
Сб: Выполнил → 3/3, is_success=true, кнопка "Забрать 💆 Массаж"
Вс: Квест выполнен, кнопка "Забрать" доступна
Пн: Новая неделя → 0/3, streak +1, если не забрал награду — сгорела
```

## 3. Получение награды

### Server action `claimHabitReward(questId: string)`

1. Найти `habit_weeks` для квеста на текущей неделе
2. Проверить: `is_success = true` AND `reward_claimed = false`
3. Проверить: квест имеет `reward_emoji` AND `reward_title` (не null)
4. UPDATE: `reward_claimed = true`, `claimed_at = now()`
5. INSERT в `reward_logs`: `reward_title`, `cost = 0`, `source = 'habit'`
6. Revalidate: `/quests`, `/dashboard`

### Если не забрал

Неделя закончилась, `is_success = true`, `reward_claimed = false` — награда сгорает. Новая неделя, новый цикл. Мотивирует забирать сразу.

### Квест без награды

Если `reward_emoji = null` / `reward_title = null` — квест работает как обычный recurring daily. Прогресс (2/3) и streak отслеживаются, но кнопки "Забрать" нет.

## 4. UI изменения

### Форма создания квеста (`quest-form.tsx`)

При `type: daily` + `is_recurring: true` — новая коллапсируемая секция **"Частота и награда"**:

**Частота:**
- Кнопки-чипы: `1` `2` `3` `4` `5` `6` `7` (раз в неделю)
- Default: 7
- Подпись: "раз в неделю"

**Награда** (опционально):
- Для `frequency_per_week < 7`: секция видна сразу
- Для `frequency_per_week = 7`: доступна через "Добавить награду"
- Ряд эмодзи-чипов: 💆🍕🎮🎬☕🛍️📱🎵🍰🏖️💤🎨
- Текстовое поле "Название награды"

### Карточка квеста (`quest-card.tsx`)

1. **Прогресс-бейдж**: `2/3 на этой неделе` — рядом со streak, только для `frequency_per_week < 7`
2. **Кнопка "Забрать награду"**: появляется при `is_success = true` AND `reward_claimed = false`. Золотой/фиолетовый стиль, с эмодзи. Анимация fade-in + scale.
3. **Состояние "Цель достигнута"**: когда completions >= target, квест визуально приглушён, кнопка выполнения недоступна.

### Таб Daily (страница квестов)

Квесты с `frequency_per_week < 7` показывают прогресс-индикатор в списке. Порядок сортировки (drag-to-reorder) не меняется.

### Статистика (вне скоупа)

Данные в `habit_weeks` позволят в будущем построить графики consistency rate. В текущем дизайне не реализуем.

## 5. Миграция

Одна новая миграция (номер определяется при реализации):

1. ALTER TABLE `quests` — добавить `frequency_per_week`, `reward_emoji`, `reward_title`
2. CREATE TABLE `habit_weeks` с RLS
3. ALTER TABLE `reward_logs` — добавить `source`
4. Существующие recurring daily квесты получают `frequency_per_week = 7` (через DEFAULT)

## 6. Вне скоупа

- Графики consistency rate на странице статистики
- Кастомные циклы (не неделя)
- Интеграция награды привычки с магазином
- Push-уведомления о незабранных наградах
- Частота для weekly/epic квестов
