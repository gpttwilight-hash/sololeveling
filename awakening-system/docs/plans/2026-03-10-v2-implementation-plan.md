# v2.0 Public Launch — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform working MVP into a production-ready, monetized product ready for public launch.

**Architecture:** Next.js 15 App Router with Server Actions, Supabase for auth/DB/edge functions, Stripe for payments, Claude API via edge function for AI features, Framer Motion for all animations.

**Tech Stack:** Next.js 15 · TypeScript strict · Tailwind 4 · Supabase · Framer Motion · Stripe · Anthropic Claude API · Resend (email)

**Subscription tiers (existing):** `hunter` = free, `monarch` = premium. Keep these names throughout.

---

## Task 1: Cinematic Onboarding — Welcome Screen

**Files:**
- Modify: `src/app/onboarding/page.tsx` (existing multi-step form — full rewrite of step 0)
- Modify: `src/app/onboarding/data.ts`

**Context:** Current onboarding is a functional multi-step form. We keep the existing step structure but transform step 0 into a cinematic "System detected new Hunter" sequence using Framer Motion's `staggerChildren` and typewriter effect.

**Step 1: Add typewriter animation hook**

Add to top of `src/app/onboarding/page.tsx` (before component):
```tsx
function useTypewriter(text: string, speed = 40) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      setDisplayed(text.slice(0, ++i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return { displayed, done };
}
```

**Step 2: Replace step 0 JSX with cinematic screen**

Find the step 0 render block (currently shows hunter name input) and replace the entire step with:
```tsx
// Step 0: Cinematic welcome
{step === 0 && (
  <motion.div
    key="welcome"
    variants={pageVariants}
    initial="initial" animate="animate" exit="exit"
    className="flex flex-col items-center justify-center min-h-screen gap-8 text-center px-6"
  >
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="w-24 h-24 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-4xl"
    >
      ⚔️
    </motion.div>
    <WelcomeText />
    <motion.button
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.5 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setStep(1)}
      className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white font-semibold transition-colors"
    >
      Начать пробуждение →
    </motion.button>
  </motion.div>
)}
```

Add `WelcomeText` component above the main component:
```tsx
function WelcomeText() {
  const lines = [
    "Система обнаружила нового Охотника.",
    "Инициализация протокола пробуждения...",
    "Статус: ГОТОВ К РЕГИСТРАЦИИ",
  ];
  return (
    <div className="space-y-3">
      {lines.map((line, i) => (
        <motion.p
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 1.1 + 0.3, duration: 0.6 }}
          className={`font-mono ${i === 2 ? "text-indigo-400 font-bold" : "text-gray-400"}`}
        >
          {line}
        </motion.p>
      ))}
    </div>
  );
}
```

**Step 3: Add "Rank E Assigned" as final step**

The existing last step (step 4 or 5) should end with rank reveal before redirect. Find the final `completeOnboarding` call. Before redirecting, add:
```tsx
// In the final step render, show rank reveal overlay
{showRankReveal && (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 gap-6"
  >
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="w-32 h-32 rounded-full border-4 border-gray-400 flex items-center justify-center text-5xl font-black text-gray-300"
    >
      E
    </motion.div>
    <motion.p
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
      className="text-2xl font-bold text-white"
    >
      Ранг E присвоен
    </motion.p>
    <motion.p
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
      className="text-gray-400 font-mono"
    >
      Путь начат. Система ожидает действий.
    </motion.p>
  </motion.div>
)}
```

Add `showRankReveal` state and trigger it 300ms before redirect.

**Step 4: Commit**
```bash
git add src/app/onboarding/page.tsx
git commit -m "feat(onboarding): cinematic welcome screen and rank reveal"
```

---

## Task 2: Dashboard — Hunter Status Bar

**Files:**
- Create: `src/components/dashboard/hunter-status-bar.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`

**Context:** Add a persistent top bar showing rank badge, streak, and coins. Always visible, replaces scattered header info.

**Step 1: Create the component**

