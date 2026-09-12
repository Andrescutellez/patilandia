import { describe, expect, it } from "vitest";

import { rankRelatedProducts } from "./storefront";
import type { StorefrontProduct } from "@/types/commerce";

function buildProduct(overrides: Partial<StorefrontProduct> & Pick<StorefrontProduct, "slug">): StorefrontProduct {
  return {
    id: overrides.slug,
    sku: `SKU-${overrides.slug}`,
    name: overrides.slug,
    categorySlug: "camitas",
    categoryLabel: "Camitas",
    collectionSlug: "dreams",
    petType: "all",
    shortDescription: "",
    description: "",
    image: "/img.png",
    galleryImages: ["/img.png"],
    price: 100000,
    rating: 0,
    reviewCount: 0,
    theme: "dreams",
    colors: [],
    sizes: [],
    materials: [],
    care: [],
    highlights: [],
    shippingClass: "standard",
    weightKg: 1,
    stock: 10,
    tags: [],
    ...overrides
  };
}

describe("rankRelatedProducts", () => {
  it("excludes the product itself", () => {
    const current = buildProduct({ slug: "a" });
    const results = rankRelatedProducts(current, [current]);
    expect(results).toHaveLength(0);
  });

  it("ranks same-category-and-theme matches above same-category-only matches", () => {
    const current = buildProduct({ slug: "current", collectionSlug: "royal", categorySlug: "camitas" });
    const sameThemeAndCategory = buildProduct({
      slug: "best-match",
      collectionSlug: "royal",
      categorySlug: "camitas"
    });
    const sameCategoryOnly = buildProduct({
      slug: "weak-match",
      collectionSlug: "galaxy",
      categorySlug: "camitas"
    });

    const results = rankRelatedProducts(current, [sameCategoryOnly, sameThemeAndCategory], 2);

    expect(results.map((p) => p.slug)).toEqual(["best-match", "weak-match"]);
  });

  it("cross-sells complementary categories instead of only suggesting more of the same", () => {
    // Exactly the scenario a real shopper cares about: buying a bed shouldn't only surface other
    // beds — food/hygiene products for the same pet are a real, useful suggestion too.
    const camita = buildProduct({ slug: "camita", categorySlug: "camitas", petType: "cats" });
    const otraCamita = buildProduct({ slug: "otra-camita", categorySlug: "camitas", petType: "cats", rating: 3 });
    const snack = buildProduct({ slug: "snack-gato", categorySlug: "alimentos", petType: "cats", rating: 5 });
    const arena = buildProduct({ slug: "arena-gato", categorySlug: "higiene", petType: "cats", rating: 4 });
    const juguetePerro = buildProduct({ slug: "juguete-perro", categorySlug: "juguetes", petType: "dogs" });

    const results = rankRelatedProducts(camita, [otraCamita, snack, arena, juguetePerro], 3);

    expect(results.map((p) => p.slug)).toContain("snack-gato");
    expect(results.map((p) => p.slug)).toContain("arena-gato");
    // Wrong pet type is never suggested, even if the category would otherwise pair well.
    expect(results.map((p) => p.slug)).not.toContain("juguete-perro");
  });

  it("doesn't let one crowded complementary category bury a category with a single item, even at equal ratings", () => {
    // cojín (accesorios) has no other accesorios to be "similar" to, so everything it recommends
    // comes from the complementary pool — camitas (6 real products) shouldn't crowd out the one
    // snack just because there are more of them and ratings are tied at 0.
    const cojin = buildProduct({ slug: "cojin", categorySlug: "accesorios" });
    const camitas = Array.from({ length: 6 }, (_, i) => buildProduct({ slug: `camita-${i}`, categorySlug: "camitas" }));
    const snack = buildProduct({ slug: "snack", categorySlug: "alimentos" });

    const results = rankRelatedProducts(cojin, [...camitas, snack], 4);

    expect(results.map((p) => p.slug)).toContain("snack");
  });

  it("never suggests an incompatible pet type, even as backfill", () => {
    const forCats = buildProduct({ slug: "current", categorySlug: "ropa", petType: "cats" });
    const forDogs = buildProduct({ slug: "for-dogs", categorySlug: "transporte", petType: "dogs" });
    const forCatsToo = buildProduct({ slug: "for-cats-too", categorySlug: "juguetes", petType: "cats" });

    const results = rankRelatedProducts(forCats, [forDogs, forCatsToo], 4);

    expect(results.map((p) => p.slug)).toEqual(["for-cats-too"]);
  });

  it("backfills with any compatible product when a category has no configured pairing", () => {
    const current = buildProduct({ slug: "current", categorySlug: "ropa" });
    const other = buildProduct({ slug: "other", categorySlug: "transporte" });

    // "ropa" only pairs with "accesorios" in the complementary map — "transporte" has no
    // configured relationship to it, but the section should still show something.
    const results = rankRelatedProducts(current, [other], 4);

    expect(results.map((p) => p.slug)).toEqual(["other"]);
  });

  it("respects the limit", () => {
    const current = buildProduct({ slug: "current" });
    const others = Array.from({ length: 10 }, (_, i) => buildProduct({ slug: `other-${i}` }));

    expect(rankRelatedProducts(current, others, 2)).toHaveLength(2);
  });
});
