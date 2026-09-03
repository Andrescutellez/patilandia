"use client";

import { MinusIcon, PlusIcon } from "@/components/ui/icons";
import { clampQuantity, cn } from "@/lib/utils";

export function QuantitySelector({
  value,
  onChange,
  className
}: {
  value: number;
  onChange: (nextValue: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex items-center rounded-full border border-[var(--line)] bg-white p-1", className)}>
      <button
        aria-label="Disminuir cantidad"
        className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--brand-violet-deep)] transition hover:bg-[var(--brand-soft)]"
        onClick={() => onChange(clampQuantity(value - 1))}
        type="button"
      >
        <MinusIcon className="h-4 w-4" />
      </button>
      <span className="min-w-10 text-center text-sm font-bold text-[var(--ink)]">{value}</span>
      <button
        aria-label="Aumentar cantidad"
        className="flex h-10 w-10 items-center justify-center rounded-full text-[var(--brand-violet-deep)] transition hover:bg-[var(--brand-soft)]"
        onClick={() => onChange(clampQuantity(value + 1))}
        type="button"
      >
        <PlusIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