`src/components/dashboard/hunter-status-bar.tsx`:
```tsx
"use client";
import { motion } from "framer-motion";
import type { Profile } from "@/types/game";
import { getRankFromLevel } from "@/lib/game/rank-system";

interface Props { profile: Profile; streak: number; }

export function HunterStatusBar({ profile, streak }: Props) {
  const rank = getRankFromLevel(profile.level);
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-40 flex items-center justify-between px-4 py-2 bg-[#0A0A0F]/80 backdrop-blur-md border-b border-white/5"
    >
      <div className="flex items-center gap-2">
        <span
          className="w-7 h-7 rounded-full border flex items-center justify-center text-xs font-black"
          style={{ borderColor: rank.color, color: rank.color }}
        >
          {rank.id}
        </span>
        <span className="text-sm text-gray-400 font-mono">{profile.hunter_name}</span>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1">
          <motion.span
            animate={{ scale: streak > 0 ? [1, 1.2, 1] : 1 }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            🔥
          </motion.span>
          <span className="font-bold text-orange-400">{streak}</span>
        </span>
        <span className="flex items-center gap-1">
          <span>💰</span>
          <span className="font-bold text-yellow-400">{profile.coins}</span>
        </span>
      </div>
    </motion.div>
  );
}
```

**Step 2: Add to dashboard page**

In `src/app/(app)/dashboard/page.tsx`, import `HunterStatusBar` and add it as the first element inside the main container, passing `profile` and `profile.streak_days`.

**Step 3: Commit**
```bash
git add src/components/dashboard/hunter-status-bar.tsx src/app/(app)/dashboard/page.tsx
git commit -m "feat(dashboard): persistent hunter status bar with rank/streak/coins"
```

---

## Task 3: Dashboard — Hero Quest + Micro-interactions

**Files:**
- Create: `src/components/dashboard/hero-quest.tsx`
- Modify: `src/components/dashboard/daily-quests.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`

**Context:** The most important quest of the day should dominate the screen. Also add spring animations to all quest completion buttons.

**Step 1: Create HeroQuest component**

`src/components/dashboard/hero-quest.tsx`:
```tsx
"use client";
import { motion } from "framer-motion";
import type { Quest } from "@/types/game";

const ATTR_COLORS: Record<string, string> = {
  str: "#E84855", int: "#3B82F6", cha: "#F59E0B",
  dis: "#8B5CF6", wlt: "#10B981",
};

interface Props {
  quest: Quest;
  onComplete: (id: string) => void;
  isCompleting: boolean;
}

export function HeroQuest({ quest, onComplete, isCompleting }: Props) {
  const color = ATTR_COLORS[quest.attribute] ?? "#6366F1";
  return (
    <motion.div
      layout
      className="relative rounded-2xl border overflow-hidden p-6"
      style={{ borderColor: `${color}40`, background: `${color}08` }}
    >
      <div className="absolute inset-0 opacity-5"
        style={{ background: `radial-gradient(circle at 80% 20%, ${color}, transparent 60%)` }}
      />
      <p className="text-xs font-mono text-gray-500 mb-1 uppercase tracking-widest">
        Главный квест дня
      </p>
      <h2 className="text-xl font-bold text-white mb-2">{quest.title}</h2>
      {quest.description && (
        <p className="text-sm text-gray-400 mb-4">{quest.description}</p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm">
          <span style={{ color }} className="font-mono font-bold">
            {quest.attribute.toUpperCase()}
          </span>
          <span className="text-yellow-400">+{quest.xp_reward} XP</span>
          <span className="text-gray-500">+{quest.coin_reward} 💰</span>
        </div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          disabled={isCompleting || quest.is_completed}
          onClick={() => onComplete(quest.id)}
          className="px-5 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-40"
          style={{ background: color }}
        >
          {quest.is_completed ? "✓ Выполнен" : isCompleting ? "..." : "Завершить"}
        </motion.button>
      </div>
    </motion.div>
  );
}
```

**Step 2: Add spring animation to all quest complete buttons in `daily-quests.tsx`**

Find every `<button>` or `<Button>` that triggers quest completion and wrap with:
```tsx
<motion.div whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.02 }}>
  {/* existing button */}
</motion.div>
```

**Step 3: Add HeroQuest to dashboard**

In `src/app/(app)/dashboard/page.tsx`, pick the first incomplete daily quest:
```tsx
const heroQuest = dailyQuests.find(q => !q.is_completed) ?? dailyQuests[0];
```
Render `<HeroQuest>` above `<DailyQuests>`. Pass a client-side wrapper that calls `completeQuest` server action.

