"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button, buttonStyles } from "@/components/ui/button";
import { ProductGallery } from "@/components/products/product-gallery";
import { ProductCard } from "@/components/products/product-card";
import { ProductQA } from "@/components/product/product-qa";
import { ProductPersonalization, type PersonalizationAnswerDraft } from "@/components/product/product-personalization";
import { ProductReviews } from "@/components/product/product-reviews";
import { ProductSubscription } from "@/components/product/product-subscription";
import { VariantPicker } from "@/components/product/variant-picker";
import { QuantitySelector } from "@/components/ui/quantity-selector";
import { RatingStars } from "@/components/ui/rating-stars";
import { CrownIcon, HeartIcon, ShieldIcon, SparklesIcon, TruckIcon, WhatsAppIcon } from "@/components/ui/icons";
import { formatCurrency, percentageOff } from "@/lib/utils";
import { buildProductHelpMessage, buildProductInterestMessage, buildWhatsAppLink, type WhatsappSettings } from "@/lib/whatsapp";
import { useStore } from "@/store/store-provider";
import type { PersonalizationConfig } from "@/lib/vendure/personalization";
import type { ProductQuestion } from "@/lib/vendure/qa";
import type { ProductReview } from "@/lib/vendure/reviews";
import type { ProductColor, ProductSize, StorefrontProduct } from "@/types/commerce";

const iconMap = {
  crown: CrownIcon,
  shield: ShieldIcon,
  sparkles: SparklesIcon,
  truck: TruckIcon
};

