"use client";

import { adaptVendureOrderLine, type VendureOrderLine } from "@/lib/vendure/adapters";
import { VENDURE_MONEY_FACTOR } from "@/lib/vendure/client";
import { clearStoredToken, ShopOperationError, shopFetch } from "@/lib/vendure/shop-fetch";
import type { CartLineItem } from "@/types/commerce";

export { ShopOperationError };

// The dummy payment method the Vendure scaffold ships with (automaticSettle: false, so a real
// order lands in "PaymentAuthorized" — matches the project's stated approach of leaving the
// actual gateway integration point ready without implementing Wompi/Mercado Pago yet).
const DEFAULT_PAYMENT_METHOD_CODE = "standard-payment";

/** Same dummy handler as the default, just a different PaymentMethod code — Patipuntos uses this
 *  to tell a contraentrega order apart and defer its points until delivery is confirmed instead
 *  of at PaymentAuthorized, since no money has actually changed hands yet at that point. */
export const CASH_ON_DELIVERY_PAYMENT_METHOD_CODE = "cash-on-delivery";

export interface ShippingMethodOption {
  id: string;
  name: string;
  priceWithTax: number;
}

export interface OrderSummary {
  id: string;
  code: string;
  state: string;
  customerEmail: string | null;
  subtotal: number;
  shippingTotal: number;
  total: number;
  shippingMethodName: string | null;
  lines: CartLineItem[];
  /** Pre-tax product total (Order.subTotal, not subTotalWithTax) — the exact basis Patipuntos uses
   *  server-side for both the PURCHASE points calculation and the redemption cap. Needed as its own
   *  field because `subtotal` above is tax-inclusive (for on-page price display), and Colombia's
   *  19% IVA makes the two meaningfully different — using the wrong one here made the "you earned
   *  N points" estimate and the redemption-cap preview both diverge from what the server enforces. */
  productSubtotal: number;
  /** Set asynchronously by patilandia-loyalty after the order reaches PaymentAuthorized — 0 right
   *  after placeOrder() resolves even on an order that will earn points. See patipuntos-client.ts's
   *  estimatePurchasePoints() for the client-side estimate shown before this value lands. */
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed: number;
  /** Set via setGiftDetails() at checkout — see checkout-page.tsx's "¿Es un regalo?" toggle. When
   *  false, none of the other gift fields are meaningful (they're left at their defaults). */
  isGift: boolean;
  giftWrap: boolean;
  giftMessage: string | null;
  giftSenderName: string | null;
  giftAnonymous: boolean;
}

const ORDER_FIELDS = `
  id
  code
  state
  customer { emailAddress }
  subTotal
  subTotalWithTax
  shippingWithTax
  totalWithTax
  customFields {
    loyaltyPointsEarned
    loyaltyPointsRedeemed
    isGift
    giftWrap
    giftMessage
    giftSenderName
    giftAnonymous
  }
  shippingLines { shippingMethod { name } }
  lines {
    id
    quantity
    unitPrice
    customFields { personalizationValues }
    productVariant {
      id
      sku
      name
      price
      featuredAsset { preview }
      options { name group { code } customFields { hex } }
      customFields { weightKg shippingClass }
      product {
        id
        slug
        name
        description
        featuredAsset { preview }
        assets { preview }
        facetValues { code name facet { code } }
        customFields { shortDescription }
      }
    }
  }
`;

const ORDER_RESULT_FIELDS = `
  ... on Order { ${ORDER_FIELDS} }
  ... on ErrorResult { errorCode message }
`;

interface RawOrder {
  id: string;
  code: string;
  state: string;
  customer?: { emailAddress: string } | null;
  subTotal: number;
  subTotalWithTax: number;
  shippingWithTax: number;
  totalWithTax: number;
  customFields?: {
    loyaltyPointsEarned: number;
    loyaltyPointsRedeemed: number;
    isGift?: boolean | null;
    giftWrap?: boolean | null;
    giftMessage?: string | null;
    giftSenderName?: string | null;
    giftAnonymous?: boolean | null;
  } | null;
  shippingLines: Array<{ shippingMethod: { name: string } }>;
  lines: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    customFields?: { personalizationValues?: string | null } | null;
    productVariant: VendureOrderLine["productVariant"];
  }>;
  errorCode?: string;
  message?: string;
}

