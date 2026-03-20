"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { resetPassword } from "../actions";

const inputStyle = {
  background: "var(--bg-tertiary)",
  border: "1px solid var(--border-subtle)",
  color: "var(--text-primary)",
};

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData();
    formData.set("email", email);
    const result = await resetPassword(formData);
    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="text-center space-y-4">
        <CheckCircle className="w-12 h-12 mx-auto" style={{ color: "var(--color-success)" }} />
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
          Письмо отправлено
        </h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Проверь почту <span className="font-medium" style={{ color: "var(--text-primary)" }}>{email}</span>.
          Ссылка для сброса пароля действительна 1 час.
        </p>
        <Link
          href="/login"
          className="inline-block text-sm font-medium hover:opacity-80"
          style={{ color: "var(--color-xp)" }}
        >
          Вернуться к входу
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="hunter@example.com"
          required
          autoComplete="email"
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
        {loading ? "Отправляем..." : "Отправить ссылку"}
      </button>
    </form>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="text-4xl font-bold mb-2" style={{ color: "var(--color-xp)" }}>🔑</div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Восстановление пароля
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
          Пришлём ссылку для сброса на твой email
        </p>
      </div>

      <div className="glass-card p-6">
        <Suspense>
          <ForgotPasswordForm />
        </Suspense>
      </div>

      <p className="text-center text-sm mt-6" style={{ color: "var(--text-tertiary)" }}>
        <Link
          href="/login"
          className="inline-flex items-center gap-1 font-medium hover:opacity-80"
          style={{ color: "var(--color-xp)" }}
        >
          <ArrowLeft className="w-3 h-3" />
          Вернуться к входу
        </Link>
      </p>
    </div>
  );
}
