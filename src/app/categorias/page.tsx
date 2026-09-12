import Image from "next/image";
import Link from "next/link";

import { categories, collections } from "@/data/mock-store";
import { CollectionCard } from "@/components/home/collection-card";
import { buttonStyles } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/icons";
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
      <section className="rounded-[2rem] border border-white/60 bg-white/82 p-6 shadow-[0_20px_50px_rgba(31,36,84,0.08)] lg:p-8">
        <SectionHeading
          description="Una estructura pensada para crecer por líneas propias, consumibles y categorías recurrentes sin rehacer el frontend."
          eyebrow="Categorías"
          title="La base navegable del catálogo"
        />
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.slug}
              className="rounded-[1.6rem] border border-[var(--line)] bg-[var(--surface)] p-3 transition hover:-translate-y-1 hover:border-[var(--brand-violet)] sm:p-5"
              href={`/categorias/${category.slug}`}
            >
              <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-[var(--brand-soft)] text-[var(--brand-violet-deep)] sm:h-14 sm:w-14">
                {category.image ? (
                  <Image
                    alt={category.name}
                    className="object-cover"
                    fill
                    sizes="56px"
                    src={category.image}
                  />
                ) : (
                  <CategoryIcon className="h-5 w-5 sm:h-6 sm:w-6" icon={category.icon} />
                )}
              </span>
              <p className="mt-3 font-display text-xl leading-tight text-[var(--ink)] sm:mt-4 sm:text-3xl sm:leading-none">
                {category.name}
              </p>
              <p className="mt-2 text-xs text-[var(--muted)] sm:text-sm">{category.description}</p>
            </Link>
          ))}
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
