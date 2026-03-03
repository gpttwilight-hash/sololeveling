# TASKS.md — Система Пробуждения
# Рабочий документ для автономного выполнения задач

> **Правила:**
> - Задача считается завершённой ТОЛЬКО при выполнении всех критериев в разделе «Done when»
> - Переход к следующей задаче — автоматически после подтверждения завершения текущей
> - Статусы: `[ ]` pending · `[→]` in progress · `[x]` done · `[!]` blocked

---

## PHASE 0 — Project Bootstrap

### T-001 · Инициализация Next.js проекта
**Depends on:** —
**Status:** `[x]`

**Action:**
```bash
npx create-next-app@latest awakening-system \
  --typescript --tailwind --eslint --app \
  --src-dir --import-alias "@/*" --no-turbopack
```
Установить зависимости:
```
framer-motion recharts zustand react-hook-form zod
@supabase/supabase-js @supabase/ssr
lucide-react next-pwa
```

**Done when:**
- [ ] Директория `awakening-system/` создана
- [ ] `npm run dev` запускается без ошибок на `localhost:3000`
- [ ] `tsconfig.json` содержит `"strict": true`
- [ ] `next.config.js` существует

---

### T-002 · Настройка shadcn/ui
**Depends on:** T-001
**Status:** `[x]`

**Action:**
```bash
npx shadcn@latest init
```
Установить компоненты: `button card input progress dialog tabs toast badge skeleton`

**Done when:**
- [ ] Директория `src/components/ui/` содержит минимум 8 компонентов
- [ ] `components.json` присутствует в корне
- [ ] `cn()` helper доступен в `src/lib/utils.ts`

---

### T-003 · Дизайн-система: CSS-переменные и Tailwind config
**Depends on:** T-002
**Status:** `[x]`

**Action:**
Записать все CSS-переменные из PRD §3.2 в `src/app/globals.css`.
Расширить `tailwind.config.ts`: добавить кастомные цвета (`strength`, `intellect`, `charisma`, `discipline`, `wealth`, `xp`, `level-up`), радиусы, тени.

**Done when:**
- [ ] `globals.css` содержит все переменные из PRD §3.2 (bg-primary, rank-*, color-*, border-*, shadow-*)
- [ ] `tailwind.config.ts` содержит секцию `extend.colors` с game-токенами
- [ ] На `localhost:3000` фон страницы `#0A0A0F`
- [ ] Нет стандартного белого/серого Next.js-фона

---

### T-004 · Настройка Supabase
**Depends on:** T-001
**Status:** `[x]`

**Action:**
- Создать проект в Supabase Dashboard
- Создать `src/lib/supabase/client.ts` (browser client)
- Создать `src/lib/supabase/server.ts` (server client с cookies)
- Создать `src/middleware.ts` (обновление session)
- Записать ключи в `.env.local`
- Создать `.env.example` с placeholder-значениями

