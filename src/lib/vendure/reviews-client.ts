"use client";

const VENDURE_SHOP_API_URL =
  process.env.NEXT_PUBLIC_VENDURE_SHOP_API_URL ?? "http://localhost:3000/shop-api";

export interface SubmitReviewInput {
  productId: string;
  authorName: string;
  authorEmail: string;
  rating: number;
  title: string;
  body: string;
}

/**
 * Public mutation — no customer login required (auth is deferred storefront-wide, see
 * Decisiones y Razonamiento). New reviews start unapproved; they only appear via
 * getProductReviews() once a moderator publishes them from the Patilandia Admin dashboard.
 */
export async function submitProductReview(input: SubmitReviewInput): Promise<void> {
  const response = await fetch(VENDURE_SHOP_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `mutation SubmitProductReview($input: SubmitProductReviewInput!) {
        submitProductReview(input: $input) { id }
      }`,
      variables: { input }
    })
  });

  const payload = (await response.json()) as { errors?: Array<{ message: string }> };

  if (payload.errors?.length) {
    throw new Error(payload.errors[0].message);
  }
}
