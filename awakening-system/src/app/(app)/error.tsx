"use client";

export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="text-5xl mb-4">💀</div>
            <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                Критическая ошибка Системы
            </h2>
            <p className="text-sm mb-6 max-w-sm" style={{ color: "var(--text-secondary)" }}>
                {error.message || "Произошла непредвиденная ошибка. Система пытается восстановиться..."}
            </p>
            <button
                onClick={reset}
                className="px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:brightness-110"
                style={{
                    background: "linear-gradient(135deg, var(--color-xp), #4F46E5)",
                    color: "#fff",
                }}
            >
                Перезапустить ⚡
            </button>
        </div>
    );
}
