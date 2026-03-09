"use client";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  show: boolean;
  newLevel: number;
  newRank?: string;
  onDone: () => void;
}

export function LevelUpOverlay({ show, newLevel, newRank, onDone }: Props) {
  useEffect(() => {
    if (show) {
      const t = setTimeout(onDone, 2200);
      return () => clearTimeout(t);
    }
  }, [show, onDone]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm gap-6"
        >
          <motion.div
            initial={{ scale: 0, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="text-center"
          >
            <p className="text-yellow-400 font-mono text-sm tracking-[0.3em] mb-3">
              УРОВЕНЬ ПОВЫШЕН
            </p>
            <p className="text-8xl font-black text-white">{newLevel}</p>
            {newRank && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-2xl font-bold text-indigo-400 mt-2"
              >
                Ранг {newRank} достигнут
              </motion.p>
            )}
          </motion.div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.8, duration: 1.2 }}
            className="h-0.5 max-w-xs bg-gradient-to-r from-transparent via-yellow-400 to-transparent"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
