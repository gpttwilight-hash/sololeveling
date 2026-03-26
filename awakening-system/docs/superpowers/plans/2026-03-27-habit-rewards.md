# Habit Rewards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend quests with flexible weekly frequency (1-7x/week) and personal rewards tied to each recurring daily quest.

**Architecture:** New fields on `quests` table (`frequency_per_week`, `reward_emoji`, `reward_title`) store habit configuration. A new `habit_weeks` table tracks per-week progress (completions, success, reward claimed). Lazy initialization on page load creates `habit_weeks` rows. `completeQuest` increments completions; a new `claimHabitReward` action handles reward claiming.

**Tech Stack:** Next.js 15 App Router, Supabase (PostgreSQL + RLS), TypeScript, Vitest, Zod, Framer Motion

**Spec:** `docs/superpowers/specs/2026-03-27-habit-rewards-design.md`

---

## File Structure

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `supabase/migrations/020_habit_rewards.sql` | DB migration: new fields, table, RLS |
| Modify | `src/types/game.ts` | Add `frequency_per_week`, `reward_emoji`, `reward_title` to Quest; add `HabitWeek` interface |
| Modify | `src/types/database.ts` | Add new fields to QuestRow; add HabitWeekRow; add `source` to RewardLogRow |
| Create | `src/lib/game/habit-week.ts` | Pure functions: `getWeekStart`, `shouldResetQuest`, `computeWeeklyStreak` |
| Create | `src/__tests__/habit-week.test.ts` | Tests for habit-week pure functions |
| Modify | `src/app/(app)/actions.ts` | Update `completeQuest`, `createQuest`, `updateQuest`; add `claimHabitReward` |
| Modify | `src/app/(app)/quests/page.tsx` | Lazy `habit_weeks` creation, extended daily reset logic, pass `habitWeeks` to cards |
| Modify | `src/components/quests/quest-form.tsx` | Frequency chips + reward emoji/title fields |
| Modify | `src/components/quests/quest-card.tsx` | Progress badge, claim reward button, completed-for-week state |

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/020_habit_rewards.sql`

- [ ] **Step 1: Create migration file**

```sql
-- 020_habit_rewards.sql
-- Adds habit frequency + reward fields to quests,
-- creates habit_weeks tracking table,
-- adds source field to reward_logs.

-- 1. New columns on quests
ALTER TABLE quests ADD COLUMN frequency_per_week INTEGER NOT NULL DEFAULT 7;
ALTER TABLE quests ADD COLUMN reward_emoji TEXT;
ALTER TABLE quests ADD COLUMN reward_title TEXT;

-- Constrain frequency to 1-7
ALTER TABLE quests ADD CONSTRAINT quests_frequency_check
  CHECK (frequency_per_week >= 1 AND frequency_per_week <= 7);

-- 2. habit_weeks table
CREATE TABLE habit_weeks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quest_id      UUID NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_start    DATE NOT NULL,
  target        INTEGER NOT NULL,
  completions   INTEGER NOT NULL DEFAULT 0,
  is_success    BOOLEAN NOT NULL DEFAULT FALSE,
  reward_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  claimed_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),

  UNIQUE(quest_id, week_start)
);

-- RLS for habit_weeks
ALTER TABLE habit_weeks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own habit_weeks"
  ON habit_weeks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own habit_weeks"
  ON habit_weeks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habit_weeks"
  ON habit_weeks FOR UPDATE
  USING (auth.uid() = user_id);

-- 3. Source field on reward_logs
ALTER TABLE reward_logs ADD COLUMN source TEXT NOT NULL DEFAULT 'shop';
```

- [ ] **Step 2: Verify no migration number conflict**

Run: `ls supabase/migrations/ | grep "^020"`
Expected: only `020_habit_rewards.sql`

- [ ] **Step 3: Apply migration**

Run: `npx supabase db push`
Expected: migration applies without errors

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/020_habit_rewards.sql
git commit -m "feat(db): add habit rewards migration (frequency, reward fields, habit_weeks table)"
```

---

### Task 2: Update TypeScript Types

**Files:**
- Modify: `src/types/game.ts`
- Modify: `src/types/database.ts`

- [ ] **Step 1: Add fields to Quest interface in `src/types/game.ts`**

