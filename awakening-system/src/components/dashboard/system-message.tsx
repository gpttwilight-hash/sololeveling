interface SystemMessageProps {
    streak: number;
    level: number;
    questsCompleted: number;
}

export function SystemMessage({ streak, level, questsCompleted }: SystemMessageProps) {
    const hour = new Date().getHours();

    function getMessage(): string {
        // Time-based greetings
        if (hour < 6) return "Система не спит. Ты тоже? Воины отдыхают перед битвой.";
        if (hour < 12) {
            if (streak >= 30) return `Утро, Охотник. ${streak} дней подряд. Система впечатлена.`;
            if (streak >= 7) return "Утро. Твоя дисциплина растёт. Не останавливайся.";
            return "Новый день — новые квесты. Система ждёт результатов.";
        }
        if (hour < 18) {
            if (questsCompleted >= 100) return `${questsCompleted} квестов завершено. Ты превосходишь 99% охотников.`;
            return "День в разгаре. Каждый выполненный квест — шаг к пробуждению.";
        }
        // Evening
        if (streak >= 14) return "Вечер. Система отмечает твою стабильность. Так держать.";
        return "Вечер. Время подвести итоги дня и подготовиться к завтрашним квестам.";
    }

    // Level-based special messages
    function getSpecial(): string | null {
        if (level >= 20) return "🔥 Ранг S в пределах досягаемости";
        if (level >= 10) return "⚡ Скрытый атрибут разблокирован";
        if (level >= 5) return "📈 Система повысила твой потенциал";
        return null;
    }

    const special = getSpecial();

    return (
        <div
            className="glass-card px-5 py-3.5"
            style={{ borderColor: "rgba(99,102,241,0.15)" }}
        >
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--color-xp)" }}>
                📡 Сообщение Системы
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {getMessage()}
            </p>
            {special && (
                <p className="text-[10px] mt-1.5 font-medium" style={{ color: "var(--color-level-up)" }}>
                    {special}
                </p>
            )}
        </div>
    );
}
