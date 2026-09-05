import type { StorefrontProduct } from "@/types/commerce";

type MedusaRecord = Record<string, unknown>;

function readString(value: unknown, fallback: string) {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function readNumber(value: unknown, fallback: number) {
  return typeof value === "number" ? value : fallback;
}

export function adaptMedusaProduct(record: MedusaRecord): StorefrontProduct {
  const title = readString(record.title, "Producto Patilandia");
  const handle = readString(record.handle, title.toLowerCase().replaceAll(" ", "-"));
  const thumbnail = readString(record.thumbnail, "/images/patilandia/hero-fantasy.png");
  const metadata =
    typeof record.metadata === "object" && record.metadata !== null
      ? (record.metadata as MedusaRecord)
      : {};
  const images = Array.isArray(record.images)
    ? (record.images as MedusaRecord[])
        .map((image) => readString(image.url, ""))
        .filter((url) => url.length > 0)
    : [];

  return {
    slug: handle,
    sku: readString(record.id, handle),
    name: title,
    categorySlug: readString(metadata.categorySlug, "camitas"),
    categoryLabel: readString(metadata.categoryLabel, "Camitas"),
    collectionSlug: readString(metadata.collectionSlug, "dreams"),
    petType:
      metadata.petType === "dogs" || metadata.petType === "cats" ? metadata.petType : "all",
    shortDescription: readString(
      metadata.shortDescription,
      "Producto sincronizado desde Medusa y listo para tu storefront."
    ),
    description: readString(
      record.description,
      "Este producto llega desde Medusa mediante una capa adaptadora desacoplada."
    ),
    image: thumbnail,
    galleryImages: images.length > 0 ? images : [thumbnail],
    price: readNumber(metadata.price, 0),
    compareAtPrice: readNumber(metadata.compareAtPrice, 0) || undefined,
    rating: readNumber(metadata.rating, 4.8),
    reviewCount: readNumber(metadata.reviewCount, 0),
    badge: readString(metadata.badge, ""),
    theme: ["royal", "galaxy", "magic", "safari", "dreams"].includes(
      readString(metadata.theme, "dreams")
    )
      ? (readString(metadata.theme, "dreams") as StorefrontProduct["theme"])
      : "dreams",
    colors: [
      {
        name: readString(metadata.colorName, "Lavanda"),
        hex: readString(metadata.colorHex, "#8b73ff")
      }
    ],
    sizes: ["S", "M", "L"],
    materials: ["Tela premium", "Relleno suave", "Acabados Patilandia"],
    care: ["Lavar a mano", "Secar a la sombra"],
    highlights: [
      {
        title: "Sincronizado con Medusa",
        description: "Producto listo para catálogo real.",
        icon: "sparkles"
      }
    ],
    shippingClass: "standard",
    weightKg: 1.5,
    stock: readNumber(metadata.stock, 10),
    featured: Boolean(metadata.featured),
    tags: [readString(metadata.tag, "medusa")]
  };
}