**Done when:**
- [ ] `.env.local` содержит `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `src/lib/supabase/client.ts` экспортирует `createBrowserClient`
- [ ] `src/lib/supabase/server.ts` экспортирует `createServerClient`
- [ ] `src/middleware.ts` обновляет Supabase session на каждый запрос
- [ ] `.env.example` присутствует в репозитории

---

### T-005 · Структура директорий проекта
**Depends on:** T-004
**Status:** `[x]`

**Action:**
Создать пустые директории и index-файлы согласно PRD §7:
- `src/app/(auth)/login/`, `src/app/(auth)/signup/`
- `src/app/(app)/dashboard/`, `quests/`, `stats/`, `achievements/`, `shop/`, `settings/`
- `src/app/onboarding/`
- `src/components/layout/`, `dashboard/`, `quests/`, `stats/`, `achievements/`, `shop/`, `effects/`, `shared/`
- `src/lib/game/`, `src/hooks/`, `src/stores/`, `src/types/`
- `supabase/migrations/`, `supabase/functions/`

**Done when:**
- [ ] Все директории из PRD §7 существуют
- [ ] `src/types/game.ts` содержит интерфейсы `Attributes`, `Quest`, `Rank`, `Reward` из PRD §5
- [ ] `src/types/database.ts` создан (placeholder для Supabase generated types)

---

## PHASE 1 — Database & Auth

### T-006 · Миграция базы данных
**Depends on:** T-004
**Status:** `[x]`

**Action:**
Создать `supabase/migrations/001_initial_schema.sql` с полным SQL из PRD §6.1:
- Таблицы: `profiles`, `quests`, `subquests`, `quest_logs`, `daily_progress`, `achievements`, `user_achievements`, `rewards`, `reward_logs`, `user_titles`
- RLS policies для всех таблиц
- Индексы из PRD §6.2

Применить через Supabase Dashboard → SQL Editor.

**Done when:**
- [ ] Файл `supabase/migrations/001_initial_schema.sql` существует
- [ ] В Supabase Dashboard все 10 таблиц созданы
- [ ] RLS включён на всех таблицах (проверить через Table Editor → RLS enabled)
- [ ] Все индексы из §6.2 созданы

---

### T-007 · Seed: достижения и награды по умолчанию
**Depends on:** T-006
**Status:** `[x]`

**Action:**
Создать `supabase/seed.sql`:
- Вставить 20+ достижений в таблицу `achievements` (категории: habits, ranks, special, hidden)
- Создать SQL-функцию для вставки дефолтных наград при регистрации пользователя

**Done when:**
- [ ] `supabase/seed.sql` существует
- [ ] В таблице `achievements` минимум 20 записей
- [ ] Достижения покрывают все категории: habits, ranks, special, hidden
- [ ] Каждое достижение имеет заполненный `condition` JSONB

---

### T-008 · Аутентификация: страницы Login и Signup
**Depends on:** T-004, T-003
**Status:** `[x]`

**Action:**
- `src/app/(auth)/layout.tsx` — centered layout на тёмном фоне
- `src/app/(auth)/login/page.tsx` — форма email/password с React Hook Form + Zod
- `src/app/(auth)/signup/page.tsx` — форма регистрации
- Server Actions для login/signup через Supabase Auth
- Редирект на `/onboarding` после первой регистрации, на `/dashboard` при повторном входе

**Done when:**
- [ ] Страница `/login` рендерится без ошибок
- [ ] Страница `/signup` рендерится без ошибок
- [ ] Форма валидируется (пустые поля, невалидный email)
- [ ] Успешная регистрация → создаётся запись в `auth.users`
- [ ] Успешный вход → редирект на `/dashboard`
- [ ] Неуспешный вход → отображается сообщение об ошибке
- [ ] Дизайн соответствует цветовой палитре PRD §3.2

---

### T-009 · Защита роутов (middleware)
**Depends on:** T-008
**Status:** `[x]`

**Action:**
Расширить `src/middleware.ts`:
- Неаутентифицированный пользователь на `/(app)/*` → редирект на `/login`
- Аутентифицированный пользователь на `/(auth)/*` → редирект на `/dashboard`
- Аутентифицированный пользователь без онбординга → редирект на `/onboarding`

**Done when:**
- [ ] Прямой переход на `/dashboard` без сессии → редирект на `/login`
- [ ] Переход на `/login` с активной сессией → редирект на `/dashboard`
- [ ] Переход на `/dashboard` после регистрации (onboarding_completed = false) → `/onboarding`

---

## PHASE 2 — Onboarding

### T-010 · Онбординг: Welcome экран
**Depends on:** T-008, T-003
**Status:** `[x]`

**Action:**
`src/app/onboarding/page.tsx` — step 1:
- Тёмный фон с subtle CSS particle effect (CSS-анимация, не canvas)
- Логотип / название «Система Пробуждения»
- Текст: «Ты получил Систему. Готов к пробуждению?»
- CTA кнопка «Начать» → переход к step 2
- Framer Motion: fade in entrance

**Done when:**
- [ ] `/onboarding` рендерится без ошибок
- [ ] Particle/ambient effect присутствует (CSS animation или Framer Motion)
- [ ] Fade-in анимация при загрузке страницы
- [ ] Кнопка «Начать» переключает на следующий шаг

---

### T-011 · Онбординг: Character Setup (step 2)
**Depends on:** T-010
**Status:** `[x]`

**Action:**
Step 2 онбординга:
- Поле ввода имени охотника (React Hook Form, min 2 символа)
- Сетка из 6-8 аватаров (минималистичные SVG-силуэты)
- Мульти-чекбокс выбора фокуса (5 пунктов из PRD §4.2.1)

**Done when:**
- [ ] Поле имени с валидацией (обязательное, min 2 символа)
- [ ] 6+ аватаров отображаются, при клике — выделение активного
- [ ] Все 5 фокусов присутствуют как чекбоксы
- [ ] Кнопка «Далее» активна только при заполненном имени и выбранном аватаре

---

### T-012 · Онбординг: First Quests (step 3) + сохранение в БД
**Depends on:** T-011, T-006
**Status:** `[x]`

**Action:**
Step 3 + финальное сохранение:
- На основе выбранного фокуса из step 2 — предложить 5-7 стартовых квестов
- Пользователь выбирает 3-5 (ограничение)
- Предупреждение если выбрано > 5: «Начни с малого»
- CTA «Начать путь» → Server Action:
  - Создать запись `profiles` с `hunter_name`, `avatar_id`
  - Создать выбранные квесты в таблице `quests`
  - Вставить дефолтные `rewards`
  - Установить `onboarding_completed = true`
  - Редирект на `/dashboard`

**Done when:**
- [ ] Квесты фильтруются по выбранному фокусу
- [ ] Выбор > 5 квестов — показывает предупреждение
- [ ] Кнопка «Начать путь» активна при выборе 3-5 квестов
- [ ] После клика: профиль, квесты, награды созданы в БД
- [ ] `onboarding_completed = true` в `profiles`
- [ ] Редирект на `/dashboard`

---

## PHASE 3 — Dashboard

### T-013 · App Shell: Layout с навигацией
**Depends on:** T-009
**Status:** `[x]`

**Action:**
`src/app/(app)/layout.tsx` + компоненты:
- `src/components/layout/app-shell.tsx` — обёртка
- `src/components/layout/bottom-nav.tsx` — mobile: 4 иконки (Home, Quests, Stats, More)
- `src/components/layout/sidebar.tsx` — desktop: 6 пунктов меню из PRD §4.1
- `src/components/layout/header.tsx` — mobile header с именем и шестерёнкой

Адаптивность: bottom nav < 1024px, sidebar ≥ 1024px

**Done when:**
- [ ] Bottom navigation отображается на мобильном (< 1024px)
- [ ] Sidebar отображается на десктопе (≥ 1024px)
- [ ] Активный пункт подсвечен
- [ ] Все 4 мобильных и 6 десктопных пунктов ведут на корректные роуты
- [ ] Touch targets ≥ 44px на мобильном

---

### T-014 · Dashboard: Profile Card с XP Bar
**Depends on:** T-013
**Status:** `[x]`

**Action:**
`src/components/dashboard/profile-card.tsx`:
- Аватар + имя охотника + уровень + ранг
- XP progress bar с анимацией заполнения (600ms cubic-bezier)
- Текст «145/300 XP»
- Цвет бара: `--color-xp` (#6366F1)
- Glass-карточка из §3.4

`src/components/dashboard/xp-bar.tsx` — переиспользуемый компонент

**Done when:**
- [ ] Имя, уровень, ранг берутся из БД (через Supabase)
- [ ] XP bar корректно отображает прогресс к следующему уровню
- [ ] Анимация заполнения при первой загрузке
- [ ] Glass-карточка стиль (blur, border, bg-glass)
- [ ] Ранг отображается с правильным цветом (§3.2, rank-*)

---

### T-015 · Dashboard: Daily Quests список
**Depends on:** T-013
**Status:** `[x]`

**Action:**
`src/components/dashboard/daily-quests.tsx`:
- Список сегодняшних квестов из БД
- Каждый квест: чекбокс, название, атрибут, XP награда
- При нажатии «выполнено» → Server Action `completeQuest()`
- `completeQuest()` в `src/app/(app)/actions.ts`:
  - Записать в `quest_logs`
  - Прибавить XP к профилю
  - Обновить `daily_progress`
  - Проверить level up
  - Вернуть `{ xpEarned, leveledUp, rankedUp }`
- Заголовок «Сегодня: Пн, 2 марта · 3/5 квестов ✓»

**Done when:**
- [ ] Квесты загружаются из БД для текущего пользователя
- [ ] Выполненные квесты имеют визуальное отличие (strikethrough + opacity)
- [ ] Клик по квесту вызывает `completeQuest()` Server Action
- [ ] XP прибавляется в профиле после выполнения (проверить в БД)
- [ ] Счётчик «3/5 квестов» обновляется
- [ ] Уже выполненный квест нельзя выполнить повторно (disabled)

---

### T-016 · Dashboard: Mini Radar Chart
**Depends on:** T-014
**Status:** `[x]`

**Action:**
`src/components/dashboard/mini-radar.tsx`:
- Recharts RadarChart, компактный (≈150x150px)
- 5 атрибутов: STR, INT, CHA, DIS, WLT
- Данные из профиля пользователя
- Цвет заливки: `--color-xp` с opacity 0.3
- Цвет линии: `--color-xp`
- Responsive, без легенды (только подписи осей)

**Done when:**
- [ ] Radar chart рендерится без ошибок
- [ ] 5 осей с правильными подписями
- [ ] Данные соответствуют значениям атрибутов из БД
- [ ] Вписывается в dashboard без горизонтального скролла

---

### T-017 · Dashboard: Streak Badge
**Depends on:** T-014
**Status:** `[x]`

**Action:**
`src/components/dashboard/streak-badge.tsx`:
- Отображение текущего streak в днях
- Иконка огня 🔥
- Монеты: 💰 340
- Анимация пульса на иконке огня при streak > 7

**Done when:**
- [ ] Streak читается из `profiles.current_streak`
- [ ] Монеты читаются из `profiles.coins`
- [ ] Пульс-анимация на 🔥 при streak ≥ 7
- [ ] Отображается на dashboard

---

### T-018 · Game Logic: XP Calculator и Level System
**Depends on:** T-005
**Status:** `[x]`

**Action:**
`src/lib/game/xp-calculator.ts`:
- `getRequiredXP(level: number): number` — формула из PRD §5.2
- `getLevelFromTotalXP(totalXP: number): number`
- `getXPProgress(totalXP: number): { level, current, required, percentage }`

`src/lib/game/level-system.ts`:
- `checkLevelUp(oldXP: number, newXP: number): { leveledUp: boolean; newLevel: number }`

`src/lib/game/rank-system.ts`:
- `getRankFromLevel(level: number): Rank`
- `checkRankUp(oldLevel: number, newLevel: number): boolean`

`src/lib/game/constants.ts`:
- Все константы из PRD: XP_CONFIG, RANKS, XP по сложности

**Done when:**
- [ ] `getRequiredXP(1)` = 100, `getRequiredXP(2)` ≈ 160, `getRequiredXP(9)` ≈ 1000
- [ ] `getRankFromLevel(3)` = E-ранг, `getRankFromLevel(10)` = D-ранг
- [ ] Все функции типизированы TypeScript
- [ ] Нет runtime ошибок при граничных значениях (level 0, level 100)

---

## PHASE 4 — Quests Page

### T-019 · Quests Page: структура и табы
**Depends on:** T-013
**Status:** `[x]`

**Action:**
`src/app/(app)/quests/page.tsx`:
- Три вкладки: Ежедневные / Еженедельные / Эпические
- shadcn Tabs компонент, стилизованный под дизайн-систему
- Каждая вкладка загружает квесты соответствующего типа из БД

**Done when:**
- [ ] Три таба рендерятся без ошибок
- [ ] Переключение между табами не вызывает перезагрузку страницы
- [ ] Каждый таб показывает только квесты своего типа
- [ ] Активный таб визуально выделен

---

### T-020 · Quest Card компонент
**Depends on:** T-019
**Status:** `[x]`

**Action:**
`src/components/quests/quest-card.tsx`:
- Структура из PRD §4.2.3: название, атрибут + XP, сложность, streak, progress bar
- Кнопка «Выполнено» → `completeQuest()` с оптимистичным обновлением
- Анимация появления: fade in + translateY (Framer Motion)
- Стиль: glass-карточка §3.4
- Streak отображается только у daily квестов

**Done when:**
- [ ] Карточка отображает все поля из PRD §4.2.3
- [ ] Кнопка «Выполнено» вызывает Server Action
- [ ] Оптимистичное обновление: карточка помечается выполненной немедленно
- [ ] При ошибке — откат и toast уведомление
- [ ] Анимация появления при загрузке списка (stagger 50ms)
- [ ] Нельзя выполнить уже выполненный квест

---

### T-021 · Epic Quest Card компонент
**Depends on:** T-019
**Status:** `[x]`

**Action:**
`src/components/quests/epic-quest-card.tsx`:
- Структура из PRD §4.2.3: заголовок ДАНЖ, описание, progress bar (%), награда, дедлайн
- Список субквестов с чекбоксами
- Поле для обновления текущего значения прогресса
- Server Action `updateEpicProgress()`
- Визуально отличается от обычной карточки (prominent border, другой badge)

**Done when:**
- [ ] Epic квесты отображаются на вкладке «Эпические»
- [ ] Progress bar показывает % выполнения (current/target)
- [ ] Субквесты перечислены и их статус обновляется
- [ ] Поле обновления прогресса работает
- [ ] Дедлайн отображается

---

### T-022 · Quest Form: создание и редактирование квестов
**Depends on:** T-019
**Status:** `[x]`

**Action:**
`src/components/quests/quest-form.tsx`:
- Dialog (shadcn) с формой
- Поля: название, тип (daily/weekly/epic), атрибут, сложность, описание
- Для epic: target_value, deadline
- React Hook Form + Zod валидация
- Server Actions: `createQuest()` и `updateQuest()`
- Кнопка «+ Добавить квест» на странице квестов

**Done when:**
- [ ] Форма открывается в диалоге
- [ ] Все поля валидируются (название обязательно, XP автоcalculate по сложности)
- [ ] Создание нового квеста → появляется в списке без перезагрузки
- [ ] Редактирование существующего квеста работает
- [ ] Удаление квеста с подтверждением

---

## PHASE 5 — Stats Page

### T-023 · Stats: Full Radar Chart
**Depends on:** T-013
**Status:** `[x]`

**Action:**
`src/components/stats/radar-chart.tsx`:
- Полноразмерный RadarChart (Recharts), responsive
- 5 атрибутов с числовыми значениями
- Кастомный tooltip
- Цвет: gradient по атрибуту (STR=red, INT=blue, CHA=amber, DIS=purple, WLT=green)

**Done when:**
- [ ] Radar chart занимает ~80% ширины на мобильном
- [ ] Все 5 атрибутов с подписями и числами
- [ ] Responsive (не выходит за границы на мобильном)
- [ ] Данные актуальны (из БД)

---

### T-024 · Stats: Attribute Bars
**Depends on:** T-023
**Status:** `[x]`

**Action:**
`src/components/stats/attribute-bars.tsx`:
- 5 прогресс-баров с числами (STR 24, INT 31, ...)
- Каждый бар — своего цвета из палитры
- Анимация заполнения при появлении на экране (Intersection Observer)

**Done when:**
- [ ] 5 баров с правильными цветами
- [ ] Анимация при скролле к секции
- [ ] Числа берутся из БД (attr_xp / 10 = attribute points)

---

### T-025 · Stats: Heat Map (Activity Calendar)
**Depends on:** T-013
**Status:** `[x]`

**Action:**
`src/components/stats/heat-map.tsx`:
- Календарная сетка последних 90 дней (как GitHub contribution graph)
- Интенсивность цвета = completion_rate дня (0 = пусто, 1 = полный)
- Tooltip с датой и % выполнения
- Данные из таблицы `daily_progress`
- Кастомная реализация (без внешней библиотеки)

**Done when:**
- [ ] 90 дней отображаются в сетке
- [ ] 4+ уровня интенсивности цвета
- [ ] Tooltip при наведении
- [ ] Текущий день выделен
- [ ] Данные из `daily_progress`

---

### T-026 · Stats: XP Line Chart и Timeline
**Depends on:** T-023
**Status:** `[x]`

**Action:**
`src/components/stats/xp-line-chart.tsx`:
- Recharts LineChart: XP earned per day за 30 дней
- Данные агрегируются из `quest_logs`
- Minimal style: одна линия, no grid lines, subtle area fill

`src/components/stats/timeline.tsx`:
- Вертикальная timeline достижений
- «День 1: Пробуждение», «День 7: Первый стрик» и т.д.
- Данные из `user_achievements`

**Done when:**
- [ ] Line chart отображает данные за 30 дней
- [ ] Timeline показывает разблокированные достижения с датами
- [ ] Оба компонента адаптивны

---

## PHASE 6 — Achievements & Shop

### T-027 · Achievements: страница и grid
**Depends on:** T-013, T-007
**Status:** `[x]`

**Action:**
`src/app/(app)/achievements/page.tsx` + `src/components/achievements/`:
- Grid из карточек достижений
- Фильтрация по категориям: Все / Привычки / Ранги / Особые
- Разблокированные: полная карточка с датой
- Заблокированные: затемнённые, с подсказкой условия
- Счётчик «12/48 открыто»

**Done when:**
- [ ] Grid минимум 20 достижений (из seed)
- [ ] Фильтрация по 4 категориям работает
- [ ] Визуальное отличие locked/unlocked
- [ ] Скрытые достижения показывают «???»
- [ ] Счётчик корректен

---

### T-028 · Achievement Checker
**Depends on:** T-027
**Status:** `[x]`

**Action:**
`src/lib/game/achievement-checker.ts`:
- Функция `checkAchievements(userId)` — проверяет все условия
- Вызывается из `completeQuest()` Server Action
- Поддерживаемые условия (из `achievements.condition` JSONB):
  - `{ type: 'quests_completed', count: N }`
  - `{ type: 'streak_days', count: N }`
  - `{ type: 'level_reached', level: N }`
  - `{ type: 'rank_reached', rank: 'D' }`
  - `{ type: 'attribute_points', attribute: 'str', min: N }`
- Вставляет в `user_achievements` если условие выполнено

**Done when:**
- [ ] Достижение «Первый шаг» (1 квест) разблокируется после первого выполненного квеста
- [ ] Достижение «Неделя огня» (7 streak) разблокируется при streak=7
- [ ] Нет дублирующих записей в `user_achievements`
- [ ] Функция возвращает список новых достижений

---

### T-029 · Shop: Reward Shop страница
**Depends on:** T-013
**Status:** `[x]`

**Action:**
`src/app/(app)/shop/page.tsx` + компоненты:
- Отображение баланса монет вверху
- Grid из reward-карточек
- `src/components/shop/reward-card.tsx`: emoji, название, стоимость, кнопка «Получить»
- `src/components/shop/reward-form.tsx`: добавление кастомной награды
- Server Action `redeemReward()`: проверка баланса, списание, запись в `reward_logs`
- Cooldown: если `cooldown_hours` задан и не истёк — кнопка disabled с таймером

**Done when:**
- [ ] Награды из БД отображаются
- [ ] Баланс монет отображается актуальный
- [ ] «Получить» списывает монеты и показывает toast
- [ ] Недостаточно монет → кнопка disabled с подсказкой
- [ ] Cooldown отображается если активен
- [ ] Добавление кастомной награды работает

---

## PHASE 7 — Effects & Feedback

### T-030 · XP Popup анимация
**Depends on:** T-015
**Status:** `[x]`

**Action:**
`src/components/effects/xp-popup.tsx`:
- При выполнении квеста: «+15 XP» поднимается вверх и растворяется
- Framer Motion: `y: 0 → -40`, `opacity: 1 → 0`, duration 1.2s
- Цвет: `--color-xp`
- Позиция: рядом с нажатой кнопкой

Интегрировать в `quest-card.tsx` и `daily-quests.tsx`

**Done when:**
- [ ] XP popup появляется при выполнении квеста
- [ ] Анимация: поднимается и растворяется
- [ ] Текст показывает реальное количество XP
- [ ] Несколько попапов не мешают друг другу

---

### T-031 · Level Up Overlay
**Depends on:** T-018
**Status:** `[x]`

**Action:**
`src/components/effects/level-up-overlay.tsx`:
- Полупрозрачный overlay при level up
- Центральный элемент: «LEVEL UP!» + новый уровень
- Золотая вспышка + Framer Motion particles
- Длительность: 2.5 секунды, затем автозакрытие
- Вызывается из `completeQuest()` когда `leveledUp: true`

**Done when:**
- [ ] Overlay появляется при реальном level up
- [ ] Анимация: вспышка + появление текста + закрытие
- [ ] Не блокирует интерфейс после закрытия
- [ ] Показывает новый уровень

---

### T-032 · Streak Tracker и Daily Reset
**Depends on:** T-015
**Status:** `[x]`

**Action:**
`src/lib/game/streak-tracker.ts`:
- `updateStreak(userId, date)` — обновление стрика
- Логика: если вчера был прогресс → streak+1, иначе → сброс
- Rest day не ломает streak

`supabase/functions/daily-reset/index.ts`:
- Cron Function: каждый день в 00:00 UTC
- Сбрасывает `is_completed` у всех daily квестов
- Вызывает `updateStreak` для каждого пользователя
- Записывает итоговый `daily_progress` за прошедший день
- Применяет/снимает дебаффы

**Done when:**
- [ ] `streak-tracker.ts` содержит корректную логику
- [ ] Edge Function создана в `supabase/functions/daily-reset/`
- [ ] Rest day (`is_rest_day = true`) не ломает streak
- [ ] 3 пропущенных дня подряд → debuff «laziness» в `active_debuffs`

---

## PHASE 8 — Settings & Polish

### T-033 · Settings страница
**Depends on:** T-013
**Status:** `[x]`

**Action:**
`src/app/(app)/settings/page.tsx`:
- Секция «Профиль»: изменение имени, аватара
- Секция «Уведомления»: toggle на push-уведомления, время напоминания
- Секция «Данные»: кнопка «Экспорт JSON» (скачать данные пользователя)
- Секция «Аккаунт»: кнопка «Выйти», кнопка «Удалить аккаунт» (с подтверждением)

**Done when:**
- [ ] Все 4 секции рендерятся
- [ ] Изменение имени сохраняется в `profiles`
- [ ] Смена аватара сохраняется
- [ ] «Выйти» → Supabase signOut → редирект на `/login`
- [ ] Экспорт JSON скачивает файл с данными пользователя

---

### T-034 · PWA: Manifest и Service Worker
**Depends on:** T-001
**Status:** `[x]`

**Action:**
- `public/manifest.json`: name, short_name, icons (192, 512), theme_color=#0A0A0F, background_color=#0A0A0F, display=standalone
- Иконки: создать SVG-иконку приложения, экспортировать PNG 192 и 512
- Настроить `next-pwa` в `next.config.js`
- Проверить установку как PWA в Chrome DevTools → Application

**Done when:**
- [ ] `public/manifest.json` существует и валиден
- [ ] `public/icons/icon-192.png` и `icon-512.png` существуют
- [ ] В Chrome DevTools → Application → Manifest нет ошибок
- [ ] Lighthouse PWA score ≥ 80

---

### T-035 · Loading States и Empty States
**Depends on:** T-013
**Status:** `[x]`

**Action:**
`src/components/shared/`:
- `loading-skeleton.tsx` — skeleton компоненты для карточек (анимированный shimmer)
- `empty-state.tsx` — состояние «нет квестов», «нет достижений» и т.д.
- Suspense boundaries в страницах с `<Suspense fallback={<LoadingSkeleton />}>`

**Done when:**
- [ ] При загрузке данных виден skeleton, не пустой экран
- [ ] Skeleton анимирован (shimmer effect)
- [ ] При отсутствии данных виден empty state с CTA
- [ ] Нет layout shift при загрузке

---

### T-036 · Toast уведомления
**Depends on:** T-013
**Status:** `[x]`

**Action:**
Подключить shadcn Toast в `src/app/layout.tsx`.
Использовать toast для:
- Успешное выполнение квеста: «Квест выполнен! +15 XP»
- Ошибка: «Ошибка. Попробуй снова»
- Level up: «Уровень повышен! Уровень 4»
- Достижение: «Достижение разблокировано: Первый шаг»
- Редим награды: «Награда активирована: Заказать еду»

**Done when:**
- [ ] Toast provider в root layout
- [ ] Toast появляется при выполнении квеста
- [ ] Toast появляется при ошибке
- [ ] Toast автоматически закрывается через 3-4 секунды
- [ ] Toast стилизован под дизайн-систему (тёмный фон)

---

## PHASE 9 — Final QA

### T-037 · Responsive QA
**Depends on:** все предыдущие
**Status:** `[x]`

**Проверить на:**
- iPhone SE (375px)
- iPhone 14 (390px)
- iPad (768px)
- Desktop (1280px)

**Done when:**
- [ ] Нет горизонтального скролла на всех размерах
- [ ] Bottom nav на мобильном, sidebar на десктопе
- [ ] Touch targets ≥ 44px на мобильном
- [ ] Шрифты читаемы (min 14px body)
- [ ] Карточки не обрезаются

---

### T-038 · Performance & Accessibility QA
**Depends on:** T-037
**Status:** `[x]`

**Done when:**
- [ ] Lighthouse Performance score ≥ 85 (desktop)
- [ ] Lighthouse Accessibility score ≥ 80
- [ ] Нет ошибок TypeScript (`npm run build` без ошибок)
- [ ] Нет ошибок ESLint
- [ ] Все интерактивные элементы доступны с клавиатуры
- [ ] `<img>` теги имеют alt атрибуты

---

### T-039 · Deploy на Vercel
**Depends on:** T-038
**Status:** `[ ]`

**Action:**
- Создать репозиторий GitHub
- Подключить к Vercel
- Добавить environment variables в Vercel Dashboard
- Проверить production build

**Done when:**
- [ ] Приложение доступно по публичному URL
- [ ] Auth работает в production
- [ ] Supabase RLS работает (пользователь видит только свои данные)
- [ ] PWA устанавливается с production URL
- [ ] Нет ошибок в Vercel Function Logs

---

## Итого: 39 задач

| Phase | Задачи | Цель |
|-------|--------|------|
| Phase 0: Bootstrap | T-001 — T-005 | Проект, стек, структура |
| Phase 1: DB & Auth | T-006 — T-009 | База данных, вход |
| Phase 2: Onboarding | T-010 — T-012 | Первый запуск |
| Phase 3: Dashboard | T-013 — T-018 | Главный экран + game logic |
| Phase 4: Quests | T-019 — T-022 | Страница квестов |
| Phase 5: Stats | T-023 — T-026 | Аналитика |
| Phase 6: Achievements & Shop | T-027 — T-029 | Контент и монетизация времени |
| Phase 7: Effects | T-030 — T-032 | Игровой feedback |
| Phase 8: Polish | T-033 — T-036 | Settings, PWA, UX |
| Phase 9: QA & Deploy | T-037 — T-039 | Выпуск |

---

## Как читать этот документ

**Для меня (Claude):**
1. Найти первую задачу со статусом `[ ]` у которой все зависимости `[x]`
2. Сменить статус на `[→]`
3. Выполнить все пункты из раздела Action
4. Пройтись по каждому критерию «Done when» и проверить
5. Только если ВСЕ критерии выполнены → сменить статус на `[x]`
6. Перейти к следующей задаче

**Для пользователя:**
- Можно в любой момент сказать «стоп» или «пропусти T-XXX»
- Можно добавить новую задачу в любое место
- Статус `[!]` означает: нужно решение от пользователя
