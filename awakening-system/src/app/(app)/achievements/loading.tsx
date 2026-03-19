export default function AchievementsLoading() {
    return (
        <div className="space-y-5 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="h-7 w-32 rounded-lg shimmer" />
                <div className="h-6 w-12 rounded-full shimmer" />
            </div>

            {/* Category tabs */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex-1 h-8 rounded-lg shimmer" />
                ))}
            </div>

            {/* Achievement cards */}
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl shimmer" />
                        <div className="flex-1 space-y-1.5">
                            <div className="h-4 w-2/3 rounded-lg shimmer" />
                            <div className="h-3 w-full rounded-lg shimmer" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
