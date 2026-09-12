"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  getLoyaltyRules,
  getLoyaltySettings,
  getMyLoyaltyAccount,
  getMyLoyaltyTransactions,
  requestLoyaltyEmailVerification,
  type LoyaltyAccount,
  type LoyaltyRule,
  type LoyaltySettings,
  type LoyaltyTransaction
} from "@/lib/vendure/patipuntos-client";
import { getStoredAccountEmail, storeAccountEmail } from "@/lib/vendure/pets-client";

const dateFormatter = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" });

const typeLabels: Record<string, string> = {
  EARN: "Ganaste",
  REDEEM: "Canjeaste",
  REVERSAL: "Ajuste",
  ADJUSTMENT: "Ajuste",
  EXPIRATION: "Vencieron"
};

function EmailGate({ onSubmit }: { onSubmit: (email: string) => void }) {
  const [email, setEmail] = useState("");

  return (
    <form
      className="mx-auto max-w-md space-y-4 rounded-[2rem] border border-white/60 bg-white/84 p-6 text-center shadow-[0_20px_50px_rgba(31,36,84,0.08)]"
      onSubmit={(event) => {
        event.preventDefault();
        if (email.trim()) onSubmit(email.trim());
      }}
    >
      <h1 className="font-display text-3xl leading-none text-[var(--ink)]">Tus Patipuntos</h1>
      <p className="text-sm text-[var(--muted)]">
        Ingresá tu correo para ver tu saldo. Usamos tu correo para identificarte, igual que en el carrito y en
        Mascotas.
      </p>
      <input
        className="w-full rounded-[0.9rem] border border-[var(--line)] px-4 py-2.5 text-sm"
        onChange={(event) => setEmail(event.target.value)}
        placeholder="tu@correo.com"
        required
        type="email"
        value={email}
      />
      <Button className="w-full" type="submit">
        Continuar
      </Button>
    </form>
  );
}

function VerificationBanner({ email, onVerified }: { email: string; onVerified: () => void }) {
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  async function handleRequest() {
    setSending(true);
    setStatus("idle");
    try {
      await requestLoyaltyEmailVerification(email);
      setStatus("sent");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "No pudimos enviar el correo.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-[1.4rem] border border-[var(--brand-gold)] bg-[var(--brand-soft)] p-5">
      <p className="font-display text-xl leading-none text-[var(--ink)]">Verificá tu correo para poder canjear</p>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
        Te vamos a mandar un enlace a <strong>{email}</strong>. Con eso alcanza — no hace falta contraseña.
      </p>
      {status === "sent" ? (
        <p className="mt-3 text-sm font-bold text-[var(--brand-violet-deep)]">
          Listo, revisá tu bandeja de entrada y hacé click en el enlace.
        </p>
      ) : (
        <Button className="mt-3" disabled={sending} onClick={handleRequest} type="button" size="sm">
          {sending ? "Enviando…" : "Enviarme el enlace"}
        </Button>
      )}
      {status === "error" ? <p className="mt-2 text-sm text-red-600">{message}</p> : null}
      <button
        className="mt-3 block text-xs text-[var(--muted)] underline"
        onClick={onVerified}
        type="button"
      >
        Ya hice click en el enlace — actualizar
      </button>
    </div>
  );
}

function PatipuntosDashboard({ email }: { email: string }) {
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [settings, setSettings] = useState<LoyaltySettings | null>(null);
  const [rules, setRules] = useState<LoyaltyRule[]>([]);
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [acc, sett, ruleList, txs] = await Promise.all([
        getMyLoyaltyAccount(email),
        getLoyaltySettings(),
        getLoyaltyRules(),
        getMyLoyaltyTransactions(email)
      ]);
      setAccount(acc);
      setSettings(sett);
      setRules(ruleList);
      setTransactions(txs);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  if (loading || !account || !settings) {
    return <p className="text-sm text-[var(--muted)]">Cargando…</p>;
  }

  const value = account.balance * settings.pointValue;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl leading-none text-[var(--ink)]">Tus Patipuntos</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">Sesión iniciada como {email}</p>
      </div>

      <div className="rounded-[2rem] border border-white/60 bg-white/84 p-8 text-center shadow-[0_20px_50px_rgba(31,36,84,0.08)]">
        <p className="text-6xl font-black text-[var(--brand-violet-deep)]">{account.balance}</p>
        <p className="mt-2 text-lg text-[var(--muted)]">Patipuntos</p>
        <p className="mt-4 text-2xl font-bold text-[var(--ink)]">Equivalentes a {formatCurrency(value)} de descuento</p>
      </div>

      {!account.eligible ? (
        <div className="rounded-[1.4rem] border border-[var(--line)] bg-white p-5">
          <p className="font-display text-xl leading-none text-[var(--ink)]">Te falta para poder canjear</p>
          <ul className="mt-3 space-y-1 text-sm text-[var(--muted)]">
            {account.redemptionBlockedReasons.map((reason) => (
              <li key={reason}>• {reason}</li>
            ))}
          </ul>
          {account.redemptionBlockedReasons.some((reason) => reason.toLowerCase().includes("correo")) ? (
            <div className="mt-4">
              <VerificationBanner email={email} onVerified={load} />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-[1.4rem] border border-[var(--brand-violet)] bg-[var(--brand-soft)] p-5">
          <p className="font-display text-xl leading-none text-[var(--brand-violet-deep)]">
            Ya podés canjear tus Patipuntos
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Elegí cuántos usar en el checkout de tu próxima compra — hasta el {settings.maxRedemptionPercentage}% del
            subtotal.
          </p>
        </div>
      )}

      <div className="rounded-[1.4rem] border border-[var(--line)] bg-white p-5">
        <h2 className="font-display text-2xl leading-none text-[var(--ink)]">Cómo ganar puntos</h2>
        <ul className="mt-4 space-y-3">
          {rules.map((rule) => (
            <li className="flex items-start justify-between gap-4 text-sm" key={rule.code}>
              <span className="text-[var(--muted)]">{rule.description}</span>
              <span className="shrink-0 font-bold text-[var(--brand-violet-deep)]">
                {rule.kind === "FLAT" ? `+${rule.points}` : `+1 c/${formatCurrency((rule.currencyMinorUnitsPerPoint ?? 0) / 100)}`}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-[1.4rem] border border-[var(--line)] bg-white p-5">
        <h2 className="font-display text-2xl leading-none text-[var(--ink)]">Historial de movimientos</h2>
        {transactions.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--muted)]">Todavía no tenés movimientos.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--line)]">
            {transactions.map((tx) => (
              <li className="flex items-center justify-between gap-4 py-3 text-sm" key={tx.id}>
                <div>
                  <p className="font-medium text-[var(--ink)]">
                    {typeLabels[tx.type] ?? tx.type} {tx.ruleCode ? `— ${tx.ruleCode}` : ""}
                  </p>
                  <p className="text-xs text-[var(--muted)]">{dateFormatter.format(new Date(tx.createdAt))}</p>
                </div>
                <span className={tx.amount >= 0 ? "font-bold text-emerald-600" : "font-bold text-red-600"}>
                  {tx.amount >= 0 ? "+" : ""}
                  {tx.amount}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export function PatipuntosManager() {
  const [email, setEmail] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setEmail(getStoredAccountEmail());
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  if (!email) {
    return (
      <EmailGate
        onSubmit={(value) => {
          storeAccountEmail(value);
          setEmail(value);
        }}
      />
    );
  }

  return <PatipuntosDashboard email={email} />;
}
