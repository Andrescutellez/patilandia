"use client";

import type { ProductColor, ProductSize } from "@/types/commerce";

/** Extracted from ProductDetail's inline color/size buttons so the "Agregar al carrito" flow and
 *  the "🔄 Recompra programada" panel (see product-subscription.tsx) share the exact same variant
 *  selection UI instead of duplicating it. */
export function VariantPicker({
  colors,
  sizes,
  selectedColor,
  selectedSize,
  onSelectColor,
  onSelectSize
}: {
  colors: ProductColor[];
  sizes: ProductSize[];
  selectedColor: ProductColor;
  selectedSize: ProductSize;
  onSelectColor: (color: ProductColor) => void;
  onSelectSize: (size: ProductSize) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-bold text-[var(--ink)]">Color: {selectedColor.name}</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {colors.map((color) => (
            <button
              key={color.name}
              aria-label={color.name}
              className={`h-11 w-11 rounded-full border-2 ${
                selectedColor.name === color.name ? "border-[var(--brand-violet)]" : "border-white"
              } shadow-[0_8px_20px_rgba(31,36,84,0.08)]`}
              onClick={() => onSelectColor(color)}
              style={{ backgroundColor: color.hex }}
              type="button"
            />
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-bold text-[var(--ink)]">Tamaño</p>
        <div className="mt-3 flex flex-wrap gap-3">
          {sizes.map((size) => (
            <button
              key={size}
              className={`min-w-14 rounded-full border px-5 py-3 text-sm font-bold transition ${
                selectedSize === size
                  ? "border-[var(--brand-violet)] bg-[var(--brand-violet)] text-white"
                  : "border-[var(--line)] bg-white text-[var(--ink)]"
              }`}
              onClick={() => onSelectSize(size)}
              type="button"
            >
              {size}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
