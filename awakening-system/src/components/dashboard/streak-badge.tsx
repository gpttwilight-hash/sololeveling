interface StreakBadgeProps {
  streak: number;
  coins: number;
}

export function StreakBadge({ streak, coins }: StreakBadgeProps) {
  const isPulsing = streak >= 7;

  return (
    <div className="flex items-center gap-4">
      {/* Streak */}
      <div className="flex items-center gap-2">
        <span
          className={isPulsing ? "streak-pulse" : ""}
          style={{ fontSize: "1.2rem" }}
        >
          🔥
        </span>
        <div>
          <span
            className="text-base font-bold tabular-nums"
            style={{ color: "var(--text-primary)" }}
          >
            {streak}
          </span>
          <span className="text-xs ml-1" style={{ color: "var(--text-tertiary)" }}>
            дней
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-6" style={{ background: "var(--border-subtle)" }} />

      {/* Coins */}
      <div className="flex items-center gap-2">
        <span style={{ fontSize: "1.2rem" }}>💰</span>
        <span
          className="text-base font-bold tabular-nums"
          style={{ color: "var(--color-level-up)" }}
        >
          {coins.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
