"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { signup } from "../actions";

const schema = z
  .object({
    email: z.string().email("Некорректный email"),
    password: z.string().min(6, "Минимум 6 символов"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Пароли не совпадают",
    path: ["confirm"],
  });

type FormData = z.infer<typeof schema>;

const inputStyle = {
  background: "var(--bg-tertiary)",
  border: "1px solid var(--border-subtle)",
  color: "var(--text-primary)",
};

export default function SignupPage() {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setServerError(null);
    const formData = new FormData();
    formData.set("email", data.email);
    formData.set("password", data.password);
    const result = await signup(formData);
    if (result?.error) {
      setServerError(result.error);
    }
  }

  const focusStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "var(--color-xp)";
    e.target.style.boxShadow = "var(--shadow-glow)";
  };
  const blurStyle = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = "var(--border-subtle)";
    e.target.style.boxShadow = "none";
  };

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <div className="text-4xl font-bold mb-2" style={{ color: "var(--color-xp)" }}>⚔</div>
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
          Получить Систему
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
          Начни своё пробуждение
        </p>
      </div>

      <div className="glass-card p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {(["email", "password", "confirm"] as const).map((field) => (
            <div key={field}>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>
                {field === "email" ? "Email" : field === "password" ? "Пароль" : "Повтори пароль"}
              </label>
              <input
                {...register(field)}
                type={field === "email" ? "email" : "password"}
                placeholder={field === "email" ? "hunter@example.com" : "••••••••"}
                autoComplete={field === "email" ? "email" : field === "password" ? "new-password" : "new-password"}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                style={inputStyle}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
              {errors[field] && (
                <p className="text-xs mt-1" style={{ color: "var(--color-danger)" }}>
                  {errors[field]?.message}
                </p>
              )}
            </div>
          ))}

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
            {isSubmitting ? "Создаём аккаунт..." : "Пробудиться"}
          </button>
        </form>
      </div>

      <p className="text-center text-sm mt-6" style={{ color: "var(--text-tertiary)" }}>
        Уже есть аккаунт?{" "}
        <Link href="/login" className="font-medium hover:opacity-80" style={{ color: "var(--color-xp)" }}>
          Войти
        </Link>
      </p>
    </div>
  );
}
