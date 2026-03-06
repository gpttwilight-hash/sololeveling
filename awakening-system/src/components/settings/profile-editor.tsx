"use client";

import { useState, useTransition } from "react";
import { Check } from "lucide-react";
import { updateProfile } from "@/app/(app)/actions";
import { toast } from "sonner";

const AVATARS = ["⚔️", "🗡️", "🛡️", "🏹", "🔮", "💀", "🐉", "⚡"];

interface ProfileEditorProps {
    hunterName: string;
    avatarId: string;
    email: string;
}

export function ProfileEditor({ hunterName: initialName, avatarId: initialAvatar, email }: ProfileEditorProps) {
    const [name, setName] = useState(initialName);
    const [avatar, setAvatar] = useState(initialAvatar);
    const [hasChanges, setHasChanges] = useState(false);
    const [isPending, startTransition] = useTransition();

    function handleNameChange(val: string) {
        setName(val);
        setHasChanges(val !== initialName || avatar !== initialAvatar);
    }

    function handleAvatarChange(val: string) {
        setAvatar(val);
        setHasChanges(name !== initialName || val !== initialAvatar);
    }

    function handleSave() {
        if (!hasChanges || name.trim().length < 2) return;
        startTransition(async () => {
            try {
                await updateProfile({ hunter_name: name.trim(), avatar_id: avatar });
                setHasChanges(false);
                toast.success("Профиль обновлён!");
            } catch {
                toast.error("Не удалось обновить профиль");
            }
        });
    }

    return (
        <div className="space-y-4">
            {/* Name */}
            <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Имя охотника
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    maxLength={30}
                    className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
                    style={{
                        background: "var(--bg-tertiary)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-primary)",
                    }}
                    onFocus={(e) => { e.target.style.borderColor = "var(--color-xp)"; }}
                    onBlur={(e) => { e.target.style.borderColor = "var(--border-subtle)"; }}
                />
            </div>

            {/* Email (read-only) */}
            <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Email
                </label>
                <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>{email}</p>
            </div>

            {/* Avatar grid */}
            <div>
                <label className="block text-xs mb-2" style={{ color: "var(--text-secondary)" }}>
                    Аватар
                </label>
                <div className="grid grid-cols-4 gap-2">
                    {AVATARS.map((av) => (
                        <button
                            key={av}
                            onClick={() => handleAvatarChange(av)}
                            className="aspect-square rounded-xl text-2xl flex items-center justify-center transition-all relative"
                            style={{
                                background: avatar === av ? "rgba(99,102,241,0.15)" : "var(--bg-tertiary)",
                                border: `1px solid ${avatar === av ? "var(--color-xp)" : "var(--border-subtle)"}`,
                            }}
                        >
                            {av}
                            {avatar === av && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "var(--color-xp)" }}>
                                    <Check className="w-2.5 h-2.5 text-white" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Save button */}
            {hasChanges && (
                <button
                    onClick={handleSave}
                    disabled={isPending || name.trim().length < 2}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                    style={{
                        background: "linear-gradient(135deg, var(--color-xp), #4F46E5)",
                        color: "#fff",
                    }}
                >
                    {isPending ? "Сохраняю..." : "Сохранить изменения"}
                </button>
            )}
        </div>
    );
}
