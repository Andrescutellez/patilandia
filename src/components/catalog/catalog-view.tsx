"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { categories } from "@/data/mock-store";
import { buttonStyles } from "@/components/ui/button";
import { CategoryIcon, ChevronDownIcon, FilterIcon, PawIcon } from "@/components/ui/icons";
import { ProductCard } from "@/components/products/product-card";
import type { StorefrontProduct } from "@/types/commerce";

type SortMode = "featured" | "price-asc" | "price-desc" | "rating";

export function CatalogView({
  products,
  title,
  description,
  heroImage,
  activeCategory
}: {
  products: StorefrontProduct[];
  title: string;
  description: string;
  heroImage: string;
  activeCategory?: string;
}) {
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("featured");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedPetTypes, setSelectedPetTypes] = useState<string[]>([]);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const visibleProducts = useMemo(() => {
    let nextProducts = [...products];

    if (activeCategory) {
      nextProducts = nextProducts.filter((product) => product.categorySlug === activeCategory);
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      nextProducts = nextProducts.filter((product) =>
        [product.name, product.shortDescription, product.categoryLabel].join(" ").toLowerCase().includes(query)
      );
    }

    if (selectedSizes.length > 0) {
      nextProducts = nextProducts.filter((product) =>
        selectedSizes.some((size) => product.sizes.includes(size as StorefrontProduct["sizes"][number]))
      );
    }

    if (selectedPetTypes.length > 0) {
      nextProducts = nextProducts.filter((product) =>
        selectedPetTypes.includes(product.petType) || product.petType === "all"
      );
    }

    switch (sortMode) {
      case "price-asc":
        nextProducts.sort((left, right) => left.price - right.price);
        break;
      case "price-desc":
        nextProducts.sort((left, right) => right.price - left.price);
        break;
      case "rating":
        nextProducts.sort((left, right) => right.rating - left.rating);
        break;
      default:
        nextProducts.sort((left, right) => Number(right.featured) - Number(left.featured));
    }

    return nextProducts;
  }, [activeCategory, products, search, selectedPetTypes, selectedSizes, sortMode]);

  const filters = (
    <aside className="space-y-6 rounded-[2rem] border border-white/60 bg-white/80 p-5 shadow-[0_18px_45px_rgba(31,36,84,0.08)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FilterIcon className="h-4 w-4 text-[var(--brand-violet-deep)]" />
          <p className="font-bold text-[var(--ink)]">Filtros</p>
        </div>
        <button
          className="text-sm font-bold text-[var(--brand-violet-deep)]"
          onClick={() => {
            setSearch("");
            setSelectedSizes([]);
            setSelectedPetTypes([]);
            setSortMode("featured");
          }}
          type="button"
        >
          Limpiar
        </button>
      </div>

      <label className="grid gap-2">
        <span className="text-sm font-bold text-[var(--ink)]">Buscar</span>
        <input
          className="h-12 rounded-2xl border border-[var(--line)] px-4 text-sm text-[var(--ink)] outline-none"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Camita nube, manta..."
          value={search}
        />
      </label>

      <div className="grid gap-3">
        <p className="text-sm font-bold text-[var(--ink)]">Tamaño</p>
        {["S", "M", "L", "XL"].map((size) => (
          <label key={size} className="flex items-center gap-3 text-sm text-[var(--muted)]">
            <input
              checked={selectedSizes.includes(size)}
              className="h-4 w-4 rounded border-[var(--line)] accent-[var(--brand-violet)]"
              onChange={(event) =>
                setSelectedSizes((current) =>
                  event.target.checked ? [...current, size] : current.filter((item) => item !== size)
                )
              }
              type="checkbox"
            />
            <span>{size}</span>
          </label>
        ))}
      </div>

      <div className="grid gap-3">
        <p className="text-sm font-bold text-[var(--ink)]">Tipo de mascota</p>
        {[
          { label: "Perros", value: "dogs" },
          { label: "Gatos", value: "cats" }
        ].map((option) => (
          <label key={option.value} className="flex items-center gap-3 text-sm text-[var(--muted)]">
            <input
              checked={selectedPetTypes.includes(option.value)}
              className="h-4 w-4 rounded border-[var(--line)] accent-[var(--brand-violet)]"
              onChange={(event) =>
                setSelectedPetTypes((current) =>
                  event.target.checked
                    ? [...current, option.value]
                    : current.filter((item) => item !== option.value)
                )
              }
              type="checkbox"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>

      <div className="grid gap-3">
        <p className="text-sm font-bold text-[var(--ink)]">Categorías</p>
        {categories.map((category) => (
          <Link
            key={category.slug}
            className="rounded-2xl border border-[var(--line)] px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--brand-violet)] hover:bg-[var(--brand-soft)]"
            href={`/categorias/${category.slug}`}
          >
            {category.name}
          </Link>
        ))}
      </div>
    </aside>
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-[#1d256d] shadow-[0_30px_80px_rgba(32,41,96,0.14)]">
        <Image
          alt={title}
          className="absolute inset-0 h-full w-full object-cover"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 1200px"
          src={heroImage}
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,22,76,0.88)_0%,rgba(15,22,76,0.62)_42%,rgba(15,22,76,0.12)_100%)]" />
        <div className="relative max-w-xl space-y-4 px-6 py-10 text-white sm:px-10 lg:py-16">
          <span className="inline-flex rounded-full bg-white/16 px-4 py-2 text-xs font-black uppercase tracking-[0.22em]">
            Patilandia
          </span>
          <h1 className="font-display text-5xl leading-[0.94]">{title}</h1>
          <p className="text-lg leading-8 text-white/80">{description}</p>
          <Link className={buttonStyles({ size: "lg", className: "w-fit" })} href="/checkout">
            Ver colección completa
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 rounded-[2rem] border border-white/60 bg-white/75 p-3 shadow-[0_18px_45px_rgba(31,36,84,0.08)] md:grid-cols-4 lg:grid-cols-8">
        {categories.map((category) => (
          <Link
            key={category.slug}
            className={`rounded-[1.4rem] px-3 py-4 text-center transition hover:bg-[var(--brand-soft)] ${
              activeCategory === category.slug ? "bg-[var(--brand-soft)]" : ""
            }`}
            href={`/categorias/${category.slug}`}
          >
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-violet-deep)]">
              <CategoryIcon className="h-6 w-6" icon={category.icon} />
            </span>
            <p className="mt-3 text-sm font-bold text-[var(--ink)]">{category.name}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="hidden lg:block">{filters}</div>

        <div className="space-y-6">
          <div className="flex flex-col gap-4 rounded-[2rem] border border-white/60 bg-white/80 p-5 shadow-[0_18px_45px_rgba(31,36,84,0.08)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <PawIcon className="h-6 w-6 text-[var(--brand-violet-deep)]" />
                <h2 className="font-display text-4xl leading-none text-[var(--ink)]">{title}</h2>
              </div>
              <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                className={buttonStyles({ variant: "secondary", className: "lg:hidden" })}
                onClick={() => setMobileFiltersOpen((current) => !current)}
                type="button"
              >
                <FilterIcon className="h-4 w-4" />
                Filtros
              </button>

              <label className="flex h-12 items-center gap-2 rounded-full border border-[var(--line)] px-4 text-sm font-semibold text-[var(--muted)]">
                <span>Ordenar</span>
                <select
                  className="bg-transparent text-[var(--ink)] outline-none"
                  onChange={(event) => setSortMode(event.target.value as SortMode)}
                  value={sortMode}
                >
                  <option value="featured">Destacados</option>
                  <option value="price-asc">Precio menor</option>
                  <option value="price-desc">Precio mayor</option>
                  <option value="rating">Mejor rating</option>
                </select>
                <ChevronDownIcon className="h-4 w-4" />
              </label>
            </div>
          </div>

          {mobileFiltersOpen ? <div className="lg:hidden">{filters}</div> : null}

          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visibleProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>

          {visibleProducts.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-[var(--line)] bg-white/70 px-6 py-12 text-center">
              <p className="font-display text-3xl text-[var(--ink)]">No encontramos resultados</p>
              <p className="mt-2 text-sm text-[var(--muted)]">
                Ajusta la búsqueda o limpia filtros para seguir explorando.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
