"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, MailCheck } from "lucide-react";
import { login, resendConfirmation } from "../actions";

const schema = z.object({
  email: z.string().email("Некорректный email"),
  password: z.string().min(6, "Минимум 6 символов"),
});

type FormData = z.infer<typeof schema>;

const inputStyle = {
  background: "var(--bg-tertiary)",
  border: "1px solid var(--border-subtle)",
  color: "var(--text-primary)",
};

const focusOn = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = "var(--color-xp)";
  e.target.style.boxShadow = "var(--shadow-glow)";
};
const focusOff = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.style.borderColor = "var(--border-subtle)";
  e.target.style.boxShadow = "none";
};

export default function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError(null);
    setUnconfirmedEmail(null);
    const formData = new FormData();
    formData.set("email", data.email);
    formData.set("password", data.password);
    const result = await login(formData);
    if (result?.error === "EMAIL_NOT_CONFIRMED") {
      setUnconfirmedEmail(data.email);
    } else if (result?.error) {
      setServerError(result.error);
    }
  }

  async function handleResend() {
    if (!unconfirmedEmail) return;
    setResendState("sending");
    const formData = new FormData();
    formData.set("email", unconfirmedEmail);
    await resendConfirmation(formData);
    setResendState("sent");
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="text-4xl font-bold mb-2" style={{ color: "var(--color-xp)" }}>⚔</div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Система Пробуждения
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
          Войди в свой аккаунт
        </p>
      </div>

      <div className="glass-card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
              Email
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder="hunter@example.com"
              autoComplete="email"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={focusOn}
              onBlur={focusOff}
            />
            {errors.email && (
              <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>{errors.email.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                Пароль
              </label>
              <Link href="/forgot-password" className="text-xs hover:opacity-80 transition-opacity" style={{ color: "var(--color-xp)" }}>
                Забыли пароль?
              </Link>
            </div>
            <input
              {...register("password")}
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
              style={inputStyle}
              onFocus={focusOn}
              onBlur={focusOff}
            />
            {errors.password && (
              <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>{errors.password.message}</p>
            )}
          </div>

          {/* Email not confirmed */}
          {unconfirmedEmail && (
            <div
              className="rounded-xl px-4 py-3 text-sm space-y-2"
              style={{
                background: "rgba(99,102,241,0.1)",
                border: "1px solid rgba(99,102,241,0.25)",
                color: "var(--text-secondary)",
              }}
            >
              <div className="flex items-center gap-2">
                <MailCheck className="w-4 h-4 shrink-0" style={{ color: "var(--color-xp)" }} />
                <span>Email <strong style={{ color: "var(--text-primary)" }}>{unconfirmedEmail}</strong> ещё не подтверждён.</span>
              </div>
              {resendState === "sent" ? (
                <p className="text-xs" style={{ color: "var(--color-success)" }}>
                  ✓ Письмо отправлено повторно — проверь почту и папку «Спам»
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendState === "sending"}
                  className="text-xs font-medium underline hover:opacity-80 disabled:opacity-50"
                  style={{ color: "var(--color-xp)" }}
                >
                  {resendState === "sending" ? "Отправляем..." : "Отправить письмо повторно"}
                </button>
              )}
            </div>
          )}

          {/* Generic error */}
          {serverError && (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                color: "var(--color-danger)",
              }}
            >
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ background: "linear-gradient(135deg, var(--color-xp), #4F46E5)" }}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? "Входим..." : "Войти"}
          </button>
        </form>
      </div>

      <p className="text-center text-sm mt-6" style={{ color: "var(--text-tertiary)" }}>
        Нет аккаунта?{" "}
        <Link href="/signup" className="font-medium transition-colors hover:opacity-80" style={{ color: "var(--color-xp)" }}>
          Зарегистрироваться
        </Link>
      </p>
    </div>
  );
}
