"use client";

import { VENDURE_MONEY_FACTOR } from "./client";

const VENDURE_SHOP_API_URL =
  process.env.NEXT_PUBLIC_VENDURE_SHOP_API_URL ?? "http://localhost:3000/shop-api";

class LoyaltyApiError extends Error {}

async function shopFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(VENDURE_SHOP_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables })
  });

  const payload = (await response.json()) as { data?: T; errors?: Array<{ message: string }> };

  if (payload.errors?.length) {
    throw new LoyaltyApiError(payload.errors[0].message);
  }
  if (!payload.data) {
    throw new LoyaltyApiError("Vendure no devolvió datos.");
  }
  return payload.data;
}

export interface LoyaltyAccount {
  balance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  completedOrderCount: number;
  emailVerifiedAt: string | null;
  eligible: boolean;
  redemptionBlockedReasons: string[];
}

export interface LoyaltyTransaction {
  id: string;
  createdAt: string;
  amount: number;
  type: string;
  ruleCode: string | null;
  balanceAfter: number;
}

export interface LoyaltySettings {
  /** Decimal currency (COP), already converted from Vendure's minor-unit integer. */
  pointValue: number;
  maxRedemptionPercentage: number;
}

export interface LoyaltyRule {
  code: string;
  label: string;
  kind: "FLAT" | "PER_CURRENCY_UNIT";
  points: number | null;
  currencyMinorUnitsPerPoint: number | null;
  description: string;
}

const ACCOUNT_FIELDS = `balance lifetimeEarned lifetimeRedeemed completedOrderCount emailVerifiedAt eligible redemptionBlockedReasons`;

export async function getMyLoyaltyAccount(email: string): Promise<LoyaltyAccount> {
  const data = await shopFetch<{ myLoyaltyAccount: LoyaltyAccount }>(
    `query MyLoyaltyAccount($email: String!) { myLoyaltyAccount(customerEmail: $email) { ${ACCOUNT_FIELDS} } }`,
    { email }
  );
  return data.myLoyaltyAccount;
}

export async function getMyLoyaltyTransactions(email: string): Promise<LoyaltyTransaction[]> {
  const data = await shopFetch<{ myLoyaltyTransactions: LoyaltyTransaction[] }>(
    `query MyLoyaltyTransactions($email: String!) {
      myLoyaltyTransactions(customerEmail: $email) { id createdAt amount type ruleCode balanceAfter }
    }`,
    { email }
  );
  return data.myLoyaltyTransactions;
}

export async function getLoyaltySettings(): Promise<LoyaltySettings> {
  const data = await shopFetch<{ loyaltySettings: { pointValueInMinorUnits: number; maxRedemptionPercentage: number } }>(
    `query LoyaltySettings { loyaltySettings { pointValueInMinorUnits maxRedemptionPercentage } }`
  );
  return {
    pointValue: data.loyaltySettings.pointValueInMinorUnits / VENDURE_MONEY_FACTOR,
    maxRedemptionPercentage: data.loyaltySettings.maxRedemptionPercentage
  };
}

export async function getLoyaltyRules(): Promise<LoyaltyRule[]> {
  const data = await shopFetch<{ loyaltyRules: LoyaltyRule[] }>(
    `query LoyaltyRules { loyaltyRules { code label kind points currencyMinorUnitsPerPoint description } }`
  );
  return data.loyaltyRules;
}

export async function requestLoyaltyEmailVerification(email: string): Promise<void> {
  await shopFetch(
    `mutation RequestLoyaltyEmailVerification($email: String!) { requestLoyaltyEmailVerification(customerEmail: $email) }`,
    { email }
  );
}

export async function confirmLoyaltyEmailVerification(token: string): Promise<void> {
  await shopFetch(
    `mutation ConfirmLoyaltyEmailVerification($token: String!) { confirmLoyaltyEmailVerification(token: $token) }`,
    { token }
  );
}

export interface RedemptionResult {
  pointsRedeemed: number;
  /** Decimal currency (COP), already converted from Vendure's minor-unit integer. */
  discountAmount: number;
}

export async function applyLoyaltyRedemption(
  orderId: string,
  email: string,
  points: number
): Promise<RedemptionResult> {
  const data = await shopFetch<{
    applyLoyaltyRedemption: { pointsRedeemed: number; discountMinorUnits: number };
  }>(
    `mutation ApplyLoyaltyRedemption($orderId: ID!, $email: String!, $points: Int!) {
      applyLoyaltyRedemption(orderId: $orderId, customerEmail: $email, points: $points) {
        pointsRedeemed
        discountMinorUnits
      }
    }`,
    { orderId, email, points }
  );
  return {
    pointsRedeemed: data.applyLoyaltyRedemption.pointsRedeemed,
    discountAmount: data.applyLoyaltyRedemption.discountMinorUnits / VENDURE_MONEY_FACTOR
  };
}

export async function removeLoyaltyRedemption(orderId: string, email: string): Promise<void> {
  await shopFetch(
    `mutation RemoveLoyaltyRedemption($orderId: ID!, $email: String!) {
      removeLoyaltyRedemption(orderId: $orderId, customerEmail: $email) { id }
    }`,
    { orderId, email }
  );
}

/** Pure — used for the checkout "you have N points" cap preview and the post-purchase "you earned
 *  N points" estimate. The real PURCHASE award happens asynchronously server-side (see
 *  patilandia-vendure's event-subscribers.ts), so this is deliberately an estimate, not a promise
 *  the exact number will match — the authoritative balance shows up moments later in /cuenta/patipuntos. */
export function estimatePurchasePoints(subtotal: number, rules: LoyaltyRule[]): number {
  const purchaseRule = rules.find((rule) => rule.code === "PURCHASE");
  if (!purchaseRule || purchaseRule.kind !== "PER_CURRENCY_UNIT" || !purchaseRule.currencyMinorUnitsPerPoint) {
    return 0;
  }
  const currencyUnitsPerPoint = purchaseRule.currencyMinorUnitsPerPoint / VENDURE_MONEY_FACTOR;
  return Math.floor(subtotal / currencyUnitsPerPoint);
}

/** `subtotal` is decimal currency (COP) — the same shape as useStore().subtotal, not minor units. */
export function maxRedeemablePoints(subtotal: number, balance: number, settings: LoyaltySettings): number {
  const maxByPercentage = Math.floor((subtotal * settings.maxRedemptionPercentage) / 100 / settings.pointValue);
  return Math.max(0, Math.min(balance, maxByPercentage));
}
