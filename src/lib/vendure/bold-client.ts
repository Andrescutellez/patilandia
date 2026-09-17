"use client";

import { shopFetch } from "./shop-fetch";

export interface BoldCheckoutData {
  apiKey: string;
  orderId: string;
  amount: number;
  currency: string;
  signature: string;
  redirectionUrl: string;
}

export type BoldPaymentStatusValue =
  | "APPROVED"
  | "REJECTED"
  | "FAILED"
  | "VOIDED"
  | "PROCESSING"
  | "PENDING"
  | "NO_TRANSACTION_FOUND";

export interface BoldPaymentStatus {
  orderCode: string;
  status: BoldPaymentStatusValue;
  orderSettled: boolean;
}

const CHECKOUT_DATA_FIELDS = `apiKey orderId amount currency signature redirectionUrl`;

/** Transitions the active order to ArrangingPayment (server-side) and returns everything needed
 *  to render Bold's Payment Button — never returns the secret key, only the identity key and a
 *  signature already computed server-side. See checkout-page.tsx for how the button gets mounted. */
export async function generateBoldCheckout(): Promise<BoldCheckoutData> {
  const data = await shopFetch<{ generateBoldCheckout: BoldCheckoutData }>(
    `mutation GenerateBoldCheckout { generateBoldCheckout { ${CHECKOUT_DATA_FIELDS} } }`
  );
  return data.generateBoldCheckout;
}

/** Actively asks the backend to check with Bold and settle the order if approved — never trusts
 *  the `bold-tx-status` query param Bold's redirect adds on its own, per Bold's own docs (the
 *  receipt status "puede no ser el estado definitivo"). See confirmacion-bold/page.tsx. */
export async function getBoldPaymentStatus(orderCode: string): Promise<BoldPaymentStatus> {
  const data = await shopFetch<{ boldPaymentStatus: BoldPaymentStatus }>(
    `query BoldPaymentStatus($orderCode: String!) {
      boldPaymentStatus(orderCode: $orderCode) { orderCode status orderSettled }
    }`,
    { orderCode }
  );
  return data.boldPaymentStatus;
}
