"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { buttonStyles } from "@/components/ui/button";
import {
  CASH_ON_DELIVERY_PAYMENT_METHOD_CODE,
  getEligibleShippingMethods,
  type OrderSummary,
  type ShippingMethodOption
} from "@/lib/vendure/shop-client";
import { formatCurrency } from "@/lib/utils";
import {
  applyLoyaltyRedemption,
  estimatePurchasePoints,
  getLoyaltyRules,
  getLoyaltySettings,
  getMyLoyaltyAccount,
  maxRedeemablePoints,
  type LoyaltyAccount,
  type LoyaltyRule,
  type LoyaltySettings
} from "@/lib/vendure/patipuntos-client";
import { getStoredAccountEmail } from "@/lib/vendure/pets-client";
import { useStore } from "@/store/store-provider";

interface AddressForm {
  fullName: string;
  streetLine1: string;
  city: string;
  province: string;
  postalCode: string;
  phoneNumber: string;
}

const EMPTY_ADDRESS: AddressForm = {
  fullName: "",
  streetLine1: "",
  city: "",
  province: "",
  postalCode: "",
  phoneNumber: ""
};

export function CheckoutPage() {
  const {
    cart,
    subtotal,
    productSubtotal,
    customerEmail,
    orderId,
    refreshOrder,
    setCustomerEmail,
    updateCustomerName,
    setShippingAddress,
    setShippingMethod,
    placeOrder,
    cartError
  } = useStore();

  const [email, setEmail] = useState("");
  const [address, setAddress] = useState<AddressForm>(EMPTY_ADDRESS);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethodOption[]>([]);
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderSummary | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"standard-payment" | typeof CASH_ON_DELIVERY_PAYMENT_METHOD_CODE>(
    "standard-payment"
  );

  const [loyaltyAccount, setLoyaltyAccount] = useState<LoyaltyAccount | null>(null);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings | null>(null);
  const [loyaltyRules, setLoyaltyRules] = useState<LoyaltyRule[]>([]);
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  useEffect(() => {
    getEligibleShippingMethods()
      .then((methods) => {
        setShippingMethods(methods);
        setSelectedShippingMethodId((current) => current || methods[0]?.id || "");
      })
      .catch(() => setShippingMethods([]));
  }, []);

  useEffect(() => {
    // Uses the confirmed order email once known, falling back to whatever the Mascotas/Wishlist
    // flows already remember — a returning customer sees their real balance without having to
    // retype their email first. The actual redemption call still requires the order's own
    // confirmed customer email (checked server-side), this is only for the preview.
    const identityEmail = customerEmail ?? getStoredAccountEmail();
    if (!identityEmail) return;
    Promise.all([getMyLoyaltyAccount(identityEmail), getLoyaltySettings(), getLoyaltyRules()])
      .then(([account, settings, rules]) => {
        setLoyaltyAccount(account);
        setLoyaltySettings(settings);
        setLoyaltyRules(rules);
      })
      .catch(() => {
        // Vendure unreachable — checkout still works, just without the Patipuntos widget.
      });
  }, [customerEmail]);

  if (completedOrder) {
    // The real PURCHASE award happens asynchronously server-side, moments after this screen
    // renders — see patipuntos-client.ts. This is a client-side estimate using the same rule
    // config and the order's final (post-redemption) pre-tax subtotal, not a read of the real
    // ledger — must use productSubtotal (pre-tax), not subtotal (tax-inclusive), to match what the
    // server actually bases the real PURCHASE award on.
    const estimatedPoints = estimatePurchasePoints(completedOrder.productSubtotal, loyaltyRules);
    const estimatedValue = loyaltySettings ? estimatedPoints * loyaltySettings.pointValue : 0;
    // Contraentrega orders don't earn PURCHASE points at checkout — see Decisiones y Razonamiento
    // (2026-09-12): PaymentAuthorized on a COD order doesn't mean the money is secured yet, so
    // Patipuntos defers the award until an admin confirms the delivery. Saying "ganaste" here would
    // be exactly the kind of misleading promise the brief explicitly warned against.
    const isCashOnDelivery = paymentMethod === CASH_ON_DELIVERY_PAYMENT_METHOD_CODE;

    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-[var(--brand-violet-deep)]">
          ¡Gracias por tu compra!
        </p>
        <h1 className="mt-3 font-display text-5xl leading-none text-[var(--ink)]">
          Pedido {completedOrder.code} confirmado
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base leading-8 text-[var(--muted)]">
          Te escribimos a {completedOrder.customerEmail} con los detalles.{" "}
          {isCashOnDelivery
            ? `Pagás ${formatCurrency(completedOrder.total)} en efectivo cuando recibas tu pedido.`
            : `Total pagado: ${formatCurrency(completedOrder.total)}.`}
        </p>

        {estimatedPoints > 0 ? (
          <div className="mx-auto mt-6 max-w-md rounded-[1.4rem] bg-[var(--brand-soft)] p-6 text-left">
            {isCashOnDelivery ? (
              <>
                <p className="font-display text-2xl leading-none text-[var(--brand-violet-deep)]">
                  Vas a ganar {estimatedPoints} Patipuntos
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Se acreditan ({formatCurrency(estimatedValue)}) apenas confirmemos que recibiste tu pedido — vas a
                  verlos en{" "}
                  <Link className="font-bold underline" href="/cuenta/patipuntos">
                    Tus Patipuntos
                  </Link>
                  .
                </p>
              </>
            ) : (
              <>
                <p className="font-display text-2xl leading-none text-[var(--brand-violet-deep)]">
                  ¡Ganaste {estimatedPoints} Patipuntos!
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Ya tenés {formatCurrency(estimatedValue)} para tu próxima compra en{" "}
                  <Link className="font-bold underline" href="/cuenta/patipuntos">
                    Tus Patipuntos
                  </Link>
                  .
                </p>
              </>
            )}
          </div>
        ) : null}

        <Link className={buttonStyles({ size: "lg", className: "mt-8" })} href="/tienda">
          Seguir explorando
        </Link>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-4xl leading-none text-[var(--ink)]">No hay nada en tu carrito todavía</h1>
        <Link className={buttonStyles({ size: "lg", className: "mt-8" })} href="/tienda">
          Ir a la tienda
        </Link>
      </div>
    );
  }

  const selectedShippingMethod = shippingMethods.find((method) => method.id === selectedShippingMethodId);
  const maxRedeemable =
    loyaltyAccount && loyaltyAccount.eligible && loyaltySettings
      ? maxRedeemablePoints(productSubtotal, loyaltyAccount.balance, loyaltySettings)
      : 0;
  const redeemDiscount = loyaltySettings ? Math.min(redeemPoints, maxRedeemable) * loyaltySettings.pointValue : 0;
  const total = subtotal + (selectedShippingMethod?.priceWithTax ?? 0) - redeemDiscount;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setRedeemError(null);

    try {
      let confirmedEmail = customerEmail;
      if (!confirmedEmail) {
        const ok = await setCustomerEmail(email);
        if (!ok) return;
        confirmedEmail = email;
      }

      // The email step only ever captures a placeholder name — now that the address form has a
      // real one, correct the customer record before finishing the order.
      await updateCustomerName(confirmedEmail, address.fullName);

      const addressOk = await setShippingAddress({
        fullName: address.fullName,
        streetLine1: address.streetLine1,
        city: address.city,
        province: address.province || undefined,
        postalCode: address.postalCode || undefined,
        phoneNumber: address.phoneNumber || undefined,
        countryCode: "CO"
      });
      if (!addressOk || !selectedShippingMethodId) return;

      const shippingOk = await setShippingMethod(selectedShippingMethodId);
      if (!shippingOk) return;

      // Applied last, right before payment — not as an earlier "preview" step — so there's no
      // window where points are held against a checkout the customer might never finish. See
      // Decisiones y Razonamiento for why this timing avoids needing a separate reserve/release
      // lifecycle. A failure here shouldn't block a legitimate purchase, so it's caught and
      // surfaced without stopping checkout.
      if (redeemPoints > 0 && confirmedEmail && orderId) {
        try {
          await applyLoyaltyRedemption(orderId, confirmedEmail, redeemPoints);
          await refreshOrder();
        } catch (err) {
          setRedeemError(err instanceof Error ? err.message : "No pudimos aplicar tus Patipuntos a este pedido.");
        }
      }

      const finishedOrder = await placeOrder(paymentMethod);
      if (finishedOrder) {
        setCompletedOrder(finishedOrder);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8" onSubmit={handleSubmit}>
      <div>
        <p className="text-sm font-black uppercase tracking-[0.3em] text-[var(--brand-violet-deep)]">Checkout</p>
        <h1 className="mt-3 font-display text-5xl leading-none text-[var(--ink)]">Listo para completar la orden</h1>
      </div>

      {cartError ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-500">{cartError}</p>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          {!customerEmail ? (
            <div className="rounded-[2rem] border border-white/60 bg-white/84 p-6 shadow-[0_20px_50px_rgba(31,36,84,0.08)]">
              <h2 className="font-display text-4xl leading-none text-[var(--ink)]">Correo electrónico</h2>
              <label className="mt-5 grid gap-2">
                <span className="text-sm font-bold text-[var(--ink)]">Correo electrónico</span>
                <input
                  className="h-12 rounded-2xl border border-[var(--line)] px-4 text-sm outline-none"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="tu@correo.com"
                  required
                  type="email"
                  value={email}
                />
              </label>
            </div>
          ) : null}

          <div className="rounded-[2rem] border border-white/60 bg-white/84 p-6 shadow-[0_20px_50px_rgba(31,36,84,0.08)]">
            <h2 className="font-display text-4xl leading-none text-[var(--ink)]">Dirección de envío</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["fullName", "Nombre completo", "sm:col-span-2"],
                  ["streetLine1", "Dirección", "sm:col-span-2"],
                  ["city", "Ciudad", ""],
                  ["province", "Departamento", ""],
                  ["postalCode", "Código postal", ""],
                  ["phoneNumber", "Teléfono", ""]
                ] as const
              ).map(([field, label, span]) => (
                <label className={`grid gap-2 ${span}`} key={field}>
                  <span className="text-sm font-bold text-[var(--ink)]">{label}</span>
                  <input
                    className="h-12 rounded-2xl border border-[var(--line)] px-4 text-sm outline-none"
                    onChange={(event) => setAddress((current) => ({ ...current, [field]: event.target.value }))}
                    placeholder={label}
                    required={field === "fullName" || field === "streetLine1" || field === "city"}
                    type="text"
                    value={address[field]}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/60 bg-white/84 p-6 shadow-[0_20px_50px_rgba(31,36,84,0.08)]">
            <h2 className="font-display text-4xl leading-none text-[var(--ink)]">Método de envío</h2>
            <div className="mt-5 grid gap-3">
              {shippingMethods.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">Cargando métodos de envío disponibles…</p>
              ) : (
                shippingMethods.map((method) => (
                  <label
                    className={`flex cursor-pointer items-center justify-between rounded-2xl border px-4 py-3 text-sm ${
                      selectedShippingMethodId === method.id
                        ? "border-[var(--brand-violet)] bg-[var(--brand-soft)]"
                        : "border-[var(--line)]"
                    }`}
                    key={method.id}
                  >
                    <span className="flex items-center gap-3 font-semibold text-[var(--ink)]">
                      <input
                        checked={selectedShippingMethodId === method.id}
                        name="shippingMethod"
                        onChange={() => setSelectedShippingMethodId(method.id)}
                        type="radio"
                      />
                      {method.name}
                    </span>
                    <span className="font-bold text-[var(--brand-violet-deep)]">
                      {formatCurrency(method.priceWithTax)}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/60 bg-white/84 p-6 shadow-[0_20px_50px_rgba(31,36,84,0.08)]">
            <h2 className="font-display text-4xl leading-none text-[var(--ink)]">Método de pago</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
              Wompi y Mercado Pago llegan en una fase posterior. Por ahora, confirmar el pedido lo deja
              autorizado y listo para que el equipo lo procese desde el panel.
            </p>
            <div className="mt-5 grid gap-3">
              {(
                [
                  ["standard-payment", "Pago en línea", "Se autoriza al confirmar el pedido."],
                  [
                    CASH_ON_DELIVERY_PAYMENT_METHOD_CODE,
                    "Pago contraentrega",
                    "Pagás en efectivo cuando recibís tu pedido."
                  ]
                ] as const
              ).map(([value, label, description]) => (
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
                    paymentMethod === value ? "border-[var(--brand-violet)] bg-[var(--brand-soft)]" : "border-[var(--line)]"
                  }`}
                  key={value}
                >
                  <input
                    checked={paymentMethod === value}
                    className="mt-1"
                    name="paymentMethod"
                    onChange={() => setPaymentMethod(value)}
                    type="radio"
                  />
                  <span>
                    <span className="block font-semibold text-[var(--ink)]">{label}</span>
                    <span className="text-[var(--muted)]">{description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        </section>

        <aside className="h-fit rounded-[2rem] border border-white/60 bg-white/88 p-6 shadow-[0_24px_60px_rgba(31,36,84,0.1)]">
          <h2 className="font-display text-4xl leading-none text-[var(--ink)]">Resumen del pedido</h2>
          <div className="mt-6 space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                <div>
                  <p className="font-bold text-[var(--ink)]">{item.product.name}</p>
                  <p className="mt-1 text-[var(--muted)]">
                    {item.quantity} × {formatCurrency(item.product.price)}
                  </p>
                </div>
                <span className="font-bold text-[var(--ink)]">{formatCurrency(item.product.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3 border-t border-[var(--line)] pt-5 text-sm text-[var(--muted)]">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span className="font-bold text-[var(--ink)]">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Envío</span>
              <span className="font-bold text-[var(--ink)]">
                {selectedShippingMethod ? formatCurrency(selectedShippingMethod.priceWithTax) : "—"}
              </span>
            </div>

            {loyaltyAccount && loyaltyAccount.balance > 0 ? (
              loyaltyAccount.eligible && loyaltySettings && maxRedeemable > 0 ? (
                <div className="space-y-2 border-t border-[var(--line)] pt-4">
                  <div className="flex items-center justify-between">
                    <span>Usar Patipuntos ({loyaltyAccount.balance} disponibles)</span>
                    {redeemDiscount > 0 ? (
                      <span className="font-bold text-[var(--brand-violet-deep)]">-{formatCurrency(redeemDiscount)}</span>
                    ) : null}
                  </div>
                  <input
                    aria-label="Cantidad de Patipuntos a usar"
                    className="w-full accent-[var(--brand-violet)]"
                    max={maxRedeemable}
                    min={0}
                    onChange={(event) => setRedeemPoints(Number(event.target.value))}
                    type="range"
                    value={Math.min(redeemPoints, maxRedeemable)}
                  />
                  <p className="text-xs text-[var(--muted)]">
                    {redeemPoints > 0
                      ? `Usando ${Math.min(redeemPoints, maxRedeemable)} puntos — ahorrás ${formatCurrency(redeemDiscount)}.`
                      : `Podés usar hasta ${maxRedeemable} puntos en este pedido (máximo ${loyaltySettings.maxRedemptionPercentage}% del subtotal).`}
                  </p>
                </div>
              ) : (
                <p className="border-t border-[var(--line)] pt-4 text-xs text-[var(--muted)]">
                  Tenés {loyaltyAccount.balance} Patipuntos, pero todavía no podés canjearlos:{" "}
                  {loyaltyAccount.redemptionBlockedReasons.join(", ")}.
                </p>
              )
            ) : null}
            {redeemError ? <p className="text-xs text-red-600">{redeemError}</p> : null}

            <div className="flex items-center justify-between border-t border-[var(--line)] pt-4">
              <span className="text-base font-bold text-[var(--ink)]">Total</span>
              <span className="text-3xl font-black text-[var(--brand-violet-deep)]">{formatCurrency(total)}</span>
            </div>
          </div>

          <button className={buttonStyles({ size: "lg", className: "mt-8 w-full" })} disabled={isSubmitting} type="submit">
            {isSubmitting ? "Procesando..." : "Confirmar pedido"}
          </button>
          <Link className={buttonStyles({ variant: "ghost", className: "mt-4 w-full" })} href="/carrito">
            Volver al carrito
          </Link>
        </aside>
      </div>
    </form>
  );
}
