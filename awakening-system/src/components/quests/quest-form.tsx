"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Loader2, X } from "lucide-react";
import { createQuest } from "@/app/(app)/actions";

const schema = z.object({
  title: z.string().min(2, "Минимум 2 символа").max(100),
  type: z.enum(["daily", "weekly", "epic"]),
  attribute: z.enum(["str", "int", "cha", "dis", "wlt", "hidden"]),
  difficulty: z.enum(["easy", "medium", "hard", "legendary"]),
  description: z.string().optional(),
  target_value: z.number().optional(),
});

type FormData = z.infer<typeof schema>;

const ATTRS = [
  { value: "str", label: "STR — Сила",          color: "var(--color-strength)" },
  { value: "int", label: "INT — Интеллект",      color: "var(--color-intellect)" },
  { value: "cha", label: "CHA — Харизма",        color: "var(--color-charisma)" },
  { value: "dis", label: "DIS — Дисциплина",     color: "var(--color-discipline)" },
  { value: "wlt", label: "WLT — Богатство",      color: "var(--color-wealth)" },
];

const TYPES = [
  { value: "daily",   label: "Ежедневный" },
  { value: "weekly",  label: "Еженедельный" },
  { value: "epic",    label: "Эпический" },
];

const DIFFICULTIES = [
  { value: "easy",      label: "Лёгкий",      xp: 8 },
  { value: "medium",    label: "Средний",      xp: 15 },
  { value: "hard",      label: "Сложный",      xp: 30 },
  { value: "legendary", label: "Легендарный",  xp: 80 },
];

const inputStyle = {
  background: "var(--bg-tertiary)",
  border: "1px solid var(--border-subtle)",
  color: "var(--text-primary)",
};

export function QuestForm() {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { type: "daily", attribute: "str", difficulty: "medium" },
    });

  const questType = watch("type");

  function onSubmit(data: FormData) {
    startTransition(async () => {
      await createQuest(data);
      reset();
      setOpen(false);
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all"
        style={{
          background: "var(--bg-tertiary)",
          border: "1px dashed var(--border-default)",
          color: "var(--text-secondary)",
        }}
      >
        <Plus className="w-4 h-4" /> Добавить квест
      </button>
    );
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-default)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Новый квест
        </h3>
        <button onClick={() => { setOpen(false); reset(); }}>
          <X className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {/* Title */}
        <input
          {...register("title")}
          placeholder="Название квеста..."
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
          style={inputStyle}
          onFocus={(e) => { e.target.style.borderColor = "var(--color-xp)"; }}
          onBlur={(e) => { e.target.style.borderColor = "var(--border-subtle)"; }}
        />
        {errors.title && (
          <p className="text-xs" style={{ color: "var(--color-danger)" }}>{errors.title.message}</p>
        )}

        {/* Type + Difficulty row */}
        <div className="grid grid-cols-2 gap-2">
          <select
            {...register("type")}
            className="px-3 py-2.5 rounded-xl text-sm outline-none"
            style={inputStyle}
          >
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <select
            {...register("difficulty")}
            className="px-3 py-2.5 rounded-xl text-sm outline-none"
            style={inputStyle}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d.value} value={d.value}>{d.label} (+{d.xp} XP)</option>
            ))}
          </select>
        </div>

        {/* Attribute */}
        <select
          {...register("attribute")}
          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
          style={inputStyle}
        >
          {ATTRS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
        </select>

        {/* Description */}
        <input
          {...register("description")}
          placeholder="Описание (опционально)"
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
          style={inputStyle}
          onFocus={(e) => { e.target.style.borderColor = "var(--color-xp)"; }}
          onBlur={(e) => { e.target.style.borderColor = "var(--border-subtle)"; }}
        />

        {/* Epic: target value */}
        {questType === "epic" && (
          <input
            {...register("target_value", { valueAsNumber: true })}
            type="number"
            placeholder="Целевое значение (например, 1000)"
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
            style={inputStyle}
          />
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, var(--color-xp), #4F46E5)" }}
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Создать квест
        </button>
      </form>
    </div>
  );
}
