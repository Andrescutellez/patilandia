"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonStyles } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { getMyLoyaltyAccount, getLoyaltySettings, type LoyaltyAccount, type LoyaltySettings } from "@/lib/vendure/patipuntos-client";
import { getStoredAccountEmail } from "@/lib/vendure/pets-client";
import { useStore } from "@/store/store-provider";

/** Same self-fetching pattern as AccountPetsCard — prefers a real logged-in session's email, falls
 *  back to the shared email-identity key for guests, fails soft to "no points yet" if there's no
 *  known email or Vendure is unreachable. */
export function AccountPatipuntosCard() {
  const { activeCustomer, isAuthReady } = useStore();
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [hasEmail, setHasEmail] = useState(false);

  useEffect(() => {
    if (!isAuthReady) return;
    const email = activeCustomer?.emailAddress ?? getStoredAccountEmail();
    if (!email) return;
    setHasEmail(true);
    Promise.all([getMyLoyaltyAccount(email), getLoyaltySettings()])
      .then(([acc, sett]) => {
        setAccount(acc);
        setSettings(sett);
      })
      .catch(() => {
        // Vendure unreachable or the account doesn't exist yet — card just shows the empty state.
      });
  }, [activeCustomer, isAuthReady]);

  const balance = account?.balance ?? 0;
  const value = settings ? balance * settings.pointValue : 0;

  return (
    <div className="rounded-[2rem] border border-white/60 bg-white/82 p-6 shadow-[0_20px_50px_rgba(31,36,84,0.08)]">
      <h2 className="font-display text-3xl leading-none text-[var(--ink)]">Tus Patipuntos</h2>

      {!hasEmail || !account ? (
        <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
          Comprá o contanos de tu mascota para empezar a ganar Patipuntos.
        </p>
      ) : (
        <>
          <p className="mt-3 text-4xl font-black text-[var(--brand-violet-deep)]">{balance}</p>
          <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
            {settings ? `Equivalen a ${formatCurrency(value)} de descuento` : "puntos"}
          </p>
        </>
      )}

      <Link className={buttonStyles({ variant: "secondary", size: "sm", className: "mt-5 w-full" })} href="/cuenta/patipuntos">
        Ver Patipuntos
      </Link>
    </div>
  );
}