export function ProductDetail({
  product,
  personalizationConfig,
  questions,
  relatedProducts,
  reviews,
  whatsappSettings
}: {
  product: StorefrontProduct;
  personalizationConfig: PersonalizationConfig | null;
  questions: ProductQuestion[];
  relatedProducts: StorefrontProduct[];
  reviews: ProductReview[];
  whatsappSettings: WhatsappSettings | null;
}) {
  const { addToCart, isLoggedIn, isWishlisted, toggleWishlist, setWhatsappMessage } = useStore();
  const [selectedColor, setSelectedColor] = useState<ProductColor>(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState<ProductSize>(product.sizes[1] ?? product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [personalizationAnswers, setPersonalizationAnswers] = useState<PersonalizationAnswerDraft[]>([]);
  const [personalizationValid, setPersonalizationValid] = useState(!personalizationConfig);
  const discount = percentageOff(product.price, product.compareAtPrice);

  // Feeds the global WhatsApp floating button (see whatsapp-floating-button.tsx) a message specific
  // to this product while it's on screen, restoring the generic default the moment the shopper
  // navigates away — a stale "I'm interested in X" message must never survive to a different page.
  useEffect(() => {
    setWhatsappMessage(buildProductInterestMessage(product.name));
    return () => setWhatsappMessage(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.name]);

  return (
    <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <ProductGallery alt={product.name} images={product.galleryImages} />

        <div className="space-y-6 rounded-[2rem] border border-white/60 bg-white/84 p-6 shadow-[0_24px_60px_rgba(31,36,84,0.08)]">
          <div className="space-y-3">
            <span className="inline-flex rounded-full bg-[var(--brand-soft)] px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--brand-violet-deep)]">
              {product.categoryLabel}
            </span>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-5xl leading-none text-[var(--ink)]">{product.name}</h1>
                <p className="mt-3 text-lg text-[var(--muted)]">{product.shortDescription}</p>
              </div>
              <button
                aria-label="Agregar a favoritos"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[var(--line)] bg-white text-[var(--brand-violet-deep)]"
                onClick={() => toggleWishlist(product.id)}
                type="button"
              >
                <HeartIcon
                  className={isWishlisted(product.id) ? "h-5 w-5 text-[var(--brand-pink)]" : "h-5 w-5"}
                />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
            {product.reviewCount > 0 ? (
              <>
                <RatingStars rating={product.rating} />
                <span className="font-bold text-[var(--ink)]">{product.rating.toFixed(1)}</span>
                <span>({product.reviewCount} reseñas)</span>
              </>
            ) : (
              <span>Sin reseñas todavía</span>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <p className="text-5xl font-black text-[var(--brand-violet-deep)]">{formatCurrency(product.price)}</p>
              {discount ? (
                <span className="rounded-full bg-[var(--brand-gold)] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[var(--ink)]">
                  -{discount}%
                </span>
              ) : null}
            </div>
            {product.compareAtPrice ? (
              <p className="text-sm text-[var(--muted)] line-through">{formatCurrency(product.compareAtPrice)}</p>
            ) : null}
          </div>

          <p className="text-base leading-8 text-[var(--muted)]">{product.description}</p>

          <div className="grid gap-3 rounded-[1.8rem] bg-[var(--brand-soft)] p-4 sm:grid-cols-2">
            {product.highlights.map((highlight) => {
              const Icon = iconMap[highlight.icon as keyof typeof iconMap] ?? SparklesIcon;
              return (
                <div key={highlight.title} className="rounded-[1.2rem] bg-white/72 p-4">
                  <Icon className="h-5 w-5 text-[var(--brand-violet-deep)]" />
                  <p className="mt-3 font-bold text-[var(--ink)]">{highlight.title}</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{highlight.description}</p>
                </div>
              );
            })}
          </div>

          <VariantPicker
            colors={product.colors}
            onSelectColor={setSelectedColor}
            onSelectSize={setSelectedSize}
            selectedColor={selectedColor}
            selectedSize={selectedSize}
            sizes={product.sizes}
          />

          {personalizationConfig ? (
            <ProductPersonalization
              config={personalizationConfig}
              onChange={(answers, isValid) => {
                setPersonalizationAnswers(answers);
                setPersonalizationValid(isValid);
              }}
            />
          ) : null}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <QuantitySelector className="w-fit" onChange={setQuantity} value={quantity} />
            <Button
              className="flex-1"
              disabled={Boolean(personalizationConfig) && !personalizationValid}
              onClick={() => {
                for (let index = 0; index < quantity; index += 1) {
                  addToCart(product, {
                    size: selectedSize,
                    color: selectedColor,
                    personalization: personalizationAnswers.length ? personalizationAnswers : undefined
                  });
                }
              }}
              size="lg"
              type="button"
            >
              Agregar al carrito
            </Button>
          </div>

          <Link className={buttonStyles({ variant: "secondary", size: "lg", className: "w-full" })} href="/checkout">
            Comprar ahora
          </Link>

          {whatsappSettings ? (
            <button
              className="flex w-full items-center justify-center gap-2 text-sm font-bold text-[var(--brand-violet-deep)]"
              onClick={() => {
                const message = buildProductHelpMessage(
                  product.name,
                  `${selectedColor.name} / ${selectedSize}`,
                  window.location.href
                );
                window.open(buildWhatsAppLink(whatsappSettings.phoneNumber, message), "_blank", "noopener,noreferrer");
              }}
              type="button"
            >
              <WhatsAppIcon className="h-4 w-4" />
              ¿Necesitás ayuda? Preguntanos por WhatsApp
            </button>
          ) : null}
        </div>
      </div>

      <section className="grid gap-6 rounded-[2rem] border border-white/60 bg-white/76 p-6 shadow-[0_24px_60px_rgba(31,36,84,0.08)] lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <h2 className="font-display text-4xl leading-none text-[var(--ink)]">Descripción del producto</h2>
          <p className="text-base leading-8 text-[var(--muted)]">{product.description}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.4rem] bg-[var(--brand-soft)] p-4">
              <p className="font-bold text-[var(--ink)]">Materiales</p>
              <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                {product.materials.map((material) => (
                  <li key={material}>{material}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-[1.4rem] bg-[var(--brand-soft)] p-4">
              <p className="font-bold text-[var(--ink)]">Cuidados</p>
              <ul className="mt-3 space-y-2 text-sm text-[var(--muted)]">
                {product.care.map((care) => (
                  <li key={care}>{care}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="rounded-[1.8rem] bg-[var(--brand-violet)] p-6 text-white">
          <p className="text-sm font-black uppercase tracking-[0.3em] text-white/70">Hecho para destacar</p>
          <p className="mt-4 font-display text-4xl leading-none">Su propia cama, su propio reino.</p>
          <p className="mt-4 text-base leading-8 text-white/80">
            Variantes, inventario y checkout reales, todos conectados a Vendure, sin comprometer el
            lenguaje visual de la marca.
          </p>
        </div>
      </section>

      {product.repurchaseEnabled ? <ProductSubscription isLoggedIn={isLoggedIn} product={product} /> : null}

      <ProductReviews
        productId={product.id}
        initialReviews={reviews}
        rating={product.rating}
        reviewCount={product.reviewCount}
      />

      <ProductQA productId={product.id} initialQuestions={questions} />

      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.28em] text-[var(--brand-violet-deep)]">
              Relacionados
            </p>
            <h2 className="mt-3 font-display text-4xl leading-none text-[var(--ink)]">
              Más mundos para explorar
            </h2>
          </div>
          <Link className={buttonStyles({ variant: "ghost", className: "px-0" })} href="/tienda">
            Ver tienda
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {relatedProducts.map((relatedProduct) => (
            <ProductCard key={relatedProduct.slug} product={relatedProduct} />
          ))}
        </div>
      </section>
    </div>
  );
}
