import Link from "next/link";

import { categories, mainNavigation } from "@/data/mock-store";
import { Logo } from "@/components/patilandia/logo";
import { HeartIcon, PawIcon, SparklesIcon } from "@/components/ui/icons";

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-[linear-gradient(180deg,#191f64,#111644)] text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] lg:px-8">
        <div className="space-y-5">
          <Logo className="[&_span:last-child]:text-white/70 [&_span:first-child]:text-white [&_svg]:text-white" />
          <p className="max-w-md text-sm leading-7 text-white/70">
            Patilandia diseña un e-commerce pet-centric con alma textil, estética fantástica y una
            experiencia construida sobre Vendure sin perder identidad.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/60">Navegación</h3>
          <div className="grid gap-3 text-sm text-white/80">
            {mainNavigation.map((link) => (
              <Link key={link.href} className="transition hover:text-white" href={link.href}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/60">Categorías</h3>
          <div className="grid gap-3 text-sm text-white/80">
            {categories.slice(0, 6).map((category) => (
              <Link
                key={category.slug}
                className="transition hover:text-white"
                href={`/categorias/${category.slug}`}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <h3 className="text-sm font-black uppercase tracking-[0.3em] text-white/60">Nuestra promesa</h3>
          <div className="grid gap-4">
            <div className="flex items-start gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
              <SparklesIcon className="mt-0.5 h-5 w-5 text-[var(--brand-gold)]" />
              <p className="text-sm text-white/80">Diseño premium inspirado en un mundo fantástico original.</p>
            </div>
            <div className="flex items-start gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
              <PawIcon className="mt-0.5 h-5 w-5 text-[var(--brand-gold)]" />
              <p className="text-sm text-white/80">Base desacoplada para catálogo, carrito y checkout reales.</p>
            </div>
            <div className="flex items-start gap-3 rounded-3xl border border-white/10 bg-white/5 p-4">
              <HeartIcon className="mt-0.5 h-5 w-5 text-[var(--brand-gold)]" />
              <p className="text-sm text-white/80">Una experiencia diseñada para sentirse cercana, cálida y memorable.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 px-4 py-5 text-center text-xs text-white/55">
        © 2026 Patilandia. Un mundo hecho para ellos.
      </div>
    </footer>
  );
}
