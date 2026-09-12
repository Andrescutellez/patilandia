import { VENDURE_MONEY_FACTOR } from "@/lib/vendure/client";
import type {
  CartLineItem,
  CollectionTheme,
  PetType,
  ProductColor,
  ProductSize,
  StorefrontProduct,
  StorefrontVariantRef
} from "@/types/commerce";

const THEMES: readonly CollectionTheme[] = ["royal", "galaxy", "magic", "safari", "dreams"];
const PET_TYPES: readonly PetType[] = ["dogs", "cats"];

export interface VendureFacetValue {
  code: string;
  name: string;
  facet: { code: string };
}

export interface VendureAsset {
  preview: string;
}

export interface VendureProductOption {
  name: string;
  group: { code: string };
  customFields?: { hex?: string | null } | null;
}

export interface VendureProductVariant {
  id: string;
  sku: string;
  price: number;
  stockLevel?: string;
  options: VendureProductOption[];
  customFields?: {
    weightKg?: number | null;
    shippingClass?: string | null;
    compareAtPrice?: number | null;
  } | null;
}

export interface VendureProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  featuredAsset?: VendureAsset | null;
  assets: VendureAsset[];
  facetValues: VendureFacetValue[];
  variants: VendureProductVariant[];
  customFields?: {
    shortDescription?: string | null;
    materials?: string[] | null;
    care?: string[] | null;
    highlights?: Array<{ title: string; description: string; icon: string }> | null;
    rating?: number | null;
    reviewCount?: number | null;
    badge?: string | null;
    featured?: boolean | null;
  } | null;
}

export function facetValueCode(record: VendureProduct, facetCode: string): string | undefined {
  return record.facetValues.find((value) => value.facet.code === facetCode)?.code;
}

export function facetValueName(record: VendureProduct, facetCode: string): string | undefined {
  return record.facetValues.find((value) => value.facet.code === facetCode)?.name;
}

export function readTheme(value: string | undefined): CollectionTheme {
  return THEMES.includes(value as CollectionTheme) ? (value as CollectionTheme) : "dreams";
}

function readPetType(value: string | undefined): PetType {
  return PET_TYPES.includes(value as PetType) ? (value as PetType) : "all";
}

function toVariantRefs(variants: VendureProductVariant[]): StorefrontVariantRef[] {
  const refs: StorefrontVariantRef[] = [];
  for (const variant of variants) {
    const size = variant.options.find((o) => o.group.code === "size")?.name;
    const colorName = variant.options.find((o) => o.group.code === "color")?.name;
    if (size && colorName) {
      refs.push({ id: variant.id, size: size as ProductSize, colorName });
    }
  }
  return refs;
}

function dedupeSizes(variants: VendureProductVariant[]): ProductSize[] {
  const sizes = new Set<string>();
  for (const variant of variants) {
    const option = variant.options.find((o) => o.group.code === "size");
    if (option) {
      sizes.add(option.name);
    }
  }
  return [...sizes] as ProductSize[];
}

// The Shop API deliberately hides exact stock counts (no `stockOnHand` field — only the computed
// `stockLevel` enum), so "stock" here is a proxy: positive when at least one variant is
// purchasable, 0 when every variant is OUT_OF_STOCK. Good enough for an in-stock/out-of-stock
// filter, which is all the storefront ever needed from this field.
function computeStock(variants: VendureProductVariant[]): number {
  return variants.some((variant) => variant.stockLevel !== "OUT_OF_STOCK") ? 10 : 0;
}

function dedupeColors(variants: VendureProductVariant[]): ProductColor[] {
  const colors = new Map<string, ProductColor>();
  for (const variant of variants) {
    const option = variant.options.find((o) => o.group.code === "color");
    if (option) {
      colors.set(option.name, { name: option.name, hex: option.customFields?.hex ?? "#8b73ff" });
    }
  }
  return [...colors.values()];
}

