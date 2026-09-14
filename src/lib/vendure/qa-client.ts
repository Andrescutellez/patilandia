"use client";

const VENDURE_SHOP_API_URL =
  process.env.NEXT_PUBLIC_VENDURE_SHOP_API_URL ?? "http://localhost:3000/shop-api";

export interface SubmitQuestionInput {
  productId: string;
  authorName: string;
  authorEmail: string;
  question: string;
}

/**
 * Public mutation — no customer login required, same trust level as product reviews. New
 * questions start unapproved; they only appear via getProductQuestions() once a moderator answers
 * them from the Patilandia Admin dashboard. No Patipuntos are ever tied to this.
 */
export async function submitProductQuestion(input: SubmitQuestionInput): Promise<void> {
  const response = await fetch(VENDURE_SHOP_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `mutation SubmitProductQuestion($input: SubmitProductQuestionInput!) {
        submitProductQuestion(input: $input) { id }
      }`,
      variables: { input }
    })
  });

  const payload = (await response.json()) as { errors?: Array<{ message: string }> };

  if (payload.errors?.length) {
    throw new Error(payload.errors[0].message);
  }
}
