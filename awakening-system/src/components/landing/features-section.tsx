"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Sword, Brain, Dumbbell, Shield, DollarSign, MessageSquare, Check, TrendingUp, Gift, Zap } from "lucide-react";

// Mini animated radar chart
function MiniRadar() {
  const attrs = [
    { label: "STR", value: 72, color: "#E84855", angle: -90 },
    { label: "INT", value: 85, color: "#3B82F6", angle: -18 },
    { label: "CHA", value: 58, color: "#F59E0B", angle: 54 },
    { label: "DIS", value: 91, color: "#8B5CF6", angle: 126 },
    { label: "WLT", value: 64, color: "#10B981", angle: 198 },
  ];

  const cx = 80;
  const cy = 80;
  const r = 55;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const points = attrs.map((a) => ({
    ...a,
    x: cx + (r * a.value) / 100 * Math.cos(toRad(a.angle)),
    y: cy + (r * a.value) / 100 * Math.sin(toRad(a.angle)),
    labelX: cx + (r + 14) * Math.cos(toRad(a.angle)),
    labelY: cy + (r + 14) * Math.sin(toRad(a.angle)),
  }));

  const polyPoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Grid rings
  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      {/* Grid rings */}
      {rings.map((scale, i) => {
        const ringPoints = attrs
          .map((a) => {
            const x = cx + r * scale * Math.cos(toRad(a.angle));
            const y = cy + r * scale * Math.sin(toRad(a.angle));
            return `${x},${y}`;
          })
          .join(" ");
        return (
          <polygon
            key={i}
            points={ringPoints}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        );
      })}

      {/* Axis lines */}
      {attrs.map((a, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={cx + r * Math.cos(toRad(a.angle))}
          y2={cy + r * Math.sin(toRad(a.angle))}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="1"
        />
      ))}

      {/* Fill */}
      <motion.polygon
        points={polyPoints}
        fill="rgba(99,102,241,0.15)"
        stroke="#6366F1"
        strokeWidth="1.5"
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />

      {/* Dots */}
      {points.map((p, i) => (
        <motion.circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3"
          fill={p.color}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6 + i * 0.08, type: "spring" }}
          style={{ transformOrigin: `${p.x}px ${p.y}px` }}
        />
      ))}

      {/* Labels */}
      {points.map((p, i) => (
        <text
          key={i}
          x={p.labelX}
          y={p.labelY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="8"
          fontWeight="600"
          fill={p.color}
        >
          {p.label}
        </text>
      ))}
    </svg>
  );
}

// Mini anti-grind demo
function AntiGrindDemo() {
  const [day, setDay] = useState(0);
  const days = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  const completion = [1, 1, 1, 0.7, 1, 0, 1]; // 0=rest, 0.7=partial, 1=full

  useEffect(() => {
    const interval = setInterval(() => {
      setDay((d) => (d + 1) % 7);
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex gap-1.5 items-end">
      {days.map((d, i) => {
        const isActive = i === day;
        const val = completion[i];
        const isRest = val === 0;
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <motion.div
              className="w-6 rounded-md"
              animate={{
                height: isRest ? 8 : val * 40,
                background: isRest
                  ? "rgba(6,182,212,0.4)"
                  : isActive
                  ? "#6366F1"
                  : val === 1
                  ? "rgba(99,102,241,0.5)"
                  : "rgba(99,102,241,0.3)",
                boxShadow: isActive ? "0 0 8px rgba(99,102,241,0.6)" : "none",
              }}
              transition={{ duration: 0.4 }}
            />
            <span
              className="text-[8px]"
              style={{
                color: isActive ? "#F0F0F5" : isRest ? "#06B6D4" : "#55556A",
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {isRest ? "😴" : d}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// Mini reward demo
function RewardDemo() {
  const rewards = [
    { emoji: "🍕", label: "Еда", cost: 100 },
    { emoji: "🎮", label: "Игры", cost: 200 },
    { emoji: "😴", label: "Отдых", cost: 500 },
  ];
  const [coins] = useState(340);

  return (
    <div className="space-y-2">
      {rewards.map((r, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.15 }}
          className="flex items-center gap-2 p-2 rounded-xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <span className="text-lg">{r.emoji}</span>
          <span className="text-[11px] flex-1" style={{ color: "#F0F0F5" }}>{r.label}</span>
          <div className="flex items-center gap-1">
            <Zap className="w-2.5 h-2.5" style={{ color: "#FBBF24" }} />
            <span className="text-[10px]" style={{ color: coins >= r.cost ? "#FBBF24" : "#55556A" }}>
              {r.cost}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

const features = [
  {
    tag: "Атрибуты",
    title: "5 сфер жизни в одной системе",
    desc: "STR, INT, CHA, DIS, WLT — каждая привычка прокачивает конкретный атрибут. Видишь баланс своего развития на radar chart.",
    visual: <MiniRadar />,
    color: "#6366F1",
  },
  {
    tag: "Анти-грайнд",
    title: "Дни отдыха без штрафа",
    desc: "Научно обоснованная система. Пропуск = не катастрофа. Streak сохраняется при объявлении дня отдыха. Восстановление за 3 дня.",
    visual: <AntiGrindDemo />,
    color: "#06B6D4",
  },
  {
    tag: "Магазин",
    title: "Зарабатывай настоящие награды",
    desc: "Монеты из XP → реальные награды которые ты сам назначаешь. Заказ еды, час игр, день отдыха — твоя система поощрений.",
    visual: <RewardDemo />,
    color: "#10B981",
  },
];

export function FeaturesSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-24 px-6" id="features">
      <div className="max-w-6xl mx-auto">
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
            Механики
          </p>
          <h2 className="text-3xl lg:text-4xl font-black mb-4" style={{ color: "#F0F0F5" }}>
            Спроектировано для retention
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "#8A8A9A" }}>
            Каждая механика основана на Self-Determination Theory и Flow theory. Не случайный геймплей — наука о мотивации.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className="rounded-2xl p-6 flex flex-col relative overflow-hidden group hover:border-white/15 transition-colors"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {/* Glow hover */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                  background: `radial-gradient(circle at 50% 0%, ${feature.color}10 0%, transparent 60%)`,
                }}
              />

              {/* Top accent line */}
              <div
                className="absolute top-0 left-6 right-6 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${feature.color}50, transparent)` }}
              />

              {/* Tag */}
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.15em] mb-4"
                style={{ color: feature.color }}
              >
                {feature.tag}
              </span>

              {/* Visual */}
              <div className="flex items-center justify-center h-40 mb-6">
                {feature.visual}
              </div>

              <h3 className="text-base font-bold mb-2" style={{ color: "#F0F0F5" }}>
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#8A8A9A" }}>
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
