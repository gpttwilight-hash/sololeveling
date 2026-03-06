import type { Quest } from "@/types/game";

interface DaySummaryProps {
    dailyQuests: Quest[];
    weeklyQuests: Quest[];
    totalXpToday: number;
    streak: number;
}

export function DaySummary({ dailyQuests, weeklyQuests, totalXpToday, streak }: DaySummaryProps) {
    const dailyDone = dailyQuests.filter((q) => q.is_completed).length;
    const dailyTotal = dailyQuests.length;
    const weeklyDone = weeklyQuests.filter((q) => q.is_completed).length;
    const weeklyTotal = weeklyQuests.length;
    const allDone = dailyDone === dailyTotal && dailyTotal > 0;

    return (
        <div
            className="glass-card px-5 py-4"
            style={allDone ? { borderColor: "rgba(34,197,94,0.3)", boxShadow: "0 0 15px rgba(34,197,94,0.08)" } : {}}
        >
            <div className="flex items-center justify-between mb-3">
                <p className="text-overline">Сводка дня</p>
                {allDone && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "rgba(34,197,94,0.15)", color: "var(--color-success)" }}>
                        ✅ Всё выполнено!
                    </span>
                )}
            </div>

            <div className="grid grid-cols-3 gap-3">
                {/* Daily */}
                <div className="text-center">
                    <p className="text-2xl font-bold tabular-nums" style={{ color: allDone ? "var(--color-success)" : "var(--color-xp)" }}>
                        {dailyDone}/{dailyTotal}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>Ежедневные</p>
                </div>

                {/* XP today */}
                <div className="text-center">
                    <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--color-level-up)" }}>
                        +{totalXpToday}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>XP сегодня</p>
                </div>

                {/* Weekly */}
                <div className="text-center">
                    <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--color-intellect)" }}>
                        {weeklyDone}/{weeklyTotal}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: "var(--text-tertiary)" }}>Еженедельные</p>
                </div>
            </div>
        </div>
    );
}
