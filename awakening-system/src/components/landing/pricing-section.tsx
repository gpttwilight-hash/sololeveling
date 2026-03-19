"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Check } from "lucide-react";



const plans = [
  {
    name: "Охотник",
    price: "0",
    period: "навсегда",
    desc: "Всё необходимое для начала пути.",
    color: "#6366F1",
    glow: false,
    cta: "Начать бесплатно",
    href: "/signup",
    features: [
      "До 7 ежедневных квестов",
      "Еженедельные квесты",
      "XP, уровни и ранги",
      "5 атрибутов + radar chart",
      "Система стриков",
      "Магазин наград",
      "24 достижения",
      "PWA (установка на телефон)",
    ],
    missing: [
      "Аналитика и графики",
      "AI-квесты",
      "Эпические данжи",
    ],
  },
  {
    name: "Монарх",
    price: "4.99",
    period: "в месяц",
    altLabel: "или $49.99 навсегда",
    desc: "Для тех, кто серьёзно настроен стать S-рангом.",
    color: "#FBBF24",
    glow: true,
    cta: "Скоро",
    href: "#",
    badge: "Скоро",
    features: [
      "Всё из Охотника",
      "Эпические данжи (Boss Raids)",
      "AI-рекомендации квестов",
      "Расширенная аналитика",
      "XP графики и heat map",
      "Кастомные темы",
      "Приоритетная поддержка",
      "Экспорт данных JSON",
    ],
  },
];

export function PricingSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] mb-4" style={{ color: "#6366F1" }}>
            Цены
          </p>
          <h2 className="text-3xl lg:text-4xl font-black mb-4" style={{ color: "#F0F0F5" }}>
            Начни бесплатно
          </h2>
          <p className="text-lg" style={{ color: "#8A8A9A" }}>
            Базовая функциональность — навсегда бесплатно. Никаких ловушек.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: i * 0.12 }}
              className="rounded-2xl p-7 relative overflow-hidden"
              style={{
                background: plan.glow
                  ? "linear-gradient(145deg, rgba(251,191,36,0.06), rgba(10,10,15,1))"
                  : "rgba(255,255,255,0.025)",
                border: `1px solid ${plan.glow ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.07)"}`,
                boxShadow: plan.glow ? "0 0 40px rgba(251,191,36,0.08)" : "none",
              }}
            >
              {plan.glow && (
                <div
                  className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: "linear-gradient(90deg, transparent, rgba(251,191,36,0.4), transparent)" }}
                />
              )}
              {plan.badge && (
                <div
                  className="absolute top-5 right-5 text-[10px] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(251,191,36,0.15)", color: "#FBBF24", border: "1px solid rgba(251,191,36,0.2)" }}
                >
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <p className="text-sm font-medium mb-1" style={{ color: plan.color }}>{plan.name}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl font-black" style={{ color: "#F0F0F5" }}>${plan.price}</span>
                  <span className="text-sm" style={{ color: "#55556A" }}>/{plan.period}</span>
                </div>
                {plan.altLabel && (
                  <p className="text-xs mb-2" style={{ color: "#55556A" }}>{plan.altLabel}</p>
                )}
                <p className="text-sm" style={{ color: "#8A8A9A" }}>{plan.desc}</p>
              </div>

              <a
                href={plan.href}
                className="block text-center py-3 rounded-xl text-sm font-semibold mb-6"
                style={{
                  ...(plan.glow
                    ? {
                        background: "rgba(251,191,36,0.1)",
                        border: "1px solid rgba(251,191,36,0.2)",
                        color: "#FBBF24",
                        cursor: "default",
                        pointerEvents: "none" as const,
                      }
                    : {
                        background: "linear-gradient(135deg, #6366F1, #4F46E5)",
                        color: "white",
                        boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
                      }),
                  textDecoration: "none",
                }}
              >
                {plan.cta}
              </a>

              <div className="space-y-2.5">
                {plan.features.map((feature, j) => (
                  <div key={j} className="flex items-center gap-2.5">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: plan.color + "20" }}
                    >
                      <Check className="w-2.5 h-2.5" style={{ color: plan.color }} />
                    </div>
                    <span className="text-sm" style={{ color: "#8A8A9A" }}>{feature}</span>
                  </div>
                ))}
                {plan.missing?.map((feature, j) => (
                  <div key={j} className="flex items-center gap-2.5 opacity-35">
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ border: "1px solid rgba(255,255,255,0.1)" }} />
                    <span className="text-sm line-through" style={{ color: "#55556A" }}>{feature}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
