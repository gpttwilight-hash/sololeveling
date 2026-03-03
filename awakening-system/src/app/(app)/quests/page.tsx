import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { QuestCard } from "@/components/quests/quest-card";
import { EpicQuestCard } from "@/components/quests/epic-quest-card";
import { QuestForm } from "@/components/quests/quest-form";
import type { Quest } from "@/types/game";

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function QuestsPage({ searchParams }: Props) {
  const { tab = "daily" } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("quests")
    .select("*, subquests(*)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("sort_order");

  const allQuests = (data ?? []) as unknown as Quest[];
  const filtered = allQuests.filter((q) => q.type === tab);

  const TABS = [
    { key: "daily",   label: "Ежедневные" },
    { key: "weekly",  label: "Еженедельные" },
    { key: "epic",    label: "Эпические" },
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
      <div className="space-y-3 mb-4">
        {filtered.map((quest, i) =>
          quest.type === "epic"
            ? <EpicQuestCard key={quest.id} quest={quest} index={i} />
            : <QuestCard key={quest.id} quest={quest} index={i} />
        )}

        {filtered.length === 0 && (
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
      <QuestForm />
    </div>
  );
}