Find the block after `streak: number;` and before `// Habit science fields`:

```typescript
  streak: number;

  // Habit science fields
```

Replace with:

```typescript
  streak: number;

  // Habit frequency & reward
  frequency_per_week: number; // 1-7, default 7
  reward_emoji?: string;
  reward_title?: string;

  // Habit science fields
```

- [ ] **Step 2: Add HabitWeek interface to `src/types/game.ts`**

After the `CompleteQuestResult` interface (after line ~160), add:

```typescript
export interface HabitWeek {
  id: string;
  quest_id: string;
  user_id: string;
  week_start: string;
  target: number;
  completions: number;
  is_success: boolean;
  reward_claimed: boolean;
  claimed_at?: string;
  created_at: string;
}
```

- [ ] **Step 3: Update QuestRow in `src/types/database.ts`**

Find the QuestRow type and add after the `streak: number;` line:

```typescript
  frequency_per_week: number;
  reward_emoji: string | null;
  reward_title: string | null;
```

- [ ] **Step 4: Add HabitWeekRow to `src/types/database.ts`**

Add a new row type in the Tables section:

```typescript
habit_weeks: {
  Row: {
    id: string;
    quest_id: string;
    user_id: string;
    week_start: string;
    target: number;
    completions: number;
    is_success: boolean;
    reward_claimed: boolean;
    claimed_at: string | null;
    created_at: string;
  };
  Insert: {
    id?: string;
    quest_id: string;
    user_id: string;
    week_start: string;
    target: number;
    completions?: number;
    is_success?: boolean;
    reward_claimed?: boolean;
    claimed_at?: string | null;
    created_at?: string;
  };
  Update: {
    completions?: number;
    is_success?: boolean;
    reward_claimed?: boolean;
    claimed_at?: string | null;
  };
};
```

- [ ] **Step 5: Add `source` to RewardLogRow in `src/types/database.ts`**

Find the RewardLogRow type and add:

```typescript
  source: string; // 'shop' | 'habit'
```

- [ ] **Step 6: Run type check**

Run: `cd /Users/sergeychukavin/Desktop/SOURCES/Solo\ Leveling/awakening-system && npx tsc --noEmit`
Expected: no errors (or only pre-existing errors unrelated to our changes)

- [ ] **Step 7: Commit**

```bash
git add src/types/game.ts src/types/database.ts
git commit -m "feat(types): add HabitWeek interface and habit reward fields to Quest"
```

---

### Task 3: Habit Week Pure Functions

**Files:**
- Create: `src/lib/game/habit-week.ts`

- [ ] **Step 1: Create `src/lib/game/habit-week.ts`**

```typescript
/**
 * Pure functions for habit week cycle logic.
 * No Supabase calls — used by actions and page server components.
 */

/**
 * Returns the Monday (ISO date string) of the week containing `date`.
 * Week = Monday 00:00 – Sunday 23:59.
 */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d.toISOString().split("T")[0];
}

/**
 * Determines if a recurring daily quest should be reset today.
 *
 * For frequency_per_week = 7: always reset (same as current behavior).
 * For frequency_per_week < 7: only reset if weekly target not yet met.
 */
export function shouldResetQuest(
  lastResetDate: string | null,
  today: string,
  frequencyPerWeek: number,
  weeklyCompletions: number
): boolean {
  // Not completed since last reset — nothing to reset
  if (lastResetDate === today) return false;
  // If no last reset date, always reset
  if (!lastResetDate || lastResetDate < today) {
    // For daily (7/7): always reset
    if (frequencyPerWeek >= 7) return true;
    // For habit (< 7): only reset if target not yet met
    return weeklyCompletions < frequencyPerWeek;
  }
  return false;
}

/**
 * Computes the new streak value when a new week starts.
 *
 * For frequency_per_week < 7: streak = consecutive successful weeks.
 * For frequency_per_week = 7: streak is unchanged here (managed by complete_quest RPC).
 */
export function computeWeeklyStreak(
  currentStreak: number,
  frequencyPerWeek: number,
  previousWeekSuccess: boolean | null
): number {
  // For daily quests (7/7), streak is managed per-completion, not per-week
  if (frequencyPerWeek >= 7) return currentStreak;

  // For habit quests (< 7), streak counts successful weeks
  if (previousWeekSuccess === true) return currentStreak + 1;
  if (previousWeekSuccess === false) return 0;
  // null = no previous week record (first week) — start at 0
  return 0;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/game/habit-week.ts
git commit -m "feat(game): add habit-week pure functions (getWeekStart, shouldResetQuest, computeWeeklyStreak)"
```

