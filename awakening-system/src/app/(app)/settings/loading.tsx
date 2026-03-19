export default function SettingsLoading() {
    return (
        <div className="space-y-5 animate-pulse">
            <div className="h-7 w-32 rounded-lg shimmer" />

            {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-5">
                    <div className="h-3 w-20 rounded-lg shimmer mb-4" />
                    <div className="space-y-3">
                        <div className="h-4 w-1/2 rounded-lg shimmer" />
                        <div className="h-4 w-2/3 rounded-lg shimmer" />
                    </div>
                </div>
            ))}
        </div>
    );
}
