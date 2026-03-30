import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") ?? "Охотник";
  const rank = searchParams.get("rank") ?? "E";
  const achievement = searchParams.get("achievement") ?? "Достижение разблокировано";
  const level = searchParams.get("level") ?? "1";

  const RANK_COLORS: Record<string, string> = {
    E: "#9CA3AF", D: "#60A5FA", C: "#34D399",
    B: "#A78BFA", A: "#F59E0B", S: "#F97316",
  };
  const rankColor = RANK_COLORS[rank] ?? "#9CA3AF";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "#06060C",
          color: "white",
          fontFamily: "monospace",
          position: "relative",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${rankColor}15, transparent 70%)`,
          }}
        />
        {/* Icon */}
        <div style={{ fontSize: 72, marginBottom: 20 }}>⚔️</div>
        {/* App name */}
        <div
          style={{
            fontSize: 13,
            color: "#6366F1",
            letterSpacing: "0.3em",
            marginBottom: 12,
            textTransform: "uppercase",
          }}
        >
          Система Пробуждения
        </div>
        {/* Hunter name */}
        <div style={{ fontSize: 32, fontWeight: 900, marginBottom: 6 }}>{name}</div>
        {/* Rank + Level */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 28,
            fontSize: 16,
          }}
        >
          <span
            style={{
              color: rankColor,
              border: `2px solid ${rankColor}`,
              borderRadius: "50%",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 900,
            }}
          >
            {rank}
          </span>
          <span style={{ color: "#9CA3AF" }}>Уровень {level}</span>
        </div>
        {/* Achievement badge */}
        <div
          style={{
            fontSize: 18,
            color: "#FBBF24",
            fontWeight: 700,
            background: "rgba(251, 191, 36, 0.1)",
            padding: "10px 24px",
            borderRadius: 10,
            border: "1px solid rgba(251, 191, 36, 0.3)",
          }}
        >
          🏆 {achievement}
        </div>
        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 20,
            fontSize: 12,
            color: "#4B5563",
          }}
        >
          awakening-system.app
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
