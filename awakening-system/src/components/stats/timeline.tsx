interface TimelineEvent {
  date: string;
  title: string;
  icon: string;
}

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  if (events.length === 0) {
    return (
      <p className="text-xs text-center py-4" style={{ color: "var(--text-tertiary)" }}>
        Достижения появятся здесь
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event, i) => (
        <div key={i} className="flex items-start gap-3">
          {/* Icon + line */}
          <div className="flex flex-col items-center">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
              style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)" }}
            >
              {event.icon}
            </div>
            {i < events.length - 1 && (
              <div
                className="w-px flex-1 mt-1"
                style={{ background: "var(--border-subtle)", minHeight: "16px" }}
              />
            )}
          </div>

          {/* Content */}
          <div className="pb-3">
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {event.title}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-tertiary)" }}>
              {new Date(event.date).toLocaleDateString("ru-RU", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
