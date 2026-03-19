import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WaitlistForm } from "@/components/landing/waitlist-form";

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <span className="font-mono font-bold text-indigo-400 tracking-widest text-sm">
          СИСТЕМА ПРОБУЖДЕНИЯ
        </span>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Войти
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition-colors"
          >
            Начать бесплатно
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-6 pt-24 pb-20 space-y-8">
        <div className="space-y-1">
          <p className="text-xs font-mono text-indigo-400 tracking-[0.3em] uppercase">
            Life Gamification System
          </p>
        </div>
        <h1 className="text-4xl sm:text-6xl font-black leading-tight max-w-3xl">
          Превратите каждый день{" "}
          <span className="text-indigo-400">в миссию.</span>
        </h1>
        <p className="text-lg text-gray-400 max-w-xl leading-relaxed">
          Система Пробуждения — RPG-трекер для тех, кто строит жизнь, а не просто живёт.
          Прокачивай атрибуты, выполняй квесты, повышай ранг.
        </p>
        <WaitlistForm />
        <p className="text-xs text-gray-600">Бесплатно. Без спама. Уведомим при запуске.</p>
      </section>

      {/* Features */}
      <section className="px-6 py-20 max-w-5xl mx-auto">
        <h2 className="text-center text-2xl font-bold mb-12 text-gray-200">
          Всё что нужно для прокачки жизни
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {[
            {
              icon: "⚡",
              title: "AI Советник",
              desc: "Введи цель — получи готовый план квестов на 4 недели. Персональный коуч, работающий 24/7.",
            },
            {
              icon: "⚔️",
              title: "Босс Недели",
              desc: "Каждую неделю новый вызов. Победи босса — получи уникальный значок и бонусный XP.",
            },
            {
              icon: "📊",
              title: "Система Рангов",
              desc: "От Ранга E до Ранга S. Каждый уровень меняет облик персонажа и открывает новые возможности.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-white/5 bg-white/[0.03] p-6 space-y-3 hover:border-indigo-500/30 transition-colors"
            >
              <span className="text-3xl">{f.icon}</span>
              <h3 className="font-bold text-white">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-20 max-w-3xl mx-auto">
        <h2 className="text-center text-2xl font-bold mb-12 text-gray-200">Простые цены</h2>
        <div className="grid sm:grid-cols-2 gap-6">
          {/* Free */}
          <div className="rounded-xl border border-white/10 p-6 space-y-4">
            <div>
              <p className="text-xs font-mono text-gray-500 tracking-widest">ОХОТНИК</p>
              <p className="text-3xl font-black mt-1">$0</p>
              <p className="text-sm text-gray-500">навсегда</p>
            </div>
            <ul className="space-y-2 text-sm text-gray-400">
              {[
                "До 5 квестов в день",
                "Базовые атрибуты и ранги",
                "Стрики и достижения",
                "Магазин наград",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-emerald-500">✓</span> {item}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block text-center py-2.5 rounded-lg border border-white/10 text-sm font-semibold hover:border-white/20 transition-colors"
            >
              Начать бесплатно
            </Link>
          </div>

          {/* Pro */}
          <div className="rounded-xl border border-indigo-500/40 bg-indigo-500/5 p-6 space-y-4 relative">
            <div className="absolute top-4 right-4">
              <span className="text-xs font-mono bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-full border border-indigo-500/30">
                ПОПУЛЯРНО
              </span>
            </div>
            <div>
              <p className="text-xs font-mono text-indigo-400 tracking-widest">МОНАРХ</p>
              <p className="text-3xl font-black mt-1">$7.99</p>
              <p className="text-sm text-gray-500">в месяц или $59/год</p>
            </div>
            <ul className="space-y-2 text-sm text-gray-400">
              {[
                "Всё из бесплатного",
                "AI Советник (генерация квестов)",
                "Босс Недели",
                "Безлимитные квесты",
                "Monthly AI-отчёт",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-indigo-400">✓</span> {item}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="block text-center py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition-colors text-white"
            >
              Стать Монархом →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8 text-center text-xs text-gray-600 font-mono">
        <p>© 2026 Система Пробуждения · Построено для Охотников</p>
      </footer>
    </div>
  );
}
