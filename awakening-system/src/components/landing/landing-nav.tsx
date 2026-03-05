"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { Sword } from "lucide-react";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();

  useEffect(() => {
    const unsubscribe = scrollY.on("change", (v) => setScrolled(v > 20));
    return unsubscribe;
  }, [scrollY]);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0A0A0F]/90 backdrop-blur-xl border-b border-white/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-[#6366F1]/20 border border-[#6366F1]/30 flex items-center justify-center group-hover:bg-[#6366F1]/30 transition-colors">
            <Sword className="w-4 h-4 text-[#6366F1]" />
          </div>
          <span className="font-semibold text-[#F0F0F5] text-sm tracking-wide">
            Система Пробуждения
          </span>
        </Link>

        {/* CTA buttons */}
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm text-[#8A8A9A] hover:text-[#F0F0F5] transition-colors px-4 py-2 hidden sm:block"
          >
            Войти
          </Link>
          <Link
            href="/signup"
            className="text-sm font-medium bg-[#6366F1] hover:bg-[#5558e6] text-white px-4 py-2 rounded-xl transition-all duration-150 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] active:scale-95"
          >
            Начать бесплатно
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
