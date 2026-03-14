"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MilestoneTemplate } from "@/lib/game/milestone-templates";

interface Props {
  milestone: MilestoneTemplate;
}

export function MilestoneOverlay({ milestone }: Props) {
  const [visible, setVisible] = useState(true);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
          onClick={() => setVisible(false)}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="relative rounded-3xl border text-center px-8 py-10 max-w-sm w-full"
            style={{
              background: "var(--bg-secondary)",
              borderColor: "rgba(251,191,36,0.4)",
              boxShadow: "0 0 60px rgba(251,191,36,0.15)",
            }}
          >
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                background: "radial-gradient(circle at 50% 0%, rgba(251,191,36,0.08), transparent 70%)",
              }}
            />

            <p className="text-xs font-mono tracking-widest text-yellow-500 mb-4 uppercase">
              Система фиксирует
            </p>

            <motion.h1
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="text-3xl font-black tracking-tight text-white mb-4"
            >
              {milestone.title}
            </motion.h1>

            <p className="text-sm leading-relaxed mb-6" style={{ color: "var(--text-secondary)" }}>
              {milestone.description}
            </p>

            <div
              className="inline-block px-4 py-2 rounded-full mb-6 text-sm font-bold"
              style={{
                background: "rgba(251,191,36,0.15)",
                border: "1px solid rgba(251,191,36,0.4)",
                color: "#FBBF24",
              }}
            >
              🏆 Новый титул: «{milestone.titleGranted}»
            </div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setVisible(false)}
              className="w-full py-3 rounded-xl font-semibold text-sm text-black"
              style={{ background: "#FBBF24" }}
            >
              Принять и продолжить
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
