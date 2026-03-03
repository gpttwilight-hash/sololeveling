"use client";

import { useState, useTransition, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { completeQuest } from "@/app/(app)/actions";
import type { Quest } from "@/types/game";

const ATTR_LABELS: Record<string, string> = {
  str: "STR", int: "INT", cha: "CHA", dis: "DIS", wlt: "WLT", hidden: "???",
};
const ATTR_COLORS: Record<string, string> = {
  str: "var(--color-strength)",
  int: "var(--color-intellect)",
  cha: "var(--color-charisma)",
  dis: "var(--color-discipline)",
  wlt: "var(--color-wealth)",
  hidden: "var(--color-xp)",
};

interface XPPopup {
  id: string;
  xp: number;
}

interface DailyQuestsProps {
  quests: Quest[];
  date: string;
}

export function DailyQuests({ quests, date }: DailyQuestsProps) {
  const [optimisticCompleted, setOptimisticCompleted] = useState<Set<string>>(
    new Set(quests.filter((q) => q.is_completed).map((q) => q.id))
  );
  const [popups, setPopups] = useState<XPPopup[]>([]);
  const [pending, startTransition] = useTransition();
  const popupCounter = useRef(0);

  const completed = optimisticCompleted.size;
  const total = quests.length;

  function handleComplete(quest: Quest) {
    if (optimisticCompleted.has(quest.id)) return;

    // Optimistic update
    setOptimisticCompleted((prev) => new Set([...prev, quest.id]));

    // XP popup
    const popupId = `${quest.id}-${++popupCounter.current}`;
    setPopups((prev) => [...prev, { id: popupId, xp: quest.xp_reward }]);
    setTimeout(() => setPopups((prev) => prev.filter((p) => p.id !== popupId)), 1500);

    startTransition(async () => {
      try {
        await completeQuest(quest.id);
      } catch {
        // Rollback optimistic update on error
        setOptimisticCompleted((prev) => {
          const next = new Set(prev);
          next.delete(quest.id);
          return next;
        });
      }
    });
  }

  return (
    <div className="relative">
      {/* XP Popups */}
      <div className="absolute top-0 right-0 pointer-events-none z-20">
        <AnimatePresence>
          {popups.map((popup) => (
            <motion.div
              key={popup.id}
              initial={{ opacity: 1, y: 0, x: 0 }}
              animate={{ opacity: 0, y: -40 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute right-0 text-sm font-bold"
              style={{ color: "var(--color-xp)" }}
            >
              +{popup.xp} XP
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-overline">Ежедневные квесты</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            {date}
          </p>
        </div>
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full tabular-nums"
          style={{
            background: completed === total && total > 0
              ? "rgba(34,197,94,0.15)"
              : "var(--bg-tertiary)",
            color: completed === total && total > 0
              ? "var(--color-success)"
              : "var(--text-secondary)",
          }}
        >
          {completed}/{total} ✓
        </span>
      </div>

      {/* Quest list */}
      <div className="space-y-2">
        <AnimatePresence initial={false}>
          {quests.map((quest, i) => {
            const isDone = optimisticCompleted.has(quest.id);
            const color = ATTR_COLORS[quest.attribute] ?? "var(--color-xp)";

            return (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                style={{
                  background: isDone ? "var(--bg-glass)" : "var(--bg-secondary)",
                  border: `1px solid ${isDone ? "var(--border-subtle)" : "var(--border-subtle)"}`,
                  opacity: isDone ? 0.6 : 1,
                }}
              >
                {/* Checkbox button */}
                <button
                  onClick={() => handleComplete(quest)}
                  disabled={isDone || pending}
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    background: isDone ? color : "var(--bg-tertiary)",
                    border: `1.5px solid ${isDone ? color : "var(--border-default)"}`,
                  }}
                >
                  {isDone && <Check className="w-3.5 h-3.5 text-white" />}
                </button>

                {/* Title */}
                <span
                  className={`flex-1 text-sm transition-all ${isDone ? "line-through" : ""}`}
                  style={{ color: isDone ? "var(--text-tertiary)" : "var(--text-primary)" }}
                >
                  {quest.title}
                </span>

                {/* Attribute + XP */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className="text-xs font-semibold"
                    style={{ color }}
                  >
                    {ATTR_LABELS[quest.attribute]}
                  </span>
                  <span
                    className="text-xs tabular-nums"
                    style={{ color: "var(--text-tertiary)" }}
                  >
                    +{quest.xp_reward}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {quests.length === 0 && (
          <div
            className="text-center py-8 rounded-xl"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            <p className="text-2xl mb-2">📋</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Нет активных квестов
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
              Добавь квесты в разделе «Квесты»
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
