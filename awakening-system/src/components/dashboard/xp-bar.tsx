"use client";

import { useEffect, useState } from "react";
import type { XPProgress } from "@/types/game";

interface XPBarProps {
  progress: XPProgress;
  className?: string;
  size?: "compact" | "default" | "prominent";
}

export function XPBar({ progress, className = "", size = "default" }: XPBarProps) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(t);
  }, []);

  const heights = { compact: "4px", default: "8px", prominent: "12px" };
  const height = heights[size];

  return (
    <div className={`w-full ${className}`}>
      {/* Labels */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium" style={{ color: "var(--text-tertiary)" }}>
          XP
        </span>
        <span className="text-xs tabular-nums" style={{ color: "var(--text-secondary)" }}>
          {progress.currentXP.toLocaleString()} / {progress.requiredXP.toLocaleString()}
        </span>
      </div>

      {/* Track */}
      <div
        className="w-full rounded-full overflow-hidden"
        style={{ height, background: "var(--bg-tertiary)" }}
      >
        {/* Fill */}
        <div
          className="h-full rounded-full xp-bar-fill relative"
          style={{
            width: animated ? `${progress.percentage}%` : "0%",
          }}
        >
          {/* Pulse at tip when > 10% */}
          {progress.percentage > 10 && (
            <span
              className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full opacity-75"
              style={{
                background: "white",
                animation: "streak-pulse 2s ease-in-out infinite",
                transform: "translateY(-50%) translateX(50%)",
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
