import Link from "next/link";
import type { Quest } from "@/types/game";

interface EpicPreviewProps {
    epics: Quest[];
}

export function EpicPreview({ epics }: EpicPreviewProps) {
    if (epics.length === 0) return null;

    return (
        <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
                <p className="text-overline">Активные Эпики</p>
                <Link href="/quests?tab=epic" className="text-[10px] font-medium" style={{ color: "var(--color-xp)" }}>
                    Все →
                </Link>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollSnapType: "x mandatory" }}>
                {epics.map((epic) => {
                    const target = epic.target_value ?? 100;
                    const current = epic.current_value ?? 0;
                    const pct = Math.min(100, (current / target) * 100);

                    return (
                        <div
                            key={epic.id}
                            className="min-w-[200px] flex-shrink-0 rounded-xl p-3 transition-all"
                            style={{
                                background: "var(--bg-secondary)",
                                border: "1px solid rgba(251,191,36,0.15)",
                                scrollSnapAlign: "start",
                            }}
                        >
                            <p className="text-xs font-semibold truncate mb-1" style={{ color: "var(--text-primary)" }}>
                                ⚔️ {epic.title}
                            </p>

                            {epic.narrative && (
                                <p className="text-[10px] italic truncate mb-2" style={{ color: "var(--color-xp)" }}>
                                    «{epic.narrative}»
                                </p>
                            )}

                            {/* Progress bar */}
                            <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: "var(--bg-tertiary)" }}>
                                <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${pct}%`, background: "linear-gradient(90deg, var(--color-level-up), #F59E0B)" }}
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-[10px] tabular-nums" style={{ color: "var(--text-tertiary)" }}>
                                    {current}/{target}
                                </span>
                                {(epic.synergy_points ?? 0) > 0 && (
                                    <span className="text-[10px] font-medium" style={{ color: "var(--color-xp)" }}>
                                        ✨ {epic.synergy_points}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
