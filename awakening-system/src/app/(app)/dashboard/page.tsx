import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProfileCard } from "@/components/dashboard/profile-card";
import { DailyQuests } from "@/components/dashboard/daily-quests";
import { MiniRadar } from "@/components/dashboard/mini-radar";
import { StreakBadge } from "@/components/dashboard/streak-badge";
import { DaySummary } from "@/components/dashboard/day-summary";
import { EpicPreview } from "@/components/dashboard/epic-preview";
import { SystemMessage } from "@/components/dashboard/system-message";
import { SectionHintCard } from "@/components/shared/section-hint-card";
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
import { InitiationWidget } from "@/components/dashboard/initiation-widget";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>;

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

  const today = new Date().toISOString().split("T")[0];
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgo.toISOString().split("T")[0];
  const weekStart = getMondayOfCurrentWeek();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any;

  // ── Reset recurring daily quests that were completed before today ─────────
  // Runs on every dashboard load — no cron dependency needed.
  await supabase
    .from("quests")
    .update({ is_completed: false, last_reset_date: today })
    .eq("user_id", user.id)
    .eq("type", "daily")
    .eq("is_recurring", true)
    .eq("is_completed", true)
    .or(`last_reset_date.is.null,last_reset_date.lt.${today}`);

  // ── Parallel data fetching ────────────────────────────────────────────────
  const [
    bossResult,
    allQuestsResult,
    todayProgressResult,
    recentProgressResult,
    existingDispatchResult,
    portalProgressResult,
  ] = await Promise.all([
    isPremium(profile)
      ? supabase.from("bosses").select("*").eq("user_id", user.id).eq("week_start", weekStart).single()
      : Promise.resolve({ data: null, error: null }),
    supabase.from("quests").select("*").eq("user_id", user.id).eq("is_active", true).order("sort_order"),
    supabase.from("daily_progress").select("xp_earned").eq("user_id", user.id).eq("date", today).single(),
    supabase.from("daily_progress").select("completion_rate, is_rest_day").eq("user_id", user.id).gte("date", sevenDaysAgoStr),
    supabaseAny.from("daily_dispatch").select("*").eq("user_id", user.id).eq("date", today).single() as Promise<{ data: AnyRecord | null }>,
    supabaseAny.from("user_portal_progress").select("*").eq("user_id", user.id).eq("date", today).single() as Promise<{ data: { steps_completed: number; is_finished: boolean; template_id: string } | null }>,
  ]);

  // ── Boss: spawn if missing for premium users ──────────────────────────────
  let bossData = bossResult.data;
  if (isPremium(profile) && !bossData) {
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

  // ── Quests ────────────────────────────────────────────────────────────────
  const allQuests = (allQuestsResult.data ?? []) as unknown as Quest[];
  const tutorialQuests = allQuests.filter((q) => q.type === "tutorial");
  const dailyQuests = allQuests.filter((q) => q.type === "daily");
  const weeklyQuests = allQuests.filter((q) => q.type === "weekly");
  const epicQuests = allQuests.filter((q) => q.type === "epic" && !q.is_completed);
  const heroQuest = dailyQuests.find((q) => !q.is_completed) ?? null;

  // ── Progress stats ────────────────────────────────────────────────────────
  const totalXpToday = todayProgressResult.data?.xp_earned ?? 0;

  const activeDays = (recentProgressResult.data ?? []).filter((d) => !d.is_rest_day);
  const consistencyPct = activeDays.length > 0
    ? Math.round((activeDays.filter((d) => (d.completion_rate ?? 0) >= 0.8).length / activeDays.length) * 100)
    : undefined;

  // ── Daily Dispatch ────────────────────────────────────────────────────────
  let dispatchData: AnyRecord | null = existingDispatchResult.data;
  if (!dispatchData) {
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
        date: today,
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
      .single() as { data: AnyRecord | null };

    dispatchData = newDispatch;
  }

  // ── Portal of the Day ────────────────────────────────────────────────────
  const portalTemplate = getPortalForDate(new Date());
  const portalProgress = portalProgressResult.data;

  // ── Milestone Check ───────────────────────────────────────────────────────
  const milestone = shouldShowMilestone(
    profile.current_streak,
    ((profile as unknown as AnyRecord).last_milestone_shown as number | undefined) ?? 0
  );

  if (milestone) {
    await supabaseAny
      .from("profiles")
      .update({ last_milestone_shown: milestone.streakDay })
      .eq("id", user.id);
  }

  // ── Render ────────────────────────────────────────────────────────────────
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
      <SectionHintCard
        hintKey="dashboard"
        title="⚡ Добро пожаловать, Охотник"
        bullets={[
          "Здесь твой штаб: ежедневные квесты, стрик, прогресс атрибутов",
          "DispatchCard и PortalCard обновляются каждый день — не пропускай",
          "Начни с вкладки Инициация в разделе Квесты",
        ]}
      />

      <HunterStatusBar profile={profile} streak={profile.current_streak} />
      {heroQuest && <HeroQuest quest={heroQuest} />}

      {/* Milestone — показывается при достижении */}
      {milestone && <MilestoneOverlay milestone={milestone} />}

      {/* Daily Dispatch */}
      {dispatchData && (
        <DispatchCard
          dispatch={dispatchData as unknown as Parameters<typeof DispatchCard>[0]["dispatch"]}
          date={today}
        />
      )}

      {/* Portal of the Day */}
      <PortalCard
        portal={portalTemplate}
        progress={portalProgress ?? null}
        date={today}
      />

      {bossData && <BossBattle boss={bossData} />}
      <ProfileCard profile={profile} />
      <InitiationWidget tutorialQuests={tutorialQuests} />

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
