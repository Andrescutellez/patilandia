import { describe, expect, it } from "vitest";

import {
  buildCartSummaryMessage,
  buildGenericMessage,
  buildOrderInquiryMessage,
  buildProductHelpMessage,
  buildProductInterestMessage,
  buildWhatsAppLink
} from "./whatsapp";
import type { CartLineItem, StorefrontProduct } from "@/types/commerce";

function buildProduct(overrides: Partial<StorefrontProduct> = {}): StorefrontProduct {
  return {
    id: "test-product",
    slug: "test-product",
    sku: "TEST-001",
    name: "Camita Luna",
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
    id: "test-line",
    product: productOverride ?? buildProduct(),
    quantity: 1,
    selectedSize: "M",
    selectedColor: { name: "Lavanda", hex: "#8b73ff" },
    ...rest
  };
}

describe("buildWhatsAppLink", () => {
  it("strips spaces, dashes and the plus sign from the phone number", () => {
    const link = buildWhatsAppLink("+57 300-123 4567", "hola");
    expect(link).toBe("https://wa.me/573001234567?text=hola");
  });

  it("URL-encodes the message", () => {
    const link = buildWhatsAppLink("573001234567", "Hola, ¿cómo estás?");
    expect(link).toContain(encodeURIComponent("Hola, ¿cómo estás?"));
  });
});

describe("buildGenericMessage", () => {
  it("uses the configured default message", () => {
    expect(buildGenericMessage("Hola desde el admin")).toBe("Hola desde el admin");
  });

  it("falls back to a hardcoded greeting when the configured one is blank", () => {
    expect(buildGenericMessage("   ")).toContain("Patilandia");
  });
});

describe("buildProductInterestMessage", () => {
  it("mentions the product by name", () => {
    expect(buildProductInterestMessage("Camita Luna")).toContain("Camita Luna");
  });
});

describe("buildProductHelpMessage", () => {
  it("includes the product, the variant and the URL", () => {
    const message = buildProductHelpMessage("Camita Luna", "Lavanda / M", "https://patilandia.com.co/producto/camita-luna");
    expect(message).toContain("Camita Luna");
    expect(message).toContain("Lavanda / M");
    expect(message).toContain("https://patilandia.com.co/producto/camita-luna");
  });
});

describe("buildCartSummaryMessage", () => {
  it("lists every line item with its variant and quantity, plus the subtotal", () => {
    const cart = [
      buildLineItem({ quantity: 2 }),
      buildLineItem({ product: buildProduct({ name: "Snack Crunch" }), selectedColor: { name: "Natural", hex: "#fff" } })
    ];
    const message = buildCartSummaryMessage(cart, 250000);
    expect(message).toContain("Camita Luna");
    expect(message).toContain("x2");
    expect(message).toContain("Snack Crunch");
    expect(message).toMatch(/250[.,]000|250000/);
  });
});

describe("buildOrderInquiryMessage", () => {
  it("includes the order code", () => {
    expect(buildOrderInquiryMessage("ABC123")).toContain("ABC123");
  });
});
