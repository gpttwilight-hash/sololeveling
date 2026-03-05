"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Loader2, X, Book, Pencil, Repeat, ChevronDown, ChevronUp } from "lucide-react";
import { createQuest } from "@/app/(app)/actions";
import {
  QUEST_TEMPLATES,
  TEMPLATE_ATTRIBUTE_LABELS,
  type TemplateAttributeKey
} from "@/lib/quest-templates";

const schema = z.object({
  title: z.string().min(2, "Минимум 2 символа").max(100),
  type: z.enum(["daily", "weekly", "epic"]),
  attribute: z.enum(["str", "int", "cha", "dis", "wlt", "hidden"]),
  difficulty: z.enum(["easy", "medium", "hard", "legendary"]),
  description: z.string().optional(),
  target_value: z.number().optional(),
  deadline: z.string().optional(),
  is_recurring: z.boolean(),
  trigger_time: z.string().optional(),
  trigger_location: z.string().optional(),
  trigger_anchor: z.string().optional(),
  min_description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const ATTRS = [
  { value: "str", label: "STR — Сила", color: "var(--color-strength)" },
  { value: "int", label: "INT — Интеллект", color: "var(--color-intellect)" },
  { value: "cha", label: "CHA — Харизма", color: "var(--color-charisma)" },
  { value: "dis", label: "DIS — Дисциплина", color: "var(--color-discipline)" },
  { value: "wlt", label: "WLT — Богатство", color: "var(--color-wealth)" },
];

const TYPES = [
  { value: "daily", label: "Ежедневный" },
  { value: "weekly", label: "Еженедельный" },
  { value: "epic", label: "Эпический" },
];

const DIFFICULTIES = [
  { value: "easy", label: "Лёгкий", xp: 8 },
  { value: "medium", label: "Средний", xp: 15 },
  { value: "hard", label: "Сложный", xp: 30 },
  { value: "legendary", label: "Легендарный", xp: 80 },
];

const inputStyle = {
  background: "var(--bg-tertiary)",
  border: "1px solid var(--border-subtle)",
  color: "var(--text-primary)",
};

export function QuestForm() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"manual" | "template">("manual");
  const [showTriggers, setShowTriggers] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const { register, handleSubmit, watch, reset, setValue, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: { type: "daily", attribute: "str", difficulty: "medium", is_recurring: true },
    });

  const questType = watch("type");

  function onSubmit(data: FormData) {
    setSubmitError(null);
    startTransition(async () => {
      try {
        await createQuest(data);
        reset();
        setOpen(false);
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : "Не удалось создать квест");
      }
    });
  }

  function selectTemplate(template: any, attr: string) {
    setValue("title", template.title);
    setValue("attribute", attr as any);
    setValue("difficulty", template.difficulty);
    setMode("manual");
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

      {/* Mode Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-4 bg-[var(--bg-tertiary)]">
        <button
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${mode === "template" ? "bg-[var(--bg-secondary)] text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"
            }`}
          onClick={() => setMode("template")}
        >
          <Book className="w-3.5 h-3.5" /> Из шаблонов
        </button>
        <button
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-medium transition-all ${mode === "manual" ? "bg-[var(--bg-secondary)] text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"
            }`}
          onClick={() => setMode("manual")}
        >
          <Pencil className="w-3.5 h-3.5" /> Вручную
        </button>
      </div>

      {mode === "template" ? (
        <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
          {Object.entries(QUEST_TEMPLATES).map(([attr, templates]) => (
            <div key={attr}>
              <p className="text-[10px] font-bold uppercase tracking-widest mb-2 px-1" style={{ color: TEMPLATE_ATTRIBUTE_LABELS[attr as TemplateAttributeKey].color }}>
                {TEMPLATE_ATTRIBUTE_LABELS[attr as TemplateAttributeKey].label}
              </p>
              <div className="grid grid-cols-1 gap-1.5">
                {templates.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => selectTemplate(t, attr)}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all hover:brightness-110 active:scale-[0.98]"
                    style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)" }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate" style={{ color: "var(--text-primary)" }}>{t.title}</span>
                      <span className="flex-shrink-0" style={{ color: "var(--text-tertiary)" }}>+{t.xp_reward} XP</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
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

          {/* Recurring Option */}
          {(questType === "daily" || questType === "weekly") && (
            <label className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all hover:brightness-110" style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)" }}>
              <input
                type="checkbox"
                {...register("is_recurring")}
                className="w-4 h-4 rounded accent-[var(--color-xp)]"
              />
              <div className="flex flex-col">
                <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Повторять автоматически</span>
                <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>Сбрасывать статус каждый день в 00:00</span>
              </div>
              <Repeat className="w-4 h-4 ml-auto" style={{ color: "var(--color-xp)" }} />
            </label>
          )}

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

          {/* Habit Science: Triggers toggle */}
          <button
            type="button"
            onClick={() => setShowTriggers((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all"
            style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
          >
            <span className="text-xs font-semibold">Триггеры привычки</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px]" style={{ color: "var(--text-tertiary)" }}>
                Когда · Где · После чего
              </span>
              {showTriggers
                ? <ChevronUp className="w-3.5 h-3.5" />
                : <ChevronDown className="w-3.5 h-3.5" />
              }
            </div>
          </button>

          {showTriggers && (
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <input
                  {...register("trigger_time")}
                  type="time"
                  placeholder="Время"
                  className="px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                />
                <input
                  {...register("trigger_location")}
                  placeholder="Место (напр. Дома)"
                  className="px-3 py-2.5 rounded-xl text-sm outline-none"
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = "var(--color-xp)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border-subtle)"; }}
                />
              </div>
              <input
                {...register("trigger_anchor")}
                placeholder="Якорь: После чего делать (напр. После кофе)"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = "var(--color-xp)"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--border-subtle)"; }}
              />
              <input
                {...register("min_description")}
                placeholder="Минимум: хотя бы... (напр. 5 отжиманий)"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ ...inputStyle, borderColor: "var(--color-success)20" }}
                onFocus={(e) => { e.target.style.borderColor = "var(--color-success)"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--border-subtle)"; }}
              />
              <p className="text-[10px] px-1" style={{ color: "var(--text-tertiary)" }}>
                Минимум — версия квеста, которую можно зачесть даже в плохой день (+50% XP)
              </p>
            </div>
          )}

          {submitError && (
            <p className="text-xs px-1" style={{ color: "var(--color-danger)" }}>
              ⚠ {submitError}
            </p>
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
      )}
    </div>
  );
}