function toOrderSummary(order: RawOrder): OrderSummary {
  return {
    id: order.id,
    code: order.code,
    state: order.state,
    customerEmail: order.customer?.emailAddress ?? null,
    subtotal: order.subTotalWithTax / VENDURE_MONEY_FACTOR,
    productSubtotal: order.subTotal / VENDURE_MONEY_FACTOR,
    shippingTotal: order.shippingWithTax / VENDURE_MONEY_FACTOR,
    total: order.totalWithTax / VENDURE_MONEY_FACTOR,
    shippingMethodName: order.shippingLines[0]?.shippingMethod.name ?? null,
    loyaltyPointsEarned: order.customFields?.loyaltyPointsEarned ?? 0,
    loyaltyPointsRedeemed: order.customFields?.loyaltyPointsRedeemed ?? 0,
    isGift: order.customFields?.isGift ?? false,
    giftWrap: order.customFields?.giftWrap ?? false,
    giftMessage: order.customFields?.giftMessage ?? null,
    giftSenderName: order.customFields?.giftSenderName ?? null,
    giftAnonymous: order.customFields?.giftAnonymous ?? false,
    lines: order.lines.map((line) =>
      adaptVendureOrderLine({
        id: line.id,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        customFields: line.customFields,
        productVariant: line.productVariant
      })
    )
  };
}

function unwrapOrderResult(order: RawOrder): OrderSummary {
  if (order.errorCode) {
    throw new ShopOperationError(order.message ?? order.errorCode, order.errorCode);
  }
  return toOrderSummary(order);
}

export async function getActiveOrder(): Promise<OrderSummary | null> {
  const data = await shopFetch<{ activeOrder: RawOrder | null }>(
    `query ActiveOrder { activeOrder { ${ORDER_FIELDS} } }`
  );
  return data.activeOrder ? toOrderSummary(data.activeOrder) : null;
}

export interface OrderLineCustomFields {
  /** JSON-stringified array of `{fieldId, label, value}` — see product-personalization.tsx. Only
   *  ever carries the shopper's answers, never a price: the server decides the surcharge itself
   *  from its own PersonalizationConfig, so there's nothing here for a client to fake. */
  personalizationValues?: string;
  /** Set only by the "Comprar ahora" flow from a subscription — see subscriptions-client.ts. Ties
   *  this specific line to the subscription whose nextRenewalDate should advance once this order's
   *  payment is authorized (patilandia-subscriptions' event subscriber reads it back). */
  subscriptionId?: string;
}

export async function addItemToOrder(
  productVariantId: string,
  quantity = 1,
  customFields?: OrderLineCustomFields
): Promise<OrderSummary> {
  const data = await shopFetch<{ addItemToOrder: RawOrder }>(
    `mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!, $customFields: OrderLineCustomFieldsInput) {
      addItemToOrder(productVariantId: $productVariantId, quantity: $quantity, customFields: $customFields) { ${ORDER_RESULT_FIELDS} }
    }`,
    { productVariantId, quantity, customFields }
  );
  return unwrapOrderResult(data.addItemToOrder);
}

export async function adjustOrderLine(orderLineId: string, quantity: number): Promise<OrderSummary> {
  const data = await shopFetch<{ adjustOrderLine: RawOrder }>(
    `mutation AdjustOrderLine($orderLineId: ID!, $quantity: Int!) {
      adjustOrderLine(orderLineId: $orderLineId, quantity: $quantity) { ${ORDER_RESULT_FIELDS} }
    }`,
    { orderLineId, quantity }
  );
  return unwrapOrderResult(data.adjustOrderLine);
}

export async function removeOrderLine(orderLineId: string): Promise<OrderSummary> {
  const data = await shopFetch<{ removeOrderLine: RawOrder }>(
    `mutation RemoveOrderLine($orderLineId: ID!) {
      removeOrderLine(orderLineId: $orderLineId) { ${ORDER_RESULT_FIELDS} }
    }`,
    { orderLineId }
  );
  return unwrapOrderResult(data.removeOrderLine);
}

