import { collections, products, findProductBySlug, getRelatedProducts } from "@/data/mock-store";
import { adaptMedusaProduct } from "@/lib/medusa/adapters";
import { medusaFetch } from "@/lib/medusa/client";
import type { StorefrontProduct } from "@/types/commerce";

interface MedusaProductsResponse {
  products?: Array<Record<string, unknown>>;
}

export async function getStorefrontProducts() {
  const response = await medusaFetch<MedusaProductsResponse>(
    "/store/products?fields=+metadata,+images.url"
  );

  if (response?.products?.length) {
    return response.products.map(adaptMedusaProduct);
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
  // not a Medusa entity — they stay static regardless of catalog source.
  return collections;
}

export function getFallbackProduct(slug: string): StorefrontProduct | undefined {
  return findProductBySlug(slug);
}

export function getFallbackRelatedProducts(product: StorefrontProduct) {
  return getRelatedProducts(product);
}
