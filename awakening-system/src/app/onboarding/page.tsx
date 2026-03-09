"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ChevronRight, ChevronLeft, Check } from "lucide-react";
import { completeOnboarding } from "./actions";
import { STARTER_QUESTS, type FocusKey } from "./data";

const AVATARS = ["⚔️", "🗡️", "🛡️", "🏹", "🔮", "💀", "🐉", "⚡"];

const FOCUS_OPTIONS: { key: FocusKey; label: string; desc: string; color: string }[] = [
  { key: "str", label: "Физическая форма", desc: "Тренировки, здоровье, тело", color: "var(--color-strength)" },
  { key: "int", label: "Интеллект и навыки", desc: "Обучение, книги, мастерство", color: "var(--color-intellect)" },
  { key: "cha", label: "Коммуникация и влияние", desc: "Контент, нетворкинг, харизма", color: "var(--color-charisma)" },
  { key: "dis", label: "Дисциплина и привычки", desc: "Режим, воля, постоянство", color: "var(--color-discipline)" },
  { key: "wlt", label: "Карьера и финансы", desc: "Проекты, доход, рост", color: "var(--color-wealth)" },
];

const ATTR_LABELS: Record<FocusKey, string> = {
  str: "STR", int: "INT", cha: "CHA", dis: "DIS", wlt: "WLT",
};

const ATTR_COLORS: Record<FocusKey, string> = {
  str: "var(--color-strength)",
  int: "var(--color-intellect)",
  cha: "var(--color-charisma)",
  dis: "var(--color-discipline)",
  wlt: "var(--color-wealth)",
};

const pageVariants = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

function useTypewriter(text: string, speed = 40) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setDisplayed("");
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      setDisplayed(text.slice(0, ++i));
      if (i >= text.length) { clearInterval(id); setDone(true); }
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return { displayed, done };
}

