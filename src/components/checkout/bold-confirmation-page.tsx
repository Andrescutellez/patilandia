"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { buttonStyles } from "@/components/ui/button";
import { getBoldPaymentStatus, type BoldPaymentStatusValue } from "@/lib/vendure/bold-client";

const POLL_ATTEMPTS = 6;
const POLL_INTERVAL_MS = 2000;

type ScreenState = "checking" | "approved" | "pending" | "failed" | "missing-order";

function screenStateFor(status: BoldPaymentStatusValue, orderSettled: boolean): ScreenState {
  if (orderSettled) return "approved";
  if (status === "REJECTED" || status === "FAILED" || status === "VOIDED") return "failed";
  return "pending";
}

export function BoldConfirmationPage() {
  const searchParams = useSearchParams();
  const orderCode = searchParams.get("bold-order-id");

  const [state, setState] = useState<ScreenState>(orderCode ? "checking" : "missing-order");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!orderCode) return;
    let cancelled = false;

    async function poll() {
      try {
        const result = await getBoldPaymentStatus(orderCode as string);
        if (cancelled) return;
        const next = screenStateFor(result.status, result.orderSettled);
        setState(next);
        // Bold's own docs warn the redirect status isn't definitive and recommend a server-side
        // check — PROCESSING/PENDING means Bold hasn't decided yet (common for PSE), not that
        // anything failed, so this keeps asking for a little while before giving up.
        if (next === "pending") {
          setAttempt((current) => current + 1);
        }
      } catch {
        if (!cancelled) setState("pending");
      }
    }

    if (attempt < POLL_ATTEMPTS) {
      const timer = setTimeout(poll, attempt === 0 ? 0 : POLL_INTERVAL_MS);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }

    return () => {
      cancelled = true;
    };
  }, [orderCode, attempt]);

  if (state === "missing-order") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl leading-none text-[var(--ink)]">No encontramos tu pedido</h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-8 text-[var(--muted)]">
          Este link no tiene la información que esperábamos. Si ya pagaste, escribinos por WhatsApp con tu correo.
        </p>
        <Link className={buttonStyles({ size: "lg", className: "mt-8" })} href="/tienda">
          Volver a la tienda
        </Link>
      </div>
    );
  }

  if (state === "checking" || state === "pending") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-[var(--brand-violet-deep)]">
          Pedido {orderCode}
        </p>
        <h1 className="mt-3 font-display text-4xl leading-none text-[var(--ink)]">Confirmando tu pago…</h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-8 text-[var(--muted)]">
          Bold ya recibió tu pago, estamos esperando la confirmación final. Esto no debería tardar más de unos
          segundos.
        </p>
        {attempt >= POLL_ATTEMPTS ? (
          <button
            className={buttonStyles({ size: "lg", className: "mt-8" })}
            onClick={() => setAttempt(0)}
            type="button"
          >
            Volver a intentar
          </button>
        ) : null}
      </div>
    );
  }

  if (state === "failed") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-red-500">Pedido {orderCode}</p>
        <h1 className="mt-3 font-display text-4xl leading-none text-[var(--ink)]">El pago no se completó</h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-8 text-[var(--muted)]">
          Bold no pudo procesar el pago. Tu carrito sigue guardado — podés volver a intentar con otro medio de pago.
        </p>
        <Link className={buttonStyles({ size: "lg", className: "mt-8" })} href="/checkout">
          Volver al checkout
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
      <p className="text-sm font-black uppercase tracking-[0.3em] text-[var(--brand-violet-deep)]">
        ¡Gracias por tu compra!
      </p>
      <h1 className="mt-3 font-display text-5xl leading-none text-[var(--ink)]">Pedido {orderCode} confirmado</h1>
      <p className="mx-auto mt-4 max-w-md text-base leading-8 text-[var(--muted)]">
        Bold confirmó tu pago. Te escribimos con los detalles de tu pedido.
      </p>
      <Link className={buttonStyles({ size: "lg", className: "mt-8" })} href="/tienda">
        Seguir explorando
      </Link>
    </div>
  );
}
