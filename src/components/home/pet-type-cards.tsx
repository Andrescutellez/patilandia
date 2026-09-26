import Image from "next/image";
import Link from "next/link";

/**
 * Real catalog filter entry points, not decoration — each links to /tienda?mascota=<code>, which
 * CatalogView reads on mount to pre-select its existing "Tipo de mascota" filter (same mechanism
 * as the header search's ?buscar=). The CTA copy already lives baked into the source images, same
 * pattern as HomeHero, so each card is just a full-bleed clickable image.
 */
const PET_TYPE_CARDS = [
  {
    petType: "dogs",
    href: "/tienda?mascota=dogs",
    src: "/images/patilandia/pet-type-dogs.png",
    alt: "Consiente a tu perrito — todo para hacerlo feliz y saludable. Explorar la tienda."
  },
  {
    petType: "cats",
    href: "/tienda?mascota=cats",
    src: "/images/patilandia/pet-type-cats.png",
    alt: "Mima a tu michi — todo para consentir a tu compañero felino. Explorar la tienda."
  }
] as const;

export function PetTypeCards() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 lg:px-8">
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
        {PET_TYPE_CARDS.map((card) => (
          <Link
            key={card.petType}
            className="relative block aspect-[1774/887] overflow-hidden rounded-[2rem] shadow-[0_18px_45px_rgba(31,36,84,0.1)] transition hover:scale-[1.01]"
            href={card.href}
          >
            <Image alt={card.alt} className="object-cover" fill sizes="(max-width: 640px) 100vw, 50vw" src={card.src} />
          </Link>
        ))}
      </div>
    </section>
  );
}
