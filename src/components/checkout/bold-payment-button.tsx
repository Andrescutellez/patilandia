"use client";

import { useEffect, useRef } from "react";

import type { BoldCheckoutData } from "@/lib/vendure/bold-client";

const BOLD_LIBRARY_URL = "https://checkout.bold.co/library/boldPaymentButton.js";

/**
 * Mounts Bold's "Botón de Pagos" — a third-party widget that auto-scans the DOM for
 * `<script data-bold-button>` tags at the moment its own library script runs, then replaces them
 * with a real button. React doesn't execute injected `<script>` tags on its own, and appending a
 * NEW `<script src>` element (even pointing at an already-cached URL) does re-run it — so both the
 * library and the button descriptor are (re-)created together on every mount/checkout attempt,
 * in that order, so the freshly-executed library sees this specific button in the DOM already.
 */
export function BoldPaymentButton({ checkout }: { checkout: BoldCheckoutData }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const buttonScript = document.createElement("script");
    buttonScript.dataset.boldButton = "";
    buttonScript.dataset.apiKey = checkout.apiKey;
    buttonScript.dataset.orderId = checkout.orderId;
    buttonScript.dataset.currency = checkout.currency;
    buttonScript.dataset.amount = String(checkout.amount);
    buttonScript.dataset.integritySignature = checkout.signature;
    buttonScript.dataset.redirectionUrl = checkout.redirectionUrl;
    buttonScript.dataset.description = `Pedido ${checkout.orderId} — Patilandia`;
    container.appendChild(buttonScript);

    const libraryScript = document.createElement("script");
    libraryScript.src = BOLD_LIBRARY_URL;
    libraryScript.async = true;
    container.appendChild(libraryScript);

    return () => {
      container.replaceChildren();
    };
    // Re-mount the widget from scratch whenever the checkout data changes (e.g. cart total
    // changed and a fresh signature was generated) — a stale signature would just get rejected
    // by Bold, so there's no reason to try to patch the existing button in place.
  }, [checkout]);

  return <div className="flex w-full justify-center" ref={containerRef} />;
}
