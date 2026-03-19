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
import { selectDispatch } from "@/lib/game/dispatch-selector";
import { getPortalForDate } from "@/lib/game/portal-templates";
import { shouldShowMilestone } from "@/lib/game/milestone-templates";
import { DispatchCard } from "@/components/dashboard/dispatch-card";
import { PortalCard } from "@/components/dashboard/portal-card";
import { MilestoneOverlay } from "@/components/dashboard/milestone-overlay";

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
  // Show first incomplete quest as hero quest; if all done, show none
  const heroQuest = dailyQuests.find((q) => !q.is_completed) ?? null;

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

  // ── Daily Dispatch ──────────────────────────────────────────────────────
  const todayDate = new Date().toISOString().split("T")[0];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any;

  let dispatchData: Record<string, unknown> | null = null;
  const { data: existingDispatch } = await supabaseAny
    .from("daily_dispatch")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", todayDate)
    .single() as { data: Record<string, unknown> | null };

  if (existingDispatch) {
    dispatchData = existingDispatch;
  } else {
    const dispatchResult = selectDispatch(
      {
        rank: profile.rank,
        current_streak: profile.current_streak,
        str_xp: profile.str_xp,
        int_xp: profile.int_xp,
        cha_xp: profile.cha_xp,
        dis_xp: profile.dis_xp,
        wlt_xp: profile.wlt_xp,
      },
      new Date()
    );
    const midnight = new Date();
    midnight.setHours(23, 59, 59, 999);

    const { data: newDispatch } = await supabaseAny
      .from("daily_dispatch")
      .insert({
        user_id: user.id,
        date: todayDate,
        template_id: dispatchResult.id,
        narrative_text: dispatchResult.narrativeText,
        bonus_quest_title: dispatchResult.bonusQuestTitle,
        bonus_quest_xp: dispatchResult.bonusXP,
        bonus_quest_coins: dispatchResult.bonusCoins,
        attribute_focus: dispatchResult.resolvedAttribute,
        is_completed: false,
        expires_at: midnight.toISOString(),
      })
      .select()
      .single() as { data: Record<string, unknown> | null };

    dispatchData = newDispatch;
  }

  // ── Portal of the Day ────────────────────────────────────────────────────
  const portalTemplate = getPortalForDate(new Date());

  const { data: portalProgress } = await supabaseAny
    .from("user_portal_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", todayDate)
    .single() as { data: { steps_completed: number; is_finished: boolean; template_id: string } | null };

  // ── Milestone Check ───────────────────────────────────────────────────────
  const milestone = shouldShowMilestone(
    profile.current_streak,
    ((profile as unknown as Record<string, unknown>).last_milestone_shown as number | undefined) ?? 0
  );

  if (milestone) {
    await supabaseAny
      .from("profiles")
      .update({ last_milestone_shown: milestone.streakDay })
      .eq("id", user.id);
  }

  return (
    <div className="space-y-5">
      <HunterStatusBar profile={profile} streak={profile.current_streak} />
      {heroQuest && <HeroQuest quest={heroQuest} />}

      {/* Milestone — показывается при достижении */}
      {milestone && <MilestoneOverlay milestone={milestone} />}

      {/* Daily Dispatch */}
      {dispatchData && (
        <DispatchCard
          dispatch={dispatchData as unknown as Parameters<typeof DispatchCard>[0]["dispatch"]}
          date={todayDate}
        />
      )}

      {/* Portal of the Day */}
      <PortalCard
        portal={portalTemplate}
        progress={portalProgress ?? null}
        date={todayDate}
      />

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
