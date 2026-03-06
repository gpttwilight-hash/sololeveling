export default function QuestsLoading() {
    return (
        <div className="space-y-5 animate-pulse">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="h-7 w-28 rounded-lg shimmer" />
                <div className="h-9 w-36 rounded-xl shimmer" />
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--bg-secondary)" }}>
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex-1 h-8 rounded-lg shimmer" />
                ))}
            </div>

            {/* Quest cards */}
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg shimmer" />
                        <div className="flex-1 space-y-1.5">
                            <div className="h-4 w-3/4 rounded-lg shimmer" />
                            <div className="h-3 w-1/2 rounded-lg shimmer" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