**Step 4: Empty state message**

In `DailyQuests`, when `dailyQuests.length === 0`, show:
```tsx
<div className="text-center py-12 text-gray-500 font-mono">
  <p className="text-lg mb-2">Система ожидает твоих действий, Охотник.</p>
  <p className="text-sm">Создай свой первый квест, чтобы начать путь.</p>
</div>
```

**Step 5: Commit**
```bash
git add src/components/dashboard/hero-quest.tsx src/components/dashboard/daily-quests.tsx src/app/(app)/dashboard/page.tsx
git commit -m "feat(dashboard): hero quest card, spring interactions, empty state"
```

---

## Task 4: Level Up Overlay

**Files:**
- Create: `src/components/shared/level-up-overlay.tsx`
- Modify: `src/components/dashboard/daily-quests.tsx` (or wherever completeQuest result is handled)

**Context:** When `completeQuest` returns `leveledUp: true`, show a fullscreen overlay for 2 seconds.

**Step 1: Create overlay component**

`src/components/shared/level-up-overlay.tsx`:
```tsx
"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  show: boolean;
  newLevel: number;
  newRank?: string;
  onDone: () => void;
}

export function LevelUpOverlay({ show, newLevel, newRank, onDone }: Props) {
  useEffect(() => {
    if (show) {
      const t = setTimeout(onDone, 2200);
      return () => clearTimeout(t);
    }
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm gap-6"
        >
          <motion.div
            initial={{ scale: 0, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="text-center"
          >
            <p className="text-yellow-400 font-mono text-sm tracking-[0.3em] mb-3">
              УРОВЕНЬ ПОВЫШЕН
            </p>
            <p className="text-8xl font-black text-white">{newLevel}</p>
            {newRank && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold text-indigo-400 mt-2"
              >
                Ранг {newRank} достигнут
              </motion.p>
            )}
          </motion.div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.8, duration: 1.2 }}
            className="h-0.5 max-w-xs bg-gradient-to-r from-transparent via-yellow-400 to-transparent"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Step 2: Wire up to quest completion**

In the client component that calls `completeQuest`, after awaiting the result:
```tsx
const result = await completeQuest(questId);
if (result.leveledUp) {
  setLevelUpData({ level: result.newLevel, rank: result.newRank });
  setShowLevelUp(true);
}
```

**Step 3: Commit**
```bash
git add src/components/shared/level-up-overlay.tsx
git commit -m "feat(dashboard): level-up fullscreen overlay animation"
```

---

## Task 5: Stripe Integration — Setup

**Files:**
- Modify: `package.json` (add stripe)
- Create: `src/lib/stripe.ts`
- Create: `src/app/api/stripe/webhook/route.ts`
- Modify: `supabase/migrations/` (add subscription columns if missing)

**Context:** The app already has `subscription_tier` and `subscription_status` on `profiles`. We need Stripe to actually charge and update those fields.

**Step 1: Install Stripe**
```bash
cd awakening-system && npm install stripe @stripe/stripe-js
```

**Step 2: Create stripe client**

`src/lib/stripe.ts`:
```ts
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
});

export const PLANS = {
  monthly: process.env.STRIPE_PRICE_MONTHLY!,   // $7.99/mo
  yearly: process.env.STRIPE_PRICE_YEARLY!,     // $59/yr
  lifetime: process.env.STRIPE_PRICE_LIFETIME!, // $89 one-time
} as const;
```

**Step 3: Add env vars to `.env.local`**
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...
STRIPE_PRICE_LIFETIME=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Step 4: Create checkout Server Action**

Add to `src/app/(app)/actions.ts`:
```ts
export async function createCheckoutSession(plan: "monthly" | "yearly" | "lifetime") {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const session = await stripe.checkout.sessions.create({
    mode: plan === "lifetime" ? "payment" : "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: PLANS[plan], quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings`,
    client_reference_id: user.id,
    metadata: { user_id: user.id, plan },
  });

  redirect(session.url!);
}
```

**Step 5: Create webhook handler**

`src/app/api/stripe/webhook/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createClient(); // service role needed — use admin client here

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id!;
    await supabase.from("profiles").update({
      subscription_tier: "monarch",
      subscription_status: "active",
      stripe_customer_id: session.customer as string,
    }).eq("id", userId);
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    // look up user by stripe_customer_id
    await supabase.from("profiles")
      .update({ subscription_tier: "hunter", subscription_status: "inactive" })
      .eq("stripe_customer_id", sub.customer as string);
  }

  return NextResponse.json({ received: true });
}