async function setCustomer(input: {
  emailAddress: string;
  firstName: string;
  lastName: string;
}): Promise<OrderSummary> {
  const data = await shopFetch<{ setCustomerForOrder: RawOrder }>(
    `mutation SetCustomerForOrder($input: CreateCustomerInput!) {
      setCustomerForOrder(input: $input) { ${ORDER_RESULT_FIELDS} }
    }`,
    { input }
  );
  return unwrapOrderResult(data.setCustomerForOrder);
}

/**
 * The user asked specifically for this: capture the shopper's email the moment they reach the
 * cart, before anything else. Vendure has no opinion on *when* a storefront calls
 * setCustomerForOrder — it's valid any time there's an active order — so gating the rest of the
 * cart UI on this succeeding is entirely our own UX choice, not something Vendure requires or
 * blocks. `CartPage` calls this before showing line items.
 *
 * Vendure's CreateCustomerInput requires firstName/lastName too (not just email) — rather than
 * asking for them here and adding friction to the one field the user wanted up front, we send a
 * placeholder derived from the email and correct it in `updateCustomerName` once the checkout
 * form collects a real full name. `setCustomerForOrder` just updates the same order's customer
 * record, it doesn't create a duplicate.
 */
export async function setCustomerEmail(emailAddress: string): Promise<OrderSummary> {
  const placeholderName = emailAddress.split("@")[0] || "Cliente";
  return setCustomer({ emailAddress, firstName: placeholderName, lastName: "" });
}

export async function updateCustomerName(
  emailAddress: string,
  fullName: string
): Promise<OrderSummary> {
  const [firstName, ...rest] = fullName.trim().split(/\s+/);
  return setCustomer({
    emailAddress,
    firstName: firstName || "Cliente",
    lastName: rest.join(" ")
  });
}

export async function getEligibleShippingMethods(): Promise<ShippingMethodOption[]> {
  const data = await shopFetch<{
    eligibleShippingMethods: Array<{ id: string; name: string; priceWithTax: number }>;
  }>(`query EligibleShippingMethods { eligibleShippingMethods { id name priceWithTax } }`);
  return data.eligibleShippingMethods.map((method) => ({
    id: method.id,
    name: method.name,
    priceWithTax: method.priceWithTax / VENDURE_MONEY_FACTOR
  }));
}

export async function setShippingAddress(input: {
  fullName: string;
  streetLine1: string;
  city: string;
  province?: string;
  postalCode?: string;
  countryCode: string;
  phoneNumber?: string;
  /** Only meaningful for a gift order shipping to someone other than the buyer — see
   *  checkout-page.tsx's "Enviar a otra dirección" option. Vendure has no native barrio/delivery
   *  notes fields, so these travel as Address customFields (declared in vendure-config.ts) and flow
   *  through this mutation automatically. */
  neighborhood?: string;
  deliveryNotes?: string;
}): Promise<OrderSummary> {
  const { neighborhood, deliveryNotes, ...addressInput } = input;
  const hasCustomFields = Boolean(neighborhood || deliveryNotes);
  const data = await shopFetch<{ setOrderShippingAddress: RawOrder }>(
    `mutation SetOrderShippingAddress($input: CreateAddressInput!) {
      setOrderShippingAddress(input: $input) { ${ORDER_RESULT_FIELDS} }
    }`,
    {
      input: hasCustomFields
        ? { ...addressInput, customFields: { neighborhood, deliveryNotes } }
        : addressInput
    }
  );
  return unwrapOrderResult(data.setOrderShippingAddress);
}

export interface GiftDetailsInput {
  isGift: boolean;
  giftWrap?: boolean;
  giftMessage?: string;
  giftSenderName?: string;
  giftAnonymous?: boolean;
}

/** Uses Vendure's own native `setOrderCustomFields` Shop API mutation (not a Patilandia-specific
 *  one — see patilandia-gifts, which has no resolvers of its own) to store the shopper's "¿Es un
 *  regalo?" answers directly on the active order. */
export async function setOrderCustomFields(input: GiftDetailsInput): Promise<OrderSummary> {
  const data = await shopFetch<{ setOrderCustomFields: RawOrder }>(
    `mutation SetOrderCustomFields($input: UpdateOrderInput!) {
      setOrderCustomFields(input: $input) { ${ORDER_RESULT_FIELDS} }
    }`,
    { input: { customFields: input } }
  );
  return unwrapOrderResult(data.setOrderCustomFields);
}

