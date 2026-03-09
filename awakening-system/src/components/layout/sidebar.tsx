"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Sword, BarChart2, Trophy, ShoppingBag, Settings, Sparkles,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard",    label: "Dashboard",    icon: Home },
  { href: "/quests",       label: "Квесты",       icon: Sword },
  { href: "/goals",        label: "AI Советник",  icon: Sparkles },
  { href: "/stats",        label: "Статистика",   icon: BarChart2 },
  { href: "/achievements", label: "Достижения",   icon: Trophy },
  { href: "/shop",         label: "Магазин",      icon: ShoppingBag },
  { href: "/settings",     label: "Настройки",    icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="hidden lg:flex flex-col w-56 min-h-screen fixed left-0 top-0 z-40 py-6"
      style={{
        background: "var(--bg-secondary)",
        borderRight: "1px solid var(--border-subtle)",
      }}
    >
      {/* Logo */}
      <div className="px-5 mb-8">
        <div className="flex items-center gap-2">
          <span className="text-xl">⚔️</span>
          <span className="font-bold text-sm tracking-wide" style={{ color: "var(--text-primary)" }}>
            Система
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group"
              style={{
                background: active ? "rgba(99,102,241,0.12)" : "transparent",
                color: active ? "var(--color-xp)" : "var(--text-secondary)",
                borderLeft: active ? "2px solid var(--color-xp)" : "2px solid transparent",
              }}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 mt-6">
        <p className="text-overline" style={{ color: "var(--text-tertiary)" }}>
          E-RANK HUNTER
        </p>
      </div>
    </aside>
  );
}
