"use client";

import { adaptVendureOrderLine, type VendureOrderLine } from "@/lib/vendure/adapters";
import { VENDURE_MONEY_FACTOR } from "@/lib/vendure/client";
import type { CartLineItem } from "@/types/commerce";

const VENDURE_SHOP_API_URL =
  process.env.NEXT_PUBLIC_VENDURE_SHOP_API_URL ?? "http://localhost:3000/shop-api";
const TOKEN_STORAGE_KEY = "patilandia-vendure-token";
const AUTH_TOKEN_HEADER = "vendure-auth-token";

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
}

class ShopOperationError extends Error {}

function getStoredToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeToken(token: string) {
  try {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // Ignore — worst case the session doesn't persist across reloads.
  }
}

async function shopFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers({ "Content-Type": "application/json" });
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(VENDURE_SHOP_API_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables })
  });

  const newToken = response.headers.get(AUTH_TOKEN_HEADER);
  if (newToken) {
    storeToken(newToken);
  }

  const payload = (await response.json()) as {
    data?: T;
    errors?: Array<{ message: string }>;
  };

  if (payload.errors?.length) {
    throw new ShopOperationError(payload.errors[0].message);
  }

  if (!payload.data) {
    throw new ShopOperationError("Vendure no devolvió datos.");
  }

  return payload.data;
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
  customFields { loyaltyPointsEarned loyaltyPointsRedeemed }
  shippingLines { shippingMethod { name } }
  lines {
    id
    quantity
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
  customFields?: { loyaltyPointsEarned: number; loyaltyPointsRedeemed: number } | null;
  shippingLines: Array<{ shippingMethod: { name: string } }>;
  lines: Array<{ id: string; quantity: number; productVariant: VendureOrderLine["productVariant"] }>;
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
    lines: order.lines.map((line) =>
      adaptVendureOrderLine({
        id: line.id,
        quantity: line.quantity,
        productVariant: line.productVariant
      })
    )
  };
}

function unwrapOrderResult(order: RawOrder): OrderSummary {
  if (order.errorCode) {
    throw new ShopOperationError(order.message ?? order.errorCode);
  }
  return toOrderSummary(order);
}

export async function getActiveOrder(): Promise<OrderSummary | null> {
  const data = await shopFetch<{ activeOrder: RawOrder | null }>(
    `query ActiveOrder { activeOrder { ${ORDER_FIELDS} } }`
  );
  return data.activeOrder ? toOrderSummary(data.activeOrder) : null;
}

export async function addItemToOrder(productVariantId: string, quantity = 1): Promise<OrderSummary> {
  const data = await shopFetch<{ addItemToOrder: RawOrder }>(
    `mutation AddItemToOrder($productVariantId: ID!, $quantity: Int!) {
      addItemToOrder(productVariantId: $productVariantId, quantity: $quantity) { ${ORDER_RESULT_FIELDS} }
    }`,
    { productVariantId, quantity }
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
}): Promise<OrderSummary> {
  const data = await shopFetch<{ setOrderShippingAddress: RawOrder }>(
    `mutation SetOrderShippingAddress($input: CreateAddressInput!) {
      setOrderShippingAddress(input: $input) { ${ORDER_RESULT_FIELDS} }
    }`,
    { input }
  );
  return unwrapOrderResult(data.setOrderShippingAddress);
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

export async function placeOrder(paymentMethodCode: string = DEFAULT_PAYMENT_METHOD_CODE): Promise<OrderSummary> {
  const transition = await shopFetch<{ transitionOrderToState: RawOrder | null }>(
    `mutation TransitionOrderToState($state: String!) {
      transitionOrderToState(state: $state) { ${ORDER_RESULT_FIELDS} }
    }`,
    { state: "ArrangingPayment" }
  );
  if (!transition.transitionOrderToState) {
    throw new ShopOperationError("No se pudo pasar la orden a estado de pago.");
  }
  unwrapOrderResult(transition.transitionOrderToState);

  const payment = await shopFetch<{ addPaymentToOrder: RawOrder }>(
    `mutation AddPaymentToOrder($input: PaymentInput!) {
      addPaymentToOrder(input: $input) { ${ORDER_RESULT_FIELDS} }
    }`,
    { input: { method: paymentMethodCode, metadata: {} } }
  );
  return unwrapOrderResult(payment.addPaymentToOrder);
}
