# Security & Logic Audit — Awakening System
**Date:** 2026-03-23
**Approach:** Risk-First (Critical → High → Medium → Low)
**Deliverable:** Analysis report only (no code changes)
**Scope:** Server Actions, API Routes, Game Logic, RLS Migrations

---

## Methodology

Each finding includes: ID, file + line, description, exploit scenario, and severity justification.
Severity levels: CRITICAL / HIGH / MEDIUM / LOW.

---

## 🔴 CRITICAL

### CRIT-1: Race Condition in `completeQuest` — XP Duplication

**File:** `src/app/(app)/actions.ts:12–85`

**Description:**
The check `if (quest.is_completed)` (line 28) and the `UPDATE is_completed = true` (line 84) are two separate, non-atomic database operations with no transaction or `SELECT FOR UPDATE` between them.

**Exploit Scenario:**
1. User double-taps "Complete" on mobile with slow network, or client retries on timeout.
2. Both requests read `is_completed = false` — both pass the guard.
3. Both award XP, coins, write to `quest_logs`, update `profiles`.
4. Result: XP and coins are awarded twice per quest completion.

**Additional attack vector:** Next.js Server Actions are standard HTTP POST endpoints — they can be called programmatically via a script in a tight loop without any browser or UI involvement. A user could fire hundreds of `completeQuest` requests per second before the first write lands.

**Why Critical:**
Not theoretical — double-taps on mobile are common. RLS does not protect against this (both requests come from the same authenticated user). No transactions exist anywhere in the action layer.

**Fix note:** The fix requires a Postgres stored procedure (`supabase.rpc()`) or `SELECT ... FOR UPDATE` pattern. The Supabase JS client cannot batch multiple `.from().update()` calls into a single atomic transaction at the application layer — naive JS-level fixes will reproduce the same race condition.

---

### CRIT-2: AI-Generated Quest XP — Uncapped Values From Model Output

**File:** `src/app/api/ai/generate-quests/route.ts:59–75`

**Description:**
`xp_reward: q.xp_reward` and `coin_reward: q.coin_reward` are taken directly from the AI (Edge Function) response and bulk-inserted into the DB without any cap, floor, or type validation.

**Exploit Scenario:**
1. Edge Function returns `xp_reward: 999999` (model hallucination or compromised prompt).
2. User completes that quest → receives millions of XP.
3. Destroys progression economy for that user; at scale — a systemic balance issue.

**Why Critical:**
The game's entire XP economy (`easy=8`, `medium=15`, `hard=30`, `legendary=80`) can be bypassed via a single AI-generated quest. No server-side enforcement of XP bounds exists.

---

## 🟠 HIGH

### HIGH-1: Double `checkLevelUp` Call — Rank-Up Logic Unreliable

**File:** `src/app/(app)/actions.ts:58–62`

**Description:**
```ts
const { leveledUp, newLevel } = checkLevelUp(profile.total_xp, xpEarned); // call 1
const rankedUp = checkLevelUp(profile.total_xp, xpEarned).leveledUp        // call 2 (!)
  ? checkRankUp(profile.level, newLevel)
  : false;
```
The second `checkLevelUp` call is redundant and semantically wrong — it re-evaluates instead of reusing the first result. The `checkRankUp(profile.level, newLevel)` argument order is correct (`oldLevel, newLevel`), but the redundant second call means the `leveledUp` guard before `checkRankUp` is evaluated on a fresh computation rather than the already-computed result — introducing a theoretical divergence if any state changes between the two calls.

**Impact:**
Users leveling up at rank boundaries (e.g., level 6 = E→D, level 16 = D→C) may not have their rank updated correctly. No rank-up toast/animation is shown even though a rank change occurred.

---

### HIGH-2: `redeemReward` — Cooldown Never Enforced

**File:** `src/app/(app)/actions.ts:193–234`

**Description:**
`last_redeemed_at` is stored and `cooldown_hours` exists in the schema, but the action never reads `last_redeemed_at` before processing a redemption. Cooldown is purely decorative.

**Impact:**
A user can redeem the same reward unlimited times in a row as long as they have enough coins. A reward defined as "once per 24h" can be redeemed 100 times in a minute.

**Fix note:** When implementing the cooldown check, be aware that the read-check-write pattern (read `last_redeemed_at` → check elapsed time → update) has the same race condition as CRIT-1. The enforcement should be done atomically via a Postgres function or a conditional UPDATE that checks the cooldown in the WHERE clause.

