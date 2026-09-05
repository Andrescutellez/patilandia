import Image from "next/image";
import Link from "next/link";

import type { Collection } from "@/types/commerce";

const overlayMap: Record<Collection["theme"], string> = {
  royal: "from-[#f080c4]/75 via-[#df69b8]/45 to-transparent",
  galaxy: "from-[#2a3488]/82 via-[#4c4ecc]/50 to-transparent",
  magic: "from-[#2f6d4f]/82 via-[#4f9b67]/45 to-transparent",
  safari: "from-[#a6652a]/78 via-[#d48f4f]/40 to-transparent",
  dreams: "from-[#273581]/84 via-[#6277ea]/45 to-transparent"
};

export function CollectionCard({ collection }: { collection: Collection }) {
  return (
    <Link
      className="group relative overflow-hidden rounded-[1.8rem] border border-white/60 bg-white shadow-[0_20px_45px_rgba(34,39,88,0.12)]"
      href={`/tienda?coleccion=${collection.slug}`}
    >
      <div className="relative aspect-[0.8]">
        <Image
          alt={collection.title}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          fill
          sizes="(max-width: 768px) 50vw, 18vw"
          src={collection.image}
        />
        <div className={`absolute inset-0 bg-gradient-to-t ${overlayMap[collection.theme]}`} />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-5">
        <p className="font-display text-xl leading-tight sm:text-3xl sm:leading-none">{collection.title}</p>
        <p className="mt-1 text-xs font-semibold text-white/88 sm:mt-2 sm:text-sm">{collection.subtitle}</p>
        <p className="mt-1 hidden text-sm leading-6 text-white/76 sm:mt-2 sm:block">{collection.description}</p>
      </div>
    </Link>
  );
}
