"use client";

import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { getShippingPreview } from "@/lib/shipping";
import { formatCurrency } from "@/lib/utils";
import { useStore } from "@/store/store-provider";

export function CheckoutPage() {
  const { cart, subtotal } = useStore();
  const shippingPreview = getShippingPreview(cart);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.3em] text-[var(--brand-violet-deep)]">Checkout</p>
        <h1 className="mt-3 font-display text-5xl leading-none text-[var(--ink)]">Listo para completar la orden</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          {[
            {
              title: "Datos del cliente",
              fields: ["Nombre completo", "Correo electrónico", "Teléfono"]
            },
            {
              title: "Dirección",
              fields: ["Dirección", "Ciudad", "Departamento", "Notas de entrega"]
            },
            {
              title: "Método de envío",
              fields: ["Entrega local", "Transportadora estándar", "Cotización para productos pesados"]
            },
            {
              title: "Método de pago",
              fields: ["Wompi", "Mercado Pago", "Pago contraentrega si aplica"]
            }
          ].map((section) => (
            <div
              key={section.title}
              className="rounded-[2rem] border border-white/60 bg-white/84 p-6 shadow-[0_20px_50px_rgba(31,36,84,0.08)]"
            >
              <h2 className="font-display text-4xl leading-none text-[var(--ink)]">{section.title}</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {section.fields.map((field) => (
                  <label key={field} className="grid gap-2">
                    <span className="text-sm font-bold text-[var(--ink)]">{field}</span>
                    <input
                      className="h-12 rounded-2xl border border-[var(--line)] px-4 text-sm outline-none"
                      placeholder={field}
                      type="text"
                    />
                  </label>
                ))}
              </div>
            </div>
          ))}
        </section>

        <aside className="h-fit rounded-[2rem] border border-white/60 bg-white/88 p-6 shadow-[0_24px_60px_rgba(31,36,84,0.1)]">
          <h2 className="font-display text-4xl leading-none text-[var(--ink)]">Resumen del pedido</h2>
          <div className="mt-6 space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <p className="font-bold text-[var(--ink)]">{item.product.name}</p>
                  <p className="mt-1 text-[var(--muted)]">
                    {item.quantity} × {formatCurrency(item.product.price)}
                  </p>
                </div>
                <span className="font-bold text-[var(--ink)]">{formatCurrency(item.product.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3 border-t border-[var(--line)] pt-5 text-sm text-[var(--muted)]">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-[var(--ink)]">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <span>Envío</span>
              <div className="text-right">
                <p className="font-bold text-[var(--ink)]">{shippingPreview.label}</p>
                <p className="mt-1 max-w-[210px] text-xs leading-5">{shippingPreview.detail}</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-[var(--line)] pt-4">
              <span className="text-base font-bold text-[var(--ink)]">Total parcial</span>
              <span className="text-3xl font-black text-[var(--brand-violet-deep)]">{formatCurrency(subtotal)}</span>
            </div>
          </div>

          <button className={buttonStyles({ size: "lg", className: "mt-8 w-full" })} type="button">
            Continuar con pago seguro
          </button>
          <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
            Los campos y el resumen quedan listos para conectarse a checkout real de Medusa sin guardar
            información sensible en el frontend.
          </p>
          <Link className={buttonStyles({ variant: "ghost", className: "mt-4 w-full" })} href="/carrito">
            Volver al carrito
          </Link>
        </aside>
      </div>
    </div>
  );
}
