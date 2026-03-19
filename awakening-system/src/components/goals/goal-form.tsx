"use client";
import { useState } from "react";
import { motion } from "framer-motion";

interface GeneratedQuest {
  id: string;
  title: string;
  attribute: string;
  xp_reward: number;
  sort_order: number;
}

export function GoalForm() {
  const [goal, setGoal] = useState("");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);
  const [quests, setQuests] = useState<GeneratedQuest[]>([]);
  const [error, setError] = useState<string | null>(null);

  const ATTR_COLORS: Record<string, string> = {
    str: "#E84855", int: "#3B82F6", cha: "#F59E0B",
    dis: "#8B5CF6", wlt: "#10B981",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!goal.trim()) return;
    setLoading(true);
    setError(null);
    setQuests([]);

    try {
      const res = await fetch("/api/ai/generate-quests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goal.trim(), deadline: deadline || undefined }),
      });

      const data = await res.json() as { quests?: GeneratedQuest[]; error?: string };

      if (!res.ok) {
        setError(data.error ?? "Произошла ошибка при генерации");
        return;
      }

      setQuests(data.quests ?? []);
    } catch {
      setError("Не удалось подключиться к серверу");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-400 font-mono block mb-1">Моя цель</label>
          <input
            value={goal}
            onChange={e => setGoal(e.target.value)}
            placeholder="Научиться программировать на Python за 3 месяца"
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div>
          <label className="text-sm text-gray-400 font-mono block mb-1">
            Дедлайн <span className="text-gray-600">(опционально)</span>
          </label>
          <input
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        {error && (
          <p className="text-sm text-red-400 font-mono">{error}</p>
        )}
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={!goal.trim() || loading}
          type="submit"
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold disabled:opacity-40 transition-colors"
        >
          {loading ? "AI генерирует квесты..." : "⚡ Сгенерировать план"}
        </motion.button>
      </form>

      {quests.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <p className="text-sm text-gray-400 font-mono">
            {quests.length} квестов добавлено в систему
          </p>
          {quests.map(q => (
            <div
              key={q.id}
              className="px-4 py-3 rounded-xl border border-white/5 bg-white/3 flex items-center justify-between"
            >
              <div>
                <p className="text-white text-sm font-medium">{q.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Нед. {Math.floor(q.sort_order / 10)}
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span
                  className="font-mono font-bold"
                  style={{ color: ATTR_COLORS[q.attribute] ?? "#6366F1" }}
                >
                  {q.attribute.toUpperCase()}
                </span>
                <span className="text-yellow-400">+{q.xp_reward} XP</span>
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
