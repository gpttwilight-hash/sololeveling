"use client";

import { Sword } from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export function LandingFooter() {
  const links = [
    { label: "Войти", href: `${APP_URL}/login` },
    { label: "Регистрация", href: `${APP_URL}/signup` },
    { label: "Функции", href: "#features" },
  ];

  return (
    <footer
      className="px-6 py-12"
      style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#6366F1]/20 border border-[#6366F1]/30 flex items-center justify-center">
              <Sword className="w-3.5 h-3.5 text-[#6366F1]" />
            </div>
            <span className="font-semibold text-sm" style={{ color: "#F0F0F5" }}>
              Система Пробуждения
            </span>
          </div>

          <nav className="flex items-center gap-6">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm transition-colors hover:text-[#F0F0F5]"
                style={{ color: "#55556A", textDecoration: "none" }}
              >
                {link.label}
              </a>
            ))}
          </nav>

          <p className="text-xs" style={{ color: "#55556A" }}>
            Вдохновлено вселенной Solo Leveling. 2026.
          </p>
        </div>
      </div>
    </footer>
  );
}
