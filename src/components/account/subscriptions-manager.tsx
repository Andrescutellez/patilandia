"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { SubscriptionAddressPicker } from "@/components/product/subscription-address-picker";
import { getCustomerAddresses, type CustomerAddress } from "@/lib/vendure/shop-client";
import {
  buyNow,
  cancelSubscription,
  getMySubscriptions,
  pauseSubscription,
  resumeSubscription,
  SUBSCRIPTION_FREQUENCIES_DAYS,
  updateSubscriptionAddress,
  updateSubscriptionFrequency,
  updateSubscriptionQuantity,
  type NewSubscriptionAddressInput,
  type Subscription
} from "@/lib/vendure/subscriptions-client";
import { useStore } from "@/store/store-provider";

const EMPTY_NEW_ADDRESS: NewSubscriptionAddressInput = {
  fullName: "",
  streetLine1: "",
  city: "",
  province: "",
  postalCode: "",
  phoneNumber: "",
  countryCode: "CO",
  neighborhood: "",
  deliveryNotes: ""
};

const statusLabels: Record<Subscription["status"], string> = {
  ACTIVE: "Activa",
  PAUSED: "Pausada",
  CANCELLED: "Cancelada"
};

const dateFormatter = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium" });

function isDue(subscription: Subscription): boolean {
  return subscription.status === "ACTIVE" && new Date(subscription.nextRenewalDate).getTime() <= Date.now();
}

function LoginGate() {
  return (
    <div className="mx-auto max-w-md space-y-4 rounded-[2rem] border border-white/60 bg-white/84 p-6 text-center shadow-[0_20px_50px_rgba(31,36,84,0.08)]">
      <h1 className="font-display text-3xl leading-none text-[var(--ink)]">Tus suscripciones</h1>
      <p className="text-sm text-[var(--muted)]">
        Necesitás una cuenta para gestionar tus recompras programadas.
      </p>
      <div className="flex justify-center gap-4">
        <Link className="font-bold text-[var(--brand-violet-deep)] underline" href="/cuenta/iniciar-sesion">
          Iniciar sesión
        </Link>
        <Link className="font-bold text-[var(--brand-violet-deep)] underline" href="/cuenta/registrarse">
          Crear cuenta
        </Link>
      </div>
    </div>
  );
}

