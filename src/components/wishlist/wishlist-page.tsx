"use client";

import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { ProductCard } from "@/components/products/product-card";
import { useStore } from "@/store/store-provider";
import type { StorefrontProduct } from "@/types/commerce";

export function WishlistPage({ products }: { products: StorefrontProduct[] }) {
  const { wishlist } = useStore();
  const items = products.filter((product) => wishlist.includes(product.slug));

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.3em] text-[var(--brand-violet-deep)]">Wishlist</p>
        <h1 className="mt-3 font-display text-5xl leading-none text-[var(--ink)]">Tus favoritos encantados</h1>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-[var(--line)] bg-white/75 px-8 py-16 text-center shadow-[0_20px_50px_rgba(31,36,84,0.08)]">
          <p className="font-display text-4xl leading-none text-[var(--ink)]">Aún no guardas productos</p>
          <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-[var(--muted)]">
            Marca camitas, accesorios o snacks para comparar después y construir tu propio mundo dentro
            de Patilandia.
          </p>
          <Link className={buttonStyles({ className: "mt-8" })} href="/tienda">
            Ir a la tienda
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {items.map((item) => (
            <ProductCard key={item.slug} product={item} />
          ))}
        </div>
      )}
    </div>
  );
}
