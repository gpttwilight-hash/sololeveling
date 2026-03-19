"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updatePassword } from "../actions";

const inputStyle = {
  background: "var(--bg-tertiary)",
  border: "1px solid var(--border-subtle)",
  color: "var(--text-primary)",
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Supabase puts the recovery token in the URL hash — exchange it for a session
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Пароли не совпадают");
      return;
    }
    setError(null);
    setLoading(true);
    const formData = new FormData();
    formData.set("password", password);
    const result = await updatePassword(formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    }
    // On success, updatePassword redirects to /dashboard
  }

  if (!ready) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="text-4xl font-bold mb-2" style={{ color: "var(--color-xp)" }}>🔑</div>
        <p className="text-sm mt-4" style={{ color: "var(--text-secondary)" }}>
          Проверяем ссылку...
        </p>
        <p className="text-xs mt-2" style={{ color: "var(--text-tertiary)" }}>
          Если страница не загружается — убедись что перешёл по ссылке из письма.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="text-4xl font-bold mb-2" style={{ color: "var(--color-xp)" }}>🔑</div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Новый пароль
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
          Придумай надёжный пароль
        </p>
      </div>

      <div className="glass-card p-6">
        <form onSubmit={onSubmit} className="space-y-4">
          {[
            { id: "password", label: "Новый пароль", value: password, onChange: setPassword },
            { id: "confirm", label: "Повтори пароль", value: confirm, onChange: setConfirm },
          ].map(({ id, label, value, onChange }) => (
            <div key={id}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                {label}
              </label>
              <input
                type="password"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={(e) => {
                  e.target.style.borderColor = "var(--color-xp)";
                  e.target.style.boxShadow = "var(--shadow-glow)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "var(--border-subtle)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          ))}

          {error && (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                color: "var(--color-danger)",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, var(--color-xp), #4F46E5)" }}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Сохраняем..." : "Сохранить пароль"}
          </button>
        </form>
      </div>
    </div>
  );
}
