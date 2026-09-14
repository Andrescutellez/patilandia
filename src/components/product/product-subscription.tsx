"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { SubscriptionAddressPicker } from "@/components/product/subscription-address-picker";
import { VariantPicker } from "@/components/product/variant-picker";
import {
  createSubscription,
  SUBSCRIPTION_FREQUENCIES_DAYS,
  type NewSubscriptionAddressInput
} from "@/lib/vendure/subscriptions-client";
import { getCustomerAddresses, type CustomerAddress } from "@/lib/vendure/shop-client";
import type { ProductColor, ProductSize, StorefrontProduct } from "@/types/commerce";

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

/** The "🔄 Recompra programada" panel — only ever rendered by ProductDetail when the product has
 *  Product.customFields.repurchaseEnabled, so there's no "disabled" state to handle here, only
 *  "not rendered at all" (same convention as ProductPersonalization). Requires a real logged-in
 *  session — see subscription.service.ts for why a guest can't use this. */
export function ProductSubscription({
  product,
  isLoggedIn
}: {
  product: StorefrontProduct;
  isLoggedIn: boolean;
}) {
  const [selectedColor, setSelectedColor] = useState<ProductColor>(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState<ProductSize>(product.sizes[1] ?? product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [frequencyDays, setFrequencyDays] = useState<number>(SUBSCRIPTION_FREQUENCIES_DAYS[1]);

  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [addressId, setAddressId] = useState<string>("");
  const [useNewAddress, setUseNewAddress] = useState(false);
  const [newAddress, setNewAddress] = useState<NewSubscriptionAddressInput>(EMPTY_NEW_ADDRESS);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    getCustomerAddresses()
      .then((items) => {
        setAddresses(items);
        if (items.length > 0) {
          setAddressId(items[0].id);
        } else {
          setUseNewAddress(true);
        }
      })
      .catch(() => setUseNewAddress(true));
  }, [isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <div className="space-y-3 rounded-[2rem] border border-[var(--brand-violet)] bg-[var(--brand-soft)] p-6">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔄</span>
          <h3 className="font-display text-2xl leading-none text-[var(--ink)]">Recompra programada</h3>
        </div>
        <p className="text-sm leading-6 text-[var(--muted)]">
          Programá el reenvío automático de este producto cada cierto tiempo. Necesitás una cuenta para
          gestionar tus recompras.
        </p>
        <div className="flex gap-3">
          <Link className="text-sm font-bold text-[var(--brand-violet-deep)] underline" href="/cuenta/iniciar-sesion">
            Iniciar sesión
          </Link>
          <Link className="text-sm font-bold text-[var(--brand-violet-deep)] underline" href="/cuenta/registrarse">
            Crear cuenta
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-[2rem] border border-[var(--brand-violet)] bg-[var(--brand-soft)] p-6">
        <p className="font-display text-2xl leading-none text-[var(--ink)]">¡Recompra programada! 🎉</p>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Te vamos a avisar cuando sea momento de recomprar. Podés gestionarla desde{" "}
          <Link className="font-bold underline" href="/cuenta/suscripciones">
            Tus suscripciones
          </Link>
          .
        </p>
      </div>
    );
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError("");
    try {
      const variantId = product.variants?.find(
        (variant) => variant.size === selectedSize && variant.colorName === selectedColor.name
      )?.id;
      if (!variantId) {
        setError("Esta combinación no está disponible.");
        return;
      }
      await createSubscription({
        productVariantId: variantId,
        quantity,
        frequencyDays,
        addressId: useNewAddress ? undefined : addressId || undefined,
        newAddress: useNewAddress ? newAddress : undefined
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos crear la recompra programada.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-5 rounded-[2rem] border border-[var(--brand-violet)] bg-[var(--brand-soft)] p-6">
      <div className="flex items-center gap-2">
        <span className="text-lg">🔄</span>
        <h3 className="font-display text-2xl leading-none text-[var(--ink)]">Recompra programada</h3>
      </div>
      <p className="text-sm leading-6 text-[var(--muted)]">
        Elegí cada cuánto querés que te recordemos volver a pedir este producto. No te cobramos nada
        automáticamente — solo te avisamos y vos confirmás la compra cuando llegue la fecha.
      </p>

      <VariantPicker
        colors={product.colors}
        onSelectColor={setSelectedColor}
        onSelectSize={setSelectedSize}
        selectedColor={selectedColor}
        selectedSize={selectedSize}
        sizes={product.sizes}
      />

      <div className="space-y-2">
        <p className="text-sm font-bold text-[var(--ink)]">Cantidad</p>
        <QuantitySelector className="w-fit" onChange={setQuantity} value={quantity} />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold text-[var(--ink)]">Frecuencia</p>
        <div className="flex flex-wrap gap-2">
          {SUBSCRIPTION_FREQUENCIES_DAYS.map((days) => (
            <button
              className={`rounded-full border px-4 py-2 text-sm font-bold transition ${
                frequencyDays === days
                  ? "border-[var(--brand-violet)] bg-white shadow-[0_4px_12px_rgba(94,76,214,0.18)]"
                  : "border-[var(--line)] bg-white/60"
              }`}
              key={days}
              onClick={() => setFrequencyDays(days)}
              type="button"
            >
              Cada {days} días
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-bold text-[var(--ink)]">Dirección de entrega</p>
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
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button disabled={submitting} onClick={handleSubmit} size="lg" type="button">
        {submitting ? "Creando…" : "Programar recompra"}
      </Button>
    </div>
  );
}
