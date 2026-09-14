"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button, buttonStyles } from "@/components/ui/button";
import { resetPassword } from "@/lib/vendure/shop-client";
import { useStore } from "@/store/store-provider";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const { refreshCustomer } = useStore();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!token) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-[2rem] border border-white/60 bg-white/84 p-8 text-center shadow-[0_20px_50px_rgba(31,36,84,0.08)]">
        <h1 className="font-display text-3xl leading-none text-[var(--ink)]">Enlace inválido</h1>
        <p className="text-sm text-[var(--muted)]">Falta el enlace de restablecimiento de contraseña.</p>
        <Link className={buttonStyles({ className: "w-full" })} href="/cuenta/recuperar-contrasena">
          Pedir uno nuevo
        </Link>
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await resetPassword(token as string, password);
      await refreshCustomer();
      router.push("/cuenta");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos restablecer tu contraseña.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="mx-auto max-w-md space-y-4 rounded-[2rem] border border-white/60 bg-white/84 p-8 shadow-[0_20px_50px_rgba(31,36,84,0.08)]"
      onSubmit={handleSubmit}
    >
      <div className="text-center">
        <h1 className="font-display text-3xl leading-none text-[var(--ink)]">Elegí tu nueva contraseña</h1>
      </div>

      <input
        className="w-full rounded-[0.9rem] border border-[var(--line)] px-4 py-2.5 text-sm"
        minLength={4}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Nueva contraseña"
        required
        type="password"
        value={password}
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button className="w-full" disabled={submitting} type="submit">
        {submitting ? "Guardando…" : "Guardar contraseña"}
      </Button>
    </form>
  );
}
