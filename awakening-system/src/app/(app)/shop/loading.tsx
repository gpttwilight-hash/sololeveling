export default function ShopLoading() {
    return (
        <div className="space-y-5 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="h-7 w-28 rounded-lg shimmer" />
                <div className="h-8 w-20 rounded-xl shimmer" />
            </div>

            {/* Reward cards */}
            {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl shimmer" />
                        <div className="flex-1 space-y-1.5">
                            <div className="h-4 w-1/2 rounded-lg shimmer" />
                            <div className="h-3 w-1/3 rounded-lg shimmer" />
                        </div>
                        <div className="h-9 w-20 rounded-xl shimmer" />
                    </div>
                </div>
            ))}
        </div>
    );
}
