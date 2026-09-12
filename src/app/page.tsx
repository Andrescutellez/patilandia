import Link from "next/link";

import { benefits } from "@/data/mock-store";
import { CategoryStrip } from "@/components/home/category-strip";
import { CollectionCard } from "@/components/home/collection-card";
import { HomeHero } from "@/components/home/home-hero";
import { ProductCard } from "@/components/products/product-card";
import { buttonStyles } from "@/components/ui/button";
import { FadeIn } from "@/components/ui/fade-in";
import { SectionHeading } from "@/components/ui/section-heading";
import { getHomepageCollections, getHomepageProducts } from "@/lib/storefront";

export default async function HomePage() {
  const [featuredProducts, collections] = await Promise.all([
    getHomepageProducts(),
    getHomepageCollections(),
  ]);

  return (
    <div className="pb-12">
      <HomeHero />
      <CategoryStrip />

      <section className="mx-auto max-w-7xl space-y-6 px-4 pt-12 sm:px-6 lg:px-8">
        <FadeIn className="space-y-6">
          <SectionHeading
            actionHref="/categorias"
            actionLabel="Ver todas"
            eyebrow="Nuestras colecciones"
            title="Mundos mágicos para cada personalidad"
            titleFont="marker"
          />
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-5">
            {collections.map((collection) => (
              <CollectionCard key={collection.slug} collection={collection} />
            ))}
          </div>
        </FadeIn>
      </section>

      <section className="mx-auto max-w-7xl space-y-6 px-4 pt-12 sm:px-6 lg:px-8">
        <FadeIn className="space-y-6">
          <SectionHeading
            actionHref="/tienda"
            actionLabel="Ver tienda"
            eyebrow="Destacados"
            title="Productos con identidad Patilandia"
          />
          <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
            {featuredProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </FadeIn>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <FadeIn className="grid gap-6 overflow-hidden rounded-[2rem] border border-white/60 bg-[linear-gradient(135deg,#edf1ff,#f5efff)] p-6 shadow-[0_24px_60px_rgba(31,36,84,0.08)] lg:grid-cols-[1fr_320px] lg:p-8">
          <div className="space-y-4">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-[var(--brand-violet-deep)]">
              Producto propio destacado
            </p>
            <h2 className="font-display text-5xl leading-none text-[var(--ink)]">Personaliza su mundo</h2>
            <p className="max-w-2xl text-base leading-8 text-[var(--muted)]">
              La arquitectura ya separa UI, mocks y capa de comercio para que tu línea propia de camas y
              textiles pueda evolucionar hacia variantes reales, stock e inventario por producto.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link className={buttonStyles({ size: "lg" })} href="/producto/camita-personalizada-luna">
                Crear mi camita
              </Link>
              <Link className={buttonStyles({ variant: "secondary", size: "lg" })} href="/checkout">
                Preparar checkout
              </Link>
            </div>
          </div>

          <div className="rounded-[1.8rem] bg-[var(--brand-violet)] p-6 text-white">
            <p className="font-display text-4xl leading-none">Más que productos, experiencias</p>
            <div className="mt-5 grid gap-3 text-sm text-white/80">
              {benefits.map((benefit) => (
                <div key={benefit.title} className="rounded-[1.2rem] border border-white/12 bg-white/8 px-4 py-3">
                  <p className="font-bold text-white">{benefit.title}</p>
                  <p className="mt-1 leading-6">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
        <FadeIn className="grid gap-6 rounded-[2rem] border border-white/60 bg-white/78 p-6 shadow-[0_24px_60px_rgba(31,36,84,0.08)] lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.8rem] bg-[var(--brand-violet-deep)] p-8 text-white">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-white/65">Nuestra historia</p>
            <h2 className="mt-4 font-display text-5xl leading-none">Entrar a un mundo creado para ellos.</h2>
            <p className="mt-4 max-w-xl text-base leading-8 text-white/78">
              Patilandia no nace como una landing aislada sino como la base real de un storefront pet-centric:
              navegable, responsive y preparado para comercio real sin perder fantasía ni calidez.
            </p>
            <Link className={buttonStyles({ className: "mt-6" })} href="/cuenta">
              Conocer la experiencia
            </Link>
          </div>
          <div className="space-y-4 rounded-[1.8rem] bg-[var(--brand-soft)] p-6">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-[var(--brand-violet-deep)]">
              Qué ya queda listo
            </p>
            {[
              "Homepage con hero, categorías, colecciones y destacados.",
              "Catálogo responsive con filtros, búsqueda y ordenamiento.",
              "Página premium de producto con galería, variantes y CTA.",
              "Carrito y checkout reales, conectados a Vendure."
            ].map((item) => (
              <div key={item} className="rounded-[1.2rem] bg-white/84 px-4 py-4 text-sm leading-7 text-[var(--ink)]">
                {item}
              </div>
            ))}
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
