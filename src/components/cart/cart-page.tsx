"use client";

import Image from "next/image";
import Link from "next/link";

import { Button, buttonStyles } from "@/components/ui/button";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { getShippingPreview } from "@/lib/shipping";
import { formatCurrency } from "@/lib/utils";
import { useStore } from "@/store/store-provider";

export function CartPage() {
  const { cart, removeFromCart, subtotal, updateQuantity } = useStore();
  const shippingPreview = getShippingPreview(cart);

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-dashed border-[var(--line)] bg-white/75 px-8 py-16 text-center shadow-[0_20px_50px_rgba(31,36,84,0.08)]">
          <h1 className="font-display text-5xl leading-none text-[var(--ink)]">Tu carrito está esperando magia</h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-8 text-[var(--muted)]">
            Agrega camitas, textiles o snacks para empezar una compra realista con arquitectura lista
            para Medusa y cálculo de envío futuro.
          </p>
          <Link className={buttonStyles({ size: "lg", className: "mt-8" })} href="/tienda">
            Explorar tienda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.3em] text-[var(--brand-violet-deep)]">Carrito</p>
        <h1 className="mt-3 font-display text-5xl leading-none text-[var(--ink)]">Tu selección en Patilandia</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-4">
          {cart.map((item) => (
            <article
              key={item.id}
              className="grid gap-4 rounded-[2rem] border border-white/60 bg-white/82 p-4 shadow-[0_20px_50px_rgba(31,36,84,0.08)] sm:grid-cols-[140px_minmax(0,1fr)]"
            >
              <div className="relative aspect-square overflow-hidden rounded-[1.6rem] bg-[var(--brand-soft)]">
                <Image alt={item.product.name} className="h-full w-full object-cover" fill sizes="140px" src={item.product.image} />
              </div>
              <div className="flex flex-col justify-between gap-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-[var(--brand-violet-deep)]">
                      {item.product.categoryLabel}
                    </p>
                    <h2 className="mt-2 font-display text-3xl leading-none text-[var(--ink)]">
                      {item.product.name}
                    </h2>
                    <p className="mt-2 text-sm text-[var(--muted)]">
                      {item.selectedColor.name} · {item.selectedSize}
                    </p>
                  </div>
                  <p className="text-2xl font-black text-[var(--brand-violet-deep)]">
                    {formatCurrency(item.product.price * item.quantity)}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <QuantitySelector onChange={(quantity) => updateQuantity(item.id, quantity)} value={item.quantity} />
                  <button
                    className="text-sm font-bold text-[var(--brand-violet-deep)]"
                    onClick={() => removeFromCart(item.id)}
                    type="button"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>

        <aside className="h-fit rounded-[2rem] border border-white/60 bg-white/88 p-6 shadow-[0_24px_60px_rgba(31,36,84,0.1)]">
          <h2 className="font-display text-4xl leading-none text-[var(--ink)]">Resumen</h2>
          <div className="mt-6 space-y-4 text-sm text-[var(--muted)]">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-[var(--ink)]">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span>Envío</span>
              <div className="text-right">
                <p className="font-bold text-[var(--ink)]">{shippingPreview.label}</p>
                <p className="mt-1 max-w-[220px] text-xs leading-5">{shippingPreview.detail}</p>
              </div>
            </div>
            <div className="border-t border-[var(--line)] pt-4">
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-[var(--ink)]">Total parcial</span>
                <span className="text-3xl font-black text-[var(--brand-violet-deep)]">{formatCurrency(subtotal)}</span>
              </div>
              <p className="mt-2 text-xs leading-5">
                El total final de envío se calcula en checkout según peso, volumen, destino y método de entrega.
              </p>
            </div>
          </div>

          <Link className={buttonStyles({ size: "lg", className: "mt-8 w-full" })} href="/checkout">
            Ir a checkout
          </Link>
          <Button className="mt-3 w-full" type="button" variant="secondary">
            Seguir comprando
          </Button>
        </aside>
      </div>
    </div>
  );
}
