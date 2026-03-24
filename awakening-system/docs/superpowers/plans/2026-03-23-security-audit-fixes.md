# Security Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all 13 security and logic findings from the 2026-03-23 audit, organized in three sprints by severity.

**Architecture:** Pure logic fixes get unit tests (Vitest). Server Action fixes (Supabase interactions) are tested manually via step-by-step verification. Atomic DB operations are implemented as Postgres functions called via `supabase.rpc()`.

**Tech Stack:** Next.js 15 App Router · Supabase (SSR client) · Vitest · TypeScript strict

**Spec:** `docs/superpowers/specs/2026-03-23-security-audit-design.md`

---

## File Map

| File | Action | Reason |
|------|--------|--------|
| `src/__tests__/game-logic.test.ts` | Create | Unit tests for pure game logic |
| `supabase/migrations/018_complete_quest_rpc.sql` | Create | Atomic quest completion (CRIT-1) |
| `supabase/migrations/016_add_total_coins_earned.sql` | Create | Add coins tracking column (HIGH-3) |
| `supabase/migrations/017_rewards_delete_policy.sql` | Create | Rewards DELETE RLS (MED-5) |
| `src/app/(app)/actions.ts` | Modify | HIGH-1, HIGH-2, LOW-1, LOW-2, LOW-3, MED-4, CRIT-1 |
| `src/app/api/ai/generate-quests/route.ts` | Modify | CRIT-2, MED-3 |
| `src/lib/game/achievement-checker.ts` | Modify | HIGH-3 |
| `src/app/api/notifications/subscribe/route.ts` | Modify | MED-1 |
| `src/app/(auth)/actions.ts` | Modify | MED-2 |

---

## Chunk 1: Pure Logic Fixes + Unit Tests

*Tasks 1–4: changes to pure TypeScript functions, fully testable with Vitest.*

**Important for all bash commands:** the project root is `awakening-system/`. All commands below must be run from that directory. Use:
```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system"
```
before any `npx` command, or prefix each command with it.

---

### Task 1: Fix double `checkLevelUp` call (HIGH-1)

**Files:**
- Modify: `src/app/(app)/actions.ts:58–62`
- Create: `src/__tests__/game-logic.test.ts` (regression guard)

**Background:** Lines 58–62 call `checkLevelUp` twice. The second call is redundant — its `.leveledUp` result should just reuse the first call's result. This is a code-quality fix: the double-call is deterministic and does not currently produce wrong output, but it is semantically incorrect and fragile. No unit test can fail *before* this fix (since the current behavior is correct), so this task creates a regression guard test rather than a failing-first test.

- [ ] **Step 1: Create regression guard test file**

Create `src/__tests__/game-logic.test.ts` with the following content. **All imports must be at the top of the file** — do not add imports inline inside describe blocks.

```typescript
import { describe, it, expect } from "vitest";
import { checkLevelUp } from "@/lib/game/level-system";
import { checkRankUp } from "@/lib/game/rank-system";
import { getTotalXPForLevel } from "@/lib/game/xp-calculator";

// ─── HIGH-1: checkLevelUp + checkRankUp integration ───────────────────────────

describe("checkLevelUp + checkRankUp integration", () => {
  it("detects rank-up when leveling through a rank boundary (E→D at level 6)", () => {
    // E rank: levels 1-5, D rank: levels 6-15
    const xpAtLevel5 = getTotalXPForLevel(5);
    const xpNeededToReachLevel6 = getTotalXPForLevel(6) - xpAtLevel5 + 1;

    const { leveledUp, newLevel } = checkLevelUp(xpAtLevel5, xpNeededToReachLevel6);
    expect(leveledUp).toBe(true);
    expect(newLevel).toBeGreaterThanOrEqual(6);

    // Using first result only (no redundant second call) — this is the correct pattern
    const rankedUp = leveledUp ? checkRankUp(5, newLevel) : false;
    expect(rankedUp).toBe(true);
  });

  it("does NOT detect rank-up when leveling within same rank (D→D)", () => {
    // Level 6→7: both in D rank (levels 6-15)
    const xpAtLevel6 = getTotalXPForLevel(6);
    const xpNeededToReachLevel7 = getTotalXPForLevel(7) - xpAtLevel6 + 1;

    const { leveledUp, newLevel } = checkLevelUp(xpAtLevel6, xpNeededToReachLevel7);
    expect(leveledUp).toBe(true);
    const rankedUp = leveledUp ? checkRankUp(6, newLevel) : false;
    expect(rankedUp).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to establish baseline (should PASS)**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && npx vitest run src/__tests__/game-logic.test.ts
```

Expected: PASS. This confirms the regression guard works before we touch `actions.ts`.

- [ ] **Step 3: Fix `actions.ts` lines 58–62**

In `src/app/(app)/actions.ts`, find and replace exactly this block:

