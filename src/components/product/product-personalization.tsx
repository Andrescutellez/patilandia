"use client";

import { useEffect, useState } from "react";

import { formatCurrency } from "@/lib/utils";
import type { PersonalizationConfig } from "@/lib/vendure/personalization";

export interface PersonalizationAnswerDraft {
  fieldId: string;
  label: string;
  value: string;
}

/**
 * The "✨ Personaliza tu producto" panel — only ever rendered by ProductDetail when
 * getPersonalizationConfig() returned something, so there's no "disabled" state to handle here,
 * only "not rendered at all". Fields render dynamically from `config.fields`, entirely driven by
 * whatever the admin configured — nothing about a specific product (like Luna) is hardcoded here.
 */
export function ProductPersonalization({
  config,
  onChange
}: {
  config: PersonalizationConfig;
  onChange: (answers: PersonalizationAnswerDraft[], isValid: boolean) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    const answers = config.fields
      .filter((field) => values[field.id]?.trim())
      .map((field) => {
        const raw = values[field.id].trim();
        // For a select field, snapshot the option's human-readable label ("Dorado"), not its
        // machine value ("gold") — this is what ends up on the cart/checkout/order, and nobody
        // reading those should see an internal code.
        const displayValue =
          field.fieldType === "select" ? (field.options.find((o) => o.value === raw)?.label ?? raw) : raw;
        return { fieldId: field.id, label: field.label, value: displayValue };
      });
    const isValid = config.fields.every((field) => !field.required || Boolean(values[field.id]?.trim()));
    onChange(answers, isValid);
    // Only re-run when the answers actually change — `onChange` is a fresh closure on every
    // ProductDetail render, including it here would fire this on every keystroke's parent render too.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, config.fields]);

  return (
    <div className="space-y-5 rounded-[2rem] border border-[var(--brand-gold)] bg-[var(--brand-soft)] p-6">
      <div className="flex items-center gap-2">
        <span className="text-lg">✨</span>
        <h3 className="font-display text-2xl leading-none text-[var(--ink)]">Personaliza tu producto</h3>
      </div>

      {config.fields.map((field) => (
        <div className="space-y-2" key={field.id}>
          <label className="text-sm font-bold text-[var(--ink)]">
            {field.label}
            {field.required ? <span className="text-[var(--brand-violet-deep)]"> *</span> : null}
          </label>

          {field.fieldType === "select" ? (
            <div className="flex flex-wrap gap-2">
              {field.options.map((option) => {
                const selected = values[field.id] === option.value;
                return (
                  <button
                    className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition ${
                      selected
                        ? "border-[var(--brand-violet)] bg-white shadow-[0_4px_12px_rgba(94,76,214,0.18)]"
                        : "border-[var(--line)] bg-white/60"
                    }`}
                    key={option.id}
                    onClick={() => setValues((current) => ({ ...current, [field.id]: option.value }))}
                    type="button"
                  >
                    {option.colorHex ? (
                      <span
                        className="h-4 w-4 rounded-full border border-black/10"
                        style={{ backgroundColor: option.colorHex }}
                      />
                    ) : null}
                    {option.label}
                  </button>
                );
              })}
            </div>
          ) : (
            <input
              className="w-full rounded-[0.9rem] border border-[var(--line)] px-4 py-2.5 text-sm"
              maxLength={field.maxLength ?? undefined}
              onChange={(event) => setValues((current) => ({ ...current, [field.id]: event.target.value }))}
              placeholder={field.placeholder}
              type="text"
              value={values[field.id] ?? ""}
            />
          )}
          {field.fieldType === "text" && field.maxLength ? (
            <p className="text-right text-xs text-[var(--muted)]">
              {(values[field.id] ?? "").length}/{field.maxLength}
            </p>
          ) : null}
        </div>
      ))}

      {config.priceSurcharge > 0 ? (
        <p className="text-sm font-bold text-[var(--brand-violet-deep)]">
          Personalización +{formatCurrency(config.priceSurcharge)}
        </p>
      ) : null}
    </div>
  );
}
