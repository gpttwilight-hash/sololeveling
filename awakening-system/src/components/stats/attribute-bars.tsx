"use client";

import { useEffect, useRef, useState } from "react";

const ATTRS = [
  { key: "str", label: "STR — Сила",       color: "var(--color-strength)" },
  { key: "int", label: "INT — Интеллект",   color: "var(--color-intellect)" },
  { key: "cha", label: "CHA — Харизма",     color: "var(--color-charisma)" },
  { key: "dis", label: "DIS — Дисциплина",  color: "var(--color-discipline)" },
  { key: "wlt", label: "WLT — Богатство",   color: "var(--color-wealth)" },
];

interface AttributeBarsProps {
  str: number;
  int: number;
  cha: number;
  dis: number;
  wlt: number;
}

export function AttributeBars(props: AttributeBarsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const values: Record<string, number> = { str: props.str, int: props.int, cha: props.cha, dis: props.dis, wlt: props.wlt };
  const max = Math.max(...Object.values(values), 1);

  return (
    <div ref={ref} className="space-y-3">
      {ATTRS.map(({ key, label, color }) => {
        const val = values[key] ?? 0;
        const pct = (val / Math.max(max, 100)) * 100;

        return (
          <div key={key}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                {label}
              </span>
              <span className="text-xs font-bold tabular-nums" style={{ color }}>
                {val}
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: "var(--bg-tertiary)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: visible ? `${pct}%` : "0%",
                  background: color,
                  transitionDelay: "100ms",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
