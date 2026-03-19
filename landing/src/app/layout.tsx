import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Система Пробуждения — Геймификация жизни",
  description:
    "Превращай привычки в XP, прокачивай атрибуты, повышай ранг. Habit tracker вдохновлённый Solo Leveling.",
  openGraph: {
    title: "Система Пробуждения",
    description: "Ты получил Систему. Habit tracker нового поколения.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
