export type StoreCurrency = "COP";

export type ProductSize = "S" | "M" | "L" | "XL";
export type ShippingClass = "standard" | "bulky" | "heavy" | "custom";
export type CollectionTheme = "royal" | "galaxy" | "magic" | "safari" | "dreams";
/** Extend here (and in adapters.ts's PET_TYPES) when Patilandia adds aves/roedores/peces/otros —
 *  the Vendure side just needs the matching FacetValue added under the `pet-type` Facet. */
export type PetType = "dogs" | "cats";

export interface Category {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  image?: string;
}

export interface Collection {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  theme: CollectionTheme;
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface ProductFeature {
  title: string;
  description: string;
  icon: string;
}

export interface StorefrontVariantRef {
  id: string;
  /** Undefined when this product has no "size" option group in Vendure (e.g. a single-SKU
   *  product) — see toVariantRefs in adapters.ts. */
  size?: ProductSize;
  /** Undefined when this product has no "color" option group in Vendure (e.g. pet food that only
   *  varies by weight) — see toVariantRefs in adapters.ts. */
  colorName?: string;
}

export interface StorefrontProduct {
  /** Real Vendure Product id — needed to fetch/submit reviews. Falls back to the slug for
   *  mock/fallback data (no backend product to review anyway in that case). */
  id: string;
  slug: string;
  sku: string;
  name: string;
  categorySlug: string;
  categoryLabel: string;
  collectionSlug: string;
  /** Which pet(s) this product is for — codes of every `pet-type` FacetValue assigned to it in
   *  Vendure. Empty means "not tagged": it shows under every pet-type filter, and under any future
   *  species added later, rather than disappearing from navigation. A product can carry more than
   *  one (e.g. a universal toy → ["dogs", "cats"]) since Vendure facets are many-to-many. */
  petTypes: PetType[];
  shortDescription: string;
  description: string;
  image: string;
  galleryImages: string[];
  price: number;
  compareAtPrice?: number;
  rating: number;
  reviewCount: number;
  badge?: string;
  theme: CollectionTheme;
  colors: ProductColor[];
  sizes: ProductSize[];
  materials: string[];
  care: string[];
  highlights: ProductFeature[];
  shippingClass: ShippingClass;
  weightKg: number;
  stock: number;
  featured?: boolean;
  /** Whether this product can be scheduled for repurchase — set from the admin's product editor
   *  (Product.customFields.repurchaseEnabled). See product-subscription.tsx. */
  repurchaseEnabled?: boolean;
  tags: string[];
  /** Real Vendure variant ids per size/color, needed to add a specific variant to a real cart.
   *  Undefined for mock/fallback data (no backend order to add to anyway in that case). */
  variants?: StorefrontVariantRef[];
}

export interface Benefit {
  title: string;
  description: string;
  icon: string;
}

export interface NavigationLink {
  href: string;
  label: string;
}

export interface CartLineItem {
  id: string;
  product: StorefrontProduct;
  quantity: number;
  selectedSize: ProductSize;
  selectedColor: ProductColor;
  /** The answers the shopper gave for this line's personalization, if any — see
   *  ProductPersonalization. Undefined for a line that isn't personalized. */
  personalization?: Array<{ fieldId: string; label: string; value: string }>;
  /** Decimal currency (COP), pre-tax — the extra this specific line cost due to personalization.
   *  Undefined (not 0) when there's no surcharge, so callers can use it directly as a "show this
   *  row at all" check. */
  personalizationSurcharge?: number;
}