---

### Task 4: Tests for Habit Week Functions

**Files:**
- Create: `src/__tests__/habit-week.test.ts`

- [ ] **Step 1: Write tests**

```typescript
import { describe, it, expect } from "vitest";
import {
  getWeekStart,
  shouldResetQuest,
  computeWeeklyStreak,
} from "../lib/game/habit-week";

describe("getWeekStart", () => {
  it("returns Monday for a Wednesday", () => {
    // 2026-03-25 is Wednesday
    const result = getWeekStart(new Date("2026-03-25T12:00:00"));
    expect(result).toBe("2026-03-23");
  });

  it("returns Monday for a Monday", () => {
    const result = getWeekStart(new Date("2026-03-23T08:00:00"));
    expect(result).toBe("2026-03-23");
  });

  it("returns Monday for a Sunday", () => {
    // 2026-03-29 is Sunday
    const result = getWeekStart(new Date("2026-03-29T23:59:00"));
    expect(result).toBe("2026-03-23");
  });

  it("returns Monday for a Saturday", () => {
    // 2026-03-28 is Saturday
    const result = getWeekStart(new Date("2026-03-28T10:00:00"));
    expect(result).toBe("2026-03-23");
  });
});

describe("shouldResetQuest", () => {
  const today = "2026-03-25";

  it("resets daily (7/7) quest when last_reset_date < today", () => {
    expect(shouldResetQuest("2026-03-24", today, 7, 0)).toBe(true);
  });

  it("does not reset if already reset today", () => {
    expect(shouldResetQuest(today, today, 7, 0)).toBe(false);
  });

  it("resets habit quest (3/7) when weekly target not met", () => {
    expect(shouldResetQuest("2026-03-24", today, 3, 2)).toBe(true);
  });

  it("does not reset habit quest (3/7) when weekly target met", () => {
    expect(shouldResetQuest("2026-03-24", today, 3, 3)).toBe(false);
  });

  it("does not reset habit quest when target exceeded", () => {
    expect(shouldResetQuest("2026-03-24", today, 3, 5)).toBe(false);
  });

  it("resets when last_reset_date is null", () => {
    expect(shouldResetQuest(null, today, 3, 1)).toBe(true);
  });

  it("resets daily quest when last_reset_date is null", () => {
    expect(shouldResetQuest(null, today, 7, 0)).toBe(true);
  });
});

describe("computeWeeklyStreak", () => {
  it("increments streak when previous week was successful (freq < 7)", () => {
    expect(computeWeeklyStreak(3, 3, true)).toBe(4);
  });

  it("resets streak to 0 when previous week failed (freq < 7)", () => {
    expect(computeWeeklyStreak(5, 3, false)).toBe(0);
  });

  it("resets streak to 0 when no previous week (freq < 7)", () => {
    expect(computeWeeklyStreak(0, 3, null)).toBe(0);
  });

  it("leaves streak unchanged for daily quests (freq = 7)", () => {
    expect(computeWeeklyStreak(10, 7, true)).toBe(10);
    expect(computeWeeklyStreak(10, 7, false)).toBe(10);
    expect(computeWeeklyStreak(10, 7, null)).toBe(10);
  });
});
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `cd /Users/sergeychukavin/Desktop/SOURCES/Solo\ Leveling/awakening-system && npm test -- src/__tests__/habit-week.test.ts`
Expected: all tests PASS

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/habit-week.test.ts
git commit -m "test: add habit-week pure function tests"
```

---

### Task 5: Update `createQuest` and `updateQuest` Actions

**Files:**
- Modify: `src/app/(app)/actions.ts`

- [ ] **Step 1: Add new fields to `createQuest` parameter type**

In `createQuest`, find the parameter type definition and add after `narrative?: string;`:

