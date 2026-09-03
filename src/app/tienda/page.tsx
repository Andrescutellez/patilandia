import { CatalogView } from "@/components/catalog/catalog-view";
import { getStorefrontProducts } from "@/lib/storefront";

export const metadata = {
  title: "Tienda"
};

export default async function StorePage() {
  const storefrontProducts = await getStorefrontProducts();

  return (
    <CatalogView
      description="Camitas, textiles y esenciales con una experiencia visual premium inspirada en un universo fantástico para mascotas."
      heroImage="/images/patilandia/hero-fantasy.png"
      products={storefrontProducts}
      title="Tienda Patilandia"
    />
  );
}
