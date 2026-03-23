# Onboarding & UX Engagement — Awakening System
**Date:** 2026-03-23
**Approach:** Tutorial Quests (Approach B) + Contextual Section Hints
**Scope:** Onboarding tweaks, tutorial quest system, first-visit hint cards

---

## Problem

New users get lost at three levels:
1. **Onboarding Step 1** — "How It Works" cards are passive reading; mechanics don't stick
2. **First dashboard visit** — 15 components with no guidance on where to start
3. **Deep sections** (shop, epic quests, stats, achievements) — user finds them but doesn't understand their purpose

---

## Solution Overview

Three-layer approach:
1. **Onboarding tweaks** — minor copy changes + seed tutorial quests at completion
2. **Tutorial quest system ("Инициация")** — 9 system quests that teach by doing; give real XP/coins
3. **Contextual section hints** — dismissible info cards on first visit to each section

Tutorial quests persist until completed (no skip); contextual hints are dismissible.

---

## Layer 1: Onboarding Changes

### Step 1 — "How It Works"
Add a teaser paragraph after the 4 mechanic cards:

> *"После регистрации Система выдаст тебе Задания инициации — они научат тебя всему остальному на практике. За каждое — настоящие XP."*

This sets expectations and frames the tutorial quests as a reward, not a chore.

### Rank Reveal (final onboarding screen)
Current: one line "Ранг E присвоен".
Add second line:

> *"⚡ Система инициации активирована — 9 заданий ожидают тебя"*

### `completeOnboarding` action
Seed 9 tutorial quests (type `tutorial`) into the `quests` table for the new user alongside their selected starter quests. Tutorial quests are not tied to the user's focus selection — they cover the whole app.

---

## Layer 2: Tutorial Quest System

### Where it lives
A new **"⚡ Инициация"** tab — the first tab in `/quests` — visible only while at least one tutorial quest is incomplete. Once all 9 are done, the tab disappears permanently.

### Quest card visual
Same as standard `QuestCard` but:
- Purple left border (uses `color-xp: #6366F1`)
- `СИСТЕМА` badge instead of attribute label
- Completed cards render grey with a checkmark

### Progress bar
Top of the Инициация tab:
```
⚡ Инициация: 3 / 9 выполнено  [████████░░░░░░░░]
```

### Dashboard widget
While initiation is incomplete, a small widget appears below `ProfileCard`:
```
⚡ Инициация: 3/9 — продолжить →
```
Tapping navigates to `/quests` (Инициация tab). Widget disappears when all 9 are complete.

### The 9 Tutorial Quests

All quests use **self-reported completion** (user performs the action, then taps "Выполнено"). They do not auto-complete — including quests #8 and #9, which describe observable system state but are completed by the user manually once they feel the condition is met.

All tutorial quests are seeded with `difficulty = "easy"` and `is_recurring = false`. The `is_recurring = false` value is critical — it ensures the daily cron reset job (which targets `type = 'daily' AND is_recurring = true`) never touches tutorial quests.

| # | Title | What it teaches | XP | Coins | Attribute | Difficulty |
|---|-------|-----------------|----|-------|-----------|------------|
| 1 | Выполни свой первый ежедневный квест | Quest completion mechanic | 20 | 10 | DIS | easy |
| 2 | Создай собственный квест | Custom quest creation | 15 | 8 | INT | easy |
| 3 | Загляни в Магазин и изучи награды | Coin economy | 10 | 5 | WLT | easy |
| 4 | Потрать монеты на любую награду | Shop redemption mechanic | 15 | 10 | WLT | easy |
| 5 | Создай Epic Quest | Long-term goal system | 20 | 10 | DIS | easy |
| 6 | Открой раздел Статистика | Progress tracking | 10 | 5 | INT | easy |
| 7 | Открой раздел Достижения | Achievement system | 10 | 5 | INT | easy |
| 8 | Выполни 3 квеста за один день | Daily activity habit | 25 | 15 | DIS | easy |
| 9 | Поддержи streak 2 дня подряд | Streak mechanic | 30 | 20 | DIS | easy |

**Total: 155 XP, 88 coins** — meaningful starter boost, within economy bounds.

### Data model
- Add `tutorial` to the `quest_type` enum in the DB (migration `019_add_tutorial_quest_type.sql`)
- Add `"tutorial"` to the TypeScript `QuestType` union in `src/types/game.ts` and both occurrences in `src/types/database.ts`
- Add `"tutorial"` to the inline type literals in `src/app/(app)/actions.ts` (two locations: `createQuest` and `updateQuest` type guards)
- Tutorial quests stored as regular rows in `quests` table with `type = 'tutorial'`, `is_recurring = false`, `difficulty = 'easy'`
- Completion via existing `completeQuest` action (no new endpoints)
- **Single fetch strategy:** `quests/page.tsx` (Server Component) fetches `tutorialQuests` once and passes the array as props to both `InitiationTab` and `InitiationWidget`. Do not issue two separate DB queries.
- Verify no migration file conflicts at `019` before applying (check `supabase/migrations/` directory)

