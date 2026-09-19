import Link from "next/link";

import { collections } from "@/data/mock-store";
import { CategoryStrip } from "@/components/home/category-strip";
import { CollectionCard } from "@/components/home/collection-card";
import { buttonStyles } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata = {
  title: "Categorías",
  description:
    "Explorá el catálogo de Patilandia por categoría: camitas, juguetes, alimentos, accesorios, higiene, transporte y ropa para tu mascota.",
  alternates: { canonical: "/categorias" }
};

export default function CategoriesPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-6 lg:px-8">
      <section>
        <h1 className="font-display text-5xl leading-none text-[var(--ink)] sm:text-6xl">Categorías</h1>
        <div className="mt-8">
          <CategoryStrip className="" />
        </div>
      </section>

      <section className="space-y-6">
        <SectionHeading
          actionHref="/tienda"
          actionLabel="Explorar tienda"
          description="Colecciones visuales para organizar el catálogo sin perder la personalidad fantástica y premium de la marca."
          eyebrow="Colecciones"
          title="Lenguaje visual consistente"
        />
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-5">
          {collections.map((collection) => (
            <CollectionCard key={collection.slug} collection={collection} />
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/60 bg-[var(--brand-violet)] p-8 text-white shadow-[0_24px_60px_rgba(31,36,84,0.12)]">
        <h2 className="font-display text-5xl leading-none">Categorías conectadas a un catálogo real</h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-white/78">
          Cada categoría lee productos, variantes, precios e inventario reales desde la API de
          Vendure — con mocks de respaldo solo si el backend no está disponible.
        </p>
        <Link className={buttonStyles({ className: "mt-6" })} href="/checkout">
          Ver flujo de compra
        </Link>
      </section>
    </div>
  );
}
