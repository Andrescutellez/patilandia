import { describe, expect, it } from "vitest";

import { adaptVendureProduct, type VendureProduct, type VendureProductVariant } from "./adapters";

function buildVariant(overrides: Partial<VendureProductVariant> = {}): VendureProductVariant {
  return {
    id: "1",
    sku: "PAT-TEST-001-S-LAVANDA",
    price: 14990000,
    stockLevel: "IN_STOCK",
    options: [
      { name: "S", group: { code: "size" } },
      { name: "Lavanda", group: { code: "color" }, customFields: { hex: "#8b73ff" } }
    ],
    customFields: { weightKg: 2.5, shippingClass: "standard", compareAtPrice: null },
    ...overrides
  };
}

function buildProduct(overrides: Partial<VendureProduct> = {}): VendureProduct {
  return {
    id: "42",
    slug: "camita-de-prueba",
    name: "Camita de Prueba",
    description: "Descripción larga de prueba.",
    featuredAsset: { preview: "https://example.com/assets/preview/1.png" },
    assets: [{ preview: "https://example.com/assets/preview/1.png" }],
    facetValues: [
      { code: "camitas", name: "Camitas", facet: { code: "category" } },
      { code: "royal", name: "Royal", facet: { code: "theme" } }
    ],
    variants: [buildVariant()],
    customFields: {
      shortDescription: "Descripción corta.",
      materials: ["Microfibra"],
      care: ["Lavar a mano"],
      highlights: [],
      rating: 4.9,
      reviewCount: 12,
      badge: "Nuevo",
      featured: true
    },
    ...overrides
  };
}

describe("adaptVendureProduct", () => {
  it("maps the basic fields through as-is", () => {
    const product = adaptVendureProduct(buildProduct());
    expect(product.slug).toBe("camita-de-prueba");
    expect(product.name).toBe("Camita de Prueba");
    expect(product.description).toBe("Descripción larga de prueba.");
  });

  it("converts price from Vendure's minor-unit integer back to pesos", () => {
    const product = adaptVendureProduct(buildProduct());
    expect(product.price).toBe(149900);
  });

  it("leaves compareAtPrice undefined when the variant doesn't have one", () => {
    const product = adaptVendureProduct(buildProduct());
    expect(product.compareAtPrice).toBeUndefined();
  });

  it("converts compareAtPrice when present", () => {
    const product = adaptVendureProduct(
      buildProduct({ variants: [buildVariant({ customFields: { compareAtPrice: 18990000 } })] })
    );
    expect(product.compareAtPrice).toBe(189900);
  });

  it("reads category and theme from facetValues, with real labels, not just codes", () => {
    const product = adaptVendureProduct(buildProduct());
    expect(product.categorySlug).toBe("camitas");
    expect(product.categoryLabel).toBe("Camitas");
    expect(product.collectionSlug).toBe("royal");
    expect(product.theme).toBe("royal");
  });

  it("defaults petType to 'all' when there is no pet-type facet value", () => {
    const product = adaptVendureProduct(buildProduct());
    expect(product.petType).toBe("all");
  });

  it("reads petType when a pet-type facet value is present", () => {
    const product = adaptVendureProduct(
      buildProduct({
        facetValues: [
          { code: "camitas", name: "Camitas", facet: { code: "category" } },
          { code: "royal", name: "Royal", facet: { code: "theme" } },
          { code: "cats", name: "Gatos", facet: { code: "pet-type" } }
        ]
      })
    );
    expect(product.petType).toBe("cats");
  });

  it("dedupes sizes and colors across multiple variants", () => {
    const product = adaptVendureProduct(
      buildProduct({
        variants: [
          buildVariant({ id: "1" }),
          buildVariant({
            id: "2",
            options: [
              { name: "M", group: { code: "size" } },
              { name: "Lavanda", group: { code: "color" }, customFields: { hex: "#8b73ff" } }
            ]
          }),
          buildVariant({
            id: "3",
            options: [
              { name: "S", group: { code: "size" } },
              { name: "Crema", group: { code: "color" }, customFields: { hex: "#f7efe3" } }
            ]
          })
        ]
      })
    );
    expect(product.sizes.sort()).toEqual(["M", "S"]);
    expect(product.colors.map((c) => c.name).sort()).toEqual(["Crema", "Lavanda"]);
  });

  it("exposes one variant ref per real variant, for adding a specific size/color to the cart", () => {
    const product = adaptVendureProduct(
      buildProduct({
        variants: [
          buildVariant({ id: "1" }),
          buildVariant({
            id: "2",
            options: [
              { name: "M", group: { code: "size" } },
              { name: "Lavanda", group: { code: "color" } }
            ]
          })
        ]
      })
    );
    expect(product.variants).toEqual([
      { id: "1", size: "S", colorName: "Lavanda" },
      { id: "2", size: "M", colorName: "Lavanda" }
    ]);
  });

  it("treats a product as in stock when at least one variant isn't OUT_OF_STOCK", () => {
    const product = adaptVendureProduct(
      buildProduct({
        variants: [
          buildVariant({ id: "1", stockLevel: "OUT_OF_STOCK" }),
          buildVariant({ id: "2", stockLevel: "IN_STOCK" })
        ]
      })
    );
    expect(product.stock).toBeGreaterThan(0);
  });

  it("treats a product as out of stock only when every variant is OUT_OF_STOCK", () => {
    const product = adaptVendureProduct(
      buildProduct({
        variants: [
          buildVariant({ id: "1", stockLevel: "OUT_OF_STOCK" }),
          buildVariant({ id: "2", stockLevel: "OUT_OF_STOCK" })
        ]
      })
    );
    expect(product.stock).toBe(0);
  });

  it("falls back to a bundled image when the product has no assets at all", () => {
    const product = adaptVendureProduct(buildProduct({ featuredAsset: null, assets: [] }));
    expect(product.image).toContain("/images/patilandia/");
    expect(product.galleryImages).toEqual([product.image]);
  });
});
