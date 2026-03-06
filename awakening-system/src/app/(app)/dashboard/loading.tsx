export default function DashboardLoading() {
    return (
        <div className="space-y-5 animate-pulse">
            {/* Profile card skeleton */}
            <div className="glass-card p-5">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl shimmer" />
                    <div className="flex-1 space-y-2">
                        <div className="h-5 w-32 rounded-lg shimmer" />
                        <div className="h-3 w-48 rounded-lg shimmer" />
                    </div>
                </div>
            </div>

            {/* XP bar skeleton */}
            <div className="glass-card p-4">
                <div className="h-3 w-24 rounded-lg shimmer mb-2" />
                <div className="h-2 w-full rounded-full shimmer" />
            </div>

            {/* Streak skeleton */}
            <div className="glass-card p-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl shimmer" />
                    <div className="space-y-1.5 flex-1">
                        <div className="h-4 w-20 rounded-lg shimmer" />
                        <div className="h-3 w-40 rounded-lg shimmer" />
                    </div>
                </div>
            </div>

            {/* Quests skeleton */}
            <div className="glass-card p-5">
                <div className="h-3 w-28 rounded-lg shimmer mb-4" />
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 mb-3">
                        <div className="w-6 h-6 rounded-lg shimmer" />
                        <div className="flex-1 space-y-1.5">
                            <div className="h-4 w-3/4 rounded-lg shimmer" />
                            <div className="h-3 w-1/2 rounded-lg shimmer" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
