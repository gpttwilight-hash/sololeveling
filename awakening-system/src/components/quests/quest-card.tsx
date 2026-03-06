"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Flame, Clock, MapPin, Anchor, Trash2, Pencil } from "lucide-react";
import { completeQuest, deleteQuest } from "@/app/(app)/actions";
import { getLevelNarrative, getRankNarrative } from "@/lib/game/level-narratives";
import { QuestForm } from "./quest-form";
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
  const [lastXP, setLastXP] = useState(quest.xp_reward);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [, startTransition] = useTransition();

  const color = ATTR_COLORS[quest.attribute] ?? "var(--color-xp)";
  const hasTriggers = quest.trigger_time || quest.trigger_location || quest.trigger_anchor;

  function triggerComplete(partial: boolean) {
    if (done) return;
    setDone(true);
    setLastXP(partial ? Math.round(quest.xp_reward * 0.5) : quest.xp_reward);
    setShowXP(true);
    setTimeout(() => setShowXP(false), 1400);

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
        setDone(false);
        toast.error("Ошибка при выполнении квеста. Попробуйте еще раз.");
      }
    });
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    startTransition(async () => {
      try {
        const result = await deleteQuest(quest.id);
        setDeleted(true);
        const parts = [];
        if (result.xpRemoved > 0) parts.push(`-${result.xpRemoved} XP`);
        if (result.coinsRemoved > 0) parts.push(`-${result.coinsRemoved} монет`);
        toast.success(`Квест удалён${parts.length ? ` (${parts.join(", ")})` : ""}`);
      } catch {
        setConfirmDelete(false);
        toast.error("Не удалось удалить квест");
      }
    });
  }

  if (deleted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25 }}
      className="relative glass-card p-4"
      style={{ opacity: done ? 0.65 : 1 }}
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
            +{lastXP} XP
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons (top right) */}
      <div className="absolute top-3 right-3 flex items-center gap-1">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1.5 rounded-lg transition-all hover:brightness-125 text-tertiary"
          style={{ color: "var(--text-tertiary)" }}
          title="Редактировать квест"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => confirmDelete ? setConfirmDelete(false) : setConfirmDelete(true)}
          className="p-1.5 rounded-lg transition-all hover:brightness-125"
          style={{
            color: confirmDelete ? "var(--color-danger)" : "var(--text-tertiary)",
            background: confirmDelete ? "rgba(239,68,68,0.1)" : "transparent",
          }}
          title="Удалить квест"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {isEditing ? (
        <div className="mt-2">
          <QuestForm
            initialQuest={quest}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      ) : (
        <>
          {/* Main content row */}
          <div className="flex items-start gap-3 pr-12">
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

              {/* Trigger hints */}
              {hasTriggers && (
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  {quest.trigger_time && (
                    <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                      <Clock className="w-3 h-3" /> {quest.trigger_time}
                    </span>
                  )}
                  {quest.trigger_location && (
                    <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                      <MapPin className="w-3 h-3" /> {quest.trigger_location}
                    </span>
                  )}
                  {quest.trigger_anchor && (
                    <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                      <Anchor className="w-3 h-3" /> {quest.trigger_anchor}
                    </span>
                  )}
                </div>
              )}

              {/* Min description hint */}
              {quest.min_description && !done && (
                <p className="text-[10px] mt-1" style={{ color: "var(--color-success)", opacity: 0.8 }}>
                  Минимум: {quest.min_description}
                </p>
              )}

              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs font-semibold" style={{ color }}>
                  {ATTR_LABELS[quest.attribute]} +{quest.xp_reward} XP
                </span>
                <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                  · {DIFFICULTY_LABELS[quest.difficulty]}
                </span>
                {quest.streak > 0 && (
                  <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-warning)" }}>
                    <Flame className="w-3 h-3" />
                    {quest.streak}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {!done && !confirmDelete && (
            <div className={`mt-3 grid gap-2 ${quest.min_description ? "grid-cols-2" : "grid-cols-1"}`}>
              {quest.min_description && (
                <button
                  onClick={() => triggerComplete(true)}
                  className="py-2 rounded-xl text-xs font-semibold transition-all hover:brightness-110 active:scale-[0.98]"
                  style={{
                    background: "rgba(16,185,129,0.1)",
                    border: "1px solid rgba(16,185,129,0.3)",
                    color: "var(--color-success)",
                  }}
                >
                  Зачесть минимум (+{Math.round(quest.xp_reward * 0.5)} XP)
                </button>
              )}
              <button
                onClick={() => triggerComplete(false)}
                className="py-2 rounded-xl text-xs font-semibold transition-all hover:brightness-110 active:scale-[0.98]"
                style={{
                  background: `${color}18`,
                  border: `1px solid ${color}40`,
                  color,
                }}
              >
                Выполнено ✓
              </button>
            </div>
          )}

          {/* Delete confirmation */}
          {confirmDelete && (
            <div className="mt-3 rounded-xl p-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <p className="text-xs mb-2.5" style={{ color: "var(--text-secondary)" }}>
                Удалить квест? Весь заработанный XP и монеты будут возвращены.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all hover:brightness-110"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                >
                  Отмена
                </button>
                <button
                  onClick={handleDelete}
                  className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all hover:brightness-110"
                  style={{ background: "rgba(239,68,68,0.2)", color: "var(--color-danger)", border: "1px solid rgba(239,68,68,0.4)" }}
                >
                  Удалить
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
