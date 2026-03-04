"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Flame } from "lucide-react";
import { completeQuest } from "@/app/(app)/actions";
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
const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Лёгкая", medium: "Средняя", hard: "Сложная", legendary: "Легендарная",
};

interface QuestCardProps {
  quest: Quest;
  index?: number;
}

export function QuestCard({ quest, index = 0 }: QuestCardProps) {
  const [done, setDone] = useState(quest.is_completed);
  const [showXP, setShowXP] = useState(false);
  const [, startTransition] = useTransition();

  const color = ATTR_COLORS[quest.attribute] ?? "var(--color-xp)";

  function handleComplete() {
    if (done) return;
    setDone(true);
    setShowXP(true);
    setTimeout(() => setShowXP(false), 1400);

    startTransition(async () => {
      try {
        const result = await completeQuest(quest.id);
        toast.success(`Квест выполнен! +${result.xpEarned} XP`);
        if (result.leveledUp) toast.success(`Уровень повышен! Уровень ${result.newLevel}`);
        if (result.achievementsUnlocked && result.achievementsUnlocked.length > 0) {
          toast.success("Новое достижение разблокировано!");
        }
      } catch {
        setDone(false);
        toast.error("Ошибка при выполнении квеста. Попробуйте еще раз.");
      }
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      className="relative"
    >
      {/* XP Popup */}
      <AnimatePresence>
        {showXP && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -36 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute top-0 right-4 text-sm font-bold pointer-events-none z-10"
            style={{ color: "var(--color-xp)" }}
          >
            +{quest.xp_reward} XP
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={handleComplete}
        disabled={done}
        className="glass-card w-full text-left p-4 transition-all hover:brightness-110 active:scale-[0.98]"
        style={{ opacity: done ? 0.65 : 1 }}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox */}
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-all"
            style={{
              background: done ? color : "var(--bg-tertiary)",
              border: `1.5px solid ${done ? color : "var(--border-default)"}`,
            }}
          >
            {done && <Check className="w-3.5 h-3.5 text-white" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p
              className={`text-sm font-medium ${done ? "line-through" : ""}`}
              style={{ color: done ? "var(--text-tertiary)" : "var(--text-primary)" }}
            >
              {quest.title}
            </p>

            {quest.description && (
              <p className="text-xs mt-0.5 line-clamp-1" style={{ color: "var(--text-tertiary)" }}>
                {quest.description}
              </p>
            )}

            <div className="flex items-center gap-3 mt-2">
              {/* Attribute */}
              <span className="text-xs font-semibold" style={{ color }}>
                {ATTR_LABELS[quest.attribute]} +{quest.xp_reward} XP
              </span>

              {/* Difficulty dot */}
              <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                · {DIFFICULTY_LABELS[quest.difficulty]}
              </span>

              {/* Streak */}
              {quest.streak > 0 && (
                <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-warning)" }}>
                  <Flame className="w-3 h-3" />
                  {quest.streak}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Visual Complete button (full width) for not-done quests */}
        {!done && (
          <div
            className="w-full mt-3 py-2 rounded-xl text-xs font-semibold transition-all text-center"
            style={{
              background: `${color}18`,
              border: `1px solid ${color}40`,
              color,
            }}
          >
            Выполнено ✓
          </div>
        )}
      </button>
    </motion.div>
  );
}
