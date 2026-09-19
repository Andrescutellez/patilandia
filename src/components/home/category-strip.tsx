import Image from "next/image";
import Link from "next/link";

import { categories } from "@/data/mock-store";
import { CategoryIcon } from "@/components/ui/icons";

export function CategoryStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      {/* Mobile: a single scrollable row of small icons — the old 2-column grid made each tile
       *  huge on a phone. From sm: up (real screen space to spare) it goes back to a static grid. */}
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-4 sm:gap-3 sm:overflow-visible sm:pb-0 lg:grid-cols-7 [&::-webkit-scrollbar]:hidden">
        {categories.map((category) => (
          <Link
            key={category.slug}
            className="group w-[4.5rem] shrink-0 rounded-[1.2rem] px-1 py-3 text-center transition hover:bg-[var(--brand-soft)] sm:w-auto sm:shrink sm:rounded-[1.6rem] sm:px-3 sm:py-4"
            href={`/categorias/${category.slug}`}
          >
            <span className="relative mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_top,#fff,#f1ebff_65%,#e5defe)] text-[var(--brand-violet-deep)] shadow-[inset_0_2px_8px_rgba(255,255,255,0.95)] sm:h-20 sm:w-20">
              {category.image ? (
                <Image
                  alt={category.name}
                  className="object-cover"
                  fill
                  sizes="80px"
                  src={category.image}
                />
              ) : (
                <CategoryIcon className="h-6 w-6 sm:h-8 sm:w-8" icon={category.icon} />
              )}
            </span>
            <p className="mt-2 text-xs font-bold text-[var(--ink)] sm:mt-4 sm:text-base">{category.name}</p>
            <p className="mt-1 hidden text-sm text-[var(--muted)] sm:block">{category.tagline}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