```typescript
  // Check level/rank changes
  const { leveledUp, newLevel } = checkLevelUp(profile.total_xp, xpEarned);
  const rankedUp = checkLevelUp(profile.total_xp, xpEarned).leveledUp
    ? checkRankUp(profile.level, newLevel)
    : false;
  const newRank = rankedUp ? getRankFromLevel(newLevel).id : undefined;
```

With:

```typescript
  // Check level/rank changes
  const { leveledUp, newLevel } = checkLevelUp(profile.total_xp, xpEarned);
  const rankedUp = leveledUp ? checkRankUp(profile.level, newLevel) : false;
  const newRank = rankedUp ? getRankFromLevel(newLevel).id : undefined;
```

- [ ] **Step 4: Re-run tests to confirm regression guard still passes**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && npx vitest run src/__tests__/game-logic.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && git add src/app/\(app\)/actions.ts src/__tests__/game-logic.test.ts && git commit -m "fix(game): remove redundant checkLevelUp call, reuse first result (HIGH-1)"
```

---

### Task 2: Fix `coins_earned` achievement logic (HIGH-3)

**Files:**
- Modify: `src/lib/game/achievement-checker.ts:1–62`
- Modify: `src/__tests__/game-logic.test.ts` (append tests)

**Background:** `evaluateCondition` checks `profile.coins` (current spendable balance) for the `coins_earned` achievement. Fix: add optional `totalCoinsEarned` to `CheckContext` and use it when available. DB schema changes (`total_coins_earned` column) come in Task 9 — this task only fixes the checker and its call site in `actions.ts`.

- [ ] **Step 1: Append failing tests to `src/__tests__/game-logic.test.ts`**

Add to the **imports section at the top of the file** (after the existing imports):

```typescript
import { evaluateCondition } from "@/lib/game/achievement-checker";
import type { Profile } from "@/types/game";
```

Then **append** this describe block at the end of the file (after the existing describe blocks):

```typescript
// ─── HIGH-3: coins_earned achievement ─────────────────────────────────────────

// Profile stub — only required fields from src/types/game.ts Profile interface
const makeProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: "test-user",
  hunter_name: "Hunter",
  avatar_id: "1",
  level: 1,
  rank: "E",
  total_xp: 0,
  coins: 0,
  str_xp: 0,
  int_xp: 0,
  cha_xp: 0,
  dis_xp: 0,
  wlt_xp: 0,
  hidden_xp: 0,
  total_quests_completed: 0,
  current_streak: 0,
  longest_streak: 0,
  active_debuffs: [],
  rest_days_used_this_week: 0,
  onboarding_completed: false,
  total_coins_earned: 0, // exercises primary path once Task 9 migration is applied
  ...overrides,
});

