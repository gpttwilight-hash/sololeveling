"use client";

import { useState, useTransition } from "react";
import { Check, Sword, Trophy, Trash2 } from "lucide-react";
import { updateEpicProgress, completeQuest, deleteQuest } from "@/app/(app)/actions";
import { toast } from "sonner";
import type { Quest } from "@/types/game";

interface EpicQuestCardProps {
  quest: Quest;
  index?: number;
}

function getQuickSteps(target: number): number[] {
  if (target <= 10) return [1, 2, 5];
  if (target <= 50) return [1, 5, 10];
  if (target <= 200) return [5, 10, 25, 50];
  if (target <= 1000) return [10, 25, 50, 100];
  return [50, 100, 250, 500];
}

export function EpicQuestCard({ quest }: EpicQuestCardProps) {
  const [value, setValue] = useState(quest.current_value ?? 0);
  const [inputVal, setInputVal] = useState("");
  const [mode, setMode] = useState<"add" | "set">("add");
  const [completed, setCompleted] = useState(quest.is_completed);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const target = quest.target_value ?? 100;
  const pct = Math.min(100, (value / target) * 100);
  const quickSteps = getQuickSteps(target);

  function applyDelta(delta: number) {
    const next = Math.min(target, Math.max(0, value + delta));
    setValue(next);
    startTransition(async () => {
      await updateEpicProgress(quest.id, next);
    });
  }

  function handleComplete() {
    if (completed || isPending) return;
    setCompleteError(null);
    startTransition(async () => {
      try {
        await completeQuest(quest.id);
        setCompleted(true);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!msg.includes("NEXT_REDIRECT")) setCompleteError(msg);
      }
    });
  }

  function handleCustom() {
    const num = parseFloat(inputVal);
    if (isNaN(num) || num < 0) return;
    const next = mode === "add"
      ? Math.min(target, value + num)
      : Math.min(target, num);
    setValue(next);
    setInputVal("");
    startTransition(async () => {
      await updateEpicProgress(quest.id, next);
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
        toast.success(`Эпический квест удалён${parts.length ? ` (${parts.join(", ")})` : ""}`);
      } catch {
        setConfirmDelete(false);
        toast.error("Не удалось удалить Эпический квест");
      }
    });
  }

  if (deleted) return null;

  return (
    <div
      className="relative rounded-2xl p-5 transition-all"
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid rgba(251,191,36,0.2)",
        boxShadow: "0 0 20px rgba(251,191,36,0.06)",
      }}
    >
      {/* Delete button in corner */}
      <button
        onClick={() => confirmDelete ? setConfirmDelete(false) : setConfirmDelete(true)}
        className="absolute top-4 right-4 p-1.5 rounded-lg transition-all hover:brightness-125"
        style={{
          color: confirmDelete ? "var(--color-danger)" : "var(--text-tertiary)",
          background: confirmDelete ? "rgba(239,68,68,0.1)" : "transparent",
        }}
        title="Удалить квест"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)" }}
        >
          <Sword className="w-5 h-5" style={{ color: "var(--color-level-up)" }} />
        </div>
        <div className="flex-1">
          <p className="text-overline" style={{ color: "var(--color-level-up)" }}>ДАНЖ</p>
          <h3 className="text-base font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>
            {quest.title}
          </h3>
          {/* NCT: Narrative (The 'Why') */}
          {quest.narrative && (
            <p className="text-xs mt-1.5 italic" style={{ color: "var(--color-xp)" }}>
              «{quest.narrative}»
            </p>
          )}
          {quest.description && (
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>{quest.description}</p>
          )}
        </div>
      </div>

      {/* NCT: Synergy Points */}
      {quest.synergy_points !== undefined && quest.synergy_points > 0 && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold" style={{ background: "rgba(139, 92, 246, 0.1)", color: "var(--color-xp)", border: "1px solid rgba(139, 92, 246, 0.2)" }}>
          <span>✨ Синергия Системы:</span>
          <span>+{quest.synergy_points} PTS</span>
        </div>
      )}


      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Прогресс</span>
          <span className="text-xs font-bold tabular-nums" style={{ color: "var(--color-level-up)" }}>
            {value.toLocaleString()} / {target.toLocaleString()} ({pct.toFixed(1)}%)
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--color-level-up), #F59E0B)" }}
          />
        </div>
      </div>

      {/* Quick step buttons */}
      <div className="flex gap-2 mb-3">
        {quickSteps.map((step) => (
          <button
            key={step}
            onClick={() => applyDelta(step)}
            disabled={value >= target}
            className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-30"
            style={{
              background: "rgba(251,191,36,0.1)",
              border: "1px solid rgba(251,191,36,0.25)",
              color: "var(--color-level-up)",
            }}
          >
            +{step}
          </button>
        ))}
      </div>

      {/* Mode toggle + custom input */}
      <div className="flex gap-2 mb-4">
        {/* Mode toggle */}
        <div
          className="flex rounded-xl overflow-hidden flex-shrink-0"
          style={{ border: "1px solid var(--border-subtle)" }}
        >
          <button
            onClick={() => setMode("add")}
            className="px-3 py-2 text-xs font-medium transition-all"
            style={{
              background: mode === "add" ? "rgba(251,191,36,0.15)" : "var(--bg-tertiary)",
              color: mode === "add" ? "var(--color-level-up)" : "var(--text-tertiary)",
            }}
          >
            +
          </button>
          <button
            onClick={() => setMode("set")}
            className="px-3 py-2 text-xs font-medium transition-all"
            style={{
              background: mode === "set" ? "rgba(251,191,36,0.15)" : "var(--bg-tertiary)",
              color: mode === "set" ? "var(--color-level-up)" : "var(--text-tertiary)",
            }}
          >
            =
          </button>
        </div>

        <input
          type="number"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCustom()}
          placeholder={mode === "add" ? "Добавить..." : "Установить..."}
          className="flex-1 px-3 py-2 rounded-xl text-sm outline-none tabular-nums"
          style={{
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
          }}
          onFocus={(e) => { e.target.style.borderColor = "var(--color-level-up)"; }}
          onBlur={(e) => { e.target.style.borderColor = "var(--border-subtle)"; }}
        />

        <button
          onClick={handleCustom}
          disabled={!inputVal}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-30"
          style={{
            background: "rgba(251,191,36,0.15)",
            border: "1px solid rgba(251,191,36,0.3)",
            color: "var(--color-level-up)",
          }}
        >
          {mode === "add" ? "Добавить" : "Задать"}
        </button>
      </div>

      {/* Complete error */}
      {completeError && (
        <div className="text-xs px-3 py-2 rounded-xl mb-3"
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--color-danger)" }}>
          {completeError}
        </div>
      )}

      {/* Complete button */}
      {!completed ? (
        <button
          onClick={handleComplete}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all mb-4 disabled:opacity-50"
          style={pct >= 100
            ? { background: "linear-gradient(135deg, #FBBF24, #F59E0B)", color: "#0A0A0F" }
            : { background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)", color: "var(--color-level-up)" }
          }
        >
          <Trophy className="w-4 h-4" />
          {pct >= 100 ? "Завершить данж! ⚔️" : "Засчитать как выполненный"}
        </button>
      ) : (
        <div
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold mb-4"
          style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "var(--color-success)" }}
        >
          <Check className="w-4 h-4" /> Данж пройден!
        </div>
      )}

      {/* Reward */}
      {quest.title_reward && (
        <div
          className="text-xs px-3 py-2 rounded-xl mb-4"
          style={{ background: "rgba(251,191,36,0.08)", color: "var(--color-level-up)" }}
        >
          🏆 Награда: «{quest.title_reward}»
        </div>
      )}

      {/* Subquests */}
      {quest.subquests && quest.subquests.length > 0 && (
        <div className="space-y-2 mb-4">
          <p className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>Объективы (Подзадачи):</p>
          {quest.subquests.map((sq) => (
            <div key={sq.id} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                style={{
                  background: sq.is_completed ? "var(--color-success)" : "var(--bg-tertiary)",
                  border: `1px solid ${sq.is_completed ? "var(--color-success)" : "var(--border-default)"}`,
                }}
              >
                {sq.is_completed && <Check className="w-2.5 h-2.5 text-white" />}
              </div>
              <span
                className={`text-xs ${sq.is_completed ? "line-through" : ""}`}
                style={{ color: sq.is_completed ? "var(--text-tertiary)" : "var(--text-secondary)" }}
              >
                {sq.title}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* NCT: Linked Habits (The System) */}
      {quest.linked_tasks && quest.linked_tasks.length > 0 && (
        <div className="space-y-2 mb-4 p-3 rounded-xl" style={{ background: "var(--bg-tertiary)", border: "1px dashed var(--border-subtle)" }}>
          <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: "var(--color-xp)" }}>
            <span>⚡️ Активные привычки:</span>
          </p>
          {quest.linked_tasks.map((lt) => (
            <div key={lt.id} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: lt.is_completed ? "var(--color-success)" : "var(--color-xp)" }} />
              <span
                className={`text-xs ${lt.is_completed ? "line-through" : ""}`}
                style={{ color: lt.is_completed ? "var(--text-tertiary)" : "var(--text-secondary)" }}
              >
                {lt.title} {lt.type === "daily" ? "(Ежедневная)" : "(Еженедельная)"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Deadline */}
      {quest.deadline && (
        <p className="text-xs mt-3" style={{ color: "var(--text-tertiary)" }}>
          Дедлайн: {new Date(quest.deadline).toLocaleDateString("ru-RU")}
        </p>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="mt-4 rounded-xl p-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <p className="text-xs mb-2.5" style={{ color: "var(--text-secondary)" }}>
            Удалить этот Эпический квест? Привязанные привычки останутся, но Эпик будет удален навсегда.
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
              Удалить Эпик
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
