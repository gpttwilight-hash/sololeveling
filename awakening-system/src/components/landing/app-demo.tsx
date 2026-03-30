"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Flame, Zap, Brain, Dumbbell, DollarSign, MessageSquare, Shield } from "lucide-react";

type QuestState = "idle" | "completing" | "done";

interface Quest {
  id: number;
  title: string;
  xp: number;
  attr: string;
  color: string;
  Icon: React.ElementType;
  state: QuestState;
}

const INITIAL_QUESTS: Quest[] = [
  { id: 1, title: "Тренировка 30 мин", xp: 15, attr: "STR", color: "#E84855", Icon: Dumbbell, state: "idle" },
  { id: 2, title: "Чтение 30 мин", xp: 10, attr: "INT", color: "#3B82F6", Icon: Brain, state: "idle" },
  { id: 3, title: "Медитация 10 мин", xp: 8, attr: "DIS", color: "#8B5CF6", Icon: Shield, state: "idle" },
];

interface XPPopup {
  id: number;
  xp: number;
  questId: number;
}

export function AppDemo() {
  const [quests, setQuests] = useState<Quest[]>(INITIAL_QUESTS);
  const [xpPercent, setXpPercent] = useState(68);
  const [currentXP, setCurrentXP] = useState(204);
  const [requiredXP] = useState(300);
  const [level, setLevel] = useState(7);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [popups, setPopups] = useState<XPPopup[]>([]);
  const [streak] = useState(12);
  const [coins, setCoins] = useState(340);
  const cycleRef = useRef(false);
  const popupIdRef = useRef(0);

  const addPopup = (xp: number, questId: number) => {
    const id = ++popupIdRef.current;
    setPopups((prev) => [...prev, { id, xp, questId }]);
    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== id));
    }, 1400);
  };

  const runCycle = async () => {
    if (cycleRef.current) return;
    cycleRef.current = true;

    // Reset
    setQuests(INITIAL_QUESTS);
    setXpPercent(68);
    setCurrentXP(204);
    setLevel(7);
    setShowLevelUp(false);
    setCoins(340);

    await sleep(1200);

    // Complete quest 1
    setQuests((q) => q.map((x) => x.id === 1 ? { ...x, state: "completing" } : x));
    await sleep(400);
    setQuests((q) => q.map((x) => x.id === 1 ? { ...x, state: "done" } : x));
    addPopup(15, 1);
    setXpPercent((p) => Math.min(p + 12, 100));
    setCurrentXP((p) => p + 15);
    setCoins((c) => c + 8);
    await sleep(1000);

    // Complete quest 2
    setQuests((q) => q.map((x) => x.id === 2 ? { ...x, state: "completing" } : x));
    await sleep(400);
    setQuests((q) => q.map((x) => x.id === 2 ? { ...x, state: "done" } : x));
    addPopup(10, 2);
    setXpPercent((p) => Math.min(p + 9, 100));
    setCurrentXP((p) => p + 10);
    setCoins((c) => c + 5);
    await sleep(1000);

    // Complete quest 3 → triggers level up
    setQuests((q) => q.map((x) => x.id === 3 ? { ...x, state: "completing" } : x));
    await sleep(400);
    setQuests((q) => q.map((x) => x.id === 3 ? { ...x, state: "done" } : x));
    addPopup(8, 3);

    // Animate XP bar to 100
    setXpPercent(100);
    setCurrentXP(300);
    setCoins((c) => c + 4);
    await sleep(700);

    // LEVEL UP!
    setShowLevelUp(true);
    await sleep(2200);
    setShowLevelUp(false);
    setLevel(8);
    setXpPercent(0);
    setCurrentXP(0);
    await sleep(800);

    cycleRef.current = false;
    // Loop
    setTimeout(runCycle, 1500);
  };

  useEffect(() => {
    const timeout = setTimeout(runCycle, 800);
    return () => {
      clearTimeout(timeout);
      cycleRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative w-full max-w-[340px] mx-auto select-none">
      {/* Glow behind */}
      <div className="absolute inset-0 bg-[#6366F1]/10 rounded-3xl blur-3xl scale-110 pointer-events-none" />

      {/* Phone frame */}
      <div
        className="relative rounded-[28px] overflow-hidden border border-white/10"
        style={{
          background: "linear-gradient(145deg, #12121F, #06060C)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pt-4 pb-2">
          <span className="text-[10px] text-[#55556A] font-medium">9:41</span>
          <div className="flex gap-1.5">
            {[3, 4, 5, 5].map((h, i) => (
              <div key={i} className="w-0.5 rounded-full bg-[#55556A]" style={{ height: h * 2 + "px" }} />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-4 pb-6 space-y-3">
          {/* Profile card */}
          <div
            className="rounded-2xl p-4"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            <div className="flex items-center gap-3 mb-3">
              {/* Avatar */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                style={{ background: "linear-gradient(135deg, #6366F1, #4F46E5)", color: "white" }}
              >
                S
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-[#F0F0F5]">SERGEY</span>
                  <motion.span
                    key={level}
                    initial={{ scale: 1.3, color: "#FBBF24" }}
                    animate={{ scale: 1, color: "#8A8A9A" }}
                    transition={{ duration: 0.5 }}
                    className="text-[10px] text-[#8A8A9A]"
                  >
                    Ур. {level}
                  </motion.span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md"
                    style={{ background: "rgba(107,114,128,0.2)", color: "#6B7280" }}
                  >
                    E-РАНГ
                  </span>
                  <span className="text-[9px] text-[#55556A]">Пробуждённый</span>
                </div>
              </div>
            </div>

            {/* XP Bar */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[9px] text-[#55556A] font-medium uppercase tracking-wider">Опыт</span>
                <motion.span
                  key={currentXP}
                  className="text-[9px] font-medium"
                  style={{ color: "#6366F1" }}
                >
                  {currentXP}/{requiredXP} XP
                </motion.span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: "linear-gradient(90deg, #6366F1, #818CF8)",
                    boxShadow: "0 0 8px rgba(99,102,241,0.5)",
                  }}
                  animate={{ width: `${xpPercent}%` }}
                  transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
            </div>

            {/* Stats row */}
            <div className="flex gap-3 mt-3">
              <div className="flex items-center gap-1">
                <Flame className="w-3 h-3" style={{ color: "#F59E0B" }} />
                <span className="text-[10px] text-[#8A8A9A]">{streak} дней</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="w-3 h-3" style={{ color: "#FBBF24" }} />
                <motion.span key={coins} className="text-[10px] text-[#8A8A9A]">
                  {coins} монет
                </motion.span>
              </div>
            </div>
          </div>

          {/* Quests header */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-semibold text-[#F0F0F5]">Сегодня</span>
            <span className="text-[10px] text-[#55556A]">
              {quests.filter((q) => q.state === "done").length}/{quests.length} ✓
            </span>
          </div>

          {/* Quest cards */}
          <div className="space-y-2 relative">
            {quests.map((quest) => (
              <motion.div
                key={quest.id}
                className="rounded-xl p-3 flex items-center gap-3 relative overflow-hidden"
                animate={{
                  opacity: quest.state === "done" ? 0.55 : 1,
                  scale: quest.state === "completing" ? 0.98 : 1,
                }}
                style={{
                  background:
                    quest.state === "done"
                      ? "rgba(255,255,255,0.015)"
                      : "rgba(255,255,255,0.04)",
                  border: `1px solid ${
                    quest.state === "completing"
                      ? quest.color + "60"
                      : quest.state === "done"
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(255,255,255,0.07)"
                  }`,
                  transition: "all 0.25s ease",
                }}
              >
                {/* Checkbox */}
                <div
                  className="w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300"
                  style={{
                    background:
                      quest.state === "done"
                        ? quest.color
                        : "rgba(255,255,255,0.06)",
                    border:
                      quest.state === "done"
                        ? "none"
                        : `1.5px solid ${quest.color}40`,
                    boxShadow: quest.state === "done" ? `0 0 8px ${quest.color}60` : "none",
                  }}
                >
                  {quest.state === "done" && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    >
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </motion.div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[11px] font-medium transition-all duration-300"
                    style={{
                      color: quest.state === "done" ? "#55556A" : "#F0F0F5",
                      textDecoration: quest.state === "done" ? "line-through" : "none",
                    }}
                  >
                    {quest.title}
                  </p>
                </div>

                {/* Attribute + XP */}
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded-md"
                    style={{
                      background: quest.color + "20",
                      color: quest.color,
                    }}
                  >
                    {quest.attr}
                  </span>
                  <span className="text-[9px] text-[#55556A]">+{quest.xp}</span>
                </div>
              </motion.div>
            ))}

            {/* XP Popups */}
            <AnimatePresence>
              {popups.map((popup) => {
                const quest = quests.find((q) => q.id === popup.questId);
                return (
                  <motion.div
                    key={popup.id}
                    initial={{ opacity: 1, y: 0, x: 0 }}
                    animate={{ opacity: 0, y: -44 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="absolute right-3 text-sm font-bold pointer-events-none"
                    style={{
                      color: "#6366F1",
                      top:
                        popup.questId === 1 ? "16px" :
                        popup.questId === 2 ? "72px" : "128px",
                      textShadow: "0 0 12px rgba(99,102,241,0.8)",
                    }}
                  >
                    +{popup.xp} XP
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Level Up Overlay */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 rounded-[28px] flex items-center justify-center z-20"
            style={{ background: "rgba(10,10,15,0.92)", backdropFilter: "blur(8px)" }}
          >
            <div className="text-center">
              {/* Gold flash ring */}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: [0.5, 1.4, 1], opacity: [0, 1, 0.7] }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="absolute inset-0 rounded-[28px]"
                style={{
                  background: "radial-gradient(circle at center, rgba(251,191,36,0.25) 0%, transparent 70%)",
                }}
              />
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
              >
                <div
                  className="text-[11px] font-bold tracking-[0.25em] mb-2 uppercase"
                  style={{ color: "#FBBF24" }}
                >
                  Уровень повышен
                </div>
                <div
                  className="text-6xl font-black"
                  style={{
                    background: "linear-gradient(135deg, #FBBF24, #F59E0B)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 0 20px rgba(251,191,36,0.6))",
                  }}
                >
                  8
                </div>
                <div className="text-[13px] font-medium mt-1" style={{ color: "#F0F0F5" }}>
                  Уровень
                </div>
              </motion.div>

              {/* Particles */}
              {Array.from({ length: 8 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                  animate={{
                    x: Math.cos((i * Math.PI * 2) / 8) * 80,
                    y: Math.sin((i * Math.PI * 2) / 8) * 80,
                    opacity: 0,
                    scale: 0,
                  }}
                  transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
                  className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
                  style={{
                    background: i % 2 === 0 ? "#FBBF24" : "#6366F1",
                    marginTop: -4,
                    marginLeft: -4,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating label */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span
          className="text-[10px] font-medium px-3 py-1 rounded-full"
          style={{
            background: "rgba(99,102,241,0.1)",
            border: "1px solid rgba(99,102,241,0.2)",
            color: "#6366F1",
          }}
        >
          ⚡ Живая демонстрация
        </span>
      </div>
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}
