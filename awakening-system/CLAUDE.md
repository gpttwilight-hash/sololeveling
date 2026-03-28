# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint
npm test             # Run all tests (Vitest, once)
npm run test:watch   # Run tests in watch mode

# Run a single test file
npm test -- src/__tests__/use-section-hint.test.ts

# Type-check without emitting
npx tsc --noEmit

# Apply DB migrations to Supabase
npx supabase db push
```

## Architecture

Next.js 15 App Router with two route groups:

- `src/app/(app)/` — Protected app routes. All pages are Server Components; data is fetched directly in page files using the server Supabase client.
- `src/app/(auth)/` — Public auth routes (login, signup, forgot/reset password).
- `src/app/onboarding/` — Onboarding flow (separate from both groups).
- `src/app/api/` — API routes (AI quest generation, push notification subscription).

**Server Actions** live in `actions.ts` files co-located with their route group:
- `src/app/(app)/actions.ts` — All game mutations: `completeQuest`, `createQuest`, `redeemReward`, `declareRestDay`, `reorderQuests`, etc.
- `src/app/(auth)/actions.ts` — Auth: `login`, `signup`, `resendConfirmation`, `updatePassword`.
- `src/app/onboarding/actions.ts` — `completeOnboarding` (seeds starter + tutorial quests).

## Supabase Pattern

Two separate clients — never mix them:

```typescript
// Server Components and Server Actions
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();

// Client Components (rare)
import { createClient } from "@/lib/supabase/client";
```

The server client reads from `cookies()` for SSR session management. Middleware at `src/middleware.ts` refreshes sessions on every request.

**Atomic mutations** use Postgres RPC (`supabase.rpc()`), not chained JS calls. The `completeQuest` action calls `complete_quest` RPC (migration `018`) to prevent race conditions — XP/coins are pre-computed in JS and passed as parameters so debuff logic stays in TypeScript.

## Game Mechanics Layer

All game logic is in `src/lib/game/`. Pure functions, no Supabase calls:

| File | Responsibility |
|------|----------------|
| `xp-calculator.ts` | XP formula: `baseXP(100) * level^1.3`; level derivation |
| `level-system.ts` | `checkLevelUp(currentXP, xpEarned)` |
| `rank-system.ts` | 6 ranks E→S mapped to level ranges; `checkRankUp` |
| `achievement-checker.ts` | Evaluates `AchievementCondition` against profile + context |
| `streak-tracker.ts` | Streak calculation + laziness debuff trigger (3 missed days) |
| `constants.ts` | `XP_BY_DIFFICULTY`, `RANKS`, `COIN_MULTIPLIER` (0.5), debuff config |
| `ai-quest-sanitizer.ts` | Caps AI-generated XP/coins before DB insert |

XP by difficulty: `easy=8, medium=15, hard=30, legendary=80`. Coins = XP × 0.5. Tutorial quests override these values with exact amounts seeded in `completeOnboarding`.

## Types

- `src/types/game.ts` — Domain types (`Quest`, `Profile`, `QuestType`, `AttributeKey`, etc.)
- `src/types/database.ts` — Supabase-generated row types. Both files must stay in sync whenever the schema changes.

`QuestType` is `"daily" | "weekly" | "epic" | "tutorial"`. The DB enforces this via a named CHECK constraint `quests_type_check`. The `VALID_TYPES` runtime array in `(app)/actions.ts` (`createQuest`) must also be kept in sync.

## Database Migrations

Migrations live in `supabase/migrations/` (numbered `001`–`019`). Always create a new file — never edit existing migrations. Check for numbering conflicts before creating:

```bash
ls supabase/migrations/ | grep "^019"
```

RLS is enabled on all tables. The `rewards` table uses soft-delete (`is_active: false`) rather than hard DELETE.

## Design System

CSS custom properties for all colors (defined in global CSS, not Tailwind config):

```
--bg-primary / --bg-secondary / --bg-tertiary
--text-primary / --text-secondary / --text-tertiary
--color-xp: #6366F1   (indigo — XP, tutorial, initiation)
--color-level-up: #FBBF24 (gold)
--border-subtle
```

Attribute colors: `STR=#E84855 INT=#3B82F6 CHA=#F59E0B DIS=#8B5CF6 WLT=#10B981`.

Use inline `style={{ color: "var(--text-primary)" }}` for design token colors, Tailwind classes for layout/spacing.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL        # Required
NEXT_PUBLIC_SUPABASE_ANON_KEY   # Required
NEXT_PUBLIC_SITE_URL            # Production domain (fallback: http://localhost:3000)
```

Used for `emailRedirectTo` in `signUp` to route confirmation emails through `/auth/callback`.

## Testing

Test files are in `src/__tests__/`. The environment is `node` by default. Tests that use `localStorage` or React hooks must declare `// @vitest-environment jsdom` as the first line.

`@testing-library/react` is available for hook tests. `renderHook` + `act(async () => {})` is the pattern for testing hooks with async effects.
