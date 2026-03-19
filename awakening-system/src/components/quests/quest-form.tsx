"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Loader2, X, Book, Pencil, Repeat, ChevronDown, ChevronUp, Save } from "lucide-react";
import { createQuest, updateQuest } from "@/app/(app)/actions";
import { QUEST_TEMPLATES, TEMPLATE_ATTRIBUTE_LABELS, type TemplateAttributeKey } from "@/lib/quest-templates";
import type { QuestType, Quest } from "@/types/game";

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
  parent_id: z.string().optional(),
  narrative: z.string().optional(),
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

export function QuestForm({
  initialType = "daily",
  activeEpics = [],
  initialQuest = null,
  onCancel = null,
}: {
  initialType?: QuestType,
  activeEpics?: Quest[],
  initialQuest?: Quest | null,
  onCancel?: (() => void) | null,
}) {
  const isEditing = !!initialQuest;
  const [open, setOpen] = useState(isEditing);
  const [mode, setMode] = useState<"manual" | "template">(isEditing ? "manual" : "manual");
  const [showTriggers, setShowTriggers] = useState(
    !!(initialQuest?.trigger_time || initialQuest?.trigger_location || initialQuest?.trigger_anchor)
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const { register, handleSubmit, watch, reset, setValue, formState: { errors, isSubmitting } } =
    useForm<FormData>({
      resolver: zodResolver(schema),
      defaultValues: initialQuest ? {
        title: initialQuest.title,
        type: initialQuest.type as "daily" | "weekly" | "epic",
        attribute: initialQuest.attribute as "str" | "int" | "cha" | "dis" | "wlt" | "hidden",
        difficulty: initialQuest.difficulty as "easy" | "medium" | "hard" | "legendary",
        description: initialQuest.description || "",
        target_value: initialQuest.target_value ?? undefined,
        deadline: initialQuest.deadline ? new Date(initialQuest.deadline).toISOString().split('T')[0] : undefined,
        is_recurring: initialQuest.is_recurring ?? (initialQuest.type !== "epic"),
        trigger_time: initialQuest.trigger_time || "",
        trigger_location: initialQuest.trigger_location || "",
        trigger_anchor: initialQuest.trigger_anchor || "",
        min_description: initialQuest.min_description || "",
        parent_id: initialQuest.parent_id || "",
        narrative: initialQuest.narrative || "",
      } : {
        type: initialType,
        attribute: "str",
        difficulty: "medium",
        is_recurring: initialType !== "epic"
      },
    });

  const questType = watch("type");

  function onSubmit(data: FormData) {
    setSubmitError(null);
    startTransition(async () => {
      try {
        if (isEditing && initialQuest) {
          await updateQuest(initialQuest.id, data);
          if (onCancel) onCancel();
        } else {
          await createQuest(data);
          reset();
          setOpen(false);
        }
      } catch (e) {
        setSubmitError(e instanceof Error ? e.message : "Не удалось сохранить квест");
      }
    });
  }

  function selectTemplate(template: { title: string; difficulty: "easy" | "medium" | "hard" | "legendary"; xp_reward: number }, attr: string) {
    setValue("title", template.title);
    setValue("attribute", attr as "str" | "int" | "cha" | "dis" | "wlt" | "hidden");
    setValue("difficulty", template.difficulty);
    setMode("manual");
  }

  if (!open && !isEditing) {
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
      style={{
        background: "var(--bg-secondary)",
        border: isEditing ? "1px solid var(--color-xp)40" : "1px solid var(--border-default)",
        boxShadow: isEditing ? "0 0 20px var(--color-xp)10" : "none"
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          {isEditing ? `Редактирование: ${initialQuest.title}` : "Новый квест"}
        </h3>
        <button onClick={() => {
          if (isEditing && onCancel) onCancel();
          else { setOpen(false); reset(); }
        }}>
          <X className="w-4 h-4" style={{ color: "var(--text-tertiary)" }} />
        </button>
      </div>

      {/* Mode Tabs - only for create mode */}
      {!isEditing && (
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
      )}

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

          {/* NCT System: Link to Epic (for Daily/Weekly) */}
          {(questType === "daily" || questType === "weekly") && activeEpics.length > 0 && (
            <select
              {...register("parent_id")}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{ background: "var(--bg-tertiary)", border: "1px solid rgba(139, 92, 246, 0.3)", color: "var(--color-xp)" }}
            >
              <option value="">Без привязки к Сюжету (Эпику)</option>
              {activeEpics.map((epic) => (
                <option key={epic.id} value={epic.id}>
                  🔗 Эпик: {epic.title}
                </option>
              ))}
            </select>
          )}

          {/* NCT System: Narrative (for Epics) */}
          {questType === "epic" && (
            <input
              {...register("narrative")}
              placeholder="Сюжетная арка: Зачем вам это нужно? (Опционально)"
              className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
              style={{ background: "var(--bg-tertiary)", border: "1px solid rgba(139, 92, 246, 0.3)", color: "var(--color-xp)" }}
            />
          )}

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

          <div className="flex gap-2">
            {isEditing && (
              <button
                type="button"
                onClick={onCancel || (() => { })}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
              >
                Отмена
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, var(--color-xp), #4F46E5)" }}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                isEditing ? <Save className="w-4 h-4" /> : null
              )}
              {isEditing ? "Сохранить изменения" : "Создать квест"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
