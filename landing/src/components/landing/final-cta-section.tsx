"use client";

import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Sword } from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export function FinalCtaSection() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <section ref={ref} className="py-24 px-6 relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(99,102,241,0.1) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black, transparent)",
        }}
      />

      <div className="max-w-3xl mx-auto text-center relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-center mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(99,102,241,0.05))",
                border: "1px solid rgba(99,102,241,0.3)",
                boxShadow: "0 0 40px rgba(99,102,241,0.2)",
              }}
            >
              <Sword className="w-8 h-8" style={{ color: "#6366F1" }} />
            </div>
          </div>

          <h2 className="text-4xl lg:text-5xl font-black mb-6 leading-tight" style={{ color: "#F0F0F5" }}>
            Твой путь к{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #FBBF24, #F59E0B)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 20px rgba(251,191,36,0.3))",
              }}
            >
              S-рангу
            </span>{" "}
            начинается сейчас.
          </h2>

          <p className="text-lg mb-10 max-w-xl mx-auto" style={{ color: "#8A8A9A" }}>
            Регистрация занимает 30 секунд. Первый квест — 2 минуты.
            Ты ничего не теряешь. Только E-ранг.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`${APP_URL}/signup`}
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white"
              style={{
                background: "linear-gradient(135deg, #6366F1, #4F46E5)",
                boxShadow: "0 4px 30px rgba(99,102,241,0.4)",
                fontSize: "1rem",
                textDecoration: "none",
              }}
            >
              Получить Систему бесплатно
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>

          <p className="mt-6 text-xs" style={{ color: "#55556A" }}>
            Никаких карт. Никакого спама. Только путь.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
