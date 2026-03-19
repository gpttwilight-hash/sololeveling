"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { AppDemo } from "./app-demo";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

function fadeUp(delay: number) {
  return {
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.6, ease: "easeOut" } as const,
  };
}

function Particles() {
  const particles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    x: (i * 37 + 13) % 100,
    y: (i * 53 + 7) % 100,
    size: (i % 3) + 1,
    duration: 6 + (i % 5),
    delay: (i * 0.4) % 4,
    opacity: 0.1 + (i % 4) * 0.08,
    colorIndex: i % 3,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.colorIndex === 0 ? "#6366F1" : p.colorIndex === 1 ? "#8B5CF6" : "#FBBF24",
            opacity: p.opacity,
          }}
          animate={{ y: [0, -30, 0], opacity: [p.opacity, p.opacity * 2.5, p.opacity] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 60% 50%, rgba(99,102,241,0.07) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.12) 0%, #0A0A0F 60%)",
        }}
      />
      <Particles />

      <div className="relative max-w-6xl mx-auto px-6 w-full py-20 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div>
            <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 mb-6">
              <div
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
                style={{
                  background: "rgba(99,102,241,0.1)",
                  border: "1px solid rgba(99,102,241,0.2)",
                  color: "#818CF8",
                }}
              >
                <Sparkles className="w-3 h-3" />
                Habit tracker нового поколения
              </div>
            </motion.div>

            <motion.h1
              {...fadeUp(0.1)}
              className="text-5xl lg:text-[3.8rem] font-black leading-[1.05] tracking-tight mb-6"
            >
              <span style={{ color: "#F0F0F5" }}>Ты получил</span>
              <br />
              <span
                style={{
                  background: "linear-gradient(135deg, #6366F1 0%, #A78BFA 50%, #FBBF24 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Систему.
              </span>
            </motion.h1>

            <motion.p
              {...fadeUp(0.2)}
              className="text-lg leading-relaxed mb-8 max-w-lg"
              style={{ color: "#8A8A9A" }}
            >
              Превращай привычки в XP, прокачивай атрибуты, повышай ранг.{" "}
              <span style={{ color: "#F0F0F5" }}>Единственный habit tracker</span>, который ты не
              захочешь бросать.
            </motion.p>

            <motion.div {...fadeUp(0.3)} className="flex flex-wrap gap-3 mb-10">
              <a
                href={`${APP_URL}/signup`}
                className="group flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-white"
                style={{
                  background: "linear-gradient(135deg, #6366F1, #4F46E5)",
                  boxShadow: "0 4px 24px rgba(99,102,241,0.35)",
                  textDecoration: "none",
                }}
              >
                Начать бесплатно
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#features"
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium text-sm"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#F0F0F5",
                  textDecoration: "none",
                }}
              >
                Посмотреть возможности
              </a>
            </motion.div>

            <motion.div {...fadeUp(0.4)} className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {(["S", "A", "M", "K"] as const).map((letter, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-[#0A0A0F] flex items-center justify-center text-[9px] font-bold text-white"
                    style={{
                      background: (["#6366F1", "#E84855", "#10B981", "#F59E0B"] as const)[i],
                    }}
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <p className="text-sm" style={{ color: "#55556A" }}>
                <span style={{ color: "#8A8A9A" }}>47 охотников</span> уже прокачиваются
              </p>
            </motion.div>

            <motion.div
              {...fadeUp(0.5)}
              className="mt-10 pt-8 grid grid-cols-3 gap-4"
              style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
            >
              {[
                { value: "100%", label: "Бесплатно" },
                { value: "5", label: "Атрибутов" },
                { value: "S-ранг", label: "Вершина" },
              ].map((stat, i) => (
                <div key={i}>
                  <div className="text-lg font-bold" style={{ color: i === 2 ? "#FBBF24" : "#F0F0F5" }}>
                    {stat.value}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "#55556A" }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.35, ease: "easeOut" }}
            className="flex justify-center lg:justify-end pb-10"
          >
            <AppDemo />
          </motion.div>
        </div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, #0A0A0F)" }}
      />
    </section>
  );
}