function WelcomeText() {
  return (
    <div className="flex flex-col gap-3 my-8 text-center">
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-gray-400"
      >
        Система обнаружила нового Охотника.
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.4, duration: 0.5 }}
        className="text-gray-400"
      >
        Инициализация протокола пробуждения...
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.5, duration: 0.5 }}
        className="text-indigo-400 font-bold"
      >
        Статус: ГОТОВ К РЕГИСТРАЦИИ
      </motion.p>
    </div>
  );
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [hunterName, setHunterName] = useState("");
  const [avatarId, setAvatarId] = useState(AVATARS[0]);
  const [selectedFocus, setSelectedFocus] = useState<FocusKey[]>([]);
  const [selectedQuests, setSelectedQuests] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showRankReveal, setShowRankReveal] = useState(false);

  // Build available quests from selected focus areas
  const availableQuests = selectedFocus.flatMap((focus) =>
    STARTER_QUESTS[focus].map((q, i) => ({ ...q, id: `${focus}_${i}`, attribute: focus }))
  );

  function toggleFocus(key: FocusKey) {
    setSelectedFocus((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key]
    );
    setSelectedQuests([]);
  }

  function toggleQuest(id: string) {
    setSelectedQuests((prev) => {
      if (prev.includes(id)) return prev.filter((q) => q !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  }

  async function handleSubmit() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    setShowRankReveal(true);
    await new Promise((resolve) => setTimeout(resolve, 2500));
    try {
      const formData = new FormData();
      formData.set("hunter_name", hunterName);
      formData.set("avatar_id", avatarId);
      selectedFocus.forEach((f) => formData.append("focus", f));
      selectedQuests.forEach((q) => formData.append("quests", q));
      await completeOnboarding(formData);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (!msg.includes("NEXT_REDIRECT")) {
        setShowRankReveal(false);
        setSubmitError(msg);
        setIsSubmitting(false);
      }
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: "var(--bg-primary)" }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Rank Reveal Overlay */}
      <AnimatePresence>
        {showRankReveal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 gap-6"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-32 h-32 rounded-full border-4 border-gray-400 flex items-center justify-center text-5xl font-black text-gray-300"
            >
              E
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
              className="text-2xl font-bold text-white"
            >
              Ранг E присвоен
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
              className="text-gray-400 font-mono"
            >
              Путь начат. Система ожидает действий.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step indicator */}
      <div className="flex gap-2 mb-8 z-10">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-1 rounded-full transition-all duration-300"
            style={{
              width: i === step ? "32px" : "16px",
              background: i <= step ? "var(--color-xp)" : "var(--border-default)",
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md z-10">
        <AnimatePresence mode="wait">

          {/* ==================== STEP 0: Cinematic Welcome ==================== */}
          {step === 0 && (
            <motion.div
              key="step-0"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center justify-center text-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="text-7xl mb-2"
              >
                ⚔️
              </motion.div>

              <WelcomeText />

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 3.5, duration: 0.5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setStep(1)}
                className="mt-4 inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
              >
                Начать пробуждение →
              </motion.button>
            </motion.div>
          )}

          {/* ==================== STEP 1: Explanation ==================== */}
          {step === 1 && (
            <motion.div
              key="step-1"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
                Как это работает?
              </h2>
              <div className="space-y-4 mb-8">
                {[
                  { icon: "📈", title: "Прокачка", text: "Выполняй квесты, получай XP и повышай свои атрибуты." },
                  { icon: "🔥", title: "Стрик", text: "Не пропускай дни, чтобы сохранять серию и получать бонусы." },
                  { icon: "💰", title: "Магазин", text: "Трать заработанные монеты на реальные награды для себя." },
                  { icon: "⚔️", title: "Эпики", text: "Ставь глобальные цели и иди к ним через малые шаги." },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-3 rounded-xl" style={{ background: "var(--bg-tertiary)" }}>
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{item.title}</p>
                      <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(0)}
                  className="flex items-center gap-1 px-4 py-3 rounded-xl text-sm transition-all"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                >
                  <ChevronLeft className="w-4 h-4" /> Назад
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ background: "linear-gradient(135deg, var(--color-xp), #4F46E5)" }}
                >
                  Понятно <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ==================== STEP 2: Character Setup ==================== */}
          {step === 2 && (
            <motion.div
              key="step-2"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                Создай персонажа
              </h2>
              <p className="text-sm mb-6" style={{ color: "var(--text-tertiary)" }}>
                Как тебя будет звать Система?
              </p>

              <div className="mb-6">
                <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Имя охотника
                </label>
                <input
                  type="text"
                  value={hunterName}
                  onChange={(e) => setHunterName(e.target.value)}
                  placeholder="Введи своё имя..."
                  maxLength={30}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                  style={{
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div className="mb-6">
                <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Выбери аватар
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {AVATARS.map((av) => (
                    <button
                      key={av}
                      onClick={() => setAvatarId(av)}
                      className="aspect-square rounded-xl text-3xl flex items-center justify-center transition-all"
                      style={{
                        background: avatarId === av ? "rgba(99,102,241,0.15)" : "var(--bg-tertiary)",
                        border: `1px solid ${avatarId === av ? "var(--color-xp)" : "var(--border-subtle)"}`,
                      }}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-xs font-medium mb-2" style={{ color: "var(--text-secondary)" }}>
                  Выбери фокус (можно несколько)
                </label>
                <div className="space-y-2">
                  {FOCUS_OPTIONS.map(({ key, label, desc, color }) => {
                    const active = selectedFocus.includes(key);
                    return (
                      <button
                        key={key}
                        onClick={() => toggleFocus(key)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all"
                        style={{
                          background: active ? `${color}18` : "var(--bg-tertiary)",
                          border: `1px solid ${active ? color : "var(--border-subtle)"}`,
                        }}
                      >
                        <div
                          className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 transition-all"
                          style={{ background: active ? color : "var(--border-default)" }}
                        >
                          {active && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <div>
                          <div className="text-sm font-medium" style={{ color: active ? color : "var(--text-primary)" }}>
                            {label}
                          </div>
                          <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>{desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-1 px-4 py-3 rounded-xl text-sm transition-all"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                >
                  <ChevronLeft className="w-4 h-4" /> Назад
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={hunterName.trim().length < 2 || selectedFocus.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, var(--color-xp), #4F46E5)" }}
                >
                  Далее <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ==================== STEP 3: First Quests ==================== */}
          {step === 3 && (
            <motion.div
              key="step-3"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                Первые квесты
              </h2>
              <p className="text-sm mb-6" style={{ color: "var(--text-tertiary)" }}>
                Выбери 3–5 квестов для начала
              </p>

              <div className="space-y-2 mb-8 max-h-72 overflow-y-auto pr-1">
                {availableQuests.map((q) => {
                  const active = selectedQuests.includes(q.id);
                  const attr = q.attribute as FocusKey;
                  const disabled = !active && selectedQuests.length >= 5;
                  return (
                    <button
                      key={q.id}
                      onClick={() => toggleQuest(q.id)}
                      disabled={disabled}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all disabled:opacity-40"
                      style={{
                        background: active ? `${ATTR_COLORS[attr]}15` : "var(--bg-tertiary)",
                        border: `1px solid ${active ? ATTR_COLORS[attr] : "var(--border-subtle)"}`,
                      }}
                    >
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ background: active ? ATTR_COLORS[attr] : "var(--border-default)" }}
                      >
                        {active && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                          {q.title}
                        </div>
                        <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                          +{q.xp_reward} XP · {ATTR_LABELS[attr]}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {submitError && (
                <div className="rounded-xl px-4 py-3 mb-4 text-sm" style={{ background: "rgba(239,68,68,0.1)", color: "var(--color-danger)" }}>
                  {submitError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(2)}
                  className="flex items-center gap-1 px-4 py-3 rounded-xl text-sm transition-all"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                >
                  <ChevronLeft className="w-4 h-4" /> Назад
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={selectedQuests.length < 3 || isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, var(--color-xp), #4F46E5)" }}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isSubmitting ? "Запускаем..." : "Начать путь ⚔️"}
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
