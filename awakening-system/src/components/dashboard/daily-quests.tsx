"use client";

import { useState, useTransition, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { completeQuest } from "@/app/(app)/actions";
import { getLevelNarrative, getRankNarrative } from "@/lib/game/level-narratives";
import { toast } from "sonner";
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

  function handleComplete(quest: Quest, partial = false) {
    if (optimisticCompleted.has(quest.id)) return;

    setOptimisticCompleted((prev) => new Set([...prev, quest.id]));

    const xpShown = partial ? Math.round(quest.xp_reward * 0.5) : quest.xp_reward;
    const popupId = `${quest.id}-${++popupCounter.current}`;
    setPopups((prev) => [...prev, { id: popupId, xp: xpShown }]);
    setTimeout(() => setPopups((prev) => prev.filter((p) => p.id !== popupId)), 1500);

    startTransition(async () => {
      try {
        const result = await completeQuest(quest.id, partial);
        const label = partial ? "Минимум засчитан" : "Квест выполнен!";
        toast.success(`${label} +${result.xpEarned} XP`);
        if (result.leveledUp && result.newLevel) {
          toast.success(`Уровень ${result.newLevel}! ${getLevelNarrative(result.newLevel)}`, { duration: 4000 });
        }
        if (result.rankedUp && result.newRank) {
          toast.success(getRankNarrative(result.newRank), { duration: 5000 });
        }
        if (result.achievementsUnlocked && result.achievementsUnlocked.length > 0) {
          toast.success("Новое достижение разблокировано!");
        }
      } catch {
        setOptimisticCompleted((prev) => {
          const next = new Set(prev);
          next.delete(quest.id);
          return next;
        });
        toast.error("Ошибка при выполнении квеста. Попробуйте еще раз.");
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
              >
                <div
                  className="px-4 py-3 rounded-xl transition-all"
                  style={{
                    background: isDone ? "var(--bg-glass)" : "var(--bg-secondary)",
                    border: `1px solid ${isDone ? "var(--border-subtle)" : "var(--border-active)"}`,
                    opacity: isDone ? 0.6 : 1,
                  }}
                >
                  {/* Main row */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                    disabled={isDone || pending}
                    onClick={() => handleComplete(quest)}
                    className="w-full flex items-center gap-3 text-left"
                  >
                    {/* Checkbox */}
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all"
                      style={{
                        background: isDone ? color : "var(--bg-tertiary)",
                        border: `1.5px solid ${isDone ? color : "var(--border-default)"}`,
                      }}
                    >
                      {isDone && <Check className="w-3.5 h-3.5 text-white" />}
                    </div>

                    {/* Title */}
                    <span
                      className={`flex-1 text-sm text-left transition-all ${isDone ? "line-through" : ""}`}
                      style={{ color: isDone ? "var(--text-tertiary)" : "var(--text-primary)" }}
                    >
                      {quest.title}
                    </span>

                    {/* Attribute + XP */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-semibold" style={{ color }}>
                        {ATTR_LABELS[quest.attribute]}
                      </span>
                      <span className="text-xs tabular-nums" style={{ color: "var(--text-tertiary)" }}>
                        +{quest.xp_reward}
                      </span>
                    </div>
                  </motion.button>

                  {/* Min description hint + partial button */}
                  {!isDone && quest.min_description && (
                    <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                      <span className="text-[10px]" style={{ color: "var(--color-success)", opacity: 0.8 }}>
                        Минимум: {quest.min_description}
                      </span>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={pending}
                        onClick={() => handleComplete(quest, true)}
                        className="text-[10px] font-semibold px-2.5 py-1 rounded-lg transition-all hover:brightness-110"
                        style={{
                          background: "rgba(16,185,129,0.12)",
                          border: "1px solid rgba(16,185,129,0.3)",
                          color: "var(--color-success)",
                        }}
                      >
                        Зачесть (+{Math.round(quest.xp_reward * 0.5)} XP)
                      </motion.button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {quests.length === 0 && (
          <div className="text-center py-12 text-gray-500 font-mono">
            <p className="text-lg mb-2">Система ожидает твоих действий, Охотник.</p>
            <p className="text-sm">Создай свой первый квест, чтобы начать путь.</p>
          </div>
        )}
      </div>
    </div>
  );
}
