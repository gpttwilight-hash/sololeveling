"use client";

import {
  XAxis, YAxis, Tooltip,
  ResponsiveContainer, Area, AreaChart,
} from "recharts";

interface XPChartProps {
  data: { date: string; xp: number }[];
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 rounded-xl text-xs"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-default)" }}
    >
      <p style={{ color: "var(--text-tertiary)" }}>{label}</p>
      <p className="font-bold" style={{ color: "var(--color-xp)" }}>+{payload[0].value} XP</p>
    </div>
  );
};

export function XPLineChart({ data }: XPChartProps) {
  return (
    <div style={{ width: "100%", height: 160 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
          <defs>
            <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-xp)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-xp)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fill: "var(--text-tertiary)", fontSize: 9 }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "var(--text-tertiary)", fontSize: 9 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="xp"
            stroke="var(--color-xp)"
            strokeWidth={2}
            fill="url(#xpGradient)"
            dot={false}
            activeDot={{ r: 4, fill: "var(--color-xp)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
