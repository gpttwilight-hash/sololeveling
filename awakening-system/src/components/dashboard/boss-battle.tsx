"use client";
import { motion } from "framer-motion";

interface Boss {
  id: string;
  title: string;
  description: string | null;
  total_quests: number;
  completed_quests: number;
  is_defeated: boolean;
  badge_name: string | null;
  bonus_xp: number;
}

interface Props {
  boss: Boss;
}

export function BossBattle({ boss }: Props) {
  const progressPct = boss.total_quests > 0
    ? (boss.completed_quests / boss.total_quests) * 100
    : 0;
  const hp = Math.max(0, 100 - progressPct);
  const hpColor = hp > 60 ? "#E84855" : hp > 30 ? "#F59E0B" : "#10B981";

  if (boss.is_defeated) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center space-y-1"
      >
        <p className="text-emerald-400 font-mono text-xs tracking-widest">✓ БОСС НЕДЕЛИ ПОВЕРЖЕН</p>
        <p className="text-white font-bold">{boss.title}</p>
        {boss.badge_name && (
          <p className="text-sm text-emerald-300">Получен: {boss.badge_name}</p>
        )}
        <p className="text-xs text-gray-500">+{boss.bonus_xp} бонусного XP начислено</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-red-400 tracking-widest">⚔ БОСС НЕДЕЛИ</p>
        <p className="text-xs text-gray-500">+{boss.bonus_xp} XP при победе</p>
      </div>
      <div>
        <h3 className="text-white font-bold">{boss.title}</h3>
        {boss.description && (
          <p className="text-sm text-gray-400 mt-0.5">{boss.description}</p>
        )}
      </div>
      <div>
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span>HP</span>
          <span>{boss.completed_quests}/{boss.total_quests} квестов выполнено</span>
        </div>
        <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: `${hp}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{ background: hpColor }}
          />
        </div>
      </div>
    </motion.div>
  );
}
