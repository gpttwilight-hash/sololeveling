"use client";

import { X } from "lucide-react";
import { useSectionHint } from "@/hooks/use-section-hint";

interface SectionHintCardProps {
  hintKey: string;
  title: string;
  bullets: string[];
}

export function SectionHintCard({ hintKey, title, bullets }: SectionHintCardProps) {
  const { isDismissed, dismiss } = useSectionHint(hintKey);

  if (isDismissed) return null;

  return (
    <div
      className="relative rounded-2xl px-5 py-4 mb-5"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--color-xp)",
        boxShadow: "0 0 12px rgba(99,102,241,0.08)",
      }}
    >
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 p-1 rounded-lg transition-colors"
        style={{ color: "var(--text-tertiary)" }}
        aria-label="Закрыть подсказку"
      >
        <X className="w-4 h-4" />
      </button>

      <p className="text-sm font-bold mb-2 pr-6" style={{ color: "var(--text-primary)" }}>
        {title}
      </p>
      <ul className="space-y-1">
        {bullets.map((bullet, i) => (
          <li key={i} className="flex gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
            <span style={{ color: "var(--color-xp)" }}>•</span>
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
