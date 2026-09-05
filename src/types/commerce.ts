export type StoreCurrency = "COP";

export type ProductSize = "S" | "M" | "L" | "XL";
export type ShippingClass = "standard" | "bulky" | "heavy" | "custom";
export type CollectionTheme = "royal" | "galaxy" | "magic" | "safari" | "dreams";
export type PetType = "dogs" | "cats" | "all";

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

export interface StorefrontProduct {
  slug: string;
  sku: string;
  name: string;
  categorySlug: string;
  categoryLabel: string;
  collectionSlug: string;
  petType: PetType;
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
  tags: string[];
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
}
