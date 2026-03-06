"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

type Theme = "dark" | "light" | "system";

export function ThemeToggle() {
    const [theme, setTheme] = useState<Theme>("dark");

    function applyTheme(t: Theme) {
        const html = document.documentElement;
        if (t === "system") {
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            html.setAttribute("data-theme", prefersDark ? "dark" : "light");
            html.style.colorScheme = prefersDark ? "dark" : "light";
        } else {
            html.setAttribute("data-theme", t);
            html.style.colorScheme = t;
        }
    }

    useEffect(() => {
        const stored = localStorage.getItem("theme") as Theme | null;
        if (stored) {
            setTheme(stored);
            applyTheme(stored);
        }
    }, []);

    function handleChange(t: Theme) {
        setTheme(t);
        localStorage.setItem("theme", t);
        applyTheme(t);
    }

    const options: { key: Theme; icon: typeof Sun; label: string }[] = [
        { key: "dark", icon: Moon, label: "Тёмная" },
        { key: "light", icon: Sun, label: "Светлая" },
        { key: "system", icon: Monitor, label: "Авто" },
    ];

    return (
        <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--bg-tertiary)" }}>
            {options.map(({ key, icon: Icon, label }) => (
                <button
                    key={key}
                    onClick={() => handleChange(key)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                        background: theme === key ? "var(--bg-secondary)" : "transparent",
                        color: theme === key ? "var(--text-primary)" : "var(--text-tertiary)",
                        boxShadow: theme === key ? "var(--shadow-card)" : "none",
                    }}
                >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                </button>
            ))}
        </div>
    );
}
