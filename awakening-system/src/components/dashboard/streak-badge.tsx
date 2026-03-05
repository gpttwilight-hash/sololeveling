interface StreakBadgeProps {
  streak: number;
  coins: number;
  shields?: number;
  consistencyPct?: number;
}

export function StreakBadge({ streak, coins, shields = 0, consistencyPct }: StreakBadgeProps) {
  const isPulsing = streak >= 7;

  return (
    <div className="flex items-center gap-4 flex-wrap">
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

      {/* Shields */}
      {shields > 0 && (
        <>
          <div className="w-px h-6" style={{ background: "var(--border-subtle)" }} />
          <div className="flex items-center gap-1.5">
            {Array.from({ length: Math.min(shields, 3) }).map((_, i) => (
              <span key={i} style={{ fontSize: "1rem" }} title="Щит стрика">🛡️</span>
            ))}
            {shields > 3 && (
              <span className="text-xs font-semibold" style={{ color: "var(--text-tertiary)" }}>
                ×{shields}
              </span>
            )}
          </div>
        </>
      )}

      {/* Consistency */}
      {consistencyPct !== undefined && (
        <>
          <div className="w-px h-6" style={{ background: "var(--border-subtle)" }} />
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: "1rem" }}>📈</span>
            <div>
              <span
                className="text-base font-bold tabular-nums"
                style={{
                  color: consistencyPct >= 80
                    ? "var(--color-success)"
                    : consistencyPct >= 50
                    ? "var(--color-warning)"
                    : "var(--color-danger)",
                }}
              >
                {consistencyPct}%
              </span>
              <span className="text-xs ml-1" style={{ color: "var(--text-tertiary)" }}>
                7д
              </span>
            </div>
          </div>
        </>
      )}

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
