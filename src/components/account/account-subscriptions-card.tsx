"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonStyles } from "@/components/ui/button";
import { getMySubscriptions } from "@/lib/vendure/subscriptions-client";
import { useStore } from "@/store/store-provider";

/** Unlike every other account card, this only ever loads for a real logged-in session —
 *  suscripciones has no guest fallback (see subscription.service.ts for why). */
export function AccountSubscriptionsCard() {
  const { isAuthReady, isLoggedIn } = useStore();
  const [activeCount, setActiveCount] = useState<number | null>(null);

  useEffect(() => {
    if (!isAuthReady || !isLoggedIn) return;
    getMySubscriptions()
      .then((items) => setActiveCount(items.filter((item) => item.status === "ACTIVE").length))
      .catch(() => {
        // Vendure unreachable — card just shows the empty state.
      });
  }, [isAuthReady, isLoggedIn]);

  return (
    <div className="rounded-[2rem] border border-white/60 bg-white/82 p-6 shadow-[0_20px_50px_rgba(31,36,84,0.08)]">
      <h2 className="font-display text-3xl leading-none text-[var(--ink)]">Recompras programadas</h2>

      {!isLoggedIn ? (
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          Iniciá sesión para programar recompras de tus productos favoritos.
        </p>
      ) : activeCount ? (
        <p className="mt-3 text-4xl font-black text-[var(--brand-violet-deep)]">{activeCount}</p>
      ) : (
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          Todavía no tenés recompras activas — buscá el panel &ldquo;🔄 Recompra programada&rdquo; en los
          productos que lo admiten.
        </p>
      )}

      <Link
        className={buttonStyles({ variant: "secondary", size: "sm", className: "mt-5 w-full" })}
        href="/cuenta/suscripciones"
      >
        Ver suscripciones
      </Link>
    </div>
  );
}
