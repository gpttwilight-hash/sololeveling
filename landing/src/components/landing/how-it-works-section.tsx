"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Target, Zap, TrendingUp } from "lucide-react";

const steps = [
  {
    number: "01",
    Icon: Target,
    title: "Настрой своё путешествие",
    desc: "Выбери фокус (физическая форма, интеллект, дисциплина...) и получи персонализированные стартовые квесты. 3–5 задач — не больше.",
    tip: "«Начни с малого. E-ранг охотник не берёт S-ранг данжи»",
    color: "#6366F1",
  },
  {
    number: "02",
    Icon: Zap,
    title: "Выполняй квесты, получай XP",
    desc: "Каждое выполненное задание — это XP, монеты и рост атрибутов. Видишь, как бар заполняется. Видишь, как растут STR, INT, CHA.",
    tip: "Средняя сессия: 2 минуты в день",
    color: "#8B5CF6",
  },
  {
    number: "03",
    Icon: TrendingUp,
    title: "Повышай ранг, меняй жизнь",
    desc: "Ранговые испытания требуют реальных достижений. E→D: 30 дней привычек. C→B: стабильный доход. Система растёт вместе с тобой.",
    tip: "D30 retention >20% (средний трекер — 8%)",
    color: "#FBBF24",
  },
];

export function HowItWorksSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} id="demo" className="py-24 px-6 relative">
      {/* Separator line */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16"
        style={{ background: "linear-gradient(to bottom, transparent, rgba(255,255,255,0.08))" }}
      />

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
            Как это работает
          </p>
          <h2 className="text-3xl lg:text-4xl font-black mb-4" style={{ color: "#F0F0F5" }}>
            Три шага до первого ранга
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 relative">
          {/* Connector lines (desktop) */}
          <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-px" style={{ background: "rgba(255,255,255,0.06)" }} />

          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="relative"
            >
              {/* Step number */}
              <div className="flex items-center gap-3 mb-5">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: step.color + "15",
                    border: `1px solid ${step.color}30`,
                  }}
                >
                  <step.Icon className="w-5 h-5" style={{ color: step.color }} />
                </div>
                <span
                  className="text-2xl font-black"
                  style={{ color: step.color + "30" }}
                >
                  {step.number}
                </span>
              </div>

              <h3 className="text-lg font-bold mb-3" style={{ color: "#F0F0F5" }}>
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "#8A8A9A" }}>
                {step.desc}
              </p>

              {/* Tip */}
              <div
                className="rounded-xl p-3 text-xs italic"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "#55556A",
                }}
              >
                {step.tip}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
