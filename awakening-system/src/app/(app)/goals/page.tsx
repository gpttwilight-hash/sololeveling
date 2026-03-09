import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPremium } from "@/lib/game/subscriptions";
import { GoalForm } from "@/components/goals/goal-form";
import type { Profile } from "@/types/game";

export default async function GoalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const profile = profileData as unknown as Profile;

  if (!isPremium(profile)) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <p className="text-xs font-mono text-indigo-400 tracking-widest">HUNTER PRO</p>
        <h1 className="text-2xl font-bold text-white">AI Советник недоступен</h1>
        <p className="text-gray-400">
          AI Quest Advisor — эксклюзивная функция Hunter Pro.
          Обновись, чтобы получить персональный план развития.
        </p>
        <div className="pt-4">
          <p className="text-sm text-gray-500 font-mono">Монетизация будет добавлена в следующем обновлении.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <div>
        <p className="text-xs font-mono text-indigo-400 tracking-widest mb-1">AI СОВЕТНИК</p>
        <h1 className="text-2xl font-bold text-white">Генератор квестов</h1>
        <p className="text-sm text-gray-400 mt-1">
          Введи долгосрочную цель — AI создаст план квестов на 4 недели.
        </p>
      </div>
      <GoalForm />
    </div>
  );
}
