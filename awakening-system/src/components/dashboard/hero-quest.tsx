"use client";
import { motion } from "framer-motion";
import { useState } from "react";
import { completeQuest } from "@/app/(app)/actions";
import { toast } from "sonner";
import { posthog } from "@/lib/posthog";
import type { Quest } from "@/types/game";

const ATTR_COLORS: Record<string, string> = {
  str: "#E84855",
  int: "#3B82F6",
  cha: "#F59E0B",
  dis: "#8B5CF6",
  wlt: "#10B981",
};

interface Props {
  quest: Quest;
}

export function HeroQuest({ quest }: Props) {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isDone, setIsDone] = useState(quest.is_completed);
  const color = ATTR_COLORS[quest.attribute] ?? "#6366F1";

  async function handleComplete() {
    if (isCompleting || isDone) return;
    setIsCompleting(true);
    try {
      await completeQuest(quest.id);
      setIsDone(true);
      posthog.capture("quest_completed", {
        questId: quest.id,
        attribute: quest.attribute,
        xpEarned: quest.xp_reward,
        source: "hero_quest",
      });
    } catch (err) {
      console.error("Failed to complete quest:", err);
      toast.error("Не удалось завершить квест. Попробуй снова.");
    } finally {
      setIsCompleting(false);
    }
  }

  return (
    <motion.div
      layout
      className="relative rounded-2xl border overflow-hidden p-6"
      style={{ borderColor: `${color}40`, background: `${color}08` }}
    >
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 80% 20%, ${color}, transparent 60%)`,
        }}
      />
      <p className="text-xs font-mono text-gray-500 mb-1 uppercase tracking-widest">
        Главный квест дня
      </p>
      <h2 className="text-xl font-bold text-white mb-2">{quest.title}</h2>
      {quest.description && (
        <p className="text-sm text-gray-400 mb-4">{quest.description}</p>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 text-sm">
          <span style={{ color }} className="font-mono font-bold">
            {quest.attribute.toUpperCase()}
          </span>
          <span className="text-yellow-400">+{quest.xp_reward} XP</span>
          <span className="text-gray-500">+{quest.coin_reward} 💰</span>
        </div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          disabled={isCompleting || isDone}
          onClick={handleComplete}
          className="px-5 py-2 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 text-white"
          style={{ background: isDone ? "#10B981" : color }}
        >
          {isDone ? "✓ Выполнен" : isCompleting ? "..." : "Завершить"}
        </motion.button>
      </div>
    </motion.div>
  );
}
