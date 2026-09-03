"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="space-y-4">
      <div className="relative aspect-[1.03] overflow-hidden rounded-[2rem] border border-white/60 bg-white shadow-[0_20px_50px_rgba(31,36,84,0.1)]">
        <Image alt={alt} className="h-full w-full object-cover" fill priority sizes="(max-width: 1024px) 100vw, 50vw" src={images[activeIndex]} />
      </div>

      <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
        {images.map((image, index) => (
          <button
            key={`${image}-${index}`}
            className={cn(
              "relative aspect-square overflow-hidden rounded-[1.25rem] border bg-white",
              index === activeIndex ? "border-[var(--brand-violet)]" : "border-white/60"
            )}
            onClick={() => setActiveIndex(index)}
            type="button"
          >
            <Image alt={`${alt} ${index + 1}`} className="h-full w-full object-cover" fill sizes="96px" src={image} />
          </button>
        ))}
      </div>
    </div>
  );
}
