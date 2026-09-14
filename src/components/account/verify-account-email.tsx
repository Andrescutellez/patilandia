"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { buttonStyles } from "@/components/ui/button";
import { verifyCustomerAccount } from "@/lib/vendure/shop-client";
import { useStore } from "@/store/store-provider";

export function VerifyAccountEmail() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { refreshCustomer } = useStore();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Falta el enlace de verificación.");
      return;
    }
    verifyCustomerAccount(token)
      .then(async () => {
        await refreshCustomer();
        setStatus("success");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "No pudimos verificar tu cuenta.");
      });
    // refreshCustomer identity is stable across renders (from useMemo in store-provider) but isn't
    // itself a dependency we want to re-trigger this on — only the token from the URL should.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-[2rem] border border-white/60 bg-white/84 p-8 text-center shadow-[0_20px_50px_rgba(31,36,84,0.08)]">
      {status === "loading" ? (
        <p className="text-sm text-[var(--muted)]">Verificando tu cuenta…</p>
      ) : status === "success" ? (
        <>
          <h1 className="font-display text-3xl leading-none text-[var(--ink)]">¡Cuenta confirmada!</h1>
          <p className="text-sm text-[var(--muted)]">
            Si ya habías comprado o cargado mascotas con este correo, ya está todo en tu cuenta.
          </p>
        </>
      ) : (
        <>
          <h1 className="font-display text-3xl leading-none text-[var(--ink)]">No pudimos verificar tu cuenta</h1>
          <p className="text-sm text-[var(--muted)]">{message}</p>
        </>
      )}
      <Link className={buttonStyles({ className: "w-full" })} href="/cuenta">
        Ir a tu cuenta
      </Link>
    </div>
  );
}
