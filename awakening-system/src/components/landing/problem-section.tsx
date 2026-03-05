"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { TrendingDown, Clock, Frown } from "lucide-react";

const problems = [
  {
    Icon: Frown,
    stat: "80%",
    title: "бросают Habitica за 3 месяца",
    desc: "Пиксельная графика и детский геймплей теряют привлекательность через пару недель.",
    color: "#E84855",
  },
  {
    Icon: TrendingDown,
    stat: "73%",
    title: "людей не достигают целей",
    desc: "Скучные чеклисты не создают эмоциональную связь. Нет прогресса — нет мотивации.",
    color: "#F59E0B",
  },
  {
    Icon: Clock,
    stat: "2 нед.",
    title: "средний срок жизни новой привычки",
    desc: "Без правильной системы подкрепления мозг не воспринимает задачи как важные.",
    color: "#8B5CF6",
  },
];

export function ProblemSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-24 px-6 relative">
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
            Почему это не работает
          </p>
          <h2 className="text-3xl lg:text-4xl font-black mb-4" style={{ color: "#F0F0F5" }}>
            Обычные трекеры привычек сломаны
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "#8A8A9A" }}>
            Они лечат симптом — «запиши задачу». Но не лечат причину — отсутствие смысла и прогресса.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {problems.map((problem, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className="rounded-2xl p-6 relative overflow-hidden group"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              {/* Color accent top */}
              <div
                className="absolute top-0 left-0 right-0 h-px"
                style={{ background: `linear-gradient(90deg, transparent, ${problem.color}60, transparent)` }}
              />

              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: problem.color + "15" }}
              >
                <problem.Icon className="w-5 h-5" style={{ color: problem.color }} />
              </div>

              <div
                className="text-4xl font-black mb-2"
                style={{ color: problem.color }}
              >
                {problem.stat}
              </div>

              <h3 className="text-sm font-semibold mb-2" style={{ color: "#F0F0F5" }}>
                {problem.title}
              </h3>

              <p className="text-sm leading-relaxed" style={{ color: "#8A8A9A" }}>
                {problem.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Transition text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="text-center mt-16"
        >
          <p className="text-lg font-semibold" style={{ color: "#F0F0F5" }}>
            Система решает это иначе.{" "}
            <span style={{ color: "#6366F1" }}>Ты — не пользователь трекера. Ты — охотник.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