---

### HIGH-3: `coins_earned` Achievement — Checks Balance, Not Total Earned

**File:** `src/lib/game/achievement-checker.ts:51`

**Description:**
```ts
case "coins_earned":
  return profile.coins >= condition.total;
```
This checks the user's *current coin balance*, not the *total coins ever earned*. An active user who spends coins on rewards will never unlock this achievement even after earning thousands of coins over time.

**Impact:**
Achievement is effectively broken for engaged users (the exact users it should reward).

---

## 🟡 MEDIUM

### MED-1: `push_subscriptions` — Arbitrary JSON, No Schema Validation

**File:** `src/app/api/notifications/subscribe/route.ts:13–16`

**Description:**
Any authenticated user can POST arbitrary JSON of any size. No validation that the payload is a valid Web Push subscription object (`endpoint`, `keys.p256dh`, `keys.auth`).

**Impact:**
Malformed subscriptions stored in DB will cause the push-sending Edge Function to fail at send time with unpredictable errors. A user could store a 1MB payload in their subscription row.

---

### MED-2: `updatePassword` — 6-Character Minimum

**File:** `src/app/(auth)/actions.ts:107`

**Description:**
Password minimum is 6 characters. NIST SP 800-63B recommends a minimum of 8 characters; modern best practice is 12+.

**Why Medium (not High):**
Supabase Auth stores passwords with bcrypt. Rate-limiting and brute-force protection exist at the Auth layer. This is a policy weakness, not an architectural vulnerability.

---

### MED-4: `updateQuest` — No Title Validation

**File:** `src/app/(app)/actions.ts:337–390`

