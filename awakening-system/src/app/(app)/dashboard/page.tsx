import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileCard } from "@/components/dashboard/profile-card";
import { DailyQuests } from "@/components/dashboard/daily-quests";
import { MiniRadar } from "@/components/dashboard/mini-radar";
import { StreakBadge } from "@/components/dashboard/streak-badge";
import { DaySummary } from "@/components/dashboard/day-summary";
import { EpicPreview } from "@/components/dashboard/epic-preview";
import { SystemMessage } from "@/components/dashboard/system-message";
import type { Profile, Quest } from "@/types/game";
import { HunterStatusBar } from "@/components/dashboard/hunter-status-bar";
import { HeroQuest } from "@/components/dashboard/hero-quest";
import { BossBattle } from "@/components/dashboard/boss-battle";
import { isPremium } from "@/lib/game/subscriptions";
import { getMondayOfCurrentWeek, getBossForWeek, getWeekNumber } from "@/lib/game/bosses";

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

  // Fetch or auto-spawn weekly boss for premium users
  let bossData = null;
  if (isPremium(profile)) {
    const weekStart = getMondayOfCurrentWeek();
    const { data: existingBoss } = await supabase
      .from("bosses")
      .select("*")
      .eq("user_id", user.id)
      .eq("week_start", weekStart)
      .single();

    if (existingBoss) {
      bossData = existingBoss;
    } else {
      const weekNum = getWeekNumber(new Date());
      const template = getBossForWeek(weekNum);
      const { data: newBoss } = await supabase
        .from("bosses")
        .insert({
          user_id: user.id,
          week_start: weekStart,
          title: template.title,
          description: template.description,
          total_quests: template.total_quests,
          bonus_xp: template.bonus_xp,
          badge_name: template.badge_name,
          completed_quests: 0,
          is_defeated: false,
        })
        .select()
        .single();
      bossData = newBoss;
    }
  }

  // Fetch ALL active quests (daily, weekly, epic)
  const { data: allQuestsData } = await supabase
    .from("quests")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("sort_order");

  const allQuests = (allQuestsData ?? []) as unknown as Quest[];
  const dailyQuests = allQuests.filter((q) => q.type === "daily");
  const weeklyQuests = allQuests.filter((q) => q.type === "weekly");
  const epicQuests = allQuests.filter((q) => q.type === "epic" && !q.is_completed);
  const heroQuest = dailyQuests.find((q) => !q.is_completed) ?? dailyQuests[0];

  // Today's XP from daily_progress
  const today = new Date().toISOString().split("T")[0];
  const { data: todayProgress } = await supabase
    .from("daily_progress")
    .select("xp_earned")
    .eq("user_id", user.id)
    .eq("date", today)
    .single();

  const totalXpToday = todayProgress?.xp_earned ?? 0;

  // Consistency % over last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const { data: recentProgress } = await supabase
    .from("daily_progress")
    .select("completion_rate, is_rest_day")
    .eq("user_id", user.id)
    .gte("date", sevenDaysAgo.toISOString().split("T")[0]);

  const activeDays = (recentProgress ?? []).filter((d) => !d.is_rest_day);
  const consistencyPct = activeDays.length > 0
    ? Math.round((activeDays.filter((d) => (d.completion_rate ?? 0) >= 0.8).length / activeDays.length) * 100)
    : undefined;

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
      <HunterStatusBar profile={profile} streak={profile.current_streak} />
      {heroQuest && <HeroQuest quest={heroQuest} />}
      {bossData && <BossBattle boss={bossData} />}
      <ProfileCard profile={profile} />

      {/* System Message */}
      <SystemMessage
        streak={profile.current_streak}
        level={profile.level}
        questsCompleted={profile.total_quests_completed}
      />

      {profile.active_debuffs && profile.active_debuffs.length > 0 && (
        <div
          className="glass-card px-5 py-4"
          style={{
            borderColor: 'var(--color-danger)',
            background: 'var(--bg-secondary)',
            boxShadow: '0 0 15px rgba(239, 68, 68, 0.1)'
          }}
        >
          <div className="flex items-start gap-3">
            <div className="text-xl mt-0.5">⚠️</div>
            <div>
              <p className="font-bold text-sm" style={{ color: 'var(--color-danger)' }}>Системное предупреждение</p>
              {profile.active_debuffs.map((d, i) => (
                <p key={i} className="text-xs mt-1 line-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  {d.type === "laziness"
                    ? `Обнаружена лень. Штраф к получаемому опыту: -${d.xp_penalty ?? 25}%. Выполняйте ежедневные квесты 3 дня подряд, чтобы снять дебафф.`
                    : "Обнаружено выгорание. Система настоятельно рекомендует взять день отдыха, чтобы восстановить силы."}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Day Summary */}
      <DaySummary
        dailyQuests={dailyQuests}
        weeklyQuests={weeklyQuests}
        totalXpToday={totalXpToday}
        streak={profile.current_streak}
      />

      <div className="glass-card px-5 py-4">
        <StreakBadge
          streak={profile.current_streak}
          coins={profile.coins}
          shields={profile.streak_shields}
          consistencyPct={consistencyPct}
        />
      </div>

      {/* Epic Preview */}
      <EpicPreview epics={epicQuests} />

      <div className="glass-card p-5">
        <DailyQuests quests={dailyQuests} date={dateStr} />
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
