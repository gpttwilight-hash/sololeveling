import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logout } from "@/app/(auth)/actions";
import { Trophy, ShoppingBag } from "lucide-react";
import type { Profile } from "@/types/game";
import { ProfileEditor } from "@/components/settings/profile-editor";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { PushNotificationToggle } from "@/components/settings/push-notification-toggle";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const profile = data as unknown as Profile;

  return (
    <div className="space-y-5">
      <h1 className="text-h1" style={{ color: "var(--text-primary)" }}>Ещё</h1>

      {/* Quick navigation cards */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/achievements"
          className="glass-card p-4 flex flex-col items-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)" }}
          >
            <Trophy className="w-5 h-5" style={{ color: "var(--color-xp)" }} />
          </div>
          <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>Достижения</span>
        </Link>
        <Link
          href="/shop"
          className="glass-card p-4 flex flex-col items-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(251,191,36,0.12)", border: "1px solid rgba(251,191,36,0.3)" }}
          >
            <ShoppingBag className="w-5 h-5" style={{ color: "var(--color-level-up)" }} />
          </div>
          <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>Магазин</span>
        </Link>
      </div>

      {/* Profile section — editable */}
      <section className="glass-card p-5">
        <p className="text-overline mb-4">Профиль</p>
        <ProfileEditor
          hunterName={profile.hunter_name}
          avatarId={profile.avatar_id}
          email={user.email ?? ""}
        />
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: "var(--text-primary)" }}>Тема</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm" style={{ color: "var(--text-primary)" }}>Версия</span>
            <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>1.1.0</span>
          </div>
        </div>
      </section>

      {/* Notifications section */}
      <section className="glass-card p-5">
        <p className="text-overline mb-4">Уведомления</p>
        <PushNotificationToggle />
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

