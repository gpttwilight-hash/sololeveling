"use client";
import { motion } from "framer-motion";
import type { Profile } from "@/types/game";
import { getRankFromLevel } from "@/lib/game/rank-system";

interface Props { profile: Profile; streak: number; }

export function HunterStatusBar({ profile, streak }: Props) {
  const rank = getRankFromLevel(profile.level);
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-40 flex items-center justify-between px-4 py-2 bg-[#0A0A0F]/80 backdrop-blur-md border-b border-white/5"
    >
      <div className="flex items-center gap-2">
        <span
          className="w-7 h-7 rounded-full border flex items-center justify-center text-xs font-black"
          style={{ borderColor: rank.color, color: rank.color }}
        >
          {rank.id}
        </span>
        <span className="text-sm text-gray-400 font-mono">{profile.hunter_name}</span>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1">
          <motion.span
            animate={{ scale: streak > 0 ? [1, 1.2, 1] : 1 }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            🔥
          </motion.span>
          <span className="font-bold text-orange-400">{streak}</span>
        </span>
        <span className="flex items-center gap-1">
          <span>💰</span>
          <span className="font-bold text-yellow-400">{profile.coins}</span>
        </span>
      </div>
    </motion.div>
  );
}
