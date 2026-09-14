"use client";

import { shopFetch } from "./shop-fetch";

const WISHLIST_ITEM_FIELDS = `product { id }`;

export async function addToWishlist(email: string, productId: string): Promise<void> {
  await shopFetch(
    `mutation AddToWishlist($email: String!, $productId: ID!) {
      addToWishlist(customerEmail: $email, productId: $productId) { ${WISHLIST_ITEM_FIELDS} }
    }`,
    { email, productId }
  );
}

export async function removeFromWishlist(email: string, productId: string): Promise<void> {
  await shopFetch(
    `mutation RemoveFromWishlist($email: String!, $productId: ID!) {
      removeFromWishlist(customerEmail: $email, productId: $productId)
    }`,
    { email, productId }
  );
}

/** Merges a locally-held list of product ids into the real wishlist for this email. Returns the
 *  merged list (local ids + anything already stored server-side for this email, e.g. from another
 *  device) so the caller can replace its local state with the authoritative result. */
export async function syncWishlist(email: string, productIds: string[]): Promise<string[]> {
  const data = await shopFetch<{ syncWishlist: Array<{ product: { id: string } }> }>(
    `mutation SyncWishlist($email: String!, $productIds: [ID!]!) {
      syncWishlist(customerEmail: $email, productIds: $productIds) { ${WISHLIST_ITEM_FIELDS} }
    }`,
    { email, productIds }
  );
  return data.syncWishlist.map((item) => item.product.id);
}
