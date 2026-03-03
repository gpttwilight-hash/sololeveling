"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { redeemReward } from "@/app/(app)/actions";
import type { Reward } from "@/types/game";

interface RewardCardProps {
  reward: Reward;
  userCoins: number;
}

export function RewardCard({ reward, userCoins }: RewardCardProps) {
  const [success, setSuccess] = useState(false);
  const [, startTransition] = useTransition();
  const [isPending, setIsPending] = useState(false);

  const canAfford = userCoins >= reward.cost;

  // Check cooldown once at mount (useState lazy initializer runs only once, not on every render)
  const [cooldownActive] = useState(() => {
    if (!reward.cooldown_hours || !reward.last_redeemed_at) return false;
    const lastRedeem = new Date(reward.last_redeemed_at).getTime();
    const cooldownEnd = lastRedeem + reward.cooldown_hours * 3600 * 1000;
    return Date.now() < cooldownEnd;
  });

  function handleRedeem() {
    if (!canAfford || cooldownActive || isPending) return;
    setIsPending(true);
    startTransition(async () => {
      await redeemReward(reward.id);
      setSuccess(true);
      setIsPending(false);
      setTimeout(() => setSuccess(false), 2000);
    });
  }

  return (
    <div
      className="glass-card p-4 flex flex-col gap-3"
      style={{ opacity: canAfford ? 1 : 0.6 }}
    >
      {/* Emoji + title */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{reward.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
            {reward.title}
          </p>
          {reward.description && (
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {reward.description}
            </p>
          )}
        </div>
      </div>

      {/* Cost + button */}
      <div className="flex items-center justify-between gap-3">
        <span
          className="text-sm font-bold tabular-nums"
          style={{ color: canAfford ? "var(--color-level-up)" : "var(--text-tertiary)" }}
        >
          💰 {reward.cost}
        </span>

        <button
          onClick={handleRedeem}
          disabled={!canAfford || cooldownActive || isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
          style={{
            background: success
              ? "rgba(34,197,94,0.15)"
              : canAfford && !cooldownActive
              ? "rgba(99,102,241,0.15)"
              : "var(--bg-tertiary)",
            border: `1px solid ${success ? "rgba(34,197,94,0.4)" : "rgba(99,102,241,0.3)"}`,
            color: success
              ? "var(--color-success)"
              : canAfford
              ? "var(--color-xp)"
              : "var(--text-tertiary)",
          }}
        >
          {isPending && <Loader2 className="w-3 h-3 animate-spin" />}
          {success ? "✓ Получено!" : cooldownActive ? "⏱ Кулдаун" : !canAfford ? "Мало монет" : "Получить"}
        </button>
      </div>
    </div>
  );
}
