"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonStyles } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { orderStateLabel } from "@/lib/order-state";
import { formatCurrency } from "@/lib/utils";
import { buildOrderInquiryMessage, buildWhatsAppLink, getWhatsappSettings, type WhatsappSettings } from "@/lib/whatsapp";
import { getOrderByCode, type OrderSummary } from "@/lib/vendure/shop-client";

const dateFormatter = new Intl.DateTimeFormat("es-CO", { dateStyle: "long" });

type Status = "loading" | "not-found" | "forbidden" | "ready";

export function OrderTrackingPage({ code }: { code: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [whatsappSettings, setWhatsappSettings] = useState<WhatsappSettings | null>(null);

  useEffect(() => {
    getWhatsappSettings().then(setWhatsappSettings);
  }, []);

  useEffect(() => {
    getOrderByCode(code).then((result) => {
      if (result.forbidden) {
        setStatus("forbidden");
      } else if (!result.order) {
        setStatus("not-found");
      } else {
        setOrder(result.order);
        setStatus("ready");
      }
    });
  }, [code]);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-sm text-[var(--muted)]">Buscando tu pedido…</p>
      </div>
    );
  }

  if (status === "not-found") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl leading-none text-[var(--ink)]">No encontramos ese pedido</h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-8 text-[var(--muted)]">
          Revisa que el código sea correcto. Si acabas de comprar, el enlace de tu correo de
          confirmación siempre funciona.
        </p>
        <Link className={buttonStyles({ size: "lg", className: "mt-8" })} href="/tienda">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl leading-none text-[var(--ink)]">Inicia sesión para ver este pedido</h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-8 text-[var(--muted)]">
          Por seguridad, un pedido solo se puede consultar sin iniciar sesión durante las primeras
          2 horas después de comprarlo. Si tienes cuenta, inicia sesión con el mismo correo con el
          que compraste para verlo cuando quieras.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            className={buttonStyles({ size: "lg" })}
            href={`/cuenta/iniciar-sesion?returnTo=/pedido/${code}`}
          >
            Iniciar sesión
          </Link>
          {whatsappSettings ? (
            <a
              className={buttonStyles({ size: "lg", variant: "secondary" })}
              href={buildWhatsAppLink(whatsappSettings.phoneNumber, buildOrderInquiryMessage(code))}
              rel="noopener noreferrer"
              target="_blank"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Consultar por WhatsApp
            </a>
          ) : null}
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const trackingCode = order.fulfillments.find((fulfillment) => fulfillment.trackingCode)?.trackingCode;

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.3em] text-[var(--brand-violet-deep)]">
          Pedido #{order.code}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <h1 className="font-display text-4xl leading-none text-[var(--ink)]">Tu pedido</h1>
          <span
            className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${
              order.state === "Cancelled"
                ? "bg-red-50 text-red-600"
                : "bg-[var(--brand-soft)] text-[var(--brand-violet-deep)]"
            }`}
          >
            {orderStateLabel(order.state)}
          </span>
        </div>
        {order.orderPlacedAt ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Comprado el {dateFormatter.format(new Date(order.orderPlacedAt))}
          </p>
        ) : null}
      </div>

      {trackingCode ? (
        <div className="rounded-[1.4rem] border border-[var(--brand-violet)] bg-[var(--brand-soft)] p-5">
          <p className="text-sm font-bold text-[var(--brand-violet-deep)]">Número de guía</p>
          <p className="mt-1 text-lg font-black text-[var(--ink)]">{trackingCode}</p>
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-4">
          {order.lines.map((item) => (
            <article
              key={item.id}
              className="grid gap-4 rounded-[1.6rem] border border-white/60 bg-white/82 p-4 sm:grid-cols-[100px_minmax(0,1fr)]"
            >
              <div className="relative aspect-square overflow-hidden rounded-[1.2rem] bg-[var(--brand-soft)]">
                <Image alt={item.product.name} className="h-full w-full object-cover" fill sizes="100px" src={item.product.image} />
              </div>
              <div className="flex flex-col justify-between">
                <div>
                  <h2 className="font-display text-xl leading-none text-[var(--ink)]">{item.product.name}</h2>
                  <p className="mt-2 text-sm text-[var(--muted)]">
                    {item.selectedColor.name ? `${item.selectedColor.name} · ` : ""}
                    {item.selectedSize} · {item.quantity} unidad{item.quantity !== 1 ? "es" : ""}
                  </p>
                </div>
                <p className="mt-2 text-lg font-black text-[var(--brand-violet-deep)]">
                  {formatCurrency(item.product.price * item.quantity)}
                </p>
              </div>
            </article>
          ))}
        </section>

        <aside className="h-fit space-y-4">
          <div className="rounded-[1.6rem] border border-white/60 bg-white/88 p-6">
            <h2 className="font-display text-2xl leading-none text-[var(--ink)]">Resumen</h2>
            <div className="mt-4 space-y-2 text-sm text-[var(--muted)]">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-[var(--ink)]">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Envío</span>
                <span className="font-bold text-[var(--ink)]">{formatCurrency(order.shippingTotal)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-[var(--line)] pt-2 text-base">
                <span className="font-bold text-[var(--ink)]">Total</span>
                <span className="text-xl font-black text-[var(--brand-violet-deep)]">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {order.shippingAddress ? (
            <div className="rounded-[1.6rem] border border-white/60 bg-white/88 p-6">
              <h2 className="font-display text-2xl leading-none text-[var(--ink)]">Enviado a</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
                {order.shippingAddress.fullName}
                <br />
                {order.shippingAddress.streetLine1}
                {order.shippingAddress.streetLine2 ? `, ${order.shippingAddress.streetLine2}` : ""}
                <br />
                {order.shippingAddress.city}
                {order.shippingAddress.province ? `, ${order.shippingAddress.province}` : ""}
              </p>
            </div>
          ) : null}

          {whatsappSettings ? (
            <a
              className="flex w-full items-center justify-center gap-2 rounded-[1.6rem] border border-white/60 bg-white/88 p-4 text-sm font-bold text-[var(--brand-violet-deep)]"
              href={buildWhatsAppLink(whatsappSettings.phoneNumber, buildOrderInquiryMessage(order.code))}
              rel="noopener noreferrer"
              target="_blank"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Consultar por WhatsApp
            </a>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