```typescript
  frequency_per_week?: number;
  reward_emoji?: string;
  reward_title?: string;
```

- [ ] **Step 2: Add validation for new fields in `createQuest`**

After the `target_value` validation block (`if (data.target_value !== undefined && ...)`), add:

```typescript
  if (data.frequency_per_week !== undefined && (data.frequency_per_week < 1 || data.frequency_per_week > 7)) {
    throw new Error("Частота должна быть от 1 до 7 раз в неделю");
  }
  if (data.reward_title && data.reward_title.length > 100) {
    throw new Error("Название награды слишком длинное (макс. 100 символов)");
  }
```

- [ ] **Step 3: Pass new fields in `createQuest` insert**

In the `supabase.from("quests").insert({...})` call, add after `narrative: data.narrative || null,`:

```typescript
    frequency_per_week: data.frequency_per_week ?? 7,
    reward_emoji: data.reward_emoji || null,
    reward_title: data.reward_title || null,
```

- [ ] **Step 4: Add same fields to `updateQuest` parameter type**

In `updateQuest`, add the same three optional fields to the parameter type:

```typescript
  frequency_per_week?: number;
  reward_emoji?: string;
  reward_title?: string;
```

- [ ] **Step 5: Pass new fields in `updateQuest` update call**

In the `supabase.from("quests").update({...})` call, add after `narrative: data.narrative || null,`:

```typescript
    frequency_per_week: data.frequency_per_week ?? 7,
    reward_emoji: data.reward_emoji || null,
    reward_title: data.reward_title || null,
```

- [ ] **Step 6: Update Zod schema in `quest-form.tsx` to match**

In `src/components/quests/quest-form.tsx`, find the `schema` definition and add after `narrative: z.string().optional(),`:

```typescript
  frequency_per_week: z.number().min(1).max(7).optional(),
  reward_emoji: z.string().optional(),
  reward_title: z.string().max(100).optional(),
```

- [ ] **Step 7: Run type check**

Run: `npx tsc --noEmit`
Expected: no new errors

- [ ] **Step 8: Commit**

```bash
git add src/app/\(app\)/actions.ts src/components/quests/quest-form.tsx
git commit -m "feat(actions): accept frequency_per_week, reward_emoji, reward_title in createQuest/updateQuest"
```

---

### Task 6: Update `completeQuest` to Increment Habit Weeks

**Files:**
- Modify: `src/app/(app)/actions.ts`

- [ ] **Step 1: Add import for `getWeekStart`**

At the top of `actions.ts`, add:

```typescript
import { getWeekStart } from "@/lib/game/habit-week";
```

- [ ] **Step 2: Add habit_weeks increment logic after the RPC call**

In `completeQuest`, find the comment `// --- Non-atomic post-completion work ---` and add immediately after it (before the level-up check):

