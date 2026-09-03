import Image from "next/image";
import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { ChevronRightIcon, HeartIcon, SparklesIcon } from "@/components/ui/icons";

export function HomeHero() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-[#1d256d] shadow-[0_30px_80px_rgba(32,41,96,0.18)]">
        <Image
          alt="Patilandia hero"
          className="absolute inset-0 h-full w-full object-cover object-center"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 1200px"
          src="/images/patilandia/hero-fantasy.png"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(16,23,78,0.88)_0%,rgba(27,31,95,0.76)_35%,rgba(27,31,95,0.18)_68%,rgba(27,31,95,0.04)_100%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.22),transparent_38%)]" />

        <div className="relative grid min-h-[620px] items-center gap-8 px-6 py-10 sm:px-10 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-14">
          <div className="max-w-2xl space-y-6 text-white">
            <p className="text-sm font-black uppercase tracking-[0.42em] text-white/85">
              Todo lo que tu mascota necesita
            </p>
            <h1 className="font-display text-5xl leading-[0.94] sm:text-6xl lg:text-7xl">
              En un solo lugar,
              <span className="mt-2 block text-[var(--brand-pink)]">hecho con magia real.</span>
            </h1>
            <p className="max-w-xl text-lg leading-8 text-white/82">
              Camitas, textiles, snacks, accesorios y una experiencia diseñada para que entrar a
              Patilandia se sienta como descubrir un mundo creado alrededor de ellos.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link className={buttonStyles({ size: "lg", className: "w-fit" })} href="/tienda">
                Explorar la tienda
                <ChevronRightIcon className="h-4 w-4" />
              </Link>
              <Link
                className={buttonStyles({
                  variant: "secondary",
                  size: "lg",
                  className: "w-fit border-white/20 bg-white/15 text-white backdrop-blur"
                })}
                href="/categorias/camitas"
              >
                Ver camitas propias
              </Link>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="ml-auto max-w-[280px] rounded-[2rem] border border-white/18 bg-white/12 p-6 text-right text-white shadow-[0_20px_50px_rgba(12,15,64,0.24)] backdrop-blur-md">
              <div className="mb-3 inline-flex rounded-full bg-white/14 p-3 text-[var(--brand-gold)]">
                <SparklesIcon className="h-5 w-5" />
              </div>
              <p className="font-display text-3xl leading-tight">Pequeños detalles, grandes momentos.</p>
              <div className="mt-4 flex justify-end text-[var(--brand-pink)]">
                <HeartIcon className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