export const config = { api: { bodyParser: false } };
```

Note: The webhook needs a Supabase admin client (service role key), not the regular user client. Create `src/lib/supabase/admin.ts` with `createClient(process.env.SUPABASE_SERVICE_ROLE_KEY)`.

**Step 6: Add `stripe_customer_id` column to profiles**

Create `supabase/migrations/002_stripe.sql`:
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
CREATE INDEX IF NOT EXISTS profiles_stripe_customer_id_idx ON profiles(stripe_customer_id);
```

**Step 7: Commit**
```bash
git add src/lib/stripe.ts src/app/api/stripe/ src/app/(app)/actions.ts supabase/migrations/002_stripe.sql src/lib/supabase/admin.ts
git commit -m "feat(payments): Stripe checkout + webhook for subscription management"
```

---

## Task 6: Paywall — Upgrade Modal + Quest Limit

**Files:**
- Create: `src/components/shared/upgrade-modal.tsx`
- Modify: `src/app/(app)/actions.ts` (createQuest — enforce 5/day limit for free)
- Modify: `src/components/quests/` (show upgrade modal on limit hit)

**Step 1: Create UpgradeModal**

`src/components/shared/upgrade-modal.tsx`:
```tsx
"use client";
import { motion, AnimatePresence } from "framer-motion";
import { createCheckoutSession } from "@/app/(app)/actions";

interface Props { open: boolean; onClose: () => void; reason?: string; }

export function UpgradeModal({ open, onClose, reason }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-indigo-500/30 bg-[#0D0D14] p-6 space-y-5"
          >
            <div className="text-center">
              <p className="text-xs font-mono text-indigo-400 tracking-widest mb-2">HUNTER PRO</p>
              <h2 className="text-xl font-bold text-white">
                {reason ?? "Лимит достигнут"}
              </h2>
              <p className="text-sm text-gray-400 mt-2">
                Бесплатный план: до 5 квестов в день. Стань Монархом — без ограничений, AI-советник, Weekly Boss.
              </p>
            </div>
            <div className="space-y-2">
              <form action={createCheckoutSession.bind(null, "yearly")}>
                <button className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors">
                  $59 / год <span className="text-indigo-300 text-sm">(экономия 40%)</span>
                </button>
              </form>
              <form action={createCheckoutSession.bind(null, "monthly")}>
                <button className="w-full py-2.5 rounded-xl border border-white/10 text-gray-300 hover:border-white/20 transition-colors text-sm">
                  $7.99 / месяц
                </button>
              </form>
              <form action={createCheckoutSession.bind(null, "lifetime")}>
                <button className="w-full py-2.5 rounded-xl border border-yellow-500/30 text-yellow-400 hover:border-yellow-500/50 transition-colors text-sm">
                  $89 — Пожизненный доступ ⚡
                </button>
              </form>
            </div>
            <button onClick={onClose} className="w-full text-xs text-gray-600 hover:text-gray-500">
              Остаться на бесплатном плане
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Step 2: Enforce limit in `createQuest` server action**

In `src/app/(app)/actions.ts`, inside `createQuest`, after auth check:
```ts
const profile = await getProfile(user.id); // fetch profile
if (!isPremium(profile)) {
  const today = new Date().toISOString().split("T")[0];
  const { count } = await supabase
    .from("quests")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_active", true)
    .gte("created_at", today);
  if ((count ?? 0) >= 5) {
    return { error: "QUEST_LIMIT_REACHED" };
  }
}
```

**Step 3: Show modal in quest creation UI**

In the quests page or create quest form component, handle the `QUEST_LIMIT_REACHED` error by setting `showUpgrade(true)`. Add `<UpgradeModal>` to the page.

**Step 4: Show upgrade badge in settings**

In `src/app/(app)/settings/page.tsx`, show current plan and link to upgrade.

**Step 5: Commit**
```bash
git add src/components/shared/upgrade-modal.tsx src/app/(app)/actions.ts
git commit -m "feat(monetization): paywall modal, quest limit for free tier"
```

---

## Task 7: AI Quest Advisor — Supabase Edge Function

**Files:**
- Create: `supabase/functions/generate-quests/index.ts`
- Create: `src/app/api/ai/generate-quests/route.ts`
- Create: `src/app/(app)/goals/page.tsx`
- Create: `src/components/goals/goal-form.tsx`
- Modify: `supabase/migrations/003_goals.sql`

**Context:** Pro-only feature. User enters a long-term goal + deadline. Edge function calls Claude API, returns structured quest list, we bulk-insert into quests table.

**Step 1: DB migration for goals table**

`supabase/migrations/003_goals.sql`:
```sql
CREATE TABLE IF NOT EXISTS goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  deadline DATE,
  attribute TEXT NOT NULL DEFAULT 'dis',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own goals" ON goals
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