---

## Layer 3: Contextual Section Hints

### Mechanism
- State stored in `localStorage` (no DB needed): keys `hint_dismissed_shop`, `hint_dismissed_stats`, etc.
- Reusable `SectionHintCard` component: accepts `hintKey` + title + bullet points
- On mount: reads localStorage; if key absent → renders card
- On dismiss: sets key to `"1"` in localStorage → card unmounts
- **SSR safety:** `useSectionHint` must be used only inside `"use client"` components. Access `localStorage` only inside `useEffect` or behind a `typeof window !== 'undefined'` guard — direct access at render time will throw on the server.
- **localStorage cleared:** hints reappear for all sections. This is accepted behaviour — no workaround needed.

### Hook
`useSectionHint(hintKey: string): { isDismissed: boolean; dismiss: () => void }`

Internally uses `useEffect` to read/write `localStorage` after hydration. Returns `isDismissed = true` on first render (SSR-safe default) and updates to the stored value after mount.

### 5 Section Hints

**`/dashboard`** — shown only on first visit after onboarding (key: `hint_dismissed_dashboard`)
> **⚡ Добро пожаловать, Охотник**
> - Здесь твой штаб: ежедневные квесты, стрик, прогресс атрибутов
> - DispatchCard и PortalCard обновляются каждый день — не пропускай
> - Начни с вкладки Инициация в разделе Квесты

**`/shop`** — key: `hint_dismissed_shop`
> **🛒 Как работает магазин**
> - За выполнение квестов ты получаешь монеты
> - Создавай награды для себя — всё что мотивирует
> - У каждой награды можно поставить кулдаун, чтобы не злоупотреблять

**`/quests` Epic tab** — shown when the Epic tab is active (key: `hint_dismissed_epic`). The Epic tab content is **lazily mounted** — rendered only when the user switches to it. `SectionHintCard` is placed inside the Epic tab content; `useSectionHint` fires on mount, which happens on first tab switch. If the tab implementation ever changes to eager rendering, move the hint check to also require `isTabActive === true`.
> **⚔️ Epic Quests — долгосрочные цели**
> - Большие задачи которые разбиваются на подзадачи
> - Прогресс виден на дашборде
> - Дают синергию-очки за каждый выполненный подквест

**`/stats`** — key: `hint_dismissed_stats`
> **📊 Твой прогресс**
> - Радар показывает баланс атрибутов — STR, INT, CHA, DIS, WLT
> - XP-график — история активности за 90 дней
> - Тепловая карта — видишь паттерны своей продуктивности

**`/achievements`** — key: `hint_dismissed_achievements`
> **🏆 Достижения**
> - Разблокируются автоматически при выполнении условий
> - Некоторые требуют накопленного прогресса — проверяй регулярно
> - Поделиться ачивкой можно через кнопку шера

---

## New Files

| File | Purpose |
|------|---------|
| `src/components/quests/initiation-tab.tsx` | Tutorial quests list with progress bar |
| `src/components/shared/section-hint-card.tsx` | Reusable dismissible hint card |
| `src/components/dashboard/initiation-widget.tsx` | Dashboard progress widget (3/9) |
| `src/hooks/use-section-hint.ts` | localStorage hook for hint dismissal |
| `supabase/migrations/019_add_tutorial_quest_type.sql` | Add `tutorial` to quest_type enum |

## Modified Files

| File | Change |
|------|--------|
| `src/app/onboarding/page.tsx` | Add teaser text in Step 1 + second line in Rank Reveal |
| `src/app/onboarding/actions.ts` | Seed 9 tutorial quests in `completeOnboarding` |
| `src/app/(app)/quests/page.tsx` | Add "Инициация" tab (first tab, conditional); fetch `tutorialQuests` once, pass to tab + widget |
| `src/app/(app)/dashboard/page.tsx` | Add `InitiationWidget` below `ProfileCard` |
| `src/app/(app)/shop/page.tsx` | Add `SectionHintCard` at top |
| `src/app/(app)/stats/page.tsx` | Add `SectionHintCard` at top |
| `src/app/(app)/achievements/page.tsx` | Add `SectionHintCard` at top |
| `src/types/game.ts` | Add `"tutorial"` to `QuestType` union |
| `src/types/database.ts` | Add `"tutorial"` to both `type` field occurrences in quest-related types |
| `src/app/(app)/actions.ts` | Add `"tutorial"` to inline type literals in `createQuest` and `updateQuest` |

---

## Existing Users

Tutorial quests are seeded only in `completeOnboarding` (new users). Existing users who have already completed onboarding do not receive tutorial quests — this is intentional. The hint cards (localStorage-based) will appear for all users on their next visit to each section since localStorage keys are absent.

---

## Out of Scope

- Auto-completing tutorial quests based on detected actions (e.g., auto-complete "Загляни в магазин" when /shop is visited) — deferred to a future iteration
- Tutorial quests for existing users — not worth the complexity for what is likely a small existing user base
- Re-showing hints (no "reset hints" feature) — YAGNI
