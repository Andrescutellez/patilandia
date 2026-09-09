import Image from "next/image";
import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { ChevronRightIcon } from "@/components/ui/icons";

export function HomeHero() {
  return (
    <>
      <section className="relative overflow-hidden bg-[#1d256d] aspect-[1786/881] md:aspect-[2098/749]">
        <Image
          alt="Patilandia — todo lo que tu mascota necesita, en un solo lugar hecho con magia real. Camitas, juguetes, accesorios, comida y mucho más."
          className="absolute inset-0 h-full w-full object-cover md:hidden"
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
      </section>

      <div className="flex justify-center bg-[#1d256d] px-6 py-5 sm:justify-start sm:px-10 sm:py-6 lg:px-14">
        <Link className={buttonStyles({ size: "lg" })} href="/tienda">
          Explorar la tienda
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </>
  );
}
