"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sword } from "lucide-react";

// Ссылки ведут на основное приложение


export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "backdrop-blur-xl border-b" : ""
      }`}
      style={{
        background: scrolled ? "rgba(10,10,15,0.92)" : "transparent",
        borderColor: scrolled ? "rgba(255,255,255,0.05)" : "transparent",
      }}
    >
      <div
        style={{
          maxWidth: 1152,
          margin: "0 auto",
          padding: "0 24px",
          height: 64,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "rgba(99,102,241,0.15)",
              border: "1px solid rgba(99,102,241,0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Sword style={{ width: 16, height: 16, color: "#6366F1" }} />
          </div>
          <span style={{ fontWeight: 600, fontSize: 14, color: "#F0F0F5", letterSpacing: "0.02em" }}>
            Система Пробуждения
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a
            href={"/login"}
            style={{ fontSize: 14, color: "#8A8A9A", padding: "8px 16px", textDecoration: "none" }}
          >
            Войти
          </a>
          <a
            href={"/signup"}
            style={{
              fontSize: 14,
              fontWeight: 600,
              background: "#6366F1",
              color: "white",
              padding: "8px 16px",
              borderRadius: 12,
              textDecoration: "none",
              transition: "background 0.15s",
            }}
          >
            Начать бесплатно
          </a>
        </div>
      </div>
    </motion.nav>
  );
}
