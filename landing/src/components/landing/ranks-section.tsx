"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";

const ranks = [
  {
    id: "E",
    name: "Пробуждённый",
    levels: "1–5",
    color: "#6B7280",
    glow: "rgba(107,114,128,0.4)",
    bg: "rgba(107,114,128,0.08)",
    border: "rgba(107,114,128,0.25)",
    desc: "Начало пути. Ты только что получил Систему.",
    trial: null,
  },
  {
    id: "D",
    name: "Охотник",
    levels: "6–15",
    color: "#3B82F6",
    glow: "rgba(59,130,246,0.4)",
    bg: "rgba(59,130,246,0.08)",
    border: "rgba(59,130,246,0.25)",
    desc: "Первые реальные изменения. Привычки становятся частью жизни.",
    trial: "30 дней базовых привычек подряд",
  },
  {
    id: "C",
    name: "Ветеран",
    levels: "16–30",
    color: "#8B5CF6",
    glow: "rgba(139,92,246,0.4)",
    bg: "rgba(139,92,246,0.08)",
    border: "rgba(139,92,246,0.25)",
    desc: "Трансформация очевидна. Окружение замечает изменения.",
    trial: "Первый заработок с нового навыка",
  },
  {
    id: "B",
    name: "Элита",
    levels: "31–50",
    color: "#F59E0B",
    glow: "rgba(245,158,11,0.4)",
    bg: "rgba(245,158,11,0.08)",
    border: "rgba(245,158,11,0.25)",
    desc: "Стабильность. 3 месяца устойчивого прогресса в ключевой сфере.",
    trial: "Стабильный доход 3 месяца подряд",
  },
  {
    id: "A",
    name: "Мастер",
    levels: "51–75",
    color: "#EF4444",
    glow: "rgba(239,68,68,0.4)",
    bg: "rgba(239,68,68,0.08)",
    border: "rgba(239,68,68,0.25)",
    desc: "Ты ведёшь других. Твои результаты вдохновляют.",
    trial: "Менторить других или создать продукт с 1000+ пользователей",
  },
  {
    id: "S",
    name: "Монарх",
    levels: "76–100",
    color: "#FBBF24",
    glow: "rgba(251,191,36,0.5)",
    bg: "rgba(251,191,36,0.08)",
    border: "rgba(251,191,36,0.3)",
    desc: "Ты определяешь свой путь сам. S-ранг знает свою цель.",
    trial: "Определяешь сам.",
    special: true,
  },
];

export function RanksSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [active, setActive] = useState(5); // S-rank

  return (
    <section ref={ref} className="py-24 px-6 relative overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(99,102,241,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p
            className="text-xs font-semibold uppercase tracking-[0.2em] mb-4"
            style={{ color: "#6366F1" }}
          >
            Ранговая система
          </p>
          <h2 className="text-3xl lg:text-4xl font-black mb-4" style={{ color: "#F0F0F5" }}>
            Шесть рангов. Один путь.
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "#8A8A9A" }}>
            Каждый ранг требует реального испытания. Не просто набитые очки — доказанный результат в жизни.
          </p>
        </motion.div>

        {/* Rank grid */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-10">
          {ranks.map((rank, i) => (
            <motion.button
              key={rank.id}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.07 }}
              onClick={() => setActive(i)}
              className="flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300 cursor-pointer"
              style={{
                background: active === i ? rank.bg : "rgba(255,255,255,0.02)",
                border: `1px solid ${active === i ? rank.border : "rgba(255,255,255,0.06)"}`,
                boxShadow: active === i && rank.special
                  ? `0 0 30px ${rank.glow}, 0 0 60px ${rank.glow}40`
                  : active === i
                  ? `0 0 20px ${rank.glow}`
                  : "none",
              }}
            >
              <div
                className="text-3xl font-black"
                style={{
                  color: rank.color,
                  filter: rank.special && active === i ? `drop-shadow(0 0 8px ${rank.color})` : "none",
                }}
              >
                {rank.id}
              </div>
              <div className="text-[9px] font-medium" style={{ color: rank.color + "99" }}>
                {rank.levels} ур.
              </div>
            </motion.button>
          ))}
        </div>

        {/* Active rank detail */}
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl p-8 relative overflow-hidden"
          style={{
            background: ranks[active].bg,
            border: `1px solid ${ranks[active].border}`,
          }}
        >
          {ranks[active].special && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${ranks[active].glow}30 0%, transparent 60%)`,
              }}
            />
          )}

          <div className="grid md:grid-cols-2 gap-6 relative">
            <div>
              <div className="flex items-baseline gap-3 mb-3">
                <span
                  className="text-5xl font-black"
                  style={{
                    color: ranks[active].color,
                    filter: ranks[active].special ? `drop-shadow(0 0 12px ${ranks[active].color})` : "none",
                  }}
                >
                  {ranks[active].id}
                </span>
                <div>
                  <div className="text-xl font-bold" style={{ color: "#F0F0F5" }}>
                    {ranks[active].name}
                  </div>
                  <div className="text-sm" style={{ color: ranks[active].color + "99" }}>
                    Уровни {ranks[active].levels}
                  </div>
                </div>
              </div>
              <p className="text-base leading-relaxed" style={{ color: "#8A8A9A" }}>
                {ranks[active].desc}
              </p>
            </div>

            {ranks[active].trial && (
              <div
                className="rounded-xl p-4"
                style={{
                  background: "rgba(0,0,0,0.2)",
                  border: `1px solid ${ranks[active].color}20`,
                }}
              >
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-2"
                  style={{ color: ranks[active].color }}
                >
                  ⚔️ Ранговое испытание
                </p>
                <p className="text-sm" style={{ color: "#F0F0F5" }}>
                  {ranks[active].trial}
                </p>
                <p className="text-xs mt-2" style={{ color: "#55556A" }}>
                  Реальное достижение — не просто XP
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Arrow progression */}
        <div className="flex items-center justify-center gap-1 mt-8 flex-wrap">
          {ranks.map((r, i) => (
            <div key={r.id} className="flex items-center gap-1">
              <span
                className="text-sm font-bold px-2 py-0.5 rounded-lg"
                style={{
                  color: r.color,
                  background: r.color + "15",
                }}
              >
                {r.id}
              </span>
              {i < ranks.length - 1 && (
                <span className="text-xs" style={{ color: "#55556A" }}>→</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
