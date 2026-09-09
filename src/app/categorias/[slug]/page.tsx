import { notFound } from "next/navigation";
import { Suspense } from "react";

import { categories } from "@/data/mock-store";
import { CatalogView } from "@/components/catalog/catalog-view";
import { getStorefrontProducts } from "@/lib/storefront";

export default async function CategoryPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);

  if (!category) {
    notFound();
  }

  const storefrontProducts = await getStorefrontProducts();

  return (
    <Suspense>
      <CatalogView
        activeCategory={slug}
        description={category.description}
        heroImage="/images/patilandia/royal-bed.png"
        products={storefrontProducts}
        title={category.name}
      />
    </Suspense>
  );
}
