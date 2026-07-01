"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SAFETY_FACTOR_LABELS } from "@/lib/verification/status";
import type { SafetyScoreFormData } from "@/types/verification";

const DEFAULTS: SafetyScoreFormData = {
  neighborhood: 7,
  building_condition: 75,
  access_control: 70,
  lighting: 7,
  emergency_readiness: 65,
  notes: "",
};

type SafetyScoreFormProps = {
  initial?: Partial<SafetyScoreFormData>;
  onSubmit: (data: SafetyScoreFormData) => Promise<void>;
  disabled?: boolean;
};

export function SafetyScoreForm({ initial, onSubmit, disabled }: SafetyScoreFormProps) {
  const [form, setForm] = useState<SafetyScoreFormData>({ ...DEFAULTS, ...initial });
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(form);
    } finally {
      setSubmitting(false);
    }
  }

  const fields: { key: keyof SafetyScoreFormData; label: string; min: number; max: number; step: number }[] = [
    { key: "neighborhood", label: SAFETY_FACTOR_LABELS.NEIGHBORHOOD, min: 0, max: 10, step: 0.5 },
    { key: "building_condition", label: SAFETY_FACTOR_LABELS.BUILDING_CONDITION, min: 0, max: 100, step: 5 },
    { key: "access_control", label: SAFETY_FACTOR_LABELS.ACCESS_CONTROL, min: 0, max: 100, step: 5 },
    { key: "lighting", label: SAFETY_FACTOR_LABELS.LIGHTING, min: 0, max: 10, step: 0.5 },
    { key: "emergency_readiness", label: SAFETY_FACTOR_LABELS.EMERGENCY_READINESS, min: 0, max: 100, step: 5 },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map((field) => (
        <div key={field.key}>
          <label className="flex items-center justify-between text-sm font-medium text-ustawi-navy">
            <span>{field.label}</span>
            <span>{form[field.key] as number}</span>
          </label>
          <input
            type="range"
            min={field.min}
            max={field.max}
            step={field.step}
            value={form[field.key] as number}
            disabled={disabled || submitting}
            onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: Number(e.target.value) }))}
            className="mt-2 w-full accent-ustawi-navy"
          />
        </div>
      ))}
      <div>
        <label className="text-sm font-medium text-ustawi-navy">Inspector notes</label>
        <textarea
          rows={3}
          value={form.notes ?? ""}
          disabled={disabled || submitting}
          onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
          className="mt-1.5 w-full rounded-lg border border-[#E8EAF2] px-3 py-2 text-sm outline-none focus:border-ustawi-navy/40"
        />
      </div>
      <Button type="submit" disabled={disabled || submitting} className="w-full rounded-xl bg-ustawi-navy">
        {submitting ? "Saving…" : "Save safety score"}
      </Button>
    </form>
  );
}