**Severity:** 🟡 MEDIUM (downgraded from HIGH — TypeScript's type signature prevents `undefined`, but empty strings and oversized values remain a runtime risk)

**Description:**
`createQuest` validates the title (empty check, 120-char limit, trim). `updateQuest` inserts `data.title` directly with no trimming or length checks. An empty string or 10,000-character title can be saved.

**Impact:**
UI breaks on empty quest titles. Overly long titles can cause layout issues and potential DB constraint violations.

---

### MED-5: RLS — Missing DELETE Policy on `rewards` Table

**File:** `supabase/migrations/008_hardened_rls.sql`

**Severity:** 🟡 MEDIUM (downgraded — no current exploit path; impact is limited to future features and admin tooling)

**Description:**
Migration 008 defines `rewards_select_own`, `rewards_insert_own`, and `rewards_update_own` — but `rewards_delete_own` is absent. Migrations 009–014 were also checked and none add this policy. With RLS enabled and no DELETE policy, all DELETE operations on `rewards` are blocked for all roles including the row owner.

**Impact:**
Any direct Supabase client call to `.delete()` on rewards will be silently rejected. This doesn't affect current Server Actions (which use `is_active: false` soft-delete), but will break any future direct deletion feature or admin tooling.

**Fix note:** Add a **new migration file** (e.g., `015_fix_rewards_delete_policy.sql`). Do not edit `008_hardened_rls.sql` retroactively — this would break the migration chain for any deployed instance.

---

### MED-3: AI Endpoint — No Cap on Generated Quest Count

**File:** `src/app/api/ai/generate-quests/route.ts:59–75`

**Note:** This finding shares the same endpoint as CRIT-2. The risks are combinatorial — a response with 500 quests each carrying `xp_reward: 999999` amplifies both issues simultaneously.

**Description:**
`responseData.quests.map(...)` bulk-inserts everything the AI returns with no length limit. A model hallucination or a compromised/poisoned Edge Function response returning 500+ quest objects would insert all of them.

**Impact:**
User's quest list becomes unusable. DB storage bloats. No reasonable cap (e.g., 50 quests max) is enforced server-side.

---

## 🟢 LOW

### LOW-1: Error Messages Leak Internal Details

**File:** `src/app/(app)/actions.ts:27`

**Description:**
```ts
throw new Error(`Quest not found (id=${questId}, err=${questErr?.message})`);
```
Thrown errors include `questId` values and raw Supabase error messages. These can surface to the client via unhandled promise rejections or toast notifications.

**Impact:**
Minor information disclosure. Low risk for a personal-use app; higher risk if the app becomes a public SaaS.

---

### LOW-2: `reorderQuests` — No Array Size Limit

**File:** `src/app/(app)/actions.ts:519–534`

**Description:**
`questIds.map(...)` fires N parallel DB UPDATE requests with no upper bound. An array of 10,000 IDs would fire 10,000 concurrent queries.

**Why Low:**
`.eq("user_id", user.id)` prevents cross-user updates. Realistically users have <100 quests. Self-inflicted DB pressure only.

---

### LOW-3: `declareRestDay` — `rest_days_used_this_week` Hardcoded to 1

**File:** `src/app/(app)/actions.ts:250`

**Description:**
```ts
await supabase.from("profiles").update({ rest_days_used_this_week: 1 }).eq("id", user.id);
```
Value is hardcoded `1` instead of incrementing. A user who declares two rest days in a week will show `rest_days_used_this_week = 1`, not `2`.

**Impact:**
Game mechanic bug (weekly rest day limits are tracked incorrectly). Not a security issue; user does not gain unfair advantage — they lose accurate tracking.

---

## Summary Table

| ID | Title | Severity | File |
|----|-------|----------|------|
| CRIT-1 | Race condition in `completeQuest` | 🔴 CRITICAL | `(app)/actions.ts:12` |
| CRIT-2 | AI quest XP uncapped | 🔴 CRITICAL | `generate-quests/route.ts:59` |
| HIGH-1 | Double `checkLevelUp`, rank-up broken | 🟠 HIGH | `(app)/actions.ts:58` |
| HIGH-2 | Reward cooldown not enforced | 🟠 HIGH | `(app)/actions.ts:193` |
| HIGH-3 | `coins_earned` checks balance not total | 🟠 HIGH | `achievement-checker.ts:51` |
| MED-1 | Push subscription no schema validation | 🟡 MEDIUM | `subscribe/route.ts:13` |
| MED-2 | Password minimum 6 chars | 🟡 MEDIUM | `(auth)/actions.ts:107` |
| MED-3 | AI endpoint no quest count cap | 🟡 MEDIUM | `generate-quests/route.ts:59` |
| MED-4 | `updateQuest` missing title validation | 🟡 MEDIUM | `(app)/actions.ts:337` |
| MED-5 | Missing DELETE RLS on `rewards` | 🟡 MEDIUM | `008_hardened_rls.sql` |
| LOW-1 | Error messages leak internals | 🟢 LOW | `(app)/actions.ts:27` |
| LOW-2 | `reorderQuests` no array size limit | 🟢 LOW | `(app)/actions.ts:519` |
| LOW-3 | `rest_days_used_this_week` hardcoded 1 | 🟢 LOW | `(app)/actions.ts:250` |

---

## Recommended Fix Priority

**Sprint 1 — Critical & High (immediate)**
1. **CRIT-1** — Implement atomic `completeQuest` via Postgres RPC (`supabase.rpc()`); JS-level fix will reproduce the race condition
2. **CRIT-2** — Cap `xp_reward` to max 80 (legendary) and `coin_reward` to max 40 server-side before insert
3. **HIGH-2** — Enforce cooldown atomically (Postgres conditional UPDATE); see fix note in finding
4. **HIGH-3** — Add `total_coins_earned` column to `profiles` and increment on each quest completion, or query `quest_logs` sum; update achievement check
5. **HIGH-1** — Reuse first `checkLevelUp` result; remove redundant second call

**Sprint 2 — Medium (before public launch)**

6. **MED-3** — Add `slice(0, 50)` before bulk insert in AI endpoint (pairs with CRIT-2 fix)
7. **MED-4** — Copy title validation (trim, empty check, 120-char limit) from `createQuest` into `updateQuest`
8. **MED-5** — Add new migration `015_fix_rewards_delete_policy.sql` with `rewards_delete_own` policy
9. **MED-1** — Validate push subscription shape (`endpoint`, `keys.p256dh`, `keys.auth`) before upsert
10. **MED-2** — Raise password minimum to 8 characters

**Sprint 3 — Low (tech debt)**

11. **LOW-3** — Replace hardcoded `1` with `profiles.rest_days_used_this_week + 1`
12. **LOW-1** — Replace internal error details with user-facing messages; log originals server-side only
13. **LOW-2** — Add `questIds.slice(0, 500)` guard in `reorderQuests`
