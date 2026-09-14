"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useStore } from "@/store/store-provider";

export function RegisterForm() {
  const { register, authError } = useStore();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    emailAddress: "",
    password: "",
    phoneNumber: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    const ok = await register({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      emailAddress: form.emailAddress.trim(),
      password: form.password,
      phoneNumber: form.phoneNumber.trim() || undefined
    });
    setSubmitting(false);
    if (ok) setDone(true);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-[2rem] border border-white/60 bg-white/84 p-8 text-center shadow-[0_20px_50px_rgba(31,36,84,0.08)]">
        <h1 className="font-display text-3xl leading-none text-[var(--ink)]">Revisá tu correo</h1>
        <p className="text-sm leading-6 text-[var(--muted)]">
          Te mandamos un enlace a <strong>{form.emailAddress}</strong> para confirmar tu cuenta. Si ya
          habías comprado o cargado mascotas con este correo, vas a encontrar todo ahí apenas confirmes.
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
        <h1 className="font-display text-3xl leading-none text-[var(--ink)]">Creá tu cuenta</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Guardá tus mascotas, tus Patipuntos y tu historial en un solo lugar. Seguir comprando como
          invitado también sigue funcionando, esto es opcional.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <input
          className="rounded-[0.9rem] border border-[var(--line)] px-4 py-2.5 text-sm"
          onChange={(event) => setForm((f) => ({ ...f, firstName: event.target.value }))}
          placeholder="Nombre"
          required
          type="text"
          value={form.firstName}
        />
        <input
          className="rounded-[0.9rem] border border-[var(--line)] px-4 py-2.5 text-sm"
          onChange={(event) => setForm((f) => ({ ...f, lastName: event.target.value }))}
          placeholder="Apellido"
          required
          type="text"
          value={form.lastName}
        />
      </div>

      <input
        className="w-full rounded-[0.9rem] border border-[var(--line)] px-4 py-2.5 text-sm"
        onChange={(event) => setForm((f) => ({ ...f, emailAddress: event.target.value }))}
        placeholder="tu@correo.com"
        required
        type="email"
        value={form.emailAddress}
      />

      <input
        className="w-full rounded-[0.9rem] border border-[var(--line)] px-4 py-2.5 text-sm"
        minLength={4}
        onChange={(event) => setForm((f) => ({ ...f, password: event.target.value }))}
        placeholder="Contraseña"
        required
        type="password"
        value={form.password}
      />

      <input
        className="w-full rounded-[0.9rem] border border-[var(--line)] px-4 py-2.5 text-sm"
        onChange={(event) => setForm((f) => ({ ...f, phoneNumber: event.target.value }))}
        placeholder="Teléfono (opcional)"
        type="tel"
        value={form.phoneNumber}
      />

      {authError ? <p className="text-sm text-red-600">{authError}</p> : null}

      <Button className="w-full" disabled={submitting} type="submit">
        {submitting ? "Creando cuenta…" : "Crear cuenta"}
      </Button>

      <p className="text-center text-sm text-[var(--muted)]">
        ¿Ya tenés cuenta?{" "}
        <Link className="font-bold text-[var(--brand-violet-deep)] underline" href="/cuenta/iniciar-sesion">
          Iniciá sesión
        </Link>
      </p>
    </form>
  );
}