export async function setShippingMethod(shippingMethodId: string): Promise<OrderSummary> {
  const data = await shopFetch<{ setOrderShippingMethod: RawOrder }>(
    `mutation SetOrderShippingMethod($id: [ID!]!) {
      setOrderShippingMethod(shippingMethodId: $id) { ${ORDER_RESULT_FIELDS} }
    }`,
    { id: [shippingMethodId] }
  );
  return unwrapOrderResult(data.setOrderShippingMethod);
}

export async function transitionOrderToState(state: string): Promise<OrderSummary> {
  const data = await shopFetch<{ transitionOrderToState: RawOrder | null }>(
    `mutation TransitionOrderToState($state: String!) {
      transitionOrderToState(state: $state) { ${ORDER_RESULT_FIELDS} }
    }`,
    { state }
  );
  if (!data.transitionOrderToState) {
    throw new ShopOperationError("No se pudo cambiar el estado de la orden.");
  }
  return unwrapOrderResult(data.transitionOrderToState);
}

export async function placeOrder(paymentMethodCode: string = DEFAULT_PAYMENT_METHOD_CODE): Promise<OrderSummary> {
  await transitionOrderToState("ArrangingPayment");

  const payment = await shopFetch<{ addPaymentToOrder: RawOrder }>(
    `mutation AddPaymentToOrder($input: PaymentInput!) {
      addPaymentToOrder(input: $input) { ${ORDER_RESULT_FIELDS} }
    }`,
    { input: { method: paymentMethodCode, metadata: {} } }
  );
  return unwrapOrderResult(payment.addPaymentToOrder);
}

// ---------------------------------------------------------------------------------------------
// Customer accounts (real, optional — see store-provider.tsx for how this coexists with the
// guest-checkout flow above). Every function here reuses the same shopFetch/token plumbing, so a
// successful login/register/verify captures the resulting session exactly like an order mutation
// already does — no extra wiring needed.
// ---------------------------------------------------------------------------------------------

export interface ActiveCustomer {
  id: string;
  emailAddress: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
}

const CUSTOMER_FIELDS = `id emailAddress firstName lastName phoneNumber`;

export async function getActiveCustomer(): Promise<ActiveCustomer | null> {
  const data = await shopFetch<{ activeCustomer: ActiveCustomer | null }>(
    `query ActiveCustomer { activeCustomer { ${CUSTOMER_FIELDS} } }`
  );
  return data.activeCustomer;
}

export interface CustomerAddress {
  id: string;
  fullName: string;
  streetLine1: string;
  streetLine2: string;
  city: string;
  province: string;
  postalCode: string;
  phoneNumber: string;
  neighborhood: string;
  deliveryNotes: string;
}

interface RawCustomerAddress {
  id: string;
  fullName: string | null;
  streetLine1: string;
  streetLine2: string | null;
  city: string | null;
  province: string | null;
  postalCode: string | null;
  phoneNumber: string | null;
  customFields?: { neighborhood?: string | null; deliveryNotes?: string | null } | null;
}

/** Vendure's native address book — requires a real logged-in session (same requirement as
 *  Suscripciones itself), unlike every other identity check in this project which falls back to a
 *  guest email. See subscriptions-client.ts for why: a subscription's address needs to outlive a
 *  single order, which only the real Customer.addresses book (not an order's shippingAddress
 *  snapshot) is built for. */
export async function getCustomerAddresses(): Promise<CustomerAddress[]> {
  const data = await shopFetch<{ activeCustomer: { addresses: RawCustomerAddress[] } | null }>(
    `query ActiveCustomerAddresses {
      activeCustomer {
        addresses {
          id
          fullName
          streetLine1
          streetLine2
          city
          province
          postalCode
          phoneNumber
          customFields { neighborhood deliveryNotes }
        }
      }
    }`
  );
  return (data.activeCustomer?.addresses ?? []).map((address) => ({
    id: address.id,
    fullName: address.fullName ?? "",
    streetLine1: address.streetLine1,
    streetLine2: address.streetLine2 ?? "",
    city: address.city ?? "",
    province: address.province ?? "",
    postalCode: address.postalCode ?? "",
    phoneNumber: address.phoneNumber ?? "",
    neighborhood: address.customFields?.neighborhood ?? "",
    deliveryNotes: address.customFields?.deliveryNotes ?? ""
  }));
}

