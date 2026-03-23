"use client";

import { useState } from "react";
import { CheckCircle2, Zap } from "lucide-react";
import type { Quest } from "@/types/game";
import { completeQuest } from "@/app/(app)/actions";
import { toast } from "sonner";

interface InitiationTabProps {
  quests: Quest[];
}

export function InitiationTab({ quests }: InitiationTabProps) {
  const total = quests.length;
  const completed = quests.filter((q) => q.is_completed).length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  if (total === 0) return null;

  return (
    <div>
      {/* Progress bar */}
      <div
        className="rounded-2xl px-5 py-4 mb-4"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold flex items-center gap-1.5" style={{ color: "var(--color-xp)" }}>
            <Zap className="w-3.5 h-3.5" />
            Инициация
          </span>
          <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
            {completed} / {total}
          </span>
        </div>
        <div
          className="h-1.5 rounded-full overflow-hidden"
          style={{ background: "var(--bg-tertiary)" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: "var(--color-xp)" }}
          />
        </div>
      </div>

      {/* Quest list */}
      <div className="space-y-3">
        {quests.map((quest) => (
          <TutorialQuestCard key={quest.id} quest={quest} />
        ))}
      </div>

      {completed === total && (
        <div
          className="text-center py-8 rounded-2xl mt-4"
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
        >
          <p className="text-2xl mb-2">⚡</p>
          <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
            Инициация завершена
          </p>
          <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
            Охотник готов к самостоятельной работе
          </p>
        </div>
      )}
    </div>
  );
}

function TutorialQuestCard({ quest }: { quest: Quest }) {
  const [completing, setCompleting] = useState(false);
  const [done, setDone] = useState(quest.is_completed);

  async function handleComplete() {
    if (done || completing) return;
    setCompleting(true);
    try {
      const result = await completeQuest(quest.id);
      setDone(true);
      toast.success(`+${result.xpEarned} XP`, {
        description: quest.title,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div
      className="rounded-2xl px-4 py-3 flex items-start gap-3 transition-all"
      style={{
        background: done ? "var(--bg-secondary)" : "var(--bg-secondary)",
        border: `1px solid ${done ? "var(--border-subtle)" : "var(--color-xp)"}`,
        borderLeftWidth: "3px",
        borderLeftColor: done ? "var(--border-subtle)" : "var(--color-xp)",
        opacity: done ? 0.6 : 1,
      }}
    >
      {/* System badge */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: "rgba(99,102,241,0.15)", color: "var(--color-xp)" }}
          >
            СИСТЕМА
          </span>
          <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
            +{quest.xp_reward} XP · +{quest.coin_reward} монет
          </span>
        </div>
        <p
          className="text-sm font-medium leading-snug"
          style={{ color: done ? "var(--text-tertiary)" : "var(--text-primary)" }}
        >
          {quest.title}
        </p>
      </div>

      {/* Complete button */}
      {done ? (
        <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: "var(--color-xp)" }} />
      ) : (
        <button
          onClick={handleComplete}
          disabled={completing}
          className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all mt-0.5"
          style={{
            background: completing ? "var(--bg-tertiary)" : "var(--color-xp)",
            opacity: completing ? 0.6 : 1,
          }}
        >
          {completing ? "..." : "Готово"}
        </button>
      )}
    </div>
  );
}
