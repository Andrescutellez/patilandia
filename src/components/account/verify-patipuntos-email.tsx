"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { buttonStyles } from "@/components/ui/button";
import { confirmLoyaltyEmailVerification } from "@/lib/vendure/patipuntos-client";

export function VerifyPatipuntosEmail() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Falta el enlace de verificación.");
      return;
    }
    confirmLoyaltyEmailVerification(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "No pudimos verificar tu correo.");
      });
  }, [token]);

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-[2rem] border border-white/60 bg-white/84 p-8 text-center shadow-[0_20px_50px_rgba(31,36,84,0.08)]">
      {status === "loading" ? (
        <p className="text-sm text-[var(--muted)]">Verificando tu correo…</p>
      ) : status === "success" ? (
        <>
          <h1 className="font-display text-3xl leading-none text-[var(--ink)]">¡Correo verificado!</h1>
          <p className="text-sm text-[var(--muted)]">Ya podés canjear tus Patipuntos en tu próxima compra.</p>
        </>
      ) : (
        <>
          <h1 className="font-display text-3xl leading-none text-[var(--ink)]">No pudimos verificar tu correo</h1>
          <p className="text-sm text-[var(--muted)]">{message}</p>
        </>
      )}
      <Link className={buttonStyles({ className: "w-full" })} href="/cuenta/patipuntos">
        Ver mis Patipuntos
      </Link>
    </div>
  );
}
