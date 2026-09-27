"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { formatCurrency } from "@/lib/utils";
import { orderStateLabel } from "@/lib/order-state";
import { getMyOrders, type OrderSummary } from "@/lib/vendure/shop-client";
import { useStore } from "@/store/store-provider";

const dateFormatter = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" });

function LoginGate() {
  return (
    <div className="mx-auto max-w-md space-y-4 rounded-[2rem] border border-white/60 bg-white/84 p-6 text-center shadow-[0_20px_50px_rgba(31,36,84,0.08)]">
      <h1 className="font-display text-3xl leading-none text-[var(--ink)]">Tus pedidos</h1>
      <p className="text-sm text-[var(--muted)]">Inicia sesión para ver el historial de tus pedidos.</p>
      <div className="flex justify-center gap-4">
        <Link className="font-bold text-[var(--brand-violet-deep)] underline" href="/cuenta/iniciar-sesion?returnTo=/cuenta/pedidos">
          Iniciar sesión
        </Link>
        <Link className="font-bold text-[var(--brand-violet-deep)] underline" href="/cuenta/registrarse">
          Crear cuenta
        </Link>
      </div>
    </div>
  );
}

export function OrdersManager() {
  const { isAuthReady, isLoggedIn } = useStore();
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthReady || !isLoggedIn) return;
    getMyOrders()
      .then(setOrders)
      .finally(() => setLoading(false));
  }, [isAuthReady, isLoggedIn]);

  if (!isAuthReady || (isLoggedIn && loading)) {
    return null;
  }

  if (!isLoggedIn) {
    return <LoginGate />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl leading-none text-[var(--ink)]">Tus pedidos</h1>
      </div>

      {orders.length === 0 ? (
        <p className="rounded-[1.4rem] bg-[var(--brand-soft)] p-6 text-sm text-[var(--muted)]">
          Todavía no tienes pedidos. Cuando compres algo, lo vas a ver acá.
        </p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                className="flex flex-wrap items-center justify-between gap-4 rounded-[1.6rem] border border-white/60 bg-white/84 p-5 transition hover:border-[var(--brand-violet)]"
                href={`/pedido/${order.code}`}
              >
                <div>
                  <p className="font-display text-2xl leading-none text-[var(--ink)]">Pedido #{order.code}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    {order.orderPlacedAt ? dateFormatter.format(new Date(order.orderPlacedAt)) : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-black uppercase tracking-[0.14em] text-[var(--brand-violet-deep)]">
                    {orderStateLabel(order.state)}
                  </span>
                  <span className="text-lg font-bold text-[var(--ink)]">{formatCurrency(order.total)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
