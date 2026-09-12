"use client";

import Image from "next/image";
import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { HeartIcon } from "@/components/ui/icons";
import { useStore } from "@/store/store-provider";
import type { StorefrontProduct } from "@/types/commerce";

/**
 * Wishlist is real end-to-end today: local for instant heart-clicks, and mirrored into Vendure
 * (patilandia-wishlist plugin) the moment an email is known — see store-provider.tsx. The other
 * cards (órdenes, direcciones) genuinely need customer auth, which the brief explicitly defers —
 * see "Correctamente diferido" en Pendientes Claude.md — so they stay as honest placeholders.
 */
export function AccountWishlistCard({ products }: { products: StorefrontProduct[] }) {
  const { wishlist } = useStore();
  const items = products.filter((product) => wishlist.includes(product.id));

  return (
    <div className="rounded-[2rem] border border-white/60 bg-white/82 p-6 shadow-[0_20px_50px_rgba(31,36,84,0.08)]">
      <h2 className="font-display text-3xl leading-none text-[var(--ink)]">Favoritos</h2>

      {items.length === 0 ? (
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          Todavía no guardaste ningún producto. Marcá con el corazón lo que te guste desde la tienda.
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
            {items.length} {items.length === 1 ? "producto guardado" : "productos guardados"}
          </p>
          <div className="mt-4 flex -space-x-3">
            {items.slice(0, 4).map((item) => (
              <div
                key={item.slug}
                className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-white bg-[var(--brand-soft)]"
              >
                <Image alt={item.name} className="object-cover" fill sizes="48px" src={item.image} />
              </div>
            ))}
            {items.length > 4 ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-[var(--brand-violet-deep)] text-xs font-bold text-white">
                +{items.length - 4}
              </div>
            ) : null}
          </div>
        </>
      )}

      <Link className={buttonStyles({ variant: "secondary", size: "sm", className: "mt-5 w-full" })} href="/wishlist">
        <HeartIcon className="h-4 w-4" />
        Ver wishlist completa
      </Link>
    </div>
  );
}
