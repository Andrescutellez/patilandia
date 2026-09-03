import { notFound } from "next/navigation";

import { ProductDetail } from "@/components/product/product-detail";
import { getFallbackRelatedProducts, getStorefrontProduct } from "@/lib/storefront";

export default async function ProductPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getStorefrontProduct(slug);

  if (!product) {
    notFound();
  }

  return <ProductDetail product={product} relatedProducts={getFallbackRelatedProducts(product)} />;
}
