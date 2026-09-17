"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BoldPaymentButton } from "@/components/checkout/bold-payment-button";
import { buttonStyles } from "@/components/ui/button";
import { WhatsAppIcon } from "@/components/ui/icons";
import { generateBoldCheckout, type BoldCheckoutData } from "@/lib/vendure/bold-client";
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
import {
  buildCartSummaryMessage,
  buildOrderInquiryMessage,
  buildWhatsAppLink,
  getWhatsappSettings,
  type WhatsappSettings
} from "@/lib/whatsapp";
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

const ADDRESS_FIELDS: Array<[key: keyof AddressForm, label: string, span: string, required: boolean]> = [
  ["fullName", "Nombre completo", "sm:col-span-2", true],
  ["streetLine1", "Dirección", "sm:col-span-2", true],
  ["city", "Ciudad", "", true],
  ["province", "Departamento", "", false],
  ["postalCode", "Código postal", "", false],
  ["phoneNumber", "Teléfono", "", false]
];

interface RecipientExtra {
  neighborhood: string;
  deliveryNotes: string;
}

const EMPTY_RECIPIENT_EXTRA: RecipientExtra = { neighborhood: "", deliveryNotes: "" };

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
    setGiftDetails,
    placeOrder,
    cartError,
    cartErrorCode,
    isLoggedIn
  } = useStore();

  const [email, setEmail] = useState("");
  const [address, setAddress] = useState<AddressForm>(EMPTY_ADDRESS);

  const [isGift, setIsGift] = useState(false);
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [giftSenderName, setGiftSenderName] = useState("");
  const [giftAnonymous, setGiftAnonymous] = useState(false);
  const [giftDeliverToOther, setGiftDeliverToOther] = useState(false);
  const [recipientExtra, setRecipientExtra] = useState<RecipientExtra>(EMPTY_RECIPIENT_EXTRA);

  const [shippingMethods, setShippingMethods] = useState<ShippingMethodOption[]>([]);
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<OrderSummary | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"bold" | typeof CASH_ON_DELIVERY_PAYMENT_METHOD_CODE>("bold");
  // Only set once generateBoldCheckout() succeeds — its presence is what switches the "bold"
  // path from a plain submit button to Bold's own widget (see the render below).
  const [boldCheckout, setBoldCheckout] = useState<BoldCheckoutData | null>(null);
  const [boldError, setBoldError] = useState<string | null>(null);

  const [loyaltyAccount, setLoyaltyAccount] = useState<LoyaltyAccount | null>(null);
  const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings | null>(null);
  const [loyaltyRules, setLoyaltyRules] = useState<LoyaltyRule[]>([]);
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [redeemError, setRedeemError] = useState<string | null>(null);

  // Self-fetched, same pattern as CartPage — this is a client component with no access to the
  // server-side fetch SiteShell already did for the floating button.
  const [whatsappSettings, setWhatsappSettings] = useState<WhatsappSettings | null>(null);

  useEffect(() => {
    getWhatsappSettings().then(setWhatsappSettings);
  }, []);

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

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link className={buttonStyles({ size: "lg" })} href="/tienda">
            Seguir explorando
          </Link>
          {whatsappSettings ? (
            <a
              className={buttonStyles({ size: "lg", variant: "secondary" })}
              href={buildWhatsAppLink(whatsappSettings.phoneNumber, buildOrderInquiryMessage(completedOrder.code))}
              rel="noopener noreferrer"
              target="_blank"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Consultar mi pedido por WhatsApp
            </a>
          ) : null}
        </div>
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

      // The email step only ever captures a placeholder name for a guest — a logged-in customer
      // already has a real name from registration, and calling this while logged in throws
      // AlreadyLoggedInError (setCustomerForOrder refuses to touch a session's own customer this
      // way), which would otherwise block every registered customer's checkout.
      if (!isLoggedIn) {
        await updateCustomerName(confirmedEmail, address.fullName);
      }

      // Applied before the shipping address so a failure here doesn't leave the order stuck
      // between the two — if it fails, checkout just stops with a visible error like any other
      // step. Only ever called when the shopper actually opted in; a normal checkout never touches
      // Order.customFields' gift fields at all.
      if (isGift) {
        const giftOk = await setGiftDetails({
          isGift: true,
          giftWrap,
          giftMessage: giftMessage.trim() || undefined,
          giftSenderName: giftAnonymous ? undefined : giftSenderName.trim() || undefined,
          giftAnonymous
        });
        if (!giftOk) return;
      }

      const shipToOther = isGift && giftDeliverToOther;
      const addressOk = await setShippingAddress({
        fullName: address.fullName,
        streetLine1: address.streetLine1,
        city: address.city,
        province: address.province || undefined,
        postalCode: address.postalCode || undefined,
        phoneNumber: address.phoneNumber || undefined,
        countryCode: "CO",
        ...(shipToOther
          ? {
              neighborhood: recipientExtra.neighborhood.trim() || undefined,
              deliveryNotes: recipientExtra.deliveryNotes.trim() || undefined
            }
          : {})
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

      // Bold never goes through placeOrder()/addPaymentToOrder — the shopper still has to leave
      // to Bold's own hosted page and actually pay, so the order stays in ArrangingPayment until
      // the webhook or the confirmation page's active poll settles it (see bold.service.ts on the
      // backend and confirmacion-bold/page.tsx here). This request only prepares that: it's what
      // generates the button the shopper still has to click.
      if (paymentMethod === "bold") {
        setBoldError(null);
        try {
          const checkout = await generateBoldCheckout();
          setBoldCheckout(checkout);
        } catch (err) {
          setBoldError(err instanceof Error ? err.message : "No pudimos preparar el pago con Bold.");
        }
        return;
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

      {cartErrorCode === "EMAIL_ADDRESS_CONFLICT_ERROR" ? (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Ya existe una cuenta con este correo.{" "}
          <Link className="font-bold underline" href="/cuenta/iniciar-sesion?returnTo=/checkout">
            Iniciá sesión
          </Link>{" "}
          para continuar con tu compra.
        </div>
      ) : cartError ? (
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
            <label className="flex cursor-pointer items-center justify-between gap-4">
              <span>
                <span className="block font-display text-4xl leading-none text-[var(--ink)]">
                  🎁 ¿Es un regalo?
                </span>
                <span className="mt-1 block text-sm text-[var(--muted)]">
                  Envolvé el pedido, agregá un mensaje o mandalo a otra dirección.
                </span>
              </span>
              <input
                checked={isGift}
                className="h-6 w-6 accent-[var(--brand-violet)]"
                onChange={(event) => setIsGift(event.target.checked)}
                type="checkbox"
              />
            </label>

            {isGift ? (
              <div className="mt-6 space-y-5 border-t border-[var(--line)] pt-5">
                <label className="flex items-center gap-3">
                  <input
                    checked={giftWrap}
                    className="h-5 w-5 accent-[var(--brand-violet)]"
                    onChange={(event) => setGiftWrap(event.target.checked)}
                    type="checkbox"
                  />
                  <span className="text-sm font-semibold text-[var(--ink)]">Envolver para regalo</span>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-bold text-[var(--ink)]">Mensaje para la tarjeta (opcional)</span>
                  <textarea
                    className="rounded-2xl border border-[var(--line)] px-4 py-3 text-sm outline-none"
                    maxLength={280}
                    onChange={(event) => setGiftMessage(event.target.value)}
                    placeholder="Escribí unas palabras para quien lo recibe"
                    rows={3}
                    value={giftMessage}
                  />
                </label>

                <label className="flex items-center gap-3">
                  <input
                    checked={giftAnonymous}
                    className="h-5 w-5 accent-[var(--brand-violet)]"
                    onChange={(event) => setGiftAnonymous(event.target.checked)}
                    type="checkbox"
                  />
                  <span className="text-sm font-semibold text-[var(--ink)]">Enviar como regalo anónimo</span>
                </label>

                {!giftAnonymous ? (
                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-[var(--ink)]">Tu nombre como remitente (opcional)</span>
                    <input
                      className="h-12 rounded-2xl border border-[var(--line)] px-4 text-sm outline-none"
                      onChange={(event) => setGiftSenderName(event.target.value)}
                      placeholder="¿Quién lo regala?"
                      type="text"
                      value={giftSenderName}
                    />
                  </label>
                ) : null}

                <div className="grid gap-3">
                  <span className="text-sm font-bold text-[var(--ink)]">¿A dónde lo enviamos?</span>
                  {(
                    [
                      [false, "Enviar a mi dirección"],
                      [true, "Enviar a otra dirección"]
                    ] as const
                  ).map(([value, label]) => (
                    <label
                      className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
                        giftDeliverToOther === value
                          ? "border-[var(--brand-violet)] bg-[var(--brand-soft)]"
                          : "border-[var(--line)]"
                      }`}
                      key={String(value)}
                    >
                      <input
                        checked={giftDeliverToOther === value}
                        name="giftDeliverTo"
                        onChange={() => setGiftDeliverToOther(value)}
                        type="radio"
                      />
                      <span className="font-semibold text-[var(--ink)]">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-[2rem] border border-white/60 bg-white/84 p-6 shadow-[0_20px_50px_rgba(31,36,84,0.08)]">
            <h2 className="font-display text-4xl leading-none text-[var(--ink)]">
              {isGift && giftDeliverToOther ? "Dirección del destinatario" : "Dirección de envío"}
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {ADDRESS_FIELDS.map(([field, label, span, required]) => (
                <label className={`grid gap-2 ${span}`} key={field}>
                  <span className="text-sm font-bold text-[var(--ink)]">{label}</span>
                  <input
                    className="h-12 rounded-2xl border border-[var(--line)] px-4 text-sm outline-none"
                    onChange={(event) => setAddress((current) => ({ ...current, [field]: event.target.value }))}
                    placeholder={label}
                    required={required}
                    type="text"
                    value={address[field]}
                  />
                </label>
              ))}

              {isGift && giftDeliverToOther ? (
                <>
                  <label className="grid gap-2">
                    <span className="text-sm font-bold text-[var(--ink)]">Barrio</span>
                    <input
                      className="h-12 rounded-2xl border border-[var(--line)] px-4 text-sm outline-none"
                      onChange={(event) =>
                        setRecipientExtra((current) => ({ ...current, neighborhood: event.target.value }))
                      }
                      placeholder="Barrio"
                      type="text"
                      value={recipientExtra.neighborhood}
                    />
                  </label>
                  <label className="grid gap-2 sm:col-span-2">
                    <span className="text-sm font-bold text-[var(--ink)]">
                      Información adicional para la entrega (opcional)
                    </span>
                    <input
                      className="h-12 rounded-2xl border border-[var(--line)] px-4 text-sm outline-none"
                      onChange={(event) =>
                        setRecipientExtra((current) => ({ ...current, deliveryNotes: event.target.value }))
                      }
                      placeholder="Ej. apartamento 302, portería, punto de referencia"
                      type="text"
                      value={recipientExtra.deliveryNotes}
                    />
                  </label>
                </>
              ) : null}
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
            <div className="mt-5 grid gap-3">
              {(
                [
                  ["bold", "Bold (tarjeta, PSE, Nequi)", "Te lleva a la pasarela de Bold para completar el pago."],
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
                    onChange={() => {
                      setPaymentMethod(value);
                      setBoldCheckout(null);
                      setBoldError(null);
                    }}
                    type="radio"
                  />
                  <span>
                    <span className="block font-semibold text-[var(--ink)]">{label}</span>
                    <span className="text-[var(--muted)]">{description}</span>
                  </span>
                </label>
              ))}
            </div>
            {boldError ? <p className="mt-4 text-sm font-semibold text-red-500">{boldError}</p> : null}
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
                  {item.personalization?.length ? (
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      {item.personalization.map((answer) => `${answer.label}: ${answer.value}`).join(" · ")}
                    </p>
                  ) : null}
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

          {paymentMethod === "bold" && boldCheckout ? (
            <div className="mt-8">
              <BoldPaymentButton checkout={boldCheckout} />
            </div>
          ) : (
            <button className={buttonStyles({ size: "lg", className: "mt-8 w-full" })} disabled={isSubmitting} type="submit">
              {isSubmitting
                ? "Procesando..."
                : paymentMethod === "bold"
                  ? "Continuar con Bold"
                  : "Confirmar pedido"}
            </button>
          )}
          <Link className={buttonStyles({ variant: "ghost", className: "mt-4 w-full" })} href="/carrito">
            Volver al carrito
          </Link>
          {whatsappSettings ? (
            <a
              className="mt-4 flex w-full items-center justify-center gap-2 text-sm font-bold text-[var(--brand-violet-deep)]"
              href={buildWhatsAppLink(whatsappSettings.phoneNumber, buildCartSummaryMessage(cart, subtotal))}
              rel="noopener noreferrer"
              target="_blank"
            >
              <WhatsAppIcon className="h-4 w-4" />
              Contactar por WhatsApp
            </a>
          ) : null}
        </aside>
      </div>
    </form>
  );
}
