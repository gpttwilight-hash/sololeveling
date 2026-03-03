"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Sword, BarChart2, MoreHorizontal } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Главная", icon: Home },
  { href: "/quests",    label: "Квесты",  icon: Sword },
  { href: "/stats",     label: "Статы",   icon: BarChart2 },
  { href: "/settings",  label: "Ещё",     icon: MoreHorizontal },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border-subtle)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-1 py-3 px-5 min-w-[64px] min-h-[56px] transition-all"
              style={{ color: active ? "var(--color-xp)" : "var(--text-tertiary)" }}
            >
              <Icon
                className="w-5 h-5 transition-transform"
                style={{ transform: active ? "scale(1.1)" : "scale(1)" }}
              />
              <span className="text-[10px] font-medium">{label}</span>
              {active && (
                <span
                  className="absolute bottom-0 w-1 h-1 rounded-full"
                  style={{ background: "var(--color-xp)" }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
