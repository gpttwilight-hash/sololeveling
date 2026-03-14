"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { completePortalStep, startPortal } from "@/app/(app)/actions";
import { toast } from "sonner";
import type { PortalTemplate } from "@/lib/game/portal-templates";

const ATTR_COLORS: Record<string, string> = {
  str: "#E84855",
  int: "#3B82F6",
  cha: "#F59E0B",
  dis: "#8B5CF6",
  wlt: "#10B981",
};

interface PortalProgressData {
  steps_completed: number;
  is_finished: boolean;
  template_id: string;
}

interface Props {
  portal: PortalTemplate;
  progress: PortalProgressData | null;
  date: string;
}

export function PortalCard({ portal, progress, date }: Props) {
  const [stepsCompleted, setStepsCompleted] = useState(progress?.steps_completed ?? 0);
  const [isFinished, setIsFinished] = useState(progress?.is_finished ?? false);
  const [loadingStep, setLoadingStep] = useState<number | null>(null);
  const [started, setStarted] = useState(progress !== null);

  const color = ATTR_COLORS[portal.attribute] ?? "#6366F1";
  const totalXP = portal.steps.reduce((s, step) => s + step.xp, 0);

  async function handleStart() {
    try {
      await startPortal(date, portal.id);
      setStarted(true);
    } catch {
      toast.error("Не удалось открыть портал.");
    }
  }

  async function handleStep(stepIndex: number) {
    if (loadingStep !== null || stepsCompleted !== stepIndex) return;
    setLoadingStep(stepIndex);
    try {
      const result = await completePortalStep(date, stepIndex);
      setStepsCompleted(stepIndex + 1);
      if (result.isFinished) {
        setIsFinished(true);
        toast.success(`Портал пройден! +${totalXP} XP · 🏅 ${portal.badgeName}`);
      } else {
        toast.success(`Шаг ${stepIndex + 1} завершён! +${result.xpEarned} XP`);
      }
    } catch (err) {
      toast.error("Ошибка при выполнении шага.");
      console.error(err);
    } finally {
      setLoadingStep(null);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: `${color}40`, background: `${color}06` }}
    >
      <div className="px-5 pt-4 pb-3 flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-0.5">
            🌀 Портал дня
          </p>
          <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            {portal.title}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            {portal.description}
          </p>
        </div>
        <div className="text-right flex-shrink-0 ml-3">
          <p className="text-xs font-semibold" style={{ color }}>
            +{totalXP} XP
          </p>
          <p className="text-[10px] text-gray-500">за всё</p>
        </div>
      </div>

      <div className="px-5 mb-3">
        <div className="h-1.5 rounded-full" style={{ background: "var(--bg-tertiary)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: color }}
            animate={{ width: `${(stepsCompleted / 3) * 100}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <p className="text-[10px] mt-1 text-gray-500">
          {stepsCompleted}/3 шагов
        </p>
      </div>

      {!started ? (
        <div className="px-5 pb-4">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleStart}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: color }}
          >
            Войти в портал
          </motion.button>
        </div>
      ) : (
        <div className="px-5 pb-4 space-y-2">
          {portal.steps.map((step, i) => {
            const isCompleted = i < stepsCompleted;
            const isActive = i === stepsCompleted && !isFinished;
            const isLocked = i > stepsCompleted || isFinished;
            const isStepLoading = loadingStep === i;

            return (
              <motion.div
                key={i}
                className="rounded-xl px-4 py-3 flex items-center gap-3"
                style={{
                  background: isCompleted
                    ? `${color}15`
                    : isActive
                      ? "var(--bg-secondary)"
                      : "var(--bg-glass)",
                  border: `1px solid ${isCompleted ? color + "40" : isActive ? color + "30" : "var(--border-subtle)"}`,
                  opacity: isLocked ? 0.5 : 1,
                }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{
                    background: isCompleted ? color : "var(--bg-tertiary)",
                    color: isCompleted ? "white" : "var(--text-tertiary)",
                  }}
                >
                  {isCompleted ? "✓" : i + 1}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {step.title}
                  </p>
                  {step.description && (
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                      {step.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    +{step.xp}
                  </span>
                  {isActive && (
                    <motion.button
                      whileTap={{ scale: 0.92 }}
                      onClick={() => handleStep(i)}
                      disabled={isStepLoading}
                      className="px-3 py-1 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
                      style={{ background: color }}
                    >
                      {isStepLoading ? "..." : "Готово"}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}

          {isFinished && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl px-4 py-3 text-center"
              style={{
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.3)",
              }}
            >
              <p className="text-sm font-bold" style={{ color: "var(--color-success)" }}>
                🏅 {portal.badgeName}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
                Портал дня пройден
              </p>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}
