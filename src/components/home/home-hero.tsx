import Image from "next/image";
import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { ChevronRightIcon } from "@/components/ui/icons";

export function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-[#1d256d] md:aspect-[2098/749]">
      <Image
        alt="Patilandia — todo lo que tu mascota necesita, en un solo lugar hecho con magia real. Camitas, juguetes, accesorios, comida y mucho más."
        className="absolute inset-0 h-full w-full object-cover object-left md:hidden"
        fill
        priority
        sizes="100vw"
        src="/images/imagen-home.png"
      />
      <Image
        alt="Patilandia — todo lo que tu mascota necesita, en un solo lugar hecho con magia real. Camitas, juguetes, accesorios, comida y mucho más."
        className="absolute inset-0 hidden h-full w-full object-cover md:block"
        fill
        priority
        sizes="100vw"
        src="/images/imagen-home-destok.png"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,23,78,0)_55%,rgba(16,23,78,0.55)_100%)]" />

      <div className="relative mx-auto flex min-h-[450px] max-w-7xl items-end px-6 py-8 sm:min-h-[560px] sm:px-10 sm:py-10 md:h-full md:min-h-0 md:px-10 md:py-4 lg:px-14">
        <Link className={buttonStyles({ size: "lg" })} href="/tienda">
          Explorar la tienda
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
