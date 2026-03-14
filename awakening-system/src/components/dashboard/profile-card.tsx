import { motion } from "framer-motion";
import { XPBar } from "./xp-bar";
import { RankBadge } from "@/components/shared/rank-badge";
import { getXPProgress } from "@/lib/game/xp-calculator";
import { getAuraState } from "@/lib/game/aura-calculator";
import type { Profile } from "@/types/game";

interface ProfileCardProps {
  profile: Profile;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const progress = getXPProgress(profile.total_xp);
  const aura = getAuraState(profile);

  return (
    <div className="glass-card p-5">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {aura.intensity !== "dim" && (
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{
                boxShadow: aura.intensity === "radiate" && aura.secondaryColor
                  ? `0 0 20px ${aura.primaryColor}60, 0 0 40px ${aura.secondaryColor}30`
                  : `0 0 20px ${aura.primaryColor}60`,
              }}
              animate={
                aura.intensity === "pulse" || aura.intensity === "radiate"
                  ? { opacity: [0.6, 1, 0.6], scale: [1, 1.05, 1] }
                  : { opacity: [0.4, 0.7, 0.4] }
              }
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
          )}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-default)",
            }}
          >
            {profile.avatar_id === "default" ? "⚔️" : profile.avatar_id}
          </div>
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