export function adaptVendureProduct(record: VendureProduct): StorefrontProduct {
  const firstVariant = record.variants[0];
  const customFields = record.customFields ?? {};
  const categorySlug = facetValueCode(record, "category") ?? "camitas";
  const themeSlug = facetValueCode(record, "theme");
  const images = record.assets.map((asset) => asset.preview);
  const fallbackImage = "/images/patilandia/hero-fantasy.png";
  const image = record.featuredAsset?.preview ?? images[0] ?? fallbackImage;
  const compareAtPrice = firstVariant?.customFields?.compareAtPrice;

  return {
    id: record.id,
    slug: record.slug,
    sku: firstVariant?.sku ?? record.slug,
    name: record.name,
    categorySlug,
    categoryLabel: facetValueName(record, "category") ?? categorySlug,
    collectionSlug: themeSlug ?? "dreams",
    petType: readPetType(facetValueCode(record, "pet-type")),
    shortDescription: customFields.shortDescription ?? "",
    description: record.description,
    image,
    galleryImages: images.length > 0 ? images : [image],
    price: (firstVariant?.price ?? 0) / VENDURE_MONEY_FACTOR,
    compareAtPrice: compareAtPrice ? compareAtPrice / VENDURE_MONEY_FACTOR : undefined,
    rating: customFields.rating ?? 4.8,
    reviewCount: customFields.reviewCount ?? 0,
    badge: customFields.badge || undefined,
    theme: readTheme(themeSlug),
    colors: dedupeColors(record.variants),
    sizes: dedupeSizes(record.variants),
    materials: customFields.materials ?? [],
    care: customFields.care ?? [],
    highlights: customFields.highlights ?? [],
    shippingClass:
      (firstVariant?.customFields?.shippingClass as StorefrontProduct["shippingClass"]) ?? "standard",
    weightKg: firstVariant?.customFields?.weightKg ?? 1.5,
    stock: computeStock(record.variants),
    featured: Boolean(customFields.featured),
    tags: [categorySlug, themeSlug].filter((value): value is string => Boolean(value)),
    variants: toVariantRefs(record.variants)
  };
}

export interface VendureOrderLine {
  id: string;
  quantity: number;
  productVariant: {
    id: string;
    sku: string;
    name: string;
    price: number;
    featuredAsset?: VendureAsset | null;
    options: VendureProductOption[];
    customFields?: { weightKg?: number | null; shippingClass?: string | null } | null;
    product: VendureProduct;
  };
}

const FALLBACK_IMAGE = "/images/patilandia/hero-fantasy.png";

/**
 * Builds a full CartLineItem for the cart/checkout UI from a real Vendure OrderLine. Only
 * populates the StorefrontProduct fields the cart/checkout screens actually render (name, image,
 * price, category, theme) — fields specific to the product detail page (materials, care,
 * highlights, rating...) are left at safe empty defaults rather than over-fetching them on every
 * cart read.
 */
export function adaptVendureOrderLine(line: VendureOrderLine): CartLineItem {
  const { productVariant: variant } = line;
  const { product } = variant;
  const categorySlug = facetValueCode(product, "category") ?? "camitas";
  const themeSlug = facetValueCode(product, "theme");
  const size = variant.options.find((o) => o.group.code === "size")?.name ?? "M";
  const color = variant.options.find((o) => o.group.code === "color");
  const image = variant.featuredAsset?.preview ?? product.featuredAsset?.preview ?? FALLBACK_IMAGE;

  const product_: StorefrontProduct = {
    id: product.id,
    slug: product.slug,
    sku: variant.sku,
    name: product.name,
    categorySlug,
    categoryLabel: facetValueName(product, "category") ?? categorySlug,
    collectionSlug: themeSlug ?? "dreams",
    petType: "all",
    shortDescription: product.customFields?.shortDescription ?? "",
    description: "",
    image,
    galleryImages: [image],
    price: variant.price / VENDURE_MONEY_FACTOR,
    rating: 0,
    reviewCount: 0,
    theme: readTheme(themeSlug),
    colors: [],
    sizes: [],
    materials: [],
    care: [],
    highlights: [],
    shippingClass:
      (variant.customFields?.shippingClass as StorefrontProduct["shippingClass"]) ?? "standard",
    weightKg: variant.customFields?.weightKg ?? 1.5,
    stock: 0,
    featured: false,
    tags: []
  };

  return {
    id: line.id,
    product: product_,
    quantity: line.quantity,
    selectedSize: size as ProductSize,
    selectedColor: { name: color?.name ?? "", hex: color?.customFields?.hex ?? "#8b73ff" }
  };
}
