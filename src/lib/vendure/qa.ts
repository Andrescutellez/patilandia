import { vendureFetch } from "@/lib/vendure/client";

export interface ProductQuestion {
  id: string;
  createdAt: string;
  authorName: string;
  question: string;
  answer: string;
}

const QUESTIONS_QUERY = `
  query ProductQuestions($productId: ID!) {
    productQuestions(productId: $productId, options: { take: 50, sort: { createdAt: DESC } }) {
      items {
        id
        createdAt
        authorName
        question
        answer
      }
    }
  }
`;

interface VendureQuestionsResponse {
  productQuestions: { items: ProductQuestion[] };
}

/** Shop API only ever returns answered/approved questions — moderation lives in the Dashboard. */
export async function getProductQuestions(productId: string): Promise<ProductQuestion[]> {
  if (!productId) {
    return [];
  }

  const response = await vendureFetch<VendureQuestionsResponse>(
    QUESTIONS_QUERY,
    { productId },
    { next: { revalidate: 60 } }
  );

  return response?.productQuestions.items ?? [];
}
