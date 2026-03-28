import type { QuestLog } from "@/types/game";

const ATTRIBUTE_COLORS: Record<string, string> = {
  str: "var(--color-strength)",
  int: "var(--color-intellect)",
  cha: "var(--color-charisma)",
  dis: "var(--color-discipline)",
  wlt: "var(--color-wealth)",
};

const TYPE_LABELS: Record<string, string> = {
  daily: "Ежедневный",
  weekly: "Еженедельный",
  epic: "Эпический",
  tutorial: "Инициация",
};

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });
}

function groupByDate(logs: QuestLog[]): Map<string, QuestLog[]> {
  const groups = new Map<string, QuestLog[]>();
  const sorted = [...logs].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  for (const log of sorted) {
    const existing = groups.get(log.date);
    if (existing) {
      existing.push(log);
    } else {
      groups.set(log.date, [log]);
    }
  }
  return groups;
}

interface QuestHistoryProps {
  logs: QuestLog[];
}

export function QuestHistory({ logs }: QuestHistoryProps) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <span className="text-4xl">📜</span>
        <p style={{ color: "var(--text-secondary)" }} className="text-sm">
          История квестов пуста
        </p>
      </div>
    );
  }

  const grouped = groupByDate(logs);

  return (
    <div className="flex flex-col gap-5">
      {Array.from(grouped.entries()).map(([date, dayLogs]) => {
        const totalXP = dayLogs.reduce((sum, l) => sum + l.xp_earned, 0);

        return (
          <div key={date} className="flex flex-col gap-2">
            {/* Date header */}
            <div className="flex items-center justify-between px-1">
              <span
                style={{ color: "var(--text-primary)" }}
                className="text-sm font-medium"
              >
                {formatDateHeader(date)}
              </span>
              <span
                style={{ color: "var(--color-xp)" }}
                className="text-xs font-medium"
              >
                +{totalXP} XP
              </span>
            </div>

            {/* Log entries */}
            <div className="flex flex-col gap-1.5">
              {dayLogs.map((log) => (
                <div
                  key={log.id}
                  className="glass-card flex items-center gap-3 px-4 py-3"
                >
                  {/* Attribute color dot */}
                  <span
                    className="shrink-0 rounded-full"
                    style={{
                      width: 8,
                      height: 8,
                      backgroundColor:
                        ATTRIBUTE_COLORS[log.attribute] ??
                        "var(--text-tertiary)",
                    }}
                  />

                  {/* Title + type */}
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <span
                      style={{ color: "var(--text-primary)" }}
                      className="text-sm truncate"
                    >
                      {log.quest_title}
                    </span>
                    <span
                      style={{ color: "var(--text-tertiary)" }}
                      className="text-xs"
                    >
                      {TYPE_LABELS[log.quest_type] ?? log.quest_type}
                    </span>
                  </div>

                  {/* XP earned */}
                  <span
                    style={{ color: "var(--color-xp)" }}
                    className="text-xs font-medium shrink-0"
                  >
                    +{log.xp_earned} XP
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
