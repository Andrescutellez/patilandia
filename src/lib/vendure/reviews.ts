import { vendureFetch } from "@/lib/vendure/client";

export interface ProductReview {
  id: string;
  createdAt: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
}

const REVIEWS_QUERY = `
  query ProductReviews($productId: ID!) {
    productReviews(productId: $productId, options: { take: 50, sort: { createdAt: DESC } }) {
      items {
        id
        createdAt
        authorName
        rating
        title
        body
      }
    }
  }
`;

interface VendureReviewsResponse {
  productReviews: { items: ProductReview[] };
}

/** Shop API only ever returns approved reviews for this query — moderation lives in the Dashboard. */
export async function getProductReviews(productId: string): Promise<ProductReview[]> {
  if (!productId) {
    return [];
  }

  const response = await vendureFetch<VendureReviewsResponse>(
    REVIEWS_QUERY,
    { productId },
    { next: { revalidate: 60 } }
  );

  return response?.productReviews.items ?? [];
}
