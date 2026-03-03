import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FullRadarChart } from "@/components/stats/radar-chart";
import { AttributeBars } from "@/components/stats/attribute-bars";
import { HeatMap } from "@/components/stats/heat-map";
import { XPLineChart } from "@/components/stats/xp-line-chart";
import { Timeline } from "@/components/stats/timeline";
import { RankBadge } from "@/components/shared/rank-badge";
import { getXPProgress } from "@/lib/game/xp-calculator";
import type { Profile, DailyProgress, UserAchievement } from "@/types/game";

export default async function StatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();
  if (!profileData) redirect("/onboarding");
  const profile = profileData as unknown as Profile;

  // Last 90 days daily progress
  const since90 = new Date();
  since90.setDate(since90.getDate() - 90);
  const { data: dpData } = await supabase
    .from("daily_progress")
    .select("*")
    .eq("user_id", user.id)
    .gte("date", since90.toISOString().split("T")[0])
    .order("date");
  const dailyProgress = (dpData ?? []) as unknown as DailyProgress[];

  // XP per day (last 30 days)
  const since30 = new Date();
  since30.setDate(since30.getDate() - 30);
  const xpChartData = dailyProgress
    .filter((d) => d.date >= since30.toISOString().split("T")[0])
    .map((d) => ({
      date: new Date(d.date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" }),
      xp: d.xp_earned,
    }));

  // Achievements timeline
  const { data: achievData } = await supabase
    .from("user_achievements")
    .select("*, achievement:achievements(*)")
    .eq("user_id", user.id)
    .order("unlocked_at");
  const achievements = (achievData ?? []) as unknown as UserAchievement[];

  const timelineEvents = achievements.map((ua) => ({
    date: ua.unlocked_at,
    title: ua.achievement?.title ?? "Достижение",
    icon: ua.achievement?.icon ?? "🏆",
  }));

  const attrs = {
    str: profile.str_xp,
    int: profile.int_xp,
    cha: profile.cha_xp,
    dis: profile.dis_xp,
    wlt: profile.wlt_xp,
  };

  const progress = getXPProgress(profile.total_xp);

  return (
    <div className="space-y-5">
      <h1 className="text-h1" style={{ color: "var(--text-primary)" }}>Статистика</h1>

      {/* Summary card */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-4">
          <div className="text-4xl">
            {profile.avatar_id === "default" ? "⚔️" : profile.avatar_id}
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
              {profile.hunter_name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm tabular-nums" style={{ color: "var(--color-xp)" }}>
                Уровень {progress.level}
              </span>
              <RankBadge rank={profile.rank} size="sm" />
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
              {profile.total_quests_completed} квестов · {profile.current_streak} дней streak
            </p>
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="glass-card p-5">
        <p className="text-overline mb-3">Профиль атрибутов</p>
        <FullRadarChart {...attrs} />
      </div>

      {/* Attribute Bars */}
      <div className="glass-card p-5">
        <p className="text-overline mb-4">Атрибуты</p>
        <AttributeBars {...attrs} />
      </div>

      {/* Heat Map */}
      <div className="glass-card p-5">
        <p className="text-overline mb-3">Активность (90 дней)</p>
        <HeatMap data={dailyProgress} />
      </div>

      {/* XP Chart */}
      <div className="glass-card p-5">
        <p className="text-overline mb-3">XP за 30 дней</p>
        {xpChartData.length > 0
          ? <XPLineChart data={xpChartData} />
          : <p className="text-xs text-center py-6" style={{ color: "var(--text-tertiary)" }}>
              Данных пока нет
            </p>
        }
      </div>

      {/* Timeline */}
      <div className="glass-card p-5">
        <p className="text-overline mb-4">История достижений</p>
        <Timeline events={timelineEvents} />
      </div>
    </div>
  );
}
