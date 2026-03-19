"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { completeDispatch } from "@/app/(app)/actions";
import { toast } from "sonner";

const ATTR_COLORS: Record<string, string> = {
  str: "#E84855", int: "#3B82F6", cha: "#F59E0B", dis: "#8B5CF6", wlt: "#10B981",
};
const ATTR_LABELS: Record<string, string> = {
  str: "STR", int: "INT", cha: "CHA", dis: "DIS", wlt: "WLT",
};

interface DispatchData {
  narrative_text: string;
  bonus_quest_title: string;
  bonus_quest_xp: number;
  bonus_quest_coins: number;
  attribute_focus: string;
  is_completed: boolean;
  expires_at: string;
}

interface Props {
  dispatch: DispatchData;
  date: string;
}

function formatTimeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "истёк";
  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return `${hours}ч ${minutes}м`;
}

export function DispatchCard({ dispatch, date }: Props) {
  const [isDone, setIsDone] = useState(dispatch.is_completed);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(() => formatTimeLeft(dispatch.expires_at));

  useEffect(() => {
    if (isDone) return;
    const interval = setInterval(() => {
      setTimeLeft(formatTimeLeft(dispatch.expires_at));
    }, 60000);
    return () => clearInterval(interval);
  }, [dispatch.expires_at, isDone]);

  useEffect(() => {
    if (dispatch.is_completed) setIsDone(true);
  }, [dispatch.is_completed]);

  const color = ATTR_COLORS[dispatch.attribute_focus] ?? "#6366F1";

  async function handleComplete() {
    if (isDone || isLoading) return;
    setIsLoading(true);
    try {
      const result = await completeDispatch(date);
      setIsDone(true);
      toast.success(`Задание Системы выполнено! +${result.xpEarned} XP`);
    } catch (err) {
      toast.error("Не удалось завершить задание.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl border overflow-hidden px-5 py-4"
      style={{
        borderColor: `${color}50`,
        background: `linear-gradient(135deg, ${color}08 0%, transparent 60%)`,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-mono uppercase tracking-widest text-gray-500">
          🔮 Системный Dispatch
        </span>
        {!isDone ? (
          <span className="text-xs font-mono tabular-nums" style={{ color: "var(--text-tertiary)" }}>
            Сброс через {timeLeft}
          </span>
        ) : (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: "rgba(16,185,129,0.15)", color: "var(--color-success)" }}
          >
            ✓ Выполнено
          </span>
        )}
      </div>

      <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
        {dispatch.narrative_text}
      </p>

      <div
        className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
        style={{ background: "var(--bg-secondary)", border: `1px solid ${color}30` }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold mb-0.5" style={{ color }}>
            ⚡ Задание дня · {ATTR_LABELS[dispatch.attribute_focus] ?? dispatch.attribute_focus.toUpperCase()}
          </p>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {dispatch.bonus_quest_title}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            +{dispatch.bonus_quest_xp} XP · +{dispatch.bonus_quest_coins} 💰
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          disabled={isDone || isLoading}
          onClick={handleComplete}
          className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ background: isDone ? "#10B981" : color }}
        >
          {isDone ? "✓" : isLoading ? "..." : "Выполнить"}
        </motion.button>
      </div>
    </motion.div>
  );
}
