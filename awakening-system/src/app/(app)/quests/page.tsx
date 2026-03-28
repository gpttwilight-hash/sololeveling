import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EpicQuestCard } from "@/components/quests/epic-quest-card";
import { QuestForm } from "@/components/quests/quest-form";
import { SortableQuestList } from "@/components/quests/sortable-quest-list";
import { InitiationTab } from "@/components/quests/initiation-tab";
import { SectionHintCard } from "@/components/shared/section-hint-card";
import { getWeekStart, shouldResetQuest, computeWeeklyStreak } from "@/lib/game/habit-week";
import type { Quest, HabitWeek } from "@/types/game";

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function QuestsPage({ searchParams }: Props) {
  const { tab: rawTab } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Reset recurring daily quests with habit_weeks logic
  const today = new Date().toISOString().split("T")[0];
  const weekStart = getWeekStart();

  // Fetch all recurring daily quests for reset + habit_weeks logic
  const { data: recurringQuests } = await supabase
    .from("quests")
    .select("id, frequency_per_week, is_completed, last_reset_date, streak")
    .eq("user_id", user.id)
    .eq("type", "daily")
    .eq("is_recurring", true);

  // Fetch existing habit_weeks for this week
  const { data: existingHWs } = await supabase
    .from("habit_weeks")
    .select("*")
    .eq("user_id", user.id)
    .eq("week_start", weekStart);

  const hwByQuestId = new Map(
    (existingHWs ?? []).map((hw) => [hw.quest_id, hw])
  );

  // Process each recurring quest
  for (const rq of recurringQuests ?? []) {
    const freq = rq.frequency_per_week ?? 7;
    let hw = hwByQuestId.get(rq.id);

    // Lazy-create habit_weeks row if missing for this week
    if (!hw) {
      // Check previous week for streak calculation
      const prevWeekStart = getWeekStart(
        new Date(new Date(weekStart).getTime() - 7 * 24 * 60 * 60 * 1000)
      );
      const { data: prevHW } = await supabase
        .from("habit_weeks")
        .select("is_success")
        .eq("quest_id", rq.id)
        .eq("week_start", prevWeekStart)
        .maybeSingle();

      // Update streak based on previous week result
      const newStreak = computeWeeklyStreak(
        rq.streak ?? 0,
        freq,
        prevHW?.is_success ?? null
      );
      if (newStreak !== (rq.streak ?? 0)) {
        await supabase
          .from("quests")
          .update({ streak: newStreak })
          .eq("id", rq.id);
      }

      // Create this week's record (ignore if already exists from concurrent request)
      await supabase
        .from("habit_weeks")
        .upsert(
          {
            quest_id: rq.id,
            user_id: user.id,
            week_start: weekStart,
            target: freq,
          },
          { onConflict: "quest_id,week_start", ignoreDuplicates: true }
        );

      // Fetch the actual row (may have been created by concurrent request)
      const { data: hwRow } = await supabase
        .from("habit_weeks")
        .select("*")
        .eq("quest_id", rq.id)
        .eq("week_start", weekStart)
        .single();

      hw = hwRow ?? undefined;
    }

    // Reset quest if needed
    const weeklyCompletions = hw?.completions ?? 0;
    if (
      rq.is_completed &&
      shouldResetQuest(rq.last_reset_date, today, freq, weeklyCompletions)
    ) {
      await supabase
        .from("quests")
        .update({ is_completed: false, last_reset_date: today })
        .eq("id", rq.id);
    }
  }

  const { data } = await supabase
    .from("quests")
    .select("*, subquests(*)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("sort_order");

  const allQuests = (data ?? []) as unknown as Quest[];

  // Fetch habit_weeks for current week to pass to quest cards
  const { data: habitWeeksData } = await supabase
    .from("habit_weeks")
    .select("*")
    .eq("user_id", user.id)
    .eq("week_start", getWeekStart());

  const habitWeeksMap = new Map<string, HabitWeek>(
    (habitWeeksData ?? []).map((hw) => [hw.quest_id, hw as unknown as HabitWeek])
  );

  const tutorialQuests = allQuests.filter((q) => q.type === "tutorial");
  const hasTutorial = tutorialQuests.some((q) => !q.is_completed);
  const tab = rawTab ?? (hasTutorial ? "tutorial" : "daily");

  // Attach linked tasks to their parent Epics
  allQuests.forEach(quest => {
    if (quest.parent_id) {
      const parent = allQuests.find(q => q.id === quest.parent_id);
      if (parent) {
        if (!parent.linked_tasks) parent.linked_tasks = [];
        parent.linked_tasks.push(quest);
      }
    }
  });

  const filtered = allQuests.filter((q) => q.type === tab);
  const activeEpics = allQuests.filter((q) => q.type === "epic" && q.is_active);

  const TABS = [
    ...(hasTutorial ? [{ key: "tutorial", label: "⚡ Инициация" }] : []),
    { key: "daily", label: "Ежедневные" },
    { key: "weekly", label: "Еженедельные" },
    { key: "epic", label: "Эпические" },
  ];

  return (
    <div>
      <h1 className="text-h1 mb-5" style={{ color: "var(--text-primary)" }}>
        Квесты
      </h1>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-5"
        style={{ background: "var(--bg-secondary)" }}
      >
        {TABS.map(({ key, label }) => (
          <a
            key={key}
            href={`/quests?tab=${key}`}
            className="flex-1 text-center py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: tab === key ? "var(--bg-tertiary)" : "transparent",
              color: tab === key ? "var(--text-primary)" : "var(--text-tertiary)",
            }}
          >
            {label}
          </a>
        ))}
      </div>

      {/* Quest list */}
      <div className="mb-4">
        {tab === "tutorial" ? (
          <InitiationTab quests={tutorialQuests} />
        ) : tab === "epic" ? (
          <div>
            <SectionHintCard
              hintKey="epic"
              title="⚔️ Epic Quests — долгосрочные цели"
              bullets={[
                "Большие задачи которые разбиваются на подзадачи",
                "Прогресс виден на дашборде",
                "Дают синергию-очки за каждый выполненный подквест",
              ]}
            />
            <div className="space-y-3">
              {filtered.map((quest, i) => (
                <EpicQuestCard key={quest.id} quest={quest} index={i} />
              ))}
            </div>
          </div>
        ) : (
          <SortableQuestList
            key={tab}
            initialQuests={filtered}
            habitWeeks={Object.fromEntries(habitWeeksMap)}
          />
        )}

        {tab !== "tutorial" && filtered.length === 0 && (
          <div
            className="text-center py-12 rounded-2xl"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            <p className="text-3xl mb-3">⚔️</p>
            <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
              Нет квестов в этой категории
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
              Добавь первый квест ниже
            </p>
          </div>
        )}
      </div>

      {/* Add quest form */}
      {tab !== "tutorial" && (
        <QuestForm key={tab} initialType={tab as "daily" | "weekly" | "epic"} activeEpics={activeEpics} />
      )}
    </div>
  );
}