**Step 2: Create Supabase Edge Function**

`supabase/functions/generate-quests/index.ts`:
```ts
import Anthropic from "npm:@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

const ATTR_MAP: Record<string, string> = {
  health: "str", career: "wlt", learning: "int",
  communication: "cha", habits: "dis", finance: "wlt",
};

Deno.serve(async (req) => {
  const { goal, deadline, weeks = 4 } = await req.json();

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `You are a productivity coach for a gamified life app. Generate ${weeks} weeks of quests for this goal.

Goal: "${goal}"
Deadline: ${deadline ?? "flexible"}

Return ONLY valid JSON array. Each quest:
{
  "title": "string (max 60 chars, action verb start)",
  "description": "string (max 120 chars, optional)",
  "type": "daily" | "weekly",
  "difficulty": "easy" | "medium" | "hard",
  "attribute": "str" | "int" | "cha" | "dis" | "wlt",
  "xp_reward": number (50-300),
  "coin_reward": number (25-150),
  "week": number (1-${weeks})
}

Max 5 quests per week. Match attribute to goal type. Vary difficulty. Russian language for titles.`
    }],
  });

  const text = (message.content[0] as { type: string; text: string }).text;
  const quests = JSON.parse(text.match(/\[[\s\S]*\]/)?.[0] ?? "[]");

  return new Response(JSON.stringify({ quests }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

**Step 3: Create Next.js API route that calls the Edge Function**

`src/app/api/ai/generate-quests/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isPremium } from "@/lib/game/subscriptions";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (!isPremium(profile)) {
    return NextResponse.json({ error: "Pro required" }, { status: 403 });
  }

  const body = await req.json();
  const { data, error } = await supabase.functions.invoke("generate-quests", { body });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Bulk insert quests
  const quests = data.quests.map((q: Record<string, unknown>) => ({
    ...q,
    user_id: user.id,
    is_active: true,
    is_completed: false,
    is_recurring: q.type === "daily",
    sort_order: 0,
  }));

  const { data: inserted } = await supabase.from("quests").insert(quests).select();
  return NextResponse.json({ quests: inserted });
}
```

**Step 4: Create Goals page**

`src/app/(app)/goals/page.tsx` — server component that checks isPremium, shows blurred preview if free with UpgradeModal trigger, otherwise renders `<GoalForm>`.

`src/components/goals/goal-form.tsx` — client component:
```tsx
"use client";
import { useState } from "react";
import { motion } from "framer-motion";

