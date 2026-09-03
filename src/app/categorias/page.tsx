import Link from "next/link";

import { categories, collections } from "@/data/mock-store";
import { CollectionCard } from "@/components/home/collection-card";
import { buttonStyles } from "@/components/ui/button";
import { CategoryIcon } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/section-heading";

export const metadata = {
  title: "Categorías"
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
        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.slug}
              className="rounded-[1.6rem] border border-[var(--line)] bg-[var(--surface)] p-5 transition hover:-translate-y-1 hover:border-[var(--brand-violet)]"
              href={`/categorias/${category.slug}`}
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-violet-deep)]">
                <CategoryIcon className="h-6 w-6" icon={category.icon} />
              </span>
              <p className="mt-4 font-display text-3xl leading-none text-[var(--ink)]">{category.name}</p>
              <p className="mt-2 text-sm text-[var(--muted)]">{category.description}</p>
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
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-5">
          {collections.map((collection) => (
            <CollectionCard key={collection.slug} collection={collection} />
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/60 bg-[linear-gradient(135deg,#223089,#7f72ff)] p-8 text-white shadow-[0_24px_60px_rgba(31,36,84,0.12)]">
        <h2 className="font-display text-5xl leading-none">Preparado para integrarse con Medusa</h2>
        <p className="mt-4 max-w-3xl text-base leading-8 text-white/78">
          Las categorías quedan desacopladas del origen de datos. Hoy pueden consumir mocks y mañana
          productos, variantes, precios e inventario desde la Store API de Medusa.
        </p>
        <Link className={buttonStyles({ variant: "gold", className: "mt-6" })} href="/checkout">
          Ver flujo de compra
        </Link>
      </section>
    </div>
  );
}
