"use client";

import { addItemToOrder, setShippingAddress } from "@/lib/vendure/shop-client";
import { shopFetch } from "./shop-fetch";

export const SUBSCRIPTION_FREQUENCIES_DAYS = [15, 30, 45, 60, 90] as const;
export type SubscriptionFrequencyDays = (typeof SUBSCRIPTION_FREQUENCIES_DAYS)[number];
export type SubscriptionStatus = "ACTIVE" | "PAUSED" | "CANCELLED";

export interface SubscriptionAddress {
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

export interface Subscription {
  id: string;
  quantity: number;
  frequencyDays: number;
  status: SubscriptionStatus;
  nextRenewalDate: string;
  productVariantId: string;
  productName: string;
  productSlug: string;
  productImage: string | null;
  shippingAddress: SubscriptionAddress | null;
}

interface RawAddress {
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

interface RawSubscription {
  id: string;
  quantity: number;
  frequencyDays: number;
  status: string;
  nextRenewalDate: string;
  productVariant: {
    id: string;
    product: { name: string; slug: string; featuredAsset?: { preview: string } | null };
  };
  shippingAddress: RawAddress | null;
}

const SUBSCRIPTION_FIELDS = `
  id
  quantity
  frequencyDays
  status
  nextRenewalDate
  productVariant {
    id
    product { name slug featuredAsset { preview } }
  }
  shippingAddress {
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
`;

function adaptAddress(address: RawAddress | null): SubscriptionAddress | null {
  if (!address) return null;
  return {
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
  };
}

function adaptSubscription(raw: RawSubscription): Subscription {
  return {
    id: raw.id,
    quantity: raw.quantity,
    frequencyDays: raw.frequencyDays,
    status: raw.status as SubscriptionStatus,
    nextRenewalDate: raw.nextRenewalDate,
    productVariantId: raw.productVariant.id,
    productName: raw.productVariant.product.name,
    productSlug: raw.productVariant.product.slug,
    productImage: raw.productVariant.product.featuredAsset?.preview ?? null,
    shippingAddress: adaptAddress(raw.shippingAddress)
  };
}

export async function getMySubscriptions(): Promise<Subscription[]> {
  const data = await shopFetch<{ mySubscriptions: RawSubscription[] }>(
    `query MySubscriptions { mySubscriptions { ${SUBSCRIPTION_FIELDS} } }`
  );
  return data.mySubscriptions.map(adaptSubscription);
}

export interface NewSubscriptionAddressInput {
  fullName: string;
  streetLine1: string;
  streetLine2?: string;
  city: string;
  province?: string;
  postalCode?: string;
  countryCode: string;
  phoneNumber?: string;
  neighborhood?: string;
  deliveryNotes?: string;
}

export interface CreateSubscriptionInput {
  productVariantId: string;
  quantity: number;
  frequencyDays: number;
  addressId?: string;
  newAddress?: NewSubscriptionAddressInput;
}

export async function createSubscription(input: CreateSubscriptionInput): Promise<Subscription> {
  const data = await shopFetch<{ createProductSubscription: RawSubscription }>(
    `mutation CreateProductSubscription($input: CreateProductSubscriptionInput!) {
      createProductSubscription(input: $input) { ${SUBSCRIPTION_FIELDS} }
    }`,
    { input }
  );
  return adaptSubscription(data.createProductSubscription);
}

export async function pauseSubscription(id: string): Promise<Subscription> {
  const data = await shopFetch<{ pauseSubscription: RawSubscription }>(
    `mutation PauseSubscription($id: ID!) { pauseSubscription(id: $id) { ${SUBSCRIPTION_FIELDS} } }`,
    { id }
  );
  return adaptSubscription(data.pauseSubscription);
}

export async function resumeSubscription(id: string): Promise<Subscription> {
  const data = await shopFetch<{ resumeSubscription: RawSubscription }>(
    `mutation ResumeSubscription($id: ID!) { resumeSubscription(id: $id) { ${SUBSCRIPTION_FIELDS} } }`,
    { id }
  );
  return adaptSubscription(data.resumeSubscription);
}

export async function cancelSubscription(id: string): Promise<Subscription> {
  const data = await shopFetch<{ cancelSubscription: RawSubscription }>(
    `mutation CancelSubscription($id: ID!) { cancelSubscription(id: $id) { ${SUBSCRIPTION_FIELDS} } }`,
    { id }
  );
  return adaptSubscription(data.cancelSubscription);
}

export async function updateSubscriptionQuantity(id: string, quantity: number): Promise<Subscription> {
  const data = await shopFetch<{ updateSubscriptionQuantity: RawSubscription }>(
    `mutation UpdateSubscriptionQuantity($id: ID!, $quantity: Int!) {
      updateSubscriptionQuantity(id: $id, quantity: $quantity) { ${SUBSCRIPTION_FIELDS} }
    }`,
    { id, quantity }
  );
  return adaptSubscription(data.updateSubscriptionQuantity);
}

export async function updateSubscriptionFrequency(id: string, frequencyDays: number): Promise<Subscription> {
  const data = await shopFetch<{ updateSubscriptionFrequency: RawSubscription }>(
    `mutation UpdateSubscriptionFrequency($id: ID!, $frequencyDays: Int!) {
      updateSubscriptionFrequency(id: $id, frequencyDays: $frequencyDays) { ${SUBSCRIPTION_FIELDS} }
    }`,
    { id, frequencyDays }
  );
  return adaptSubscription(data.updateSubscriptionFrequency);
}

export interface UpdateSubscriptionAddressInput {
  id: string;
  addressId?: string;
  newAddress?: NewSubscriptionAddressInput;
}

export async function updateSubscriptionAddress(input: UpdateSubscriptionAddressInput): Promise<Subscription> {
  const data = await shopFetch<{ updateSubscriptionAddress: RawSubscription }>(
    `mutation UpdateSubscriptionAddress($input: UpdateSubscriptionAddressInput!) {
      updateSubscriptionAddress(input: $input) { ${SUBSCRIPTION_FIELDS} }
    }`,
    { input }
  );
  return adaptSubscription(data.updateSubscriptionAddress);
}

/**
 * "Comprar ahora" — the only path from a subscription to an actual order, and it never charges
 * anything on its own: it just reuses the exact same mutations any normal cart/checkout already
 * uses (addItemToOrder, setShippingAddress). Once this resolves, the caller redirects to /checkout,
 * which proceeds completely unaware a subscription was ever involved — the item and address are
 * simply already there. The subscriptionId travels as an OrderLine customField (not something
 * checkout needs to know about) so the backend can advance this subscription's schedule once the
 * resulting order's payment is authorized.
 */
export async function buyNow(subscription: Subscription): Promise<void> {
  await addItemToOrder(subscription.productVariantId, subscription.quantity, {
    subscriptionId: subscription.id
  });

  const address = subscription.shippingAddress;
  if (address) {
    await setShippingAddress({
      fullName: address.fullName,
      streetLine1: address.streetLine1,
      city: address.city,
      province: address.province || undefined,
      postalCode: address.postalCode || undefined,
      phoneNumber: address.phoneNumber || undefined,
      countryCode: "CO",
      neighborhood: address.neighborhood || undefined,
      deliveryNotes: address.deliveryNotes || undefined
    });
  }
  // If the subscription's saved address was deleted from the customer's address book (nullable FK,
  // SET NULL on delete — see the entity), there's simply nothing to prefill: checkout's own address
  // form still works exactly as it does for any other order.
}