export function GoalForm() {
  const [goal, setGoal] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [quests, setQuests] = useState<Quest[]>([]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/ai/generate-quests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal, deadline }),
    });
    const data = await res.json();
    setQuests(data.quests ?? []);
    setLoading(false);
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 font-mono">Моя цель</label>
          <input
            value={goal} onChange={e => setGoal(e.target.value)}
            placeholder="Научиться программировать на Python за 3 месяца"
            className="w-full mt-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 font-mono">Дедлайн (опционально)</label>
          <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
            className="w-full mt-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500"
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={!goal || loading}
          type="submit"
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold disabled:opacity-40 transition-colors"
        >
          {loading ? "AI генерирует квесты..." : "⚡ Сгенерировать план"}
        </motion.button>
      </form>

      {quests.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <p className="text-sm text-gray-400 font-mono">{quests.length} квестов добавлено в систему</p>
          {quests.map(q => (
            <div key={q.id} className="px-4 py-3 rounded-xl border border-white/5 bg-white/3">
              <p className="text-white text-sm font-medium">{q.title}</p>
              <p className="text-xs text-gray-500 mt-1">{q.attribute.toUpperCase()} · {q.xp_reward} XP · Нед. {(q as unknown as {week: number}).week}</p>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
```

**Step 5: Add goals link to nav**

In `src/components/layout/` (wherever the sidebar/nav is), add a "Цели (AI)" link to `/goals` with a ✨ or ⚡ icon. Show "Pro" badge if user is free.

**Step 6: Commit**
```bash
git add supabase/functions/generate-quests/ src/app/api/ai/ src/app/(app)/goals/ src/components/goals/ supabase/migrations/003_goals.sql
git commit -m "feat(ai): AI Quest Advisor via Claude API edge function (Pro only)"
```

---

## Task 8: Weekly Boss Battle

**Files:**
- Create: `supabase/migrations/004_bosses.sql`
- Create: `supabase/functions/spawn-boss/index.ts`
- Create: `src/components/dashboard/boss-battle.tsx`
- Modify: `src/app/(app)/dashboard/page.tsx`

**Step 1: DB migration**

`supabase/migrations/004_bosses.sql`:
```sql
CREATE TABLE IF NOT EXISTS bosses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  week_start DATE NOT NULL,
  total_quests INT NOT NULL DEFAULT 5,
  completed_quests INT NOT NULL DEFAULT 0,
  is_defeated BOOLEAN DEFAULT false,
  bonus_xp INT DEFAULT 500,
  badge_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE bosses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own bosses" ON bosses
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

**Step 2: Boss data constant**

Create `src/lib/game/bosses.ts` with an array of 52 bosses:
```ts
export const WEEKLY_BOSSES = [
  { week: 1, title: "Страж Рутины", description: "Победи лень — выполни 5 ключевых задач", badge_name: "Победитель Рутины" },
  { week: 2, title: "Демон Прокрастинации", description: "Завершить 3 давно откладываемых дела", badge_name: "Победитель Откладывания" },
  // ... 50 more, cycling by week of year
] as const;
```

**Step 3: Create BossBattle component**

`src/components/dashboard/boss-battle.tsx`:
```tsx
"use client";
import { motion } from "framer-motion";

interface Boss {
  id: string; title: string; description: string;
  total_quests: number; completed_quests: number;
  is_defeated: boolean; badge_name: string | null;
}

export function BossBattle({ boss }: { boss: Boss }) {
  const hp = Math.max(0, 100 - (boss.completed_quests / boss.total_quests) * 100);
  const hpColor = hp > 60 ? "#E84855" : hp > 30 ? "#F59E0B" : "#10B981";

  if (boss.is_defeated) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
        <p className="text-emerald-400 font-mono text-sm">✓ БОСС НЕДЕЛИ ПОВЕРЖЕН</p>
        {boss.badge_name && <p className="text-white font-bold mt-1">{boss.badge_name} получен</p>}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-red-400 tracking-widest">БОСС НЕДЕЛИ</p>
        <p className="text-xs text-gray-500">+500 XP при победе</p>
      </div>
      <h3 className="text-white font-bold">{boss.title}</h3>
      <p className="text-sm text-gray-400">{boss.description}</p>
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>HP</span>
          <span>{boss.completed_quests}/{boss.total_quests} квестов</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: `${hp}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: hpColor }}
          />
        </div>
      </div>
    </div>
  );
}
```

**Step 4: Fetch and render boss on dashboard**

In `src/app/(app)/dashboard/page.tsx`, fetch current week's boss:
```ts
const weekStart = getMonday(new Date()).toISOString().split("T")[0];
const { data: bossData } = await supabase
  .from("bosses")
  .select("*")
  .eq("user_id", user.id)
  .eq("week_start", weekStart)
  .single();
