"use client";

import { toast } from "sonner";

interface ShareAchievementButtonProps {
  hunterName: string;
  rank: string;
  level: number;
  achievementTitle: string;
}

export function ShareAchievementButton({
  hunterName,
  rank,
  level,
  achievementTitle,
}: ShareAchievementButtonProps) {
  const handleShare = async () => {
    const ogUrl = `/api/og/achievement?name=${encodeURIComponent(hunterName)}&rank=${encodeURIComponent(rank)}&achievement=${encodeURIComponent(achievementTitle)}&level=${level}`;
    const fullUrl = `${window.location.origin}${ogUrl}`;

    try {
      await navigator.clipboard.writeText(fullUrl);
      toast.success("Ссылка скопирована!");
    } catch {
      toast.error("Не удалось скопировать ссылку");
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-all"
      style={{
        background: "rgba(99,102,241,0.1)",
        color: "var(--color-xp)",
        border: "1px solid rgba(99,102,241,0.25)",
      }}
      title="Поделиться достижением"
    >
      <span>🔗</span>
      <span>Поделиться</span>
    </button>
  );
}
