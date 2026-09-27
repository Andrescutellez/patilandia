"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonStyles } from "@/components/ui/button";
import { getMyOrders } from "@/lib/vendure/shop-client";
import { useStore } from "@/store/store-provider";

/** Requires a real logged-in session, same as AccountSubscriptionsCard — Customer.orders only
 *  exists for a native account, there's no guest-email equivalent (see shop-client.ts's
 *  getMyOrders). A guest can still track a single order by code via "/pedido/[code]" (the link in
 *  their confirmation email), just not see a full list here. */
export function AccountOrdersCard() {
  const { isAuthReady, isLoggedIn } = useStore();
  const [orderCount, setOrderCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthReady || !isLoggedIn) return;
    getMyOrders()
      .then((orders) => setOrderCount(orders.length))
      .catch(() => {
        // Vendure unreachable — card just shows the empty state.
      });
  }, [isAuthReady, isLoggedIn]);

  return (
    <div className="rounded-[2rem] border border-white/60 bg-white/82 p-6 shadow-[0_20px_50px_rgba(31,36,84,0.08)]">
      <h2 className="font-display text-3xl leading-none text-[var(--ink)]">Órdenes y seguimiento</h2>

      {!isLoggedIn ? (
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          Inicia sesión para ver el historial y el estado de tus pedidos.
        </p>
      ) : orderCount ? (
        <p className="mt-3 text-4xl font-black text-[var(--brand-violet-deep)]">{orderCount}</p>
      ) : (
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">Todavía no tienes pedidos.</p>
      )}

      <Link
        className={buttonStyles({ variant: "secondary", size: "sm", className: "mt-5 w-full" })}
        href={isLoggedIn ? "/cuenta/pedidos" : "/cuenta/iniciar-sesion?returnTo=/cuenta/pedidos"}
      >
        Ver mis pedidos
      </Link>
    </div>
  );
}
