import { ShareAchievementButton } from "./share-achievement-button";

interface AchievementCardProps {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  isUnlocked: boolean;
  isHidden: boolean;
  unlockedAt?: string;
  hunterName?: string;
  hunterRank?: string;
  hunterLevel?: number;
}

export function AchievementCard({
  title, description, icon, isUnlocked, isHidden, unlockedAt,
  hunterName, hunterRank, hunterLevel,
}: AchievementCardProps) {
  return (
    <div
      className="glass-card p-4 transition-all"
      style={{ opacity: isUnlocked ? 1 : 0.5 }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{
            background: isUnlocked ? "rgba(99,102,241,0.12)" : "var(--bg-tertiary)",
            border: `1px solid ${isUnlocked ? "rgba(99,102,241,0.3)" : "var(--border-subtle)"}`,
            filter: isUnlocked ? "none" : "grayscale(1)",
          }}
        >
          {isHidden && !isUnlocked ? "❓" : icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold"
            style={{ color: isUnlocked ? "var(--text-primary)" : "var(--text-secondary)" }}
          >
            {isHidden && !isUnlocked ? "???" : title}
          </p>
          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: "var(--text-tertiary)" }}>
            {isHidden && !isUnlocked ? "Скрытое достижение" : description}
          </p>
          {isUnlocked && unlockedAt && (
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs" style={{ color: "var(--color-xp)" }}>
                ✓ {new Date(unlockedAt).toLocaleDateString("ru-RU")}
              </p>
              {hunterName && hunterRank && hunterLevel !== undefined && (
                <ShareAchievementButton
                  hunterName={hunterName}
                  rank={hunterRank}
                  level={hunterLevel}
                  achievementTitle={title}
                />
              )}
            </div>
          )}
        </div>

        {/* Lock */}
        {!isUnlocked && (
          <span className="text-lg flex-shrink-0" style={{ opacity: 0.4 }}>🔒</span>
        )}
      </div>
    </div>
  );
}
