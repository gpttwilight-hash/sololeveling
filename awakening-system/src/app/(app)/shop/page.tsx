import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RewardCard } from "@/components/shop/reward-card";
import type { Reward } from "@/types/game";

export default async function ShopPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profileData }, { data: rewardsData }] = await Promise.all([
    supabase.from("profiles").select("coins").eq("id", user.id).single(),
    supabase
      .from("rewards")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  const coins = profileData?.coins ?? 0;
  const rewards = (rewardsData ?? []) as unknown as Reward[];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-h1" style={{ color: "var(--text-primary)" }}>Магазин</h1>
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl"
          style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)" }}
        >
          <span>💰</span>
          <span
            className="text-sm font-bold tabular-nums"
            style={{ color: "var(--color-level-up)" }}
          >
            {coins.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Rewards grid */}
      <div className="space-y-3">
        {rewards.map((reward) => (
          <RewardCard key={reward.id} reward={reward} userCoins={coins} />
        ))}

        {rewards.length === 0 && (
          <div
            className="text-center py-12 rounded-2xl"
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            <p className="text-3xl mb-3">🛒</p>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Нет доступных наград
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
              Награды появятся после завершения онбординга
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