function SubscriptionCard({
  subscription,
  addresses,
  onChange
}: {
  subscription: Subscription;
  addresses: CustomerAddress[];
  onChange: (next: Subscription) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressId, setAddressId] = useState(subscription.shippingAddress?.id ?? "");
  const [useNewAddress, setUseNewAddress] = useState(!subscription.shippingAddress);
  const [newAddress, setNewAddress] = useState<NewSubscriptionAddressInput>(EMPTY_NEW_ADDRESS);

  async function run(action: () => Promise<Subscription>) {
    setBusy(true);
    setError("");
    try {
      onChange(await action());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos actualizar la suscripción.");
    } finally {
      setBusy(false);
    }
  }

  async function handleBuyNow() {
    setBusy(true);
    setError("");
    try {
      await buyNow(subscription);
      window.location.href = "/checkout";
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos preparar tu compra.");
      setBusy(false);
    }
  }

  async function handleSaveAddress() {
    await run(() =>
      updateSubscriptionAddress({
        id: subscription.id,
        addressId: useNewAddress ? undefined : addressId || undefined,
        newAddress: useNewAddress ? newAddress : undefined
      })
    );
    setEditingAddress(false);
  }

  return (
    <li className="space-y-4 rounded-[1.6rem] border border-white/60 bg-white/84 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-2xl leading-none text-[var(--ink)]">{subscription.productName}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {subscription.quantity} unidad{subscription.quantity !== 1 ? "es" : ""} · cada{" "}
            {subscription.frequencyDays} días
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.14em] ${
            subscription.status === "ACTIVE"
              ? "bg-[var(--brand-soft)] text-[var(--brand-violet-deep)]"
              : "bg-black/5 text-[var(--muted)]"
          }`}
        >
          {statusLabels[subscription.status]}
        </span>
      </div>

      <p className="text-sm text-[var(--ink)]">
        Próxima recompra: <span className="font-bold">{dateFormatter.format(new Date(subscription.nextRenewalDate))}</span>
        {isDue(subscription) ? <span className="ml-2 font-bold text-[var(--brand-violet-deep)]">¡Ya disponible!</span> : null}
      </p>

      {subscription.shippingAddress ? (
        <p className="text-sm text-[var(--muted)]">
          Se envía a {subscription.shippingAddress.fullName} — {subscription.shippingAddress.streetLine1},{" "}
          {subscription.shippingAddress.city}
        </p>
      ) : (
        <p className="text-sm text-red-600">Esta suscripción no tiene una dirección válida — elegí una nueva.</p>
      )}

      {subscription.status !== "CANCELLED" ? (
        <div className="flex flex-wrap items-center gap-3">
          <QuantitySelector
            onChange={(quantity) => run(() => updateSubscriptionQuantity(subscription.id, quantity))}
            value={subscription.quantity}
          />
          <select
            className="h-11 rounded-xl border border-[var(--line)] px-3 text-sm"
            disabled={busy}
            onChange={(event) => run(() => updateSubscriptionFrequency(subscription.id, Number(event.target.value)))}
            value={subscription.frequencyDays}
          >
            {SUBSCRIPTION_FREQUENCIES_DAYS.map((days) => (
              <option key={days} value={days}>
                Cada {days} días
              </option>
            ))}
          </select>
          <Button onClick={() => setEditingAddress((current) => !current)} size="sm" type="button" variant="secondary">
            {editingAddress ? "Cancelar edición" : "Cambiar dirección"}
          </Button>
        </div>
      ) : null}

      {editingAddress ? (
        <div className="space-y-3 border-t border-[var(--line)] pt-4">
          <SubscriptionAddressPicker
            addressId={addressId}
            addresses={addresses}
            newAddress={newAddress}
            onChangeNewAddress={setNewAddress}
            onSelectExisting={(id) => {
              setUseNewAddress(false);
              setAddressId(id);
            }}
            onUseNewAddress={() => setUseNewAddress(true)}
            useNewAddress={useNewAddress}
          />
          <Button disabled={busy} onClick={handleSaveAddress} size="sm" type="button">
            Guardar dirección
          </Button>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap gap-3 border-t border-[var(--line)] pt-4">
        {isDue(subscription) ? (
          <Button disabled={busy} onClick={handleBuyNow} size="sm" type="button">
            Comprar ahora
          </Button>
        ) : null}
        {subscription.status === "ACTIVE" ? (
          <Button disabled={busy} onClick={() => run(() => pauseSubscription(subscription.id))} size="sm" type="button" variant="secondary">
            Pausar
          </Button>
        ) : subscription.status === "PAUSED" ? (
          <Button disabled={busy} onClick={() => run(() => resumeSubscription(subscription.id))} size="sm" type="button" variant="secondary">
            Reanudar
          </Button>
        ) : null}
        {subscription.status !== "CANCELLED" ? (
          <Button
            disabled={busy}
            onClick={() => {
              if (window.confirm("¿Cancelar esta recompra programada?")) {
                run(() => cancelSubscription(subscription.id));
              }
            }}
            size="sm"
            type="button"
            variant="ghost"
          >
            Cancelar
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export function SubscriptionsManager() {
  const { isAuthReady, isLoggedIn } = useStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyingNowId, setBuyingNowId] = useState<string | null>(null);
  const [deepLinkError, setDeepLinkError] = useState("");

  useEffect(() => {
    if (!isAuthReady || !isLoggedIn) return;
    Promise.all([getMySubscriptions(), getCustomerAddresses()])
      .then(([items, addressItems]) => {
        setSubscriptions(items);
        setAddresses(addressItems);
      })
      .finally(() => setLoading(false));
  }, [isAuthReady, isLoggedIn]);

  // Deep link from the reminder email — see subscription-reminder-handler.ts's
  // "?comprar={{ subscriptionId }}" link.
  useEffect(() => {
    const comprarId = searchParams.get("comprar");
    if (!comprarId || loading || subscriptions.length === 0 || buyingNowId) return;
    const target = subscriptions.find((subscription) => subscription.id === comprarId);
    if (!target) return;
    setBuyingNowId(comprarId);
    setDeepLinkError("");
    buyNow(target)
      .then(() => router.push("/checkout"))
      .catch((err) => {
        // E.g. stock ran out between the reminder email being sent and the click — surfaced here
        // instead of silently doing nothing, since this path (unlike the button in each card) never
        // gets a chance to show its own inline error.
        setDeepLinkError(err instanceof Error ? err.message : "No pudimos preparar tu compra.");
        setBuyingNowId(null);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, loading, subscriptions]);

  if (!isAuthReady || loading) {
    return null;
  }

  if (!isLoggedIn) {
    return <LoginGate />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl leading-none text-[var(--ink)]">Tus suscripciones</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Gestioná tus recompras programadas — pausá, cambiá cantidad/frecuencia/dirección, o cancelá
          cuando quieras.
        </p>
      </div>

      {buyingNowId ? (
        <p className="rounded-2xl bg-[var(--brand-soft)] px-4 py-3 text-sm font-semibold text-[var(--brand-violet-deep)]">
          Preparando tu compra…
        </p>
      ) : null}

      {deepLinkError ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{deepLinkError}</p>
      ) : null}

      {subscriptions.length === 0 ? (
        <p className="rounded-[1.4rem] bg-[var(--brand-soft)] p-6 text-sm text-[var(--muted)]">
          Todavía no tenés recompras programadas. Buscá el panel &ldquo;🔄 Recompra programada&rdquo; en
          los productos que lo admiten.
        </p>
      ) : (
        <ul className="space-y-4">
          {subscriptions.map((subscription) => (
            <SubscriptionCard
              addresses={addresses}
              key={subscription.id}
              onChange={(next) =>
                setSubscriptions((current) => current.map((item) => (item.id === next.id ? next : item)))
              }
              subscription={subscription}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