export interface RegisterInput {
  emailAddress: string;
  firstName: string;
  lastName: string;
  password: string;
  phoneNumber?: string;
}

/** Vendure requires email verification before login works (requireVerification: true) — this
 *  resolves once the confirmation email has been queued, not once the account is usable. If the
 *  email already had guest-created data (pets/wishlist/points/orders), verifying attaches the new
 *  password to that SAME customer record — nothing needs to be migrated for it to show up. */
export async function registerCustomerAccount(input: RegisterInput): Promise<void> {
  const data = await shopFetch<{
    registerCustomerAccount: { success?: boolean; errorCode?: string; message?: string };
  }>(
    `mutation RegisterCustomerAccount($input: RegisterCustomerInput!) {
      registerCustomerAccount(input: $input) {
        ... on Success { success }
        ... on ErrorResult { errorCode message }
      }
    }`,
    { input }
  );
  if (data.registerCustomerAccount.errorCode) {
    throw new ShopOperationError(
      data.registerCustomerAccount.message ?? data.registerCustomerAccount.errorCode,
      data.registerCustomerAccount.errorCode
    );
  }
}

const AUTH_RESULT_FIELDS = `
  ... on CurrentUser { id identifier }
  ... on ErrorResult { errorCode message }
`;

async function resolveAfterAuth(errorLabel: string): Promise<ActiveCustomer> {
  const customer = await getActiveCustomer();
  if (!customer) {
    throw new ShopOperationError(errorLabel);
  }
  return customer;
}

/** Consumes the token from the native verification email link. No password argument — the
 *  password was already set at registration; Vendure only needs proof the inbox is real. */
export async function verifyCustomerAccount(token: string): Promise<ActiveCustomer> {
  const data = await shopFetch<{ verifyCustomerAccount: { errorCode?: string; message?: string } }>(
    `mutation VerifyCustomerAccount($token: String!) {
      verifyCustomerAccount(token: $token) { ${AUTH_RESULT_FIELDS} }
    }`,
    { token }
  );
  if (data.verifyCustomerAccount.errorCode) {
    throw new ShopOperationError(
      data.verifyCustomerAccount.message ?? data.verifyCustomerAccount.errorCode,
      data.verifyCustomerAccount.errorCode
    );
  }
  return resolveAfterAuth("No pudimos recuperar tu cuenta luego de verificarla.");
}

export async function login(emailAddress: string, password: string): Promise<ActiveCustomer> {
  const data = await shopFetch<{ login: { errorCode?: string; message?: string } }>(
    `mutation Login($emailAddress: String!, $password: String!) {
      login(username: $emailAddress, password: $password, rememberMe: true) { ${AUTH_RESULT_FIELDS} }
    }`,
    { emailAddress, password }
  );
  if (data.login.errorCode) {
    throw new ShopOperationError(data.login.message ?? data.login.errorCode, data.login.errorCode);
  }
  return resolveAfterAuth("Inicio de sesión incompleto.");
}

export async function logout(): Promise<void> {
  await shopFetch(`mutation Logout { logout { success } }`);
  clearStoredToken();
}

/** Deliberately doesn't surface whether the email exists — same anti-enumeration behavior Vendure
 *  itself uses for registerCustomerAccount, and for the same reason: a different response for
 *  "unknown email" vs "sent" would let someone probe which addresses have accounts. */
export async function requestPasswordReset(emailAddress: string): Promise<void> {
  await shopFetch(
    `mutation RequestPasswordReset($emailAddress: String!) {
      requestPasswordReset(emailAddress: $emailAddress) { ... on ErrorResult { errorCode message } }
    }`,
    { emailAddress }
  );
}

export async function resetPassword(token: string, password: string): Promise<ActiveCustomer> {
  const data = await shopFetch<{ resetPassword: { errorCode?: string; message?: string } }>(
    `mutation ResetPassword($token: String!, $password: String!) {
      resetPassword(token: $token, password: $password) { ${AUTH_RESULT_FIELDS} }
    }`,
    { token, password }
  );
  if (data.resetPassword.errorCode) {
    throw new ShopOperationError(
      data.resetPassword.message ?? data.resetPassword.errorCode,
      data.resetPassword.errorCode
    );
  }
  return resolveAfterAuth("No pudimos iniciar sesión luego de restablecer tu contraseña.");
}
