import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { categories } from "@/data/mock-store";
import { CatalogView } from "@/components/catalog/catalog-view";
import { getStorefrontProducts } from "@/lib/storefront";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = categories.find((item) => item.slug === slug);

  if (!category) {
    return { title: "Categoría no encontrada" };
  }

  const title = category.name;
  const description = category.description;

  return {
    title,
    description,
    alternates: {
      canonical: `/categorias/${category.slug}`
    },
    openGraph: {
      title,
      description,
      url: `/categorias/${category.slug}`,
      images: category.image ? [{ url: category.image, width: 1200, height: 1200, alt: category.name }] : undefined
    }
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
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