```

Helper `getMonday`: returns the most recent Monday's Date object.

Render `<BossBattle boss={bossData} />` on dashboard if boss exists and user is monarch (Pro).

**Step 5: Cron edge function to spawn boss every Monday**

`supabase/functions/spawn-boss/index.ts` — called by Supabase cron every Monday 00:00:
```ts
// For each active monarch user, insert a boss for this week
// Use WEEKLY_BOSSES[(weekNumber % 52)] to pick the boss
```

Set up cron in Supabase dashboard: `0 0 * * 1` → invoke `spawn-boss`.

**Step 6: Commit**
```bash
git add supabase/migrations/004_bosses.sql src/lib/game/bosses.ts src/components/dashboard/boss-battle.tsx supabase/functions/spawn-boss/
git commit -m "feat(boss): weekly boss battle system with HP bar (Pro only)"
```

---

## Task 9: PWA Push Notifications

**Files:**
- Create: `public/sw.js` (service worker — already configured via next-pwa?)
- Create: `src/app/api/notifications/subscribe/route.ts`
- Create: `src/lib/push.ts`
- Modify: `next.config.ts`

**Context:** Remind users to complete quests at 21:00 if fewer than 3 quests completed that day.

**Step 1: Check if next-pwa is installed**
```bash
cat awakening-system/package.json | grep pwa
```
If not: `npm install next-pwa`

**Step 2: Configure next-pwa in `next.config.ts`**
```ts
import withPWA from "next-pwa";

const nextConfig = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
})({
  // existing Next config
});
export default nextConfig;
```

**Step 3: Create push subscription API**

`src/app/api/notifications/subscribe/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const subscription = await req.json();
  await supabase.from("push_subscriptions").upsert({
    user_id: user.id,
    subscription: subscription,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true });
}
```

Add `push_subscriptions` table to migration:
```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Step 4: Client-side subscription component**

`src/components/settings/push-notification-toggle.tsx`:
```tsx
"use client";
import { useState } from "react";

export function PushNotificationToggle() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);

  async function enable() {
    setLoading(true);
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    });
    await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sub),
    });
    setEnabled(true);
    setLoading(false);
  }

  return (
    <button onClick={enable} disabled={enabled || loading}
      className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:opacity-40">
      {enabled ? "✓ Уведомления включены" : loading ? "..." : "Включить напоминания"}
    </button>
  );
}
```

**Step 5: Add component to settings page**

**Step 6: Commit**
```bash
git add public/ src/app/api/notifications/ src/components/settings/ next.config.ts
git commit -m "feat(pwa): push notification subscription for streak reminders"
```

---

## Task 10: Dynamic OG Image for Achievement Sharing

**Files:**
- Create: `src/app/api/og/achievement/route.tsx`

**Context:** When a user wants to share an achievement, generate a beautiful OG image on the fly.

**Step 1: Install @vercel/og if not present**
```bash
npm install @vercel/og
```

**Step 2: Create OG route**

`src/app/api/og/achievement/route.tsx`:
```tsx
import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") ?? "Охотник";
  const rank = searchParams.get("rank") ?? "E";
  const achievement = searchParams.get("achievement") ?? "Достижение разблокировано";
  const level = searchParams.get("level") ?? "1";

  return new ImageResponse(
    (
      <div style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", width: "100%", height: "100%",
        background: "#0A0A0F", color: "white", fontFamily: "monospace",
      }}>
        <div style={{ fontSize: 80, marginBottom: 16 }}>⚔️</div>
        <div style={{ fontSize: 14, color: "#6366F1", letterSpacing: "0.3em", marginBottom: 8 }}>
          СИСТЕМА ПРОБУЖДЕНИЯ
        </div>
        <div style={{ fontSize: 28, fontWeight: 900, marginBottom: 4 }}>{name}</div>
        <div style={{ fontSize: 16, color: "#9CA3AF", marginBottom: 24 }}>
          Ранг {rank} · Уровень {level}
        </div>
        <div style={{
          fontSize: 18, color: "#FBBF24", fontWeight: 700,
          background: "#FBBF2415", padding: "8px 20px", borderRadius: 8,
          border: "1px solid #FBBF2440",
        }}>
          🏆 {achievement}
        </div>
        <div style={{ position: "absolute", bottom: 16, fontSize: 11, color: "#4B5563" }}>
          awakening-system.app
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
```

**Step 3: Add share button to achievements page**

In `src/app/(app)/achievements/`, for each unlocked achievement, add a share button that copies a URL like:
`/api/og/achievement?name=Сергей&rank=B&achievement=Победитель+Боссов&level=31`

**Step 4: Commit**
```bash
git add src/app/api/og/
git commit -m "feat(og): dynamic achievement sharing image via @vercel/og"
```

---

## Task 11: Landing Page with Waitlist

