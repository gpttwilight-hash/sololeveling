export function CardSkeleton() {
  return (
    <div
      className="rounded-2xl p-5 space-y-3"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl shimmer" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded-lg shimmer" />
          <div className="h-3 w-20 rounded-lg shimmer" />
        </div>
      </div>
      <div className="h-2 w-full rounded-full shimmer" />
    </div>
  );
}

export function QuestSkeleton() {
  return (
    <div
      className="rounded-xl p-4 flex items-center gap-3"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
    >
      <div className="w-6 h-6 rounded-lg shimmer flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-3/4 rounded shimmer" />
        <div className="h-2 w-1/3 rounded shimmer" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <CardSkeleton />
      <div
        className="rounded-2xl p-5 space-y-2"
        style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
      >
        {[1, 2, 3].map((i) => <QuestSkeleton key={i} />)}
      </div>
    </div>
  );
}
