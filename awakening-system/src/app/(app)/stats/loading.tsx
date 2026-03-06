export default function StatsLoading() {
    return (
        <div className="space-y-5 animate-pulse">
            <div className="h-7 w-32 rounded-lg shimmer" />

            {/* Summary card */}
            <div className="glass-card p-5">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl shimmer" />
                    <div className="space-y-2 flex-1">
                        <div className="h-5 w-32 rounded-lg shimmer" />
                        <div className="h-3 w-48 rounded-lg shimmer" />
                    </div>
                </div>
            </div>

            {/* Radar chart */}
            <div className="glass-card p-5">
                <div className="h-3 w-36 rounded-lg shimmer mb-4" />
                <div className="w-48 h-48 mx-auto rounded-full shimmer" />
            </div>

            {/* HeatMap */}
            <div className="glass-card p-5">
                <div className="h-3 w-36 rounded-lg shimmer mb-4" />
                <div className="grid grid-cols-13 gap-1">
                    {Array.from({ length: 91 }).map((_, i) => (
                        <div key={i} className="aspect-square rounded shimmer" />
                    ))}
                </div>
            </div>

            {/* XP chart */}
            <div className="glass-card p-5">
                <div className="h-3 w-32 rounded-lg shimmer mb-4" />
                <div className="h-32 w-full rounded-xl shimmer" />
            </div>
        </div>
    );
}