```typescript
  // Habit week tracking: increment weekly completions for recurring daily quests
  if (quest.type === "daily" && quest.is_recurring) {
    const weekStart = getWeekStart();

    // Ensure habit_weeks row exists for this week (upsert)
    await supabase.from("habit_weeks").upsert(
      {
        quest_id: questId,
        user_id: user.id,
        week_start: weekStart,
        target: quest.frequency_per_week ?? 7,
      },
      { onConflict: "quest_id,week_start", ignoreDuplicates: true }
    );

    // Increment completions
    const { data: hw } = await supabase
      .from("habit_weeks")
      .select("completions, target")
      .eq("quest_id", questId)
      .eq("week_start", weekStart)
      .single();

    if (hw) {
      const newCompletions = hw.completions + 1;
      await supabase
        .from("habit_weeks")
        .update({
          completions: newCompletions,
          is_success: newCompletions >= hw.target,
        })
        .eq("quest_id", questId)
        .eq("week_start", weekStart);
    }
  }
```

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: no new errors

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/actions.ts
git commit -m "feat(actions): increment habit_weeks completions in completeQuest"
```

---

### Task 7: Add `claimHabitReward` Action

**Files:**
- Modify: `src/app/(app)/actions.ts`

- [ ] **Step 1: Add `claimHabitReward` server action**

Add at the end of the file (before any closing brackets, after the last exported function):

```typescript
export async function claimHabitReward(questId: string): Promise<{ success: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch quest to verify ownership and reward fields
  const { data: quest, error: questErr } = await supabase
    .from("quests")
    .select("reward_emoji, reward_title, frequency_per_week")
    .eq("id", questId)
    .eq("user_id", user.id)
    .single();

  if (questErr || !quest) throw new Error("Quest not found");
  if (!quest.reward_emoji || !quest.reward_title) {
    throw new Error("Quest has no reward configured");
  }

  // Find this week's habit_weeks record
  const weekStart = getWeekStart();
  const { data: hw, error: hwErr } = await supabase
    .from("habit_weeks")
    .select("is_success, reward_claimed")
    .eq("quest_id", questId)
    .eq("week_start", weekStart)
    .single();

  if (hwErr || !hw) throw new Error("No habit week record found");
  if (!hw.is_success) throw new Error("Weekly target not yet reached");
  if (hw.reward_claimed) throw new Error("Reward already claimed this week");

  // Claim the reward
  await supabase
    .from("habit_weeks")
    .update({ reward_claimed: true, claimed_at: new Date().toISOString() })
    .eq("quest_id", questId)
    .eq("week_start", weekStart);

  // Log the reward
  await supabase.from("reward_logs").insert({
    user_id: user.id,
    reward_title: quest.reward_title,
    cost: 0,
    source: "habit",
  });

  revalidatePath("/quests");
  revalidatePath("/dashboard");

  return { success: true };
}
```

- [ ] **Step 2: Run type check**

Run: `npx tsc --noEmit`
Expected: no new errors

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/actions.ts
git commit -m "feat(actions): add claimHabitReward server action"
```

---

### Task 8: Update Quests Page — Lazy Init and Extended Reset

**Files:**
- Modify: `src/app/(app)/quests/page.tsx`

- [ ] **Step 1: Add imports**

At the top of the file, add:

```typescript
import { getWeekStart, shouldResetQuest, computeWeeklyStreak } from "@/lib/game/habit-week";
import type { HabitWeek } from "@/types/game";
```

- [ ] **Step 2: Replace the daily reset logic block**

Find the existing daily reset block (lines ~20-29):

```typescript
const today = new Date().toISOString().split("T")[0];
await supabase
  .from("quests")
  .update({ is_completed: false, last_reset_date: today })
  .eq("user_id", user.id)
  .eq("type", "daily")
  .eq("is_recurring", true)
  .eq("is_completed", true)
  .or(`last_reset_date.is.null,last_reset_date.lt.${today}`);
```

Replace with:

```typescript
const today = new Date().toISOString().split("T")[0];
const weekStart = getWeekStart();

// Fetch all recurring daily quests for reset + habit_weeks logic
const { data: recurringQuests } = await supabase
  .from("quests")
  .select("id, frequency_per_week, is_completed, last_reset_date, streak")
  .eq("user_id", user.id)
  .eq("type", "daily")
  .eq("is_recurring", true);

// Fetch existing habit_weeks for this week
const { data: existingHWs } = await supabase
  .from("habit_weeks")
  .select("*")
  .eq("user_id", user.id)
  .eq("week_start", weekStart);

const hwByQuestId = new Map(
  (existingHWs ?? []).map((hw) => [hw.quest_id, hw])
);

// Process each recurring quest
for (const rq of recurringQuests ?? []) {
  const freq = rq.frequency_per_week ?? 7;
  let hw = hwByQuestId.get(rq.id);

  // Lazy-create habit_weeks row if missing for this week
  if (!hw) {
    // Check previous week for streak calculation
    const prevWeekStart = getWeekStart(
      new Date(new Date(weekStart).getTime() - 7 * 24 * 60 * 60 * 1000)
    );
    const { data: prevHW } = await supabase
      .from("habit_weeks")
      .select("is_success")
      .eq("quest_id", rq.id)
      .eq("week_start", prevWeekStart)
      .maybeSingle();

    // Update streak based on previous week result
    const newStreak = computeWeeklyStreak(
      rq.streak ?? 0,
      freq,
      prevHW?.is_success ?? null
    );
    if (newStreak !== (rq.streak ?? 0)) {
      await supabase
        .from("quests")
        .update({ streak: newStreak })
        .eq("id", rq.id);
    }

    // Create this week's record
    const { data: inserted } = await supabase
      .from("habit_weeks")
      .upsert(
        {
          quest_id: rq.id,
          user_id: user.id,
          week_start: weekStart,
          target: freq,
        },
        { onConflict: "quest_id,week_start", ignoreDuplicates: true }
      )
      .select()
      .single();

    hw = inserted ?? undefined;
  }

  // Reset quest if needed
  const weeklyCompletions = hw?.completions ?? 0;
  if (
    rq.is_completed &&
    shouldResetQuest(rq.last_reset_date, today, freq, weeklyCompletions)
  ) {
    await supabase
      .from("quests")
      .update({ is_completed: false, last_reset_date: today })
      .eq("id", rq.id);
  }
}
```

