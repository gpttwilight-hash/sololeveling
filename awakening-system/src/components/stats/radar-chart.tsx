"use client";

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip,
} from "recharts";

interface RadarChartProps {
  str: number;
  int: number;
  cha: number;
  dis: number;
  wlt: number;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { subject: string; value: number } }> }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      className="px-3 py-2 rounded-xl text-xs"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-default)" }}
    >
      <span style={{ color: "var(--text-secondary)" }}>{d.subject}: </span>
      <span className="font-bold" style={{ color: "var(--text-primary)" }}>{d.value}</span>
    </div>
  );
};

export function FullRadarChart({ str, int, cha, dis, wlt }: RadarChartProps) {
  const data = [
    { subject: "STR", value: Math.max(str, 1), fullMark: 100 },
    { subject: "INT", value: Math.max(int, 1), fullMark: 100 },
    { subject: "CHA", value: Math.max(cha, 1), fullMark: 100 },
    { subject: "DIS", value: Math.max(dis, 1), fullMark: 100 },
    { subject: "WLT", value: Math.max(wlt, 1), fullMark: 100 },
  ];

  return (
    <div style={{ width: "100%", height: 260 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 16, right: 30, bottom: 16, left: 30 }}>
          <PolarGrid stroke="rgba(255,255,255,0.06)" gridType="polygon" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: "var(--text-secondary)", fontSize: 12, fontWeight: 600 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "var(--text-tertiary)", fontSize: 9 }}
            axisLine={false}
          />
          <Radar
            name="Атрибуты"
            dataKey="value"
            stroke="var(--color-xp)"
            fill="var(--color-xp)"
            fillOpacity={0.2}
            strokeWidth={2}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
