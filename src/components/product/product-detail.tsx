"use client";

import Link from "next/link";
import { useState } from "react";

import { Button, buttonStyles } from "@/components/ui/button";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductCard } from "@/components/products/product-card";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { CrownIcon, HeartIcon, ShieldIcon, SparklesIcon, StarIcon, TruckIcon } from "@/components/ui/icons";
import { formatCurrency, percentageOff } from "@/lib/utils";
import { useStore } from "@/store/store-provider";
import type { ProductColor, ProductSize, StorefrontProduct } from "@/types/commerce";

const iconMap = {
  crown: CrownIcon,
  shield: ShieldIcon,
  sparkles: SparklesIcon,
  truck: TruckIcon
};

export function ProductDetail({
  product,
  relatedProducts
}: {
  product: StorefrontProduct;
  relatedProducts: StorefrontProduct[];
}) {
  const { addToCart, isWishlisted, toggleWishlist } = useStore();
  const [selectedColor, setSelectedColor] = useState<ProductColor>(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState<ProductSize>(product.sizes[1] ?? product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const discount = percentageOff(product.price, product.compareAtPrice);

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <ProductGallery alt={product.name} images={product.galleryImages} />

        <div className="space-y-6 rounded-[2rem] border border-white/60 bg-white/84 p-6 shadow-[0_24px_60px_rgba(31,36,84,0.08)]">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-[var(--brand-soft)] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--brand-violet-deep)]">
              {product.categoryLabel}
            </span>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-5xl leading-none text-[var(--ink)]">{product.name}</h1>
                <p className="mt-3 text-lg text-[var(--muted)]">{product.shortDescription}</p>
              </div>
              <button
                aria-label="Agregar a favoritos"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-white text-[var(--brand-violet-deep)]"
                onClick={() => toggleWishlist(product.slug)}
                type="button"
              >
                <HeartIcon
                  className={isWishlisted(product.slug) ? "h-5 w-5 text-[var(--brand-pink)]" : "h-5 w-5"}
                />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            <div className="flex items-center gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, index) => (
                <StarIcon key={`${product.slug}-rating-${index}`} className="h-4 w-4" />
              ))}
            </div>
            <span className="font-bold text-[var(--ink)]">{product.rating.toFixed(1)}</span>
            <span>({product.reviewCount} reseñas)</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <p className="text-5xl font-black text-[var(--brand-violet-deep)]">{formatCurrency(product.price)}</p>
              {discount ? (
                <span className="rounded-full bg-[var(--brand-gold)] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[var(--ink)]">
                  -{discount}%
                </span>
              ) : null}
            </div>
            {product.compareAtPrice ? (
              <p className="text-sm text-[var(--muted)] line-through">{formatCurrency(product.compareAtPrice)}</p>
            ) : null}
          </div>

          <p className="text-base leading-8 text-[var(--muted)]">{product.description}</p>

          <div className="grid gap-3 rounded-[1.8rem] bg-[var(--brand-soft)] p-4 sm:grid-cols-2">
            {product.highlights.map((highlight) => {
              const Icon = iconMap[highlight.icon as keyof typeof iconMap] ?? SparklesIcon;
              return (
                <div key={highlight.title} className="rounded-[1.2rem] bg-white/72 p-4">
                  <Icon className="h-5 w-5 text-[var(--brand-violet-deep)]" />
                  <p className="mt-3 font-bold text-[var(--ink)]">{highlight.title}</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{highlight.description}</p>
                </div>
              );
            })}
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm font-bold text-[var(--ink)]">Color: {selectedColor.name}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {product.colors.map((color) => (
                  <button
                    key={color.name}
                    aria-label={color.name}
                    className={`h-11 w-11 rounded-full border-2 ${
                      selectedColor.name === color.name ? "border-[var(--brand-violet)]" : "border-white"
                    } shadow-[0_8px_20px_rgba(31,36,84,0.08)]`}
                    onClick={() => setSelectedColor(color)}
                    style={{ backgroundColor: color.hex }}
                    type="button"
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-[var(--ink)]">Tamaño</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    className={`min-w-14 rounded-full border px-5 py-3 text-sm font-bold transition ${
                      selectedSize === size
                        ? "border-[var(--brand-violet)] bg-[var(--brand-violet)] text-white"
                        : "border-[var(--line)] bg-white text-[var(--ink)]"
                    }`}
                    onClick={() => setSelectedSize(size)}
                    type="button"
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <QuantitySelector className="w-fit" onChange={setQuantity} value={quantity} />
            <Button
              className="flex-1"
              onClick={() => {
                for (let index = 0; index < quantity; index += 1) {
                  addToCart(product, { size: selectedSize, color: selectedColor });
                }
              }}
              size="lg"
              type="button"
            >
              Agregar al carrito
            </Button>
          </div>

          <Link className={buttonStyles({ variant: "secondary", size: "lg", className: "w-full" })} href="/checkout">
            Comprar ahora
          </Link>
        </div>
      </div>

      <section className="grid gap-6 rounded-[2rem] border border-white/60 bg-white/76 p-6 shadow-[0_24px_60px_rgba(31,36,84,0.08)] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <h2 className="font-display text-4xl leading-none text-[var(--ink)]">Descripción del producto</h2>
          <p className="text-base leading-8 text-[var(--muted)]">{product.description}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.4rem] bg-[var(--brand-soft)] p-4">
              <p className="font-bold text-[var(--ink)]">Materiales</p>
              <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                {product.materials.map((material) => (
                  <li key={material}>{material}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-[1.4rem] bg-[var(--brand-soft)] p-4">
              <p className="font-bold text-[var(--ink)]">Cuidados</p>
              <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                {product.care.map((care) => (
                  <li key={care}>{care}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-[1.8rem] bg-[linear-gradient(135deg,#2a337f,#7c6ff7)] p-6 text-white">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-white/70">Hecho para destacar</p>
          <p className="mt-4 font-display text-4xl leading-none">Su propia cama, su propio reino.</p>
          <p className="mt-4 text-base leading-8 text-white/80">
            Esta base deja preparado el camino para variantes, inventario y checkout real con Medusa sin
            comprometer el lenguaje visual de la marca.
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-[var(--brand-violet-deep)]">
              Relacionados
            </p>
            <h2 className="mt-3 font-display text-4xl leading-none text-[var(--ink)]">
              Más mundos para explorar
            </h2>
          </div>
          <Link className={buttonStyles({ variant: "ghost", className: "px-0" })} href="/tienda">
            Ver tienda
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {relatedProducts.map((relatedProduct) => (
            <ProductCard key={relatedProduct.slug} product={relatedProduct} />
          ))}
        </div>
      </section>
    </div>
  );
}
