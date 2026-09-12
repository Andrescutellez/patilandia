import { describe, expect, it } from "vitest";

import { getShippingPreview } from "./shipping";
import type { CartLineItem, StorefrontProduct } from "@/types/commerce";

function buildProduct(overrides: Partial<StorefrontProduct> = {}): StorefrontProduct {
  return {
    id: "test-product",
    slug: "test-product",
    sku: "TEST-001",
    name: "Producto de prueba",
    categorySlug: "camitas",
    categoryLabel: "Camitas",
    collectionSlug: "dreams",
    petType: "all",
    shortDescription: "",
    description: "",
    image: "/images/patilandia/hero-fantasy.png",
    galleryImages: ["/images/patilandia/hero-fantasy.png"],
    price: 100000,
    rating: 4.8,
    reviewCount: 10,
    theme: "dreams",
    colors: [{ name: "Lavanda", hex: "#8b73ff" }],
    sizes: ["M"],
    materials: [],
    care: [],
    highlights: [],
    shippingClass: "standard",
    weightKg: 1,
    stock: 10,
    featured: false,
    tags: [],
    ...overrides
  };
}

function buildLineItem(overrides: Partial<Omit<CartLineItem, "product">> & { product?: StorefrontProduct } = {}): CartLineItem {
  const { product: productOverride, ...rest } = overrides;
  return {
    id: "test-product-M-Lavanda",
    product: productOverride ?? buildProduct(),
    quantity: 1,
    selectedSize: "M",
    selectedColor: { name: "Lavanda", hex: "#8b73ff" },
    ...rest
  };
}

describe("getShippingPreview", () => {
  it("asks to check out when the cart is empty", () => {
    expect(getShippingPreview([]).status).toBe("quote");
  });

  it("gives a standard estimate for light, standard-class items", () => {
    const items = [buildLineItem({ quantity: 1 })];
    expect(getShippingPreview(items).status).toBe("standard");
  });

  it("flags a quote when any item has a special shipping class", () => {
    const items = [buildLineItem({ product: buildProduct({ shippingClass: "bulky", weightKg: 1 }) })];
    expect(getShippingPreview(items).status).toBe("quote");
  });

  it("flags a quote when the combined weight reaches 8kg, even for standard items", () => {
    const items = [buildLineItem({ product: buildProduct({ weightKg: 4.5 }), quantity: 2 })];
    expect(getShippingPreview(items).status).toBe("quote");
  });

  it("stays standard just under the 8kg threshold", () => {
    const items = [buildLineItem({ product: buildProduct({ weightKg: 7.9 }), quantity: 1 })];
    expect(getShippingPreview(items).status).toBe("standard");
  });
});
