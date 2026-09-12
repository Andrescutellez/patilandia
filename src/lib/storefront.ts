import { collections, products, findProductBySlug } from "@/data/mock-store";
import { adaptVendureProduct, type VendureProduct } from "@/lib/vendure/adapters";
import { vendureFetch } from "@/lib/vendure/client";
import type { StorefrontProduct } from "@/types/commerce";

const PRODUCT_FIELDS = `
  id
  slug
  name
  description
  featuredAsset { preview }
  assets { preview }
  facetValues { code name facet { code } }
  variants {
    id
    sku
    price
    stockLevel
    options { name group { code } customFields { hex } }
    customFields { weightKg shippingClass compareAtPrice }
  }
  customFields {
    shortDescription
    materials
    care
    highlights { title description icon }
    rating
    reviewCount
    badge
    featured
  }
`;

const PRODUCTS_QUERY = `
  query StorefrontProducts {
    products(options: { take: 100 }) {
      items {
        ${PRODUCT_FIELDS}
      }
    }
  }
`;

interface VendureProductsResponse {
  products?: { items: VendureProduct[] };
}

export async function getStorefrontProducts() {
  const response = await vendureFetch<VendureProductsResponse>(PRODUCTS_QUERY, undefined, {
    next: { revalidate: 60 }
  });

  if (response?.products?.items.length) {
    return response.products.items.map(adaptVendureProduct);
  }

  return products;
}

export async function getStorefrontProduct(slug: string) {
  const allProducts = await getStorefrontProducts();
  return allProducts.find((product) => product.slug === slug) ?? findProductBySlug(slug);
}

export async function getHomepageProducts() {
  const allProducts = await getStorefrontProducts();
  return allProducts.filter((product) => product.featured).slice(0, 6);
}

export async function getHomepageCollections() {
  // Collections are fixed visual themes (royal/galaxy/magic/safari/dreams),
  // not something a shopper filters by directly — they stay static regardless of catalog source.
  return collections;
}

export function getFallbackProduct(slug: string): StorefrontProduct | undefined {
  return findProductBySlug(slug);
}

/**
 * Cross-sell pairing between categories — a real merchandising decision, not something derivable
 * from catalog data alone (nothing in Vendure says "a bed pairs well with snacks"). Kept as a
 * simple, explicit map so it's easy to revisit as the catalog grows past today's 3 populated
 * categories (camitas, accesorios, alimentos) into the other 4 already defined (juguetes, higiene,
 * transporte, ropa) — e.g. "alguien compró una camita, sugerile también arena o snacks", which
 * pure same-category similarity can never surface on its own.
 */
const COMPLEMENTARY_CATEGORIES: Record<string, string[]> = {
  camitas: ["accesorios", "alimentos", "higiene"],
  accesorios: ["camitas", "alimentos", "higiene", "juguetes"],
  alimentos: ["higiene", "accesorios", "camitas"],
  higiene: ["alimentos", "accesorios"],
  juguetes: ["accesorios", "alimentos"],
  transporte: ["accesorios", "higiene"],
  ropa: ["accesorios"]
};

function petTypeCompatible(a: StorefrontProduct, b: StorefrontProduct): boolean {
  return a.petType === "all" || b.petType === "all" || a.petType === b.petType;
}

function byThemeThenRating(product: StorefrontProduct) {
  return (a: StorefrontProduct, b: StorefrontProduct) =>
    Number(b.collectionSlug === product.collectionSlug) - Number(a.collectionSlug === product.collectionSlug) ||
    b.rating - a.rating;
}

/**
 * Merges one product at a time from each category (best-rated first within each), instead of
 * sorting the whole complementary pool by rating alone — otherwise, with every product tied at
 * rating 0 (no reviews yet, or several categories with only one item each), the category listed
 * first in COMPLEMENTARY_CATEGORIES would silently crowd out the others (e.g. beds burying the
 * one snack) even though both are meant to be suggested.
 */
function roundRobinByCategory(items: StorefrontProduct[], categoryOrder: string[]): StorefrontProduct[] {
  const byCategory = categoryOrder.map((category) =>
    items.filter((item) => item.categorySlug === category).sort((a, b) => b.rating - a.rating)
  );
  const result: StorefrontProduct[] = [];
  let addedInRound = true;
  while (addedInRound) {
    addedInRound = false;
    for (const bucket of byCategory) {
      const next = bucket.shift();
      if (next) {
        result.push(next);
        addedInRound = true;
      }
    }
  }
  return result;
}

/**
 * Pure ranking logic behind getRelatedProducts(), kept separate so it can be unit tested without
 * mocking the network. Blends two signals instead of just "more of the same":
 *  - "Más como este": same category (or same theme collection, ranked higher within it) — useful
 *    when someone's comparing similar options.
 *  - "Va bien con esto": a different, complementary category (e.g. a bed → snacks/litter) — real
 *    cross-sell, which pure similarity never produces on its own.
 * Both pools are filtered to a compatible pet type first (a dog toy is not a useful suggestion
 * under a cat product), then interleaved so cross-sell items actually surface in the result
 * instead of always losing to same-category matches.
 */
export function rankRelatedProducts(
  product: StorefrontProduct,
  allProducts: StorefrontProduct[],
  limit = 4
): StorefrontProduct[] {
  const candidates = allProducts.filter(
    (candidate) => candidate.slug !== product.slug && petTypeCompatible(product, candidate)
  );

  const similar = candidates
    .filter((candidate) => candidate.categorySlug === product.categorySlug)
    .sort(byThemeThenRating(product));

  const complementaryCategories = COMPLEMENTARY_CATEGORIES[product.categorySlug] ?? [];
  const complementary = roundRobinByCategory(
    candidates.filter((candidate) => complementaryCategories.includes(candidate.categorySlug)),
    complementaryCategories
  );

  const result: StorefrontProduct[] = [];
  const seen = new Set<string>();
  let i = 0;
  let j = 0;
  while (result.length < limit && (i < similar.length || j < complementary.length)) {
    if (i < similar.length) {
      const candidate = similar[i++];
      if (!seen.has(candidate.slug)) {
        seen.add(candidate.slug);
        result.push(candidate);
      }
    }
    if (result.length < limit && j < complementary.length) {
      const candidate = complementary[j++];
      if (!seen.has(candidate.slug)) {
        seen.add(candidate.slug);
        result.push(candidate);
      }
    }
  }

  // Backfill so the section is never sparse just because a category has no configured pairing yet
  // (e.g. "ropa" today) — better to show something reasonable than an almost-empty "Relacionados".
  if (result.length < limit) {
    for (const candidate of [...candidates].sort((a, b) => b.rating - a.rating)) {
      if (result.length >= limit) break;
      if (!seen.has(candidate.slug)) {
        seen.add(candidate.slug);
        result.push(candidate);
      }
    }
  }

  return result;
}

/**
 * Real recommendations, not mocks: ranks the live catalog against the product being viewed. Falls
 * back to the mock catalog automatically the same way getStorefrontProducts() already does when
 * Vendure is unreachable — no separate fallback path needed. This replaces the old
 * getFallbackRelatedProducts(), which always matched against the hardcoded mock array regardless
 * of where the current product's data actually came from.
 */
export async function getRelatedProducts(
  product: StorefrontProduct,
  limit = 4
): Promise<StorefrontProduct[]> {
  const allProducts = await getStorefrontProducts();
  return rankRelatedProducts(product, allProducts, limit);
}
