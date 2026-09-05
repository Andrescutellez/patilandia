import Image from "next/image";
import Link from "next/link";

import { categories } from "@/data/mock-store";
import { CategoryIcon } from "@/components/ui/icons";

export function CategoryStrip() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 gap-3 rounded-[2rem] border border-white/60 bg-white/80 p-3 shadow-[0_20px_50px_rgba(31,36,84,0.08)] backdrop-blur md:grid-cols-4 lg:grid-cols-7">
        {categories.map((category) => (
          <Link
            key={category.slug}
            className="group rounded-[1.6rem] px-3 py-4 text-center transition hover:bg-[var(--brand-soft)]"
            href={`/categorias/${category.slug}`}
          >
            <span className="relative mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_top,#fff,#f1ebff_65%,#e5defe)] text-[var(--brand-violet-deep)] shadow-[inset_0_2px_8px_rgba(255,255,255,0.95)]">
              {category.image ? (
                <Image
                  alt={category.name}
                  className="object-cover"
                  fill
                  sizes="80px"
                  src={category.image}
                />
              ) : (
                <CategoryIcon className="h-8 w-8" icon={category.icon} />
              )}
            </span>
            <p className="mt-4 font-bold text-[var(--ink)]">{category.name}</p>
            <p className="mt-1 text-sm text-[var(--muted)]">{category.tagline}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
