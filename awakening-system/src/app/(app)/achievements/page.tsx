import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AchievementCard } from "@/components/achievements/achievement-card";

interface Props {
  searchParams: Promise<{ cat?: string }>;
}

const CATEGORIES = [
  { key: "all",     label: "Все" },
  { key: "habits",  label: "Привычки" },
  { key: "ranks",   label: "Ранги" },
  { key: "special", label: "Особые" },
];

export default async function AchievementsPage({ searchParams }: Props) {
  const { cat = "all" } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: allAchievements } = await supabase.from("achievements").select("*");
  const { data: userAch } = await supabase
    .from("user_achievements")
    .select("achievement_id, unlocked_at")
    .eq("user_id", user.id);

  const unlockedMap = new Map(
    (userAch ?? []).map((ua) => [ua.achievement_id, ua.unlocked_at])
  );

  const filtered = (allAchievements ?? []).filter(
    (a) => cat === "all" || a.category === cat
  );

  const unlockedCount = unlockedMap.size;
  const totalCount = (allAchievements ?? []).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-h1" style={{ color: "var(--text-primary)" }}>Достижения</h1>
        <span
          className="text-xs font-semibold px-3 py-1 rounded-full tabular-nums"
          style={{
            background: "rgba(99,102,241,0.12)",
            color: "var(--color-xp)",
            border: "1px solid rgba(99,102,241,0.3)",
          }}
        >
          {unlockedCount}/{totalCount}
        </span>
      </div>

      {/* Category filter */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-5 overflow-x-auto"
        style={{ background: "var(--bg-secondary)" }}
      >
        {CATEGORIES.map(({ key, label }) => (
          <a
            key={key}
            href={`/achievements?cat=${key}`}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: cat === key ? "var(--bg-tertiary)" : "transparent",
              color: cat === key ? "var(--text-primary)" : "var(--text-tertiary)",
            }}
          >
            {label}
          </a>
        ))}
      </div>

      {/* Grid */}
      <div className="space-y-3">
        {filtered.map((achievement) => {
          const unlockedAt = unlockedMap.get(achievement.id);
          return (
            <AchievementCard
              key={achievement.id}
              id={achievement.id}
              title={achievement.title}
              description={achievement.description}
              icon={achievement.icon}
              category={achievement.category}
              isUnlocked={!!unlockedAt}
              isHidden={achievement.category === "hidden"}
              unlockedAt={unlockedAt}
            />
          );
        })}
      </div>
    </div>
  );
}
