"use client";

import type { DailyProgress } from "@/types/game";

interface HeatMapProps {
  data: DailyProgress[];
  days?: number;
}

export function HeatMap({ data, days = 90 }: HeatMapProps) {
  const today = new Date();
  const cells: { date: string; rate: number; isRestDay: boolean }[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const dp = data.find((p) => p.date === dateStr);
    cells.push({
      date: dateStr,
      rate: dp?.completion_rate ?? 0,
      isRestDay: dp?.is_rest_day ?? false,
    });
  }

  function getColor(rate: number, isRestDay: boolean): string {
    if (isRestDay) return "var(--color-rest)";
    if (rate === 0) return "var(--bg-tertiary)";
    if (rate < 0.3) return "rgba(99,102,241,0.2)";
    if (rate < 0.6) return "rgba(99,102,241,0.45)";
    if (rate < 0.9) return "rgba(99,102,241,0.7)";
    return "var(--color-xp)";
  }

  // Group by weeks (columns)
  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto pb-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((cell) => (
              <div
                key={cell.date}
                className="w-3 h-3 rounded-sm transition-all cursor-default"
                style={{ background: getColor(cell.rate, cell.isRestDay) }}
                title={`${cell.date}: ${Math.round(cell.rate * 100)}%`}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Меньше</span>
        {[0, 0.25, 0.5, 0.75, 1].map((r) => (
          <div
            key={r}
            className="w-3 h-3 rounded-sm"
            style={{ background: getColor(r, false) }}
          />
        ))}
        <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Больше</span>
      </div>
    </div>
  );
}