**Files:**
- Create: `src/app/page.tsx` (replace or extend existing landing)
- Create: `src/app/api/waitlist/route.ts`
- Modify: `supabase/migrations/005_waitlist.sql`

**Context:** The root `/` should be a high-converting landing page for cold traffic. Authenticated users redirect to `/dashboard`.

**Step 1: Waitlist table migration**

`supabase/migrations/005_waitlist.sql`:
```sql
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'landing',
  created_at TIMESTAMPTZ DEFAULT now()
);
-- No RLS needed, open insert, no read for anon
```

**Step 2: Waitlist API route**

`src/app/api/waitlist/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  const supabase = await createClient(); // use admin client for public inserts
  await supabase.from("waitlist").insert({ email });
  return NextResponse.json({ ok: true });
}
```

**Step 3: Landing page sections**

`src/app/page.tsx` — server component, redirects to `/dashboard` if user is authenticated.

Sections (implement as separate components in `src/components/landing/`):
1. `hero.tsx` — headline, sub, waitlist form, animated mockup screenshot
2. `features.tsx` — 3 key features with icons (AI Advisor, Boss Battles, Rank System)
3. `pricing.tsx` — Free vs Monarch comparison table with CTA
4. `social-proof.tsx` — placeholder for testimonials / "Join 500+ Hunters"
5. `footer.tsx` — links

Hero headline (exact copy):
```
Превратите каждый день в миссию.
Система Пробуждения — RPG-трекер для тех,
кто строит жизнь, а не просто живёт.
```

**Step 4: Commit**
```bash
git add src/app/page.tsx src/components/landing/ src/app/api/waitlist/ supabase/migrations/005_waitlist.sql
git commit -m "feat(landing): high-converting landing page with waitlist capture"
```

---

## Task 12: Sentry + PostHog Production Monitoring

**Files:**
- Create: `src/instrumentation.ts`
- Modify: `src/app/layout.tsx`
- Modify: `next.config.ts`

**Step 1: Install**
```bash
npm install @sentry/nextjs posthog-js posthog-node
npx @sentry/wizard@latest -i nextjs
```

**Step 2: PostHog client**

`src/lib/posthog.ts`:
```ts
import posthog from "posthog-js";

export function initPostHog() {
  if (typeof window !== "undefined") {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: "https://app.posthog.com",
      capture_pageview: false, // manual
    });
  }
}

export { posthog };
```

**Step 3: Track key events**

Add `posthog.capture()` calls at:
- Quest completed: `posthog.capture("quest_completed", { questId, xpEarned, attribute })`
- Level up: `posthog.capture("level_up", { newLevel, newRank })`
- Upgrade modal shown: `posthog.capture("upgrade_modal_shown", { reason })`
- Checkout started: `posthog.capture("checkout_started", { plan })`

**Step 4: Commit**
```bash
git add src/lib/posthog.ts src/instrumentation.ts sentry.*.config.ts
git commit -m "feat(monitoring): Sentry error tracking + PostHog analytics"
```

---

## Execution Order

| Task | Feature | Week | Priority |
|------|---------|------|----------|
| 1 | Cinematic Onboarding | 1 | P0 |
| 2 | Hunter Status Bar | 1 | P0 |
| 3 | Hero Quest + Micro-interactions | 1 | P0 |
| 4 | Level Up Overlay | 1 | P1 |
| 5 | Stripe Setup | 2 | P0 |
| 6 | Paywall + Upgrade Modal | 2 | P0 |
| 7 | AI Quest Advisor | 3 | P0 |
| 8 | Weekly Boss Battle | 3 | P1 |
| 9 | PWA Push Notifications | 4 | P1 |
| 10 | OG Image Sharing | 4 | P2 |
| 11 | Landing Page + Waitlist | 2 (parallel) | P0 |
| 12 | Sentry + PostHog | 4 | P1 |

## Environment Variables Checklist

```
# Supabase (existing)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe (new)
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_PRICE_MONTHLY=
STRIPE_PRICE_YEARLY=
STRIPE_PRICE_LIFETIME=
STRIPE_WEBHOOK_SECRET=

# Anthropic (new)
ANTHROPIC_API_KEY=

# VAPID for Push (new)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# PostHog (new)
NEXT_PUBLIC_POSTHOG_KEY=

# App
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```
