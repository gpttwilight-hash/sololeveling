import { getRankFromLevel } from "@/lib/game/rank-system";

interface RankBadgeProps {
  rank: string;
  size?: "sm" | "md" | "lg";
}

export function RankBadge({ rank, size = "md" }: RankBadgeProps) {
  const rankDef = getRankFromLevel(
    { E: 1, D: 6, C: 16, B: 31, A: 51, S: 76 }[rank] ?? 1
  );

  const sizes = {
    sm: "text-[10px] px-1.5 py-0.5",
    md: "text-xs px-2 py-0.5",
    lg: "text-sm px-3 py-1",
  };

  return (
    <span
      className={`inline-flex items-center font-bold rounded-md ${sizes[size]}`}
      style={{
        color: rankDef.color,
        background: `${rankDef.color}18`,
        border: `1px solid ${rankDef.color}40`,
      }}
    >
      {rank}-РАНГ
    </span>
  );
}
