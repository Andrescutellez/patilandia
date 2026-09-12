import type { MetadataRoute } from "next";

import { categories } from "@/data/mock-store";
import { SITE_URL } from "@/lib/site-config";
import { getStorefrontProducts } from "@/lib/storefront";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await getStorefrontProducts();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/tienda`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/categorias`, changeFrequency: "weekly", priority: 0.6 }
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE_URL}/categorias/${category.slug}`,
    changeFrequency: "weekly",
    priority: 0.7
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${SITE_URL}/producto/${product.slug}`,
    changeFrequency: "weekly",
    priority: 0.8
  }));

  // /carrito, /checkout y /cuenta quedan fuera a propósito — son páginas
  // transaccionales/personales, sin contenido único que valga la pena indexar.
  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
