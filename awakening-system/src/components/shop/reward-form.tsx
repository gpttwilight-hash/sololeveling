"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createReward } from "@/app/(app)/actions";
import { toast } from "sonner";

const EMOJI_OPTIONS = ["🎬", "🍕", "🎮", "☕", "🛍️", "📱", "🎵", "🍰", "🏖️", "💤", "🎨", "📚"];

export function RewardForm() {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [emoji, setEmoji] = useState("🎬");
    const [cost, setCost] = useState(20);
    const [isPending, startTransition] = useTransition();

    function handleSubmit() {
        if (!title.trim() || cost < 1) return;
        startTransition(async () => {
            try {
                await createReward({
                    title: title.trim(),
                    emoji,
                    cost,
                });
                setTitle("");
                setCost(20);
                setIsOpen(false);
                toast.success("Награда создана!");
            } catch {
                toast.error("Не удалось создать награду");
            }
        });
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all hover:brightness-110 active:scale-[0.98]"
                style={{
                    background: "rgba(251,191,36,0.08)",
                    border: "1px dashed rgba(251,191,36,0.3)",
                    color: "var(--color-level-up)",
                }}
            >
                <Plus className="w-4 h-4" />
                Добавить награду
            </button>
        );
    }

    const inputStyle = {
        background: "var(--bg-tertiary)",
        border: "1px solid var(--border-subtle)",
        color: "var(--text-primary)",
    };

    return (
        <div
            className="rounded-2xl p-4 space-y-3"
            style={{ background: "var(--bg-secondary)", border: "1px solid rgba(251,191,36,0.2)" }}
        >
            <p className="text-xs font-semibold" style={{ color: "var(--color-level-up)" }}>
                Новая награда
            </p>

            {/* Title */}
            <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Название награды..."
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle}
            />

            {/* Emoji picker */}
            <div>
                <p className="text-xs mb-1.5" style={{ color: "var(--text-tertiary)" }}>Иконка</p>
                <div className="flex gap-1.5 flex-wrap">
                    {EMOJI_OPTIONS.map((e) => (
                        <button
                            key={e}
                            onClick={() => setEmoji(e)}
                            className="w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all"
                            style={{
                                background: emoji === e ? "rgba(251,191,36,0.15)" : "var(--bg-tertiary)",
                                border: `1px solid ${emoji === e ? "var(--color-level-up)" : "var(--border-subtle)"}`,
                            }}
                        >
                            {e}
                        </button>
                    ))}
                </div>
            </div>

            {/* Cost */}
            <div>
                <p className="text-xs mb-1.5" style={{ color: "var(--text-tertiary)" }}>Стоимость (монет)</p>
                <input
                    type="number"
                    value={cost}
                    onChange={(e) => setCost(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none tabular-nums"
                    style={inputStyle}
                />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
                <button
                    onClick={() => setIsOpen(false)}
                    className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
                    style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                >
                    Отмена
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!title.trim() || isPending}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-40"
                    style={{
                        background: "rgba(251,191,36,0.15)",
                        border: "1px solid rgba(251,191,36,0.3)",
                        color: "var(--color-level-up)",
                    }}
                >
                    {isPending ? "Создаю..." : "Создать"}
                </button>
            </div>
        </div>
    );
}
