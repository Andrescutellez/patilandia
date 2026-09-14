"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useStore } from "@/store/store-provider";

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS_ERROR: "Correo o contraseña incorrectos.",
  NOT_VERIFIED_ERROR: "Todavía no confirmaste tu correo — revisá tu bandeja de entrada."
};

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/cuenta";
  const { login, authError, authErrorCode } = useStore();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    const ok = await login(emailAddress, password);
    setSubmitting(false);
    if (ok) {
      router.push(returnTo);
    }
  }

  const message = authErrorCode ? (ERROR_MESSAGES[authErrorCode] ?? authError) : authError;

  return (
    <form
      className="mx-auto max-w-md space-y-4 rounded-[2rem] border border-white/60 bg-white/84 p-8 shadow-[0_20px_50px_rgba(31,36,84,0.08)]"
      onSubmit={handleSubmit}
    >
      <div className="text-center">
        <h1 className="font-display text-3xl leading-none text-[var(--ink)]">Iniciá sesión</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Para ver tus mascotas, tus Patipuntos y tu historial.</p>
      </div>

      <input
        className="w-full rounded-[0.9rem] border border-[var(--line)] px-4 py-2.5 text-sm"
        onChange={(event) => setEmailAddress(event.target.value)}
        placeholder="tu@correo.com"
        required
        type="email"
        value={emailAddress}
      />

      <input
        className="w-full rounded-[0.9rem] border border-[var(--line)] px-4 py-2.5 text-sm"
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Contraseña"
        required
        type="password"
        value={password}
      />

      {message ? <p className="text-sm text-red-600">{message}</p> : null}

      <Button className="w-full" disabled={submitting} type="submit">
        {submitting ? "Ingresando…" : "Iniciar sesión"}
      </Button>

      <div className="flex items-center justify-between text-sm text-[var(--muted)]">
        <Link className="underline" href="/cuenta/recuperar-contrasena">
          Olvidé mi contraseña
        </Link>
        <Link className="font-bold text-[var(--brand-violet-deep)] underline" href="/cuenta/registrarse">
          Crear cuenta
        </Link>
      </div>
    </form>
  );
}