- [ ] **Step 3: Fetch habit_weeks data and pass to components**

After the quests query (where all quests are fetched with `select("*, subquests(*)")`), add:

```typescript
// Fetch habit_weeks for current week to pass to quest cards
const { data: habitWeeksData } = await supabase
  .from("habit_weeks")
  .select("*")
  .eq("user_id", user.id)
  .eq("week_start", getWeekStart());

const habitWeeksMap = new Map<string, HabitWeek>(
  (habitWeeksData ?? []).map((hw) => [hw.quest_id, hw as unknown as HabitWeek])
);
```

Then, when rendering `QuestCard` components for daily quests in the JSX, pass the habit week data. Find where `QuestCard` is rendered for daily quests and add the `habitWeek` prop:

```tsx
<QuestCard
  quest={quest}
  index={i}
  habitWeek={habitWeeksMap.get(quest.id)}
/>
```

- [ ] **Step 4: Run type check**

Run: `npx tsc --noEmit`
Expected: errors about `habitWeek` prop not existing on QuestCard yet — that's expected, will be fixed in Task 10.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/quests/page.tsx
git commit -m "feat(quests): lazy habit_weeks init, extended reset logic, pass habitWeek to cards"
```

---

### Task 9: Update Quest Form — Frequency Chips and Reward Fields

**Files:**
- Modify: `src/components/quests/quest-form.tsx`

- [ ] **Step 1: Add form field defaults**

In the `useForm` call, add default values for the new fields. Find the `defaultValues` object and add:

```typescript
  frequency_per_week: initialQuest?.frequency_per_week ?? 7,
  reward_emoji: initialQuest?.reward_emoji ?? undefined,
  reward_title: initialQuest?.reward_title ?? undefined,
