import { XPBar } from "./xp-bar";
import { RankBadge } from "@/components/shared/rank-badge";
import { getXPProgress } from "@/lib/game/xp-calculator";
import type { Profile } from "@/types/game";

interface ProfileCardProps {
  profile: Profile;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const progress = getXPProgress(profile.total_xp);

  return (
    <div className="glass-card p-5">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{
            background: "var(--bg-tertiary)",
            border: "1px solid var(--border-default)",
          }}
        >
          {profile.avatar_id === "default" ? "⚔️" : profile.avatar_id}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h2
              className="text-lg font-bold truncate"
              style={{ color: "var(--text-primary)" }}
            >
              {profile.hunter_name}
            </h2>
            <RankBadge rank={profile.rank} size="sm" />
          </div>

          <p className="text-xs mb-3" style={{ color: "var(--text-tertiary)" }}>
            Уровень{" "}
            <span className="font-semibold tabular-nums" style={{ color: "var(--color-xp)" }}>
              {progress.level}
            </span>
          </p>

          <XPBar progress={progress} />
        </div>
      </div>
    </div>
  );
}
