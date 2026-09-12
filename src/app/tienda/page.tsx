import { Suspense } from "react";

import { CatalogView } from "@/components/catalog/catalog-view";
import { getStorefrontProducts } from "@/lib/storefront";

export const metadata = {
  title: "Tienda",
  description:
    "Camitas, textiles y esenciales para perros y gatos, con una experiencia visual premium inspirada en un universo fantástico. Envíos a toda Colombia.",
  alternates: { canonical: "/tienda" }
};

export default async function StorePage() {
  const storefrontProducts = await getStorefrontProducts();

  return (
    <Suspense>
      <CatalogView
        description="Camitas, textiles y esenciales con una experiencia visual premium inspirada en un universo fantástico para mascotas."
        heroImage="/images/patilandia/hero-fantasy.png"
        products={storefrontProducts}
        title="Tienda Patilandia"
      />
    </Suspense>
  );
}