```

- [ ] **Step 2: Add state for reward section visibility**

After the `showTriggers` state declaration, add:

```typescript
const [showReward, setShowReward] = useState(
  !!initialQuest?.reward_emoji || !!initialQuest?.reward_title
);
```

- [ ] **Step 3: Watch form values for conditional rendering**

After the existing `watch` calls (or add if there aren't any), add:

```typescript
const questType = watch("type");
const isRecurring = watch("is_recurring");
const frequencyPerWeek = watch("frequency_per_week");
```

- [ ] **Step 4: Add frequency and reward section to the form JSX**

Find the recurring checkbox section (the one that shows when `questType === "daily" || questType === "weekly"`). After the recurring checkbox and before the description field, add this new section:

```tsx
{/* Frequency & Reward — only for recurring daily quests */}
{questType === "daily" && isRecurring && (
  <div
    className="rounded-xl p-3 space-y-3"
    style={{
      background: "var(--bg-tertiary)",
      border: "1px solid var(--border-subtle)",
    }}
  >
    {/* Frequency chips */}
    <div>
      <label
        className="block text-xs font-medium mb-2"
        style={{ color: "var(--text-secondary)" }}
      >
        Частота (раз в неделю)
      </label>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setValue("frequency_per_week", n)}
            className="w-9 h-9 rounded-lg text-xs font-semibold transition-all"
            style={{
              background:
                frequencyPerWeek === n
                  ? "rgba(99,102,241,0.2)"
                  : "var(--bg-secondary)",
              border: `1px solid ${
                frequencyPerWeek === n
                  ? "rgba(99,102,241,0.5)"
                  : "var(--border-subtle)"
              }`,
              color:
                frequencyPerWeek === n
                  ? "var(--color-xp)"
                  : "var(--text-secondary)",
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>

    {/* Reward section */}
    {(frequencyPerWeek ?? 7) < 7 ? (
      <div className="space-y-2">
        <label
          className="block text-xs font-medium"
          style={{ color: "var(--text-secondary)" }}
        >
          Награда за выполнение цели (опционально)
        </label>
        <div className="flex flex-wrap gap-1.5">
          {["💆", "🍕", "🎮", "🎬", "☕", "🛍️", "📱", "🎵", "🍰", "🏖️", "💤", "🎨"].map(
            (emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setValue("reward_emoji", emoji)}
                className="w-9 h-9 rounded-lg text-lg transition-all"
                style={{
                  background:
                    watch("reward_emoji") === emoji
                      ? "rgba(251,191,36,0.2)"
                      : "var(--bg-secondary)",
                  border: `1px solid ${
                    watch("reward_emoji") === emoji
                      ? "rgba(251,191,36,0.5)"
                      : "var(--border-subtle)"
                  }`,
                }}
              >
                {emoji}
              </button>
            )
          )}
        </div>
        <input
          {...register("reward_title")}
          placeholder="Название награды (напр. Массаж)"
          className="w-full px-3 py-2 rounded-xl text-sm"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
          }}
        />
      </div>
    ) : (
      !showReward ? (
        <button
          type="button"
          onClick={() => setShowReward(true)}
          className="text-xs transition-colors"
          style={{ color: "var(--text-tertiary)" }}
        >
          + Добавить награду
        </button>
      ) : (
        <div className="space-y-2">
          <label
            className="block text-xs font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            Награда за выполнение цели (опционально)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {["💆", "🍕", "🎮", "🎬", "☕", "🛍️", "📱", "🎵", "🍰", "🏖️", "💤", "🎨"].map(
              (emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setValue("reward_emoji", emoji)}
                  className="w-9 h-9 rounded-lg text-lg transition-all"
                  style={{
                    background:
                      watch("reward_emoji") === emoji
                        ? "rgba(251,191,36,0.2)"
                        : "var(--bg-secondary)",
                    border: `1px solid ${
                      watch("reward_emoji") === emoji
                        ? "rgba(251,191,36,0.5)"
                        : "var(--border-subtle)"
                    }`,
                  }}
                >
                  {emoji}
                </button>
              )
            )}
          </div>
          <input
            {...register("reward_title")}
            placeholder="Название награды (напр. Массаж)"
            className="w-full px-3 py-2 rounded-xl text-sm"
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          />
        </div>
      )
    )}
  </div>
)}
```

- [ ] **Step 5: Run type check**

Run: `npx tsc --noEmit`
Expected: no new type errors from this file

- [ ] **Step 6: Commit**

```bash
git add src/components/quests/quest-form.tsx
git commit -m "feat(quest-form): add frequency chips and reward emoji/title fields"
```

---

### Task 10: Update Quest Card — Progress Badge, Claim Button, Completed State

**Files:**
- Modify: `src/components/quests/quest-card.tsx`

- [ ] **Step 1: Update props interface**

Find the `QuestCardProps` interface and add:

```typescript
import type { HabitWeek } from "@/types/game";