describe("evaluateCondition - coins_earned", () => {
  it("does NOT unlock when totalCoinsEarned is below threshold", () => {
    const profile = makeProfile({ coins: 10 });
    const result = evaluateCondition(
      { type: "coins_earned", total: 500 },
      { profile, totalCoinsEarned: 10 },
    );
    expect(result).toBe(false);
  });

  it("unlocks when totalCoinsEarned exceeds threshold even if current balance is low", () => {
    const profile = makeProfile({ coins: 10 }); // spent most coins
    const result = evaluateCondition(
      { type: "coins_earned", total: 500 },
      { profile, totalCoinsEarned: 600 },
    );
    expect(result).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && npx vitest run src/__tests__/game-logic.test.ts
```

Expected: TypeScript compile error — `totalCoinsEarned` is not in `CheckContext`. Vitest will report this as a test failure.

- [ ] **Step 3: Update `achievement-checker.ts`**

In `src/lib/game/achievement-checker.ts`, replace the `CheckContext` interface:

```typescript
interface CheckContext {
  profile: Profile;
  newQuestsCompleted?: number;
  newStreak?: number;
  newLevel?: number;
  newRank?: string;
  epicsCompleted?: number;
  rewardsRedeemed?: number;
  totalCoinsEarned?: number;
}
```

Replace the `coins_earned` case (line 51):

```typescript
    case "coins_earned":
      // Use totalCoinsEarned if provided; fall back to profile.coins for backwards compatibility
      return (ctx.totalCoinsEarned ?? profile.coins) >= condition.total;
```

- [ ] **Step 4: Update call site in `actions.ts`**

In `src/app/(app)/actions.ts`, find the `evaluateCondition` call inside the achievement check loop (around line 166). Add `totalCoinsEarned` to the context:

```typescript
    const met = evaluateCondition(achievement.condition as AchievementCondition, {
      profile: updatedProfile,
      totalCoinsEarned: (updatedProfile.coins + coinsEarned), // total earned = balance + what was spent historically
    });
```

**Note:** The `totalCoinsEarned` value here is approximate until Task 9 adds the proper DB column. Task 9 will replace this with `updatedProfile.total_coins_earned`.

- [ ] **Step 5: Run tests**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && npx vitest run src/__tests__/game-logic.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && git add src/lib/game/achievement-checker.ts src/app/\(app\)/actions.ts src/__tests__/game-logic.test.ts && git commit -m "fix(achievements): check total coins earned, not current balance (HIGH-3)"
```

---

### Task 3: Cap AI-generated XP values (CRIT-2) + quest count (MED-3)

**Files:**
- Create: `src/lib/game/ai-quest-sanitizer.ts` (extracted helper for testability)
- Modify: `src/app/api/ai/generate-quests/route.ts:59–75`
- Modify: `src/__tests__/game-logic.test.ts` (append tests)

**Background:** AI response `xp_reward` and `coin_reward` are inserted without bounds. Extract a `sanitizeAIQuest` helper so we can unit-test the capping logic against production code (not a local closure). Also cap the number of quests to 50.

- [ ] **Step 1: Append failing test to `src/__tests__/game-logic.test.ts`**

Add to the **imports section at the top of the file**:

```typescript
import { sanitizeAIQuest } from "@/lib/game/ai-quest-sanitizer";
```

Append this describe block at the end of the file:

```typescript
// ─── CRIT-2 / MED-3: AI quest sanitization ────────────────────────────────────

describe("sanitizeAIQuest", () => {
  it("caps xp_reward above legendary max (80)", () => {
    const result = sanitizeAIQuest({ xp_reward: 999999, coin_reward: 10 });
    expect(result.xp_reward).toBe(80);
  });

  it("caps coin_reward above max (40)", () => {
    const result = sanitizeAIQuest({ xp_reward: 10, coin_reward: 999999 });
    expect(result.coin_reward).toBe(40);
  });

  it("floors xp_reward below 1", () => {
    const result = sanitizeAIQuest({ xp_reward: -5, coin_reward: 10 });
    expect(result.xp_reward).toBe(1);
  });

  it("floors coin_reward below 1", () => {
    const result = sanitizeAIQuest({ xp_reward: 10, coin_reward: 0 });
    expect(result.coin_reward).toBe(1);
  });

  it("passes through valid values unchanged", () => {
    const result = sanitizeAIQuest({ xp_reward: 30, coin_reward: 15 });
    expect(result.xp_reward).toBe(30);
    expect(result.coin_reward).toBe(15);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && npx vitest run src/__tests__/game-logic.test.ts
```

Expected: FAIL — `@/lib/game/ai-quest-sanitizer` does not exist

- [ ] **Step 3: Create `src/lib/game/ai-quest-sanitizer.ts`**

```typescript
export const AI_QUEST_LIMITS = {
  MAX_COUNT: 50,
  MAX_XP_REWARD: 80,   // legendary difficulty cap
  MAX_COIN_REWARD: 40,
  MIN_REWARD: 1,
} as const;

export function sanitizeAIQuest(q: { xp_reward: number; coin_reward: number }) {
  return {
    xp_reward: Math.min(
      AI_QUEST_LIMITS.MAX_XP_REWARD,
      Math.max(AI_QUEST_LIMITS.MIN_REWARD, Math.round(q.xp_reward))
    ),
    coin_reward: Math.min(
      AI_QUEST_LIMITS.MAX_COIN_REWARD,
      Math.max(AI_QUEST_LIMITS.MIN_REWARD, Math.round(q.coin_reward))
    ),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && npx vitest run src/__tests__/game-logic.test.ts
```

Expected: PASS

- [ ] **Step 5: Update `src/app/api/ai/generate-quests/route.ts`**

Add import at top of file (after existing imports):

```typescript
import { sanitizeAIQuest, AI_QUEST_LIMITS } from "@/lib/game/ai-quest-sanitizer";
```

Replace the `const quests = responseData.quests.map(...)` block with:

```typescript
  const now = new Date().toISOString();
  const quests = responseData.quests.slice(0, AI_QUEST_LIMITS.MAX_COUNT).map((q) => {
    const sanitized = sanitizeAIQuest(q);
    return {
      user_id: user.id,
      title: q.title,
      description: q.description ?? null,
      type: toQuestType(q.type),
      difficulty: toQuestDifficulty(q.difficulty),
      attribute: toAttributeKey(q.attribute),
      xp_reward: sanitized.xp_reward,
      coin_reward: sanitized.coin_reward,
      is_active: true,
      is_completed: false,
      is_recurring: q.type === "daily",
      streak: 0,
      sort_order: (q.week ?? 0) * 10,
      created_at: now,
      updated_at: now,
    };
  });
```

- [ ] **Step 6: Run all tests**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && npx vitest run
```

Expected: PASS

- [ ] **Step 7: Commit**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && git add src/lib/game/ai-quest-sanitizer.ts src/app/api/ai/generate-quests/route.ts src/__tests__/game-logic.test.ts && git commit -m "fix(ai): extract sanitizeAIQuest helper, cap XP/coins/count from AI responses (CRIT-2, MED-3)"
```

---

### Task 4: `updateQuest` title validation (MED-4) + error message cleanup (LOW-1)

**Files:**
- Modify: `src/app/(app)/actions.ts`

**Background:** `createQuest` trims and validates the title; `updateQuest` does not. Also some `throw new Error(...)` calls expose internal Supabase error messages to callers — replace with opaque messages.

**Note on testing:** This task modifies a Server Action that requires a live Supabase client. Unit testing Server Actions in isolation requires mocking the entire `createClient` factory, which is fragile and adds more complexity than the fix. TypeScript's type system already enforces the union types. The only runtime-only risk is an empty string or overlong title — this is verified manually below.

- [ ] **Step 1: Add title validation to `updateQuest`**

In `src/app/(app)/actions.ts`, find the `updateQuest` function. The function starts at the line containing:
```
export async function updateQuest(questId: string, data: {
```
After the line `if (!user) throw new Error("Not authenticated");`, insert:

```typescript
  // Input validation — mirrors createQuest validation
  const title = data.title?.trim();
  if (!title || title.length === 0) throw new Error("Название квеста не может быть пустым");
  if (title.length > 120) throw new Error("Название квеста слишком длинное (макс. 120 символов)");
```

Also in the `.update({...})` call that follows, change `title: data.title` to `title,` (uses the trimmed variable).

- [ ] **Step 2: Sanitize thrown error messages (LOW-1)**

In the `completeQuest` function, find and replace:

```typescript
if (questErr || !quest) throw new Error(`Quest not found (id=${questId}, err=${questErr?.message})`);
```
→
```typescript
if (questErr || !quest) throw new Error("Quest not found");
```

And:
```typescript
if (profileErr || !profile) throw new Error(`Profile not found (err=${profileErr?.message})`);
```
→
```typescript
if (profileErr || !profile) throw new Error("Profile not found");
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output (no errors). If errors appear, fix them before committing.

- [ ] **Step 4: Manual test**

1. In the app, try to save a quest with an empty title via edit form — should show "Название квеста не может быть пустым"
2. Confirm normal quest edit still works

- [ ] **Step 5: Commit**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && git add src/app/\(app\)/actions.ts && git commit -m "fix(validation): add title validation to updateQuest, sanitize error messages (MED-4, LOW-1)"
```

---

## Chunk 2: Server Action Fixes

*Tasks 5–8: changes to Server Actions and API routes that don't require DB migrations.*

**All bash commands:** prefix every `npx`/`git` call with `cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" &&`

---

### Task 5: Enforce reward cooldown (HIGH-2)

**Files:**
- Modify: `src/app/(app)/actions.ts:193–234`

**Background:** The `redeemReward` action never checks `last_redeemed_at` against `cooldown_hours`. We add the check before the coin balance check. The entire updated function is provided below to avoid any ambiguity.

- [ ] **Step 1: Replace the entire `redeemReward` function**

In `src/app/(app)/actions.ts`, find and replace the entire `redeemReward` function (from `export async function redeemReward` to the closing `}`). Replace with:

```typescript
export async function redeemReward(rewardId: string): Promise<{ success: boolean; remainingCoins: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: reward } = await supabase
    .from("rewards")
    .select("*")
    .eq("id", rewardId)
    .eq("user_id", user.id)
    .single();

  if (!reward) throw new Error("Reward not found");

  // Enforce cooldown: check if enough time has elapsed since last redemption
  if (reward.cooldown_hours && reward.last_redeemed_at) {
    const lastRedeemed = new Date(reward.last_redeemed_at as string).getTime();
    const cooldownMs = (reward.cooldown_hours as number) * 60 * 60 * 1000;
    const cooldownEndsAt = lastRedeemed + cooldownMs;
    if (Date.now() < cooldownEndsAt) {
      const remainingHours = Math.ceil((cooldownEndsAt - Date.now()) / (60 * 60 * 1000));
      throw new Error(`Награда недоступна ещё ${remainingHours} ч.`);
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("coins")
    .eq("id", user.id)
    .single();

  if (!profile || profile.coins < reward.cost) {
    return { success: false, remainingCoins: profile?.coins ?? 0 };
  }

  const remaining = profile.coins - reward.cost;

  await supabase.from("profiles").update({ coins: remaining }).eq("id", user.id);
  await supabase.from("reward_logs").insert({
    user_id: user.id,
    reward_id: rewardId,
    reward_title: reward.title,
    cost: reward.cost,
  });
  await supabase
    .from("rewards")
    .update({ last_redeemed_at: new Date().toISOString() })
    .eq("id", rewardId);

  revalidatePath("/shop");
  revalidatePath("/dashboard");

  return { success: true, remainingCoins: remaining };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output

- [ ] **Step 3: Manual verification**

1. Create a reward with `cooldown_hours: 1`
2. Redeem it once — succeeds, `last_redeemed_at` is set
3. Immediately try to redeem again — should throw "Награда недоступна ещё 1 ч."

- [ ] **Step 4: Commit**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && git add src/app/\(app\)/actions.ts && git commit -m "fix(shop): enforce reward cooldown before redemption (HIGH-2)"
```

---

### Task 6: Fix `rest_days_used_this_week` increment (LOW-3)

**Files:**
- Modify: `src/app/(app)/actions.ts:237–254`

- [ ] **Step 1: Fix the hardcoded `1`**

In `declareRestDay`, find and replace:

```typescript
  await supabase
    .from("profiles")
    .update({ rest_days_used_this_week: 1 })
    .eq("id", user.id);
```

With:

```typescript
  const { data: profileForRest } = await supabase
    .from("profiles")
    .select("rest_days_used_this_week")
    .eq("id", user.id)
    .single();

  await supabase
    .from("profiles")
    .update({ rest_days_used_this_week: ((profileForRest?.rest_days_used_this_week as number) ?? 0) + 1 })
    .eq("id", user.id);
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && git add src/app/\(app\)/actions.ts && git commit -m "fix(streak): increment rest_days_used_this_week instead of hardcoding 1 (LOW-3)"
```

---

### Task 7: Push subscription shape validation (MED-1)

**Files:**
- Modify: `src/app/api/notifications/subscribe/route.ts`

- [ ] **Step 1: Replace the entire route handler**

Replace the full contents of `src/app/api/notifications/subscribe/route.ts` with:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  // Validate Web Push subscription shape
  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).endpoint !== "string" ||
    !(body as Record<string, unknown>).endpoint ||
    typeof (body as Record<string, unknown>).keys !== "object"
  ) {
    return NextResponse.json(
      { error: "Invalid push subscription: must include endpoint and keys" },
      { status: 400 }
    );
  }

  const subscription = body as Json;

  const { error } = await supabase.from("push_subscriptions").upsert({
    user_id: user.id,
    subscription,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output

- [ ] **Step 3: Commit**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && git add src/app/api/notifications/subscribe/route.ts && git commit -m "fix(push): validate Web Push subscription shape before storing (MED-1)"
```

---

### Task 8: Raise password minimum to 8 characters (MED-2) + reorderQuests limit (LOW-2)

**Files:**
- Modify: `src/app/(auth)/actions.ts:107`
- Modify: `src/app/(app)/actions.ts:519–534`

- [ ] **Step 1: Update password minimum**

In `src/app/(auth)/actions.ts`, find and replace:

```typescript
  if (!password || password.length < 6) {
    return { error: "Минимум 6 символов" };
  }
```

With:

```typescript
  if (!password || password.length < 8) {
    return { error: "Минимум 8 символов" };
  }
```

- [ ] **Step 2: Add limit to `reorderQuests`**

In `src/app/(app)/actions.ts`, in the `reorderQuests` function, find and replace:

```typescript
  const updates = questIds.map((id, index) =>
```

With:

```typescript
  const updates = questIds.slice(0, 500).map((id, index) =>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output

- [ ] **Step 4: Commit**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && git add src/app/\(auth\)/actions.ts src/app/\(app\)/actions.ts && git commit -m "fix(auth): raise password minimum to 8 chars; add 500-item cap to reorderQuests (MED-2, LOW-2)"
```

---

## Chunk 3: Database Migrations

*Tasks 9–11: Postgres migrations for schema changes and the atomic `completeQuest` RPC.*

**Migration file numbering:** Existing migrations go up to 014. Task 9 adds 016, Task 10 adds 017, Task 11 adds 018. This ordering ensures 018 (RPC) is applied after 016 (which adds the `total_coins_earned` column the RPC references).

---

### Task 9: Add `total_coins_earned` column (HIGH-3 schema part)

**Files:**
- Modify: `src/types/game.ts` (add field to Profile interface)
- Create: `supabase/migrations/016_add_total_coins_earned.sql`
- Modify: `src/app/(app)/actions.ts` (completeQuest)

**Background:** Adds `total_coins_earned` to the `profiles` table and the `Profile` TypeScript interface. Updates `completeQuest` to increment it and pass it to the achievement checker (replacing the temporary approximation from Task 2 Step 4). `deleteQuest` does not decrement `total_coins_earned` by design — lifetime earnings are not revoked on deletion; this is a known acceptable inconsistency.

- [ ] **Step 1: Add `total_coins_earned` to the `Profile` interface**

In `src/types/game.ts`, find the `Profile` interface. Add the field after `onboarding_completed`:

```typescript
  onboarding_completed: boolean;
  total_coins_earned?: number;
```

- [ ] **Step 2: Create migration**

Create `supabase/migrations/016_add_total_coins_earned.sql`:

```sql
-- Migration: 016_add_total_coins_earned.sql
-- Adds lifetime coins tracking column to profiles.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_coins_earned bigint NOT NULL DEFAULT 0;

-- Backfill from existing quest_logs
UPDATE profiles p
SET total_coins_earned = COALESCE((
  SELECT SUM(ql.coins_earned)
  FROM quest_logs ql
  WHERE ql.user_id = p.id
), 0);
```

- [ ] **Step 3: Apply migration**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && npx supabase db push
# Or apply via Supabase dashboard SQL editor
```

- [ ] **Step 4: Update `completeQuest` profile UPDATE to include `total_coins_earned`**

In `src/app/(app)/actions.ts`, in `completeQuest`, find the profile UPDATE call that updates `total_xp`, `coins`, etc. (around line 69). Add `total_coins_earned` to the update payload:

```typescript
  await supabase
    .from("profiles")
    .update({
      total_xp: newTotalXP,
      coins: newCoins,
      total_quests_completed: newQuestsCompleted,
      level: newLevel,
      ...(newRank ? { rank: newRank } : {}),
      [attrColumn]: (profile[attrColumn] as number) + xpEarned,
      total_coins_earned: ((profile.total_coins_earned as number) ?? 0) + coinsEarned,
    })
    .eq("id", user.id);
```

- [ ] **Step 5: Replace the temporary `totalCoinsEarned` in `updatedProfile` and achievement checker**

In `completeQuest`, find the `updatedProfile` object literal (around line 143). Replace the temporary `totalCoinsEarned` computation from Task 2 Step 4 with the proper value:

```typescript
  const updatedProfile: Profile = {
    ...profile,
    total_xp: newTotalXP,
    coins: newCoins,
    total_quests_completed: newQuestsCompleted,
    level: newLevel,
    rank: newRank ?? profile.rank,
    [attrColumn]: (profile[attrColumn] as number) + xpEarned,
    total_coins_earned: ((profile.total_coins_earned as number) ?? 0) + coinsEarned,
    active_debuffs: debuffs,
  };
```

And update the `evaluateCondition` call in the achievement loop:

```typescript
    const met = evaluateCondition(achievement.condition as AchievementCondition, {
      profile: updatedProfile,
      totalCoinsEarned: updatedProfile.total_coins_earned ?? 0,
    });
```

- [ ] **Step 6: Verify TypeScript compiles**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output

- [ ] **Step 7: Run game logic tests**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && npx vitest run src/__tests__/game-logic.test.ts
```

Expected: PASS

- [ ] **Step 8: Commit**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && git add supabase/migrations/016_add_total_coins_earned.sql src/app/\(app\)/actions.ts src/types/game.ts && git commit -m "fix(achievements): add total_coins_earned column and Profile field (HIGH-3 schema)"
```

---

### Task 10: Add `rewards_delete_own` RLS policy (MED-5)

**Files:**
- Create: `supabase/migrations/017_rewards_delete_policy.sql`

- [ ] **Step 1: Create migration**

Create `supabase/migrations/017_rewards_delete_policy.sql`:

```sql
-- Migration: 017_rewards_delete_policy.sql
-- Add missing DELETE policy for rewards table.
-- Do NOT edit 008_hardened_rls.sql retroactively.

CREATE POLICY "rewards_delete_own" ON rewards
  FOR DELETE USING (auth.uid() = user_id);
```

- [ ] **Step 2: Apply migration**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && npx supabase db push
# Or apply via Supabase dashboard SQL editor
```

- [ ] **Step 3: Verify in Supabase dashboard**

Navigate to: Authentication → Policies → rewards table → confirm `rewards_delete_own` policy appears.

- [ ] **Step 4: Commit**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && git add supabase/migrations/017_rewards_delete_policy.sql && git commit -m "fix(rls): add missing rewards_delete_own policy (MED-5)"
```

---

### Task 11: Atomic `completeQuest` via Postgres RPC (CRIT-1)

**Files:**
- Create: `supabase/migrations/018_complete_quest_rpc.sql`
- Modify: `src/app/(app)/actions.ts:12–191`

**Background:** This is the most complex fix. The quest completion guard (check + update) moves into a Postgres function running in a single transaction with `SELECT ... FOR UPDATE`. Debuff-adjusted XP/coins are computed in JS and passed as parameters to the RPC — this keeps debuff logic in one place and avoids reimplementing it in SQL. The attribute XP column update also happens inside the RPC to keep all profile mutations atomic.

⚠️ **Do this task last** — it depends on `total_coins_earned` column from Task 9 (migration 016). Make sure Tasks 1–10 are committed first.

- [ ] **Step 1: Create `supabase/migrations/018_complete_quest_rpc.sql`**

```sql
-- Migration: 018_complete_quest_rpc.sql
-- Atomic quest completion: prevents XP duplication via FOR UPDATE lock.
-- XP and coin values are pre-computed in the JS layer (with debuff applied)
-- and passed as parameters.

CREATE OR REPLACE FUNCTION complete_quest(
  p_quest_id        uuid,
  p_user_id         uuid,
  p_xp_earned       integer,
  p_coins_earned    integer,
  p_attr_column     text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quest record;
BEGIN
  -- Validate attribute column to prevent SQL injection
  IF p_attr_column NOT IN ('str_xp', 'int_xp', 'cha_xp', 'dis_xp', 'wlt_xp', 'hidden_xp') THEN
    RAISE EXCEPTION 'Invalid attribute column: %', p_attr_column;
  END IF;

  -- Lock quest row — prevents concurrent completions (FOR UPDATE blocks until first tx commits)
  SELECT * INTO v_quest
  FROM quests
  WHERE id = p_quest_id AND user_id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quest not found';
  END IF;

  IF v_quest.is_completed THEN
    RAISE EXCEPTION 'Quest already completed';
  END IF;

  -- Atomic: mark quest complete
  UPDATE quests
  SET is_completed = true,
      streak = COALESCE(streak, 0) + 1
  WHERE id = p_quest_id;

  -- Atomic: update all profile columns in one statement
  EXECUTE format(
    'UPDATE profiles SET
       total_xp                = total_xp + $1,
       coins                   = coins + $2,
       total_quests_completed  = total_quests_completed + 1,
       total_coins_earned      = COALESCE(total_coins_earned, 0) + $2,
       %I                      = COALESCE(%I, 0) + $1
     WHERE id = $3',
    p_attr_column, p_attr_column
  ) USING p_xp_earned, p_coins_earned, p_user_id;
END;
$$;

-- Restrict to authenticated users
REVOKE ALL ON FUNCTION complete_quest(uuid, uuid, integer, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION complete_quest(uuid, uuid, integer, integer, text) TO authenticated;
```

- [ ] **Step 2: Apply migration**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && npx supabase db push
# Or apply via Supabase dashboard SQL editor
```

- [ ] **Step 3: Update `completeQuest` Server Action to use the RPC**

In `src/app/(app)/actions.ts`, replace the entire `completeQuest` function body with the version below. The RPC handles the atomic guard and all profile/quest mutations. The JS layer handles the remaining non-atomic work: level/rank recalculation (using pre-RPC profile snapshot), epic parent update, quest log insert, daily progress upsert, and achievement checks.

```typescript
export async function completeQuest(questId: string, partial = false): Promise<CompleteQuestResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Fetch quest metadata before RPC (needed for attr column, parent_id, logging)
  const { data: rawQuest, error: questErr } = await supabase
    .from("quests")
    .select("*")
    .eq("id", questId)
    .eq("user_id", user.id)
    .single();

  if (questErr || !rawQuest) throw new Error("Quest not found");
  const quest = rawQuest as unknown as Quest;
  // Optimistic early-exit only — NOT an authoritative guard.
  // The RPC's FOR UPDATE lock is the only atomic safeguard against double-completion.
  if (quest.is_completed) throw new Error("Quest already completed");

  // Fetch profile snapshot for debuff calculation (used for level/rank delta post-RPC)
  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  if (profileErr || !profile) throw new Error("Profile not found");

  // Apply debuff penalty (computed in JS, passed to RPC as pre-computed values)
  const debuffs = (profile.active_debuffs as Array<{ type: "laziness" | "burnout"; xp_penalty?: number; triggered_at: string }>) ?? [];
  const laziness = debuffs.find((d) => d.type === "laziness");
  const rawPenalty = laziness ? Math.min(100, Math.max(0, laziness.xp_penalty ?? 25)) : 0;
  const xpPenaltyMultiplier = 1 - rawPenalty / 100;
  const partialMultiplier = partial ? 0.5 : 1;
  const xpEarned = Math.round(quest.xp_reward * xpPenaltyMultiplier * partialMultiplier);
  const coinsEarned = Math.round(quest.coin_reward * partialMultiplier);

  // Validate attribute column
  const VALID_ATTR_COLUMNS = ["str_xp", "int_xp", "cha_xp", "dis_xp", "wlt_xp", "hidden_xp"] as const;
  type AttrColumn = typeof VALID_ATTR_COLUMNS[number];
  const candidateCol = `${quest.attribute}_xp`;
  if (!(VALID_ATTR_COLUMNS as readonly string[]).includes(candidateCol)) {
    throw new Error(`Invalid attribute: ${quest.attribute}`);
  }
  const attrColumn = candidateCol as AttrColumn;

  // ATOMIC: Complete quest + update all profile stats in one DB transaction
  const { error: rpcError } = await supabase.rpc("complete_quest", {
    p_quest_id: questId,
    p_user_id: user.id,
    p_xp_earned: xpEarned,
    p_coins_earned: coinsEarned,
    p_attr_column: attrColumn,
  });
  if (rpcError) throw new Error(`Failed to complete quest: ${rpcError.message}`);

  // --- Non-atomic post-completion work ---

  // Compute level/rank changes using pre-RPC profile snapshot
  const { leveledUp, newLevel } = checkLevelUp(profile.total_xp, xpEarned);
  const rankedUp = leveledUp ? checkRankUp(profile.level, newLevel) : false;
  const newRank = rankedUp ? getRankFromLevel(newLevel).id : undefined;

  // Update level/rank on profile if leveled up
  if (leveledUp || rankedUp) {
    await supabase
      .from("profiles")
      .update({
        level: newLevel,
        ...(newRank ? { rank: newRank } : {}),
      })
      .eq("id", user.id);
  }

  // NCT System: If linked to an Epic, increment Epic's progress & synergy
  if (quest.parent_id) {
    const { data: rawEpic } = await supabase
      .from("quests")
      .select("*")
      .eq("id", quest.parent_id)
      .single();
    if (rawEpic) {
      const parentEpic = rawEpic as unknown as Quest;
      await supabase
        .from("quests")
        .update({
          current_value: (parentEpic.current_value ?? 0) + 1,
          synergy_points: (parentEpic.synergy_points ?? 0) + 10,
        })
        .eq("id", quest.parent_id);
    }
  }

  // Log completion
  await supabase.from("quest_logs").insert({
    user_id: user.id,
    quest_id: questId,
    quest_title: quest.title,
    quest_type: quest.type,
    attribute: quest.attribute,
    xp_earned: xpEarned,
    coins_earned: coinsEarned,
  });

  // Upsert daily progress
  const today = new Date().toISOString().split("T")[0];
  const { data: dp } = await supabase
    .from("daily_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  const completedCount = (dp?.quests_completed ?? 0) + 1;
  const totalCount = dp?.quests_total ?? 1;

  await supabase.from("daily_progress").upsert({
    user_id: user.id,
    date: today,
    quests_completed: completedCount,
    quests_total: totalCount,
    xp_earned: (dp?.xp_earned ?? 0) + xpEarned,
    completion_rate: completedCount / totalCount,
    is_rest_day: dp?.is_rest_day ?? false,
  });

  // Check achievements against updated profile state
  const newTotalXP = profile.total_xp + xpEarned;
  const newCoins = profile.coins + coinsEarned;
  const updatedProfile: Profile = {
    ...profile,
    total_xp: newTotalXP,
    coins: newCoins,
    total_quests_completed: profile.total_quests_completed + 1,
    level: newLevel,
    rank: newRank ?? profile.rank,
    [attrColumn]: (profile[attrColumn] as number) + xpEarned,
    total_coins_earned: ((profile.total_coins_earned as number) ?? 0) + coinsEarned,
    active_debuffs: debuffs,
  };

  const { data: allAchievements } = await supabase.from("achievements").select("*");
  const { data: userAchievements } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", user.id);

  const unlockedIds = new Set(userAchievements?.map((a) => a.achievement_id) ?? []);
  const newlyUnlocked: string[] = [];
  const toUnlock: { user_id: string; achievement_id: string }[] = [];

  for (const achievement of allAchievements ?? []) {
    if (unlockedIds.has(achievement.id)) continue;
    const met = evaluateCondition(achievement.condition as AchievementCondition, {
      profile: updatedProfile,
      totalCoinsEarned: updatedProfile.total_coins_earned ?? 0,
    });
    if (met) {
      toUnlock.push({ user_id: user.id, achievement_id: achievement.id });
      newlyUnlocked.push(achievement.id);
    }
  }
  if (toUnlock.length > 0) {
    await supabase.from("user_achievements").insert(toUnlock);
  }

  revalidatePath("/dashboard");
  revalidatePath("/quests");
  revalidatePath("/stats");

  return {
    xpEarned,
    coinsEarned,
    leveledUp,
    newLevel: leveledUp ? newLevel : undefined,
    rankedUp,
    newRank,
    achievementsUnlocked: newlyUnlocked,
  };
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output

- [ ] **Step 5: Run all tests**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && npx vitest run
```

Expected: PASS

- [ ] **Step 6: Manual verification**

1. Complete a quest — XP and coins are awarded, level/rank updates if applicable
2. Complete the same quest again — should throw "Quest already completed"
3. Open browser DevTools → Network → throttle to "Slow 3G" → double-tap Complete — second request should fail

- [ ] **Step 7: Commit**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && git add supabase/migrations/018_complete_quest_rpc.sql src/app/\(app\)/actions.ts && git commit -m "fix(quests): atomic completeQuest via Postgres RPC, prevent XP race condition (CRIT-1)"
```

---

## Final Verification

- [ ] **Run full test suite**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && npx vitest run
```

Expected: All tests PASS

- [ ] **TypeScript check**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && npx tsc --noEmit 2>&1 | head -20
```

Expected: no output

- [ ] **Lint check**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && npx eslint src/
```

Expected: No new errors

- [ ] **Final commit summary**

```bash
cd "/Users/sergeychukavin/Desktop/SOURCES/Solo Leveling/awakening-system" && git log --oneline -12
```

Expected: 11 commits covering all audit findings (CRIT-1, CRIT-2, HIGH-1..3, MED-1..5, LOW-1..3)
