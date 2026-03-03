import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";
import type { Profile } from "@/types/game";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const profile = data as unknown as Profile;

  return (
    <div className="space-y-5">
      <h1 className="text-h1" style={{ color: "var(--text-primary)" }}>Настройки</h1>

      {/* Profile section */}
      <section className="glass-card p-5">
        <p className="text-overline mb-4">Профиль</p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Имя охотника
            </label>
            <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
              {profile.hunter_name}
            </p>
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Email
            </label>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {user.email}
            </p>
          </div>
        </div>
      </section>

      {/* Stats section */}
      <section className="glass-card p-5">
        <p className="text-overline mb-4">Прогресс</p>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Уровень", value: profile.level },
            { label: "Ранг", value: `${profile.rank}-ранг` },
            { label: "Streak", value: `${profile.current_streak} дней` },
            { label: "Квестов", value: profile.total_quests_completed },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{label}</p>
              <p className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* App section */}
      <section className="glass-card p-5">
        <p className="text-overline mb-4">Приложение</p>
        <div className="space-y-3">
          <div
            className="flex items-center justify-between py-2"
            style={{ borderBottom: "1px solid var(--border-subtle)" }}
          >
            <span className="text-sm" style={{ color: "var(--text-primary)" }}>Тема</span>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Тёмная</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm" style={{ color: "var(--text-primary)" }}>Версия</span>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>1.0.0-mvp</span>
          </div>
        </div>
      </section>

      {/* Account section */}
      <section className="glass-card p-5">
        <p className="text-overline mb-4">Аккаунт</p>
        <form action={logout}>
          <button
            type="submit"
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "var(--color-danger)",
            }}
          >
            Выйти из аккаунта
          </button>
        </form>
      </section>
    </div>
  );
}
