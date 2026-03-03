"use client";

import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";

interface MiniRadarProps {
  str: number;
  int: number;
  cha: number;
  dis: number;
  wlt: number;
}

export function MiniRadar({ str, int, cha, dis, wlt }: MiniRadarProps) {
  const data = [
    { subject: "STR", value: Math.max(str, 1) },
    { subject: "INT", value: Math.max(int, 1) },
    { subject: "CHA", value: Math.max(cha, 1) },
    { subject: "DIS", value: Math.max(dis, 1) },
    { subject: "WLT", value: Math.max(wlt, 1) },
  ];

  return (
    <div style={{ width: "100%", height: 160 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid
            stroke="rgba(255,255,255,0.06)"
            gridType="polygon"
          />
          <PolarAngleAxis
            dataKey="subject"
            tick={{
              fill: "var(--text-tertiary)",
              fontSize: 10,
              fontWeight: 600,
            }}
          />
          <Radar
            name="Атрибуты"
            dataKey="value"
            stroke="var(--color-xp)"
            fill="var(--color-xp)"
            fillOpacity={0.2}
            strokeWidth={1.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
