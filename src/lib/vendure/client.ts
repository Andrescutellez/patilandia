const VENDURE_SHOP_API_URL =
  process.env.NEXT_PUBLIC_VENDURE_SHOP_API_URL ?? "http://localhost:3000/shop-api";

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string }>;
}

/**
 * Vendure stores Money as an integer in the currency's minor unit. COP has 2 ISO 4217 decimal
 * places in Vendure's currency table (it isn't in the zero-decimal list like JPY/KRW), so a
 * price of 149900 pesos is stored — and returned by the API — as 14990000.
 */
export const VENDURE_MONEY_FACTOR = 100;

/**
 * POSTs a GraphQL query to Vendure's public Shop API. Fails soft (returns null) on any network
 * or GraphQL error so `storefront.ts` can fall back to the bundled mocks — local dev without
 * Vendure running still works this way.
 */
export async function vendureFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
  init?: { next?: { revalidate?: number; tags?: string[] } }
): Promise<T | null> {
  try {
    const response = await fetch(VENDURE_SHOP_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      ...init
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as GraphQLResponse<T>;

    if (payload.errors?.length) {
      return null;
    }

    return payload.data ?? null;
  } catch {
    return null;
  }
}
