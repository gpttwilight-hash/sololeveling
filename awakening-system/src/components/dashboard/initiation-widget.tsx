import Link from "next/link";
import { Zap } from "lucide-react";
import type { Quest } from "@/types/game";

interface InitiationWidgetProps {
  tutorialQuests: Quest[];
}

export function InitiationWidget({ tutorialQuests }: InitiationWidgetProps) {
  if (tutorialQuests.length === 0) return null;

  const completed = tutorialQuests.filter((q) => q.is_completed).length;
  const total = tutorialQuests.length;

  // Hide when all done
  if (completed === total) return null;

  return (
    <Link
      href="/quests?tab=tutorial"
      className="block rounded-2xl px-5 py-3 transition-all"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--color-xp)",
        boxShadow: "0 0 10px rgba(99,102,241,0.06)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4" style={{ color: "var(--color-xp)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Инициация
          </span>
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
            {completed}/{total}
          </span>
        </div>
        <span className="text-xs font-medium" style={{ color: "var(--color-xp)" }}>
          продолжить →
        </span>
      </div>

      {/* Mini progress bar */}
      <div
        className="mt-2 h-1 rounded-full overflow-hidden"
        style={{ background: "var(--bg-tertiary)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.round((completed / total) * 100)}%`,
            background: "var(--color-xp)",
          }}
        />
      </div>
    </Link>
  );
}
