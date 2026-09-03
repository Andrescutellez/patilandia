"use client";

import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CartIcon, HeartIcon, StarIcon } from "@/components/ui/icons";
import { formatCurrency, percentageOff } from "@/lib/utils";
import { useStore } from "@/store/store-provider";
import type { StorefrontProduct } from "@/types/commerce";

const themeMap: Record<StorefrontProduct["theme"], string> = {
  royal: "from-[#ffe2f2] via-[#fff8fd] to-[#fef4ff]",
  galaxy: "from-[#dfe4ff] via-[#f7f6ff] to-[#f2ecff]",
  magic: "from-[#e0f4df] via-[#f7fbf2] to-[#edf8eb]",
  safari: "from-[#f8ead7] via-[#fff7ee] to-[#fdf2e5]",
  dreams: "from-[#dde5ff] via-[#fbfaff] to-[#f2ecff]"
};

export function ProductCard({ product }: { product: StorefrontProduct }) {
  const { addToCart, isWishlisted, toggleWishlist } = useStore();
  const discount = percentageOff(product.price, product.compareAtPrice);
  const wishlisted = isWishlisted(product.slug);

  return (
    <article className="group overflow-hidden rounded-[1.8rem] border border-white/60 bg-white shadow-[0_20px_50px_rgba(33,38,84,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_60px_rgba(33,38,84,0.14)]">
      <div className={`relative aspect-[1.04] overflow-hidden bg-gradient-to-br ${themeMap[product.theme]}`}>
        <Image
          alt={product.name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          fill
          sizes="(max-width: 768px) 100vw, 25vw"
          src={product.image}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.25),transparent_45%)]" />
        {product.badge ? (
          <span className="absolute left-4 top-4 rounded-full bg-[var(--brand-gold)] px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-[var(--ink)]">
            {product.badge}
          </span>
        ) : null}
        <button
          aria-label={wishlisted ? "Quitar de favoritos" : "Agregar a favoritos"}
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/92 text-[var(--brand-violet-deep)] shadow-[0_12px_24px_rgba(21,26,76,0.12)]"
          onClick={() => toggleWishlist(product.slug)}
          type="button"
        >
          <HeartIcon className={wishlisted ? "h-5 w-5 text-[var(--brand-pink)]" : "h-5 w-5"} />
        </button>
      </div>

      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-[var(--brand-violet-deep)]">
            {product.categoryLabel}
          </p>
          <Link className="block font-display text-3xl leading-none text-[var(--ink)]" href={`/producto/${product.slug}`}>
            {product.name}
          </Link>
          <p className="line-clamp-2 text-sm leading-6 text-[var(--muted)]">{product.shortDescription}</p>
        </div>

        <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
          <div className="flex items-center gap-1 text-amber-400">
            {Array.from({ length: 5 }).map((_, index) => (
              <StarIcon key={`${product.slug}-${index}`} className="h-4 w-4" />
            ))}
          </div>
          <span>{product.rating.toFixed(1)}</span>
          <span>({product.reviewCount})</span>
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-black text-[var(--brand-violet-deep)]">
              {formatCurrency(product.price)}
            </p>
            {product.compareAtPrice ? (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--muted)] line-through">
                  {formatCurrency(product.compareAtPrice)}
                </span>
                {discount ? (
                  <span className="rounded-full bg-[var(--brand-soft)] px-2 py-1 text-xs font-bold text-[var(--brand-violet-deep)]">
                    -{discount}%
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <Button
          className="w-full"
          onClick={() => addToCart(product, { size: product.sizes[0], color: product.colors[0] })}
          type="button"
        >
          <CartIcon className="h-4 w-4" />
          Agregar al carrito
        </Button>
      </div>
    </article>
  );
}
