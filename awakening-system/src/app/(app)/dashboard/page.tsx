import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileCard } from "@/components/dashboard/profile-card";
import { DailyQuests } from "@/components/dashboard/daily-quests";
import { MiniRadar } from "@/components/dashboard/mini-radar";
import { StreakBadge } from "@/components/dashboard/streak-badge";
import type { Profile, Quest } from "@/types/game";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profileData) redirect("/onboarding");
  const profile = profileData as unknown as Profile;

  const { data: questsData } = await supabase
    .from("quests")
    .select("*")
    .eq("user_id", user.id)
    .eq("type", "daily")
    .eq("is_active", true)
    .order("sort_order");

  const quests = (questsData ?? []) as unknown as Quest[];

  const dateStr = new Date().toLocaleDateString("ru-RU", {
    weekday: "short",
    day: "numeric",
    month: "long",
  });

  const attrs = {
    str: profile.str_xp,
    int: profile.int_xp,
    cha: profile.cha_xp,
    dis: profile.dis_xp,
    wlt: profile.wlt_xp,
  };

  const ATTR_COLORS: Record<string, string> = {
    str: "var(--color-strength)",
    int: "var(--color-intellect)",
    cha: "var(--color-charisma)",
    dis: "var(--color-discipline)",
    wlt: "var(--color-wealth)",
  };

  return (
    <div className="space-y-5">
      <ProfileCard profile={profile} />

      <div className="glass-card px-5 py-4">
        <StreakBadge streak={profile.current_streak} coins={profile.coins} />
      </div>

      <div className="glass-card p-5">
        <DailyQuests quests={quests} date={dateStr} />
      </div>

      <div className="glass-card p-5">
        <p className="text-overline mb-3">Атрибуты</p>
        <MiniRadar {...attrs} />
        <div className="grid grid-cols-5 gap-1 mt-3">
          {Object.entries(attrs).map(([key, val]) => (
            <div key={key} className="text-center">
              <p className="text-[10px] font-semibold uppercase" style={{ color: ATTR_COLORS[key] }}>
                {key}
              </p>
              <p className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {val}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