interface QuestCardProps {
  quest: Quest;
  index?: number;
  habitWeek?: HabitWeek;
}
```

Update the component's destructured props to include `habitWeek`:

```typescript
export function QuestCard({ quest, index = 0, habitWeek }: QuestCardProps) {
```

- [ ] **Step 2: Add claim reward state and handler**

After the existing state declarations (after `const [, startTransition] = useTransition();`), add:

```typescript
const [claimed, setClaimed] = useState(habitWeek?.reward_claimed ?? false);
const [claiming, setClaiming] = useState(false);

const weeklyGoalMet = habitWeek
  ? habitWeek.completions >= habitWeek.target
  : false;
const hasReward = !!quest.reward_emoji && !!quest.reward_title;
const canClaim = weeklyGoalMet && hasReward && !claimed;
```

Add the import for `claimHabitReward` at the top of the file:

```typescript
import { completeQuest, deleteQuest, claimHabitReward } from "@/app/(app)/actions";
```

Add the handler function after existing handlers:

```typescript
function handleClaim() {
  if (!canClaim || claiming) return;
  setClaiming(true);
  startTransition(async () => {
    try {
      await claimHabitReward(quest.id);
      setClaimed(true);
    } finally {
      setClaiming(false);
    }
  });
}
```

- [ ] **Step 3: Add progress badge to the stats row**

Find the streak display block:

```tsx
{quest.streak > 0 && (
  <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-warning)" }}>
    <Flame className="w-3 h-3" />
    {quest.streak}
  </span>
)}
```

Add immediately after it:

```tsx
{habitWeek && (quest.frequency_per_week ?? 7) < 7 && (
  <span
    className="text-xs font-medium px-1.5 py-0.5 rounded"
    style={{
      background: weeklyGoalMet
        ? "rgba(16,185,129,0.15)"
        : "rgba(99,102,241,0.1)",
      color: weeklyGoalMet
        ? "var(--color-success)"
        : "var(--color-xp)",
    }}
  >
    {habitWeek.completions}/{habitWeek.target} /нед
  </span>
)}
```

- [ ] **Step 4: Add claim reward button**

Find the completion buttons block (the `{!done && !confirmDelete && (` section). Add immediately before it:

```tsx
{/* Claim habit reward button */}
{canClaim && (
  <motion.button
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    onClick={handleClaim}
    disabled={claiming}
    className="mt-3 w-full py-2.5 rounded-xl text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.98]"
    style={{
      background: "rgba(251,191,36,0.15)",
      border: "1px solid rgba(251,191,36,0.4)",
      color: "var(--color-level-up)",
    }}
  >
    {claiming ? "..." : `Забрать ${quest.reward_emoji} ${quest.reward_title}`}
  </motion.button>
)}
{claimed && hasReward && (
  <div
    className="mt-3 w-full py-2 rounded-xl text-center text-sm font-medium"
    style={{
      background: "rgba(16,185,129,0.1)",
      border: "1px solid rgba(16,185,129,0.3)",
      color: "var(--color-success)",
    }}
  >
    {quest.reward_emoji} Награда получена!
  </div>
)}
```

- [ ] **Step 5: Disable completion button when weekly goal met**

Find the completion button's condition `{!done && !confirmDelete && (`. Change it to:

```tsx
{!done && !confirmDelete && !weeklyGoalMet && (
```

This hides the completion buttons when the weekly target has been reached (for habit quests with frequency < 7). For daily quests with frequency 7, `weeklyGoalMet` is based on `habit_weeks` completions reaching 7, but since the quest resets daily and can be completed every day, `weeklyGoalMet` may be true at the end of the week — which is fine because `done` would be `true` on the last completion anyway.

Actually, this needs more nuance. For frequency=7 quests, we should NOT block based on `weeklyGoalMet`. Adjust the condition:

```tsx
{!done && !confirmDelete && !((quest.frequency_per_week ?? 7) < 7 && weeklyGoalMet) && (
```

- [ ] **Step 6: Add `motion` import if not present**

Check if `motion` from `framer-motion` is already imported. If not, add:

```typescript
import { motion, AnimatePresence } from "framer-motion";
```

(It's likely already imported for the XP popup animation.)

- [ ] **Step 7: Run type check and dev server**

Run: `npx tsc --noEmit`
Expected: no new errors

Run: `npm run dev` (manual check in browser)
Expected: quest cards show progress badge and claim button when applicable

- [ ] **Step 8: Commit**

```bash
git add src/components/quests/quest-card.tsx
git commit -m "feat(quest-card): add weekly progress badge, claim reward button, goal-met state"
```

---

### Task 11: Integration Test — Full Cycle Verification

**Files:**
- No new files — manual verification

- [ ] **Step 1: Run all tests**

Run: `cd /Users/sergeychukavin/Desktop/SOURCES/Solo\ Leveling/awakening-system && npm test`
Expected: all tests pass

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: no errors (warnings are ok)

- [ ] **Step 3: Run type check**

Run: `npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: successful build

- [ ] **Step 5: Commit any remaining fixes**

If any fixes were needed during verification:

```bash
git add -A
git commit -m "fix: resolve lint/type issues from habit rewards implementation"
```
