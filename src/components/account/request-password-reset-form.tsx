"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { requestPasswordReset } from "@/lib/vendure/shop-client";

export function RequestPasswordResetForm() {
  const [emailAddress, setEmailAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await requestPasswordReset(emailAddress);
    } finally {
      // Always shown, whether or not the email exists — see requestPasswordReset's doc comment
      // for why (avoids revealing which addresses have accounts).
      setSubmitting(false);
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-[2rem] border border-white/60 bg-white/84 p-8 text-center shadow-[0_20px_50px_rgba(31,36,84,0.08)]">
        <h1 className="font-display text-3xl leading-none text-[var(--ink)]">Revisá tu correo</h1>
        <p className="text-sm leading-6 text-[var(--muted)]">
          Si <strong>{emailAddress}</strong> tiene una cuenta, te mandamos un enlace para restablecer tu
          contraseña.
        </p>
      </div>
    );
  }

  return (
    <form
      className="mx-auto max-w-md space-y-4 rounded-[2rem] border border-white/60 bg-white/84 p-8 shadow-[0_20px_50px_rgba(31,36,84,0.08)]"
      onSubmit={handleSubmit}
    >
      <div className="text-center">
        <h1 className="font-display text-3xl leading-none text-[var(--ink)]">Recuperar contraseña</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Te mandamos un enlace para elegir una nueva.</p>
      </div>

      <input
        className="w-full rounded-[0.9rem] border border-[var(--line)] px-4 py-2.5 text-sm"
        onChange={(event) => setEmailAddress(event.target.value)}
        placeholder="tu@correo.com"
        required
        type="email"
        value={emailAddress}
      />

      <Button className="w-full" disabled={submitting} type="submit">
        {submitting ? "Enviando…" : "Enviarme el enlace"}
      </Button>
    </form>
  );
}
