import type {
  Benefit,
  CartLineItem,
  Category,
  Collection,
  NavigationLink,
  ProductFeature,
  StorefrontProduct
} from "@/types/commerce";

export const mainNavigation: NavigationLink[] = [
  { href: "/", label: "Inicio" },
  { href: "/tienda", label: "Tienda" },
  { href: "/categorias", label: "Categorías" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/cuenta", label: "Cuenta" }
];

export const categories: Category[] = [
  {
    slug: "camitas",
    name: "Camitas",
    tagline: "Descanso con magia",
    description: "Nuestro universo textil premium para perros y gatos.",
    icon: "bed",
    image: "/images/patilandia/categoria camas.png"
  },
  {
    slug: "juguetes",
    name: "Juguetes",
    tagline: "Diversión encantada",
    description: "Peluches, mordedores y estímulos para jugar en serio.",
    icon: "ball",
    image: "/images/patilandia/categoria juguetes.png"
  },
  {
    slug: "alimentos",
    name: "Alimentos",
    tagline: "Nutrición feliz",
    description: "Comida y snacks elegidos para su bienestar diario.",
    icon: "bowl",
    image: "/images/patilandia/categoria comida.png"
  },
  {
    slug: "accesorios",
    name: "Accesorios",
    tagline: "Estilo y comodidad",
    description: "Collares, placas y esenciales para paseos con personalidad.",
    icon: "collar",
    image: "/images/patilandia/categoria accesorios.png"
  },
  {
    slug: "higiene",
    name: "Higiene",
    tagline: "Rutinas suaves",
    description: "Cepillos, tapetes y soluciones pensadas para el cuidado diario.",
    icon: "brush",
    image: "/images/patilandia/categoria higiene.png"
  },
  {
    slug: "transporte",
    name: "Transporte",
    tagline: "Viajes tranquilos",
    description: "Morrales, guacales y opciones seguras para moverse juntos.",
    icon: "carrier",
    image: "/images/patilandia/categoria viaje.png"
  },
  {
    slug: "ropa",
    name: "Ropa",
    tagline: "Capas encantadas",
    description: "Textiles para clima, foto o paseo con identidad Patilandia.",
    icon: "shirt",
    image: "/images/patilandia/categoria ropa.png"
  }
];

export const collections: Collection[] = [
  {
    slug: "royal",
    title: "Royal",
    subtitle: "Princesas y príncipes",
    description: "Castillos suaves, acabados dorados y protagonismo absoluto.",
    image: "/images/patilandia/royal-bed.png",
    theme: "royal"
  },
  {
    slug: "galaxy",
    title: "Galaxy",
    subtitle: "Dormir entre estrellas",
    description: "Una colección nocturna con volumen, brillo y calma espacial.",
    image: "/images/patilandia/galaxy-bed.png",
    theme: "galaxy"
  },
  {
    slug: "magic",
    title: "Magic Forest",
    subtitle: "Bosques encantados",
    description: "Texturas orgánicas, hojas bordadas y una vibra mística premium.",
    image: "/images/patilandia/forest-bed.png",
    theme: "magic"
  },
  {
    slug: "safari",
    title: "Safari",
    subtitle: "Aventura cálida",
    description: "Tonos arena, siluetas suaves y energía de exploración tierna.",
    image: "/images/patilandia/safari-bed.png",
    theme: "safari"
  },
  {
    slug: "dreams",
    title: "Dreams",
    subtitle: "Luna, nube y descanso",
    description: "Una línea nocturna para siestas memorables y calma total.",
    image: "/images/patilandia/dreams-bed.png",
    theme: "dreams"
  }
];

const defaultHighlights: ProductFeature[] = [
  {
    title: "Materiales premium",
    description: "Fibras suaves, estructura cómoda y acabados duraderos.",
    icon: "sparkles"
  },
  {
    title: "Funda removible",
    description: "Facilita la limpieza y extiende la vida útil del producto.",
    icon: "shield"
  },
  {
    title: "Hecho con detalle",
    description: "Diseño pensado para sentirse especial desde el primer vistazo.",
    icon: "crown"
  }
];

function createProduct(
  overrides: Partial<StorefrontProduct> & Pick<StorefrontProduct, "slug" | "sku" | "name">
): StorefrontProduct {
  return {
    id: overrides.slug,
    categorySlug: "camitas",
    categoryLabel: "Camitas",
    collectionSlug: "dreams",
    petType: "all",
    shortDescription: "Textiles premium diseñados para dormir bonito y vivir mejor.",
    description:
      "Una pieza textil pensada para convertir cualquier rincón en un refugio cómodo, mágico y duradero para tu mascota.",
    image: "/images/patilandia/hero-fantasy.png",
    galleryImages: ["/images/patilandia/hero-fantasy.png"],
    price: 129900,
    compareAtPrice: 159900,
    rating: 4.8,
    reviewCount: 72,
    badge: "Favorito",
    theme: "dreams",
    colors: [
      { name: "Lavanda", hex: "#8b73ff" },
      { name: "Crema", hex: "#f7efe3" },
      { name: "Dorado suave", hex: "#f2c76f" }
    ],
    sizes: ["S", "M", "L", "XL"],
    materials: ["Microfibra premium", "Relleno siliconado", "Base antideslizante"],
    care: ["Lavar a mano", "Secar extendida", "No usar blanqueador"],
    highlights: defaultHighlights,
    shippingClass: "standard",
    weightKg: 2.4,
    stock: 18,
    featured: true,
    tags: ["premium", "patilandia"],
    ...overrides
  };
}

export const products: StorefrontProduct[] = [
  createProduct({
    slug: "camita-castillo-real",
    sku: "PAT-ROYAL-001",
    name: "Camita Castillo Real",
    collectionSlug: "royal",
    image: "/images/patilandia/royal-bed.png",
    galleryImages: [
      "/images/patilandia/royal-bed.png",
      "/images/patilandia/hero-fantasy.png",
      "/images/patilandia/dreams-bed.png"
    ],
    price: 149900,
    compareAtPrice: 189900,
    reviewCount: 124,
    rating: 4.9,
    badge: "Más vendido",
    theme: "royal",
    colors: [
      { name: "Rosa princesa", hex: "#f08ac3" },
      { name: "Azul reino", hex: "#4c63d7" },
      { name: "Lila sueño", hex: "#9a7cf8" }
    ],
    shortDescription: "La cama insignia de Patilandia con acabado castillo y tacto nube.",
    description:
      "Inspirada en un reino suave y encantado, esta camita combina volumen, soporte, detalles bordados y una silueta inolvidable para dormir como realeza.",
    shippingClass: "bulky",
    weightKg: 4.2
  }),
  createProduct({
    slug: "camita-galaxy-orbit",
    sku: "PAT-GALAXY-002",
    name: "Camita Galaxy Orbit",
    collectionSlug: "galaxy",
    image: "/images/patilandia/galaxy-bed.png",
    galleryImages: [
      "/images/patilandia/galaxy-bed.png",
      "/images/patilandia/dreams-bed.png",
      "/images/patilandia/hero-fantasy.png"
    ],
    price: 139900,
    compareAtPrice: 169900,
    reviewCount: 98,
    rating: 4.8,
    badge: "Nuevo",
    theme: "galaxy",
    petType: "cats",
    shortDescription: "Una nave mullida para gatos curiosos y siestas espaciales.",
    description:
      "Un diseño envolvente con estética cósmica y costuras luminosas para gatos que aman observar, estirarse y descansar con estilo.",
    shippingClass: "standard",
    weightKg: 2.8
  }),
  createProduct({
    slug: "camita-bosque-encantado",
    sku: "PAT-MAGIC-003",
    name: "Camita Bosque Encantado",
    collectionSlug: "magic",
    image: "/images/patilandia/forest-bed.png",
    galleryImages: [
      "/images/patilandia/forest-bed.png",
      "/images/patilandia/hero-fantasy.png"
    ],
    price: 134900,
    compareAtPrice: 159900,
    reviewCount: 76,
    rating: 4.7,
    theme: "magic",
    shortDescription: "Hojas bordadas, tonos bosque y una sensación de refugio absoluto.",
    description:
      "Ideal para peluditos que aman acurrucarse. Sus bordes altos crean contención suave y una experiencia más tranquila.",
    shippingClass: "bulky",
    weightKg: 3.6
  }),
  createProduct({
    slug: "camita-safari-leon",
    sku: "PAT-SAFARI-004",
    name: "Camita Safari León",
    collectionSlug: "safari",
    image: "/images/patilandia/safari-bed.png",
    galleryImages: [
      "/images/patilandia/safari-bed.png",
      "/images/patilandia/forest-bed.png"
    ],
    price: 139900,
    compareAtPrice: 164900,
    reviewCount: 89,
    rating: 4.8,
    theme: "safari",
    shortDescription: "Una silueta cálida, aventurera y abrazable para siestas intensas.",
    description:
      "Con una presencia escultural y tonos tierra suaves, esta cama aporta un carácter propio al espacio de tu mascota.",
    shippingClass: "bulky",
    weightKg: 3.9
  }),
  createProduct({
    slug: "camita-luna-estrellas",
    sku: "PAT-DREAMS-005",
    name: "Camita Luna y Estrellas",
    collectionSlug: "dreams",
    image: "/images/patilandia/dreams-bed.png",
    galleryImages: [
      "/images/patilandia/dreams-bed.png",
      "/images/patilandia/hero-fantasy.png",
      "/images/patilandia/galaxy-bed.png"
    ],
    price: 129900,
    compareAtPrice: 149900,
    reviewCount: 112,
    rating: 4.9,
    badge: "Top regalo",
    theme: "dreams",
    shortDescription: "Una luna acolchada para cerrar el día en calma total.",
    description:
      "Diseñada para aportar soporte y una estética soñadora, perfecta para cuartos, estudios y esquinas premium del hogar.",
    shippingClass: "standard",
    weightKg: 2.2
  }),
  createProduct({
    slug: "camita-personalizada-luna",
    sku: "PAT-CUSTOM-006",
    name: "Camita Personalizada Luna",
    collectionSlug: "dreams",
    image: "/images/patilandia/hero-fantasy.png",
    galleryImages: ["/images/patilandia/hero-fantasy.png", "/images/patilandia/dreams-bed.png"],
    price: 179900,
    compareAtPrice: 209900,
    reviewCount: 64,
    rating: 4.9,
    badge: "Personalizable",
    theme: "dreams",
    shortDescription: "El producto propio diferencial de Patilandia, listo para bordar su nombre.",
    description:
      "Personaliza color, tamaño y nombre para convertir su descanso en una pieza única de la casa.",
    shippingClass: "custom",
    weightKg: 4.4
  }),
  createProduct({
    slug: "cojin-artesanal-nube",
    sku: "PAT-TEXTIL-007",
    name: "Cojín Artesanal Nube",
    categorySlug: "accesorios",
    categoryLabel: "Accesorios",
    collectionSlug: "dreams",
    image: "/images/patilandia/dreams-bed.png",
    galleryImages: ["/images/patilandia/dreams-bed.png"],
    price: 69900,
    compareAtPrice: 89900,
    reviewCount: 45,
    rating: 4.7,
    badge: "Hecho a mano",
    theme: "dreams",
    shortDescription: "Un apoyo decorativo y funcional para rincones mágicos.",
    description:
      "Ideal para complementar la camita o crear zonas de descanso flexibles dentro del hogar.",
    shippingClass: "standard",
    weightKg: 1.1
  }),
  createProduct({
    slug: "snack-crunch-pollo",
    sku: "PAT-SNACK-008",
    name: "Snack Crunch Pollo",
    categorySlug: "alimentos",
    categoryLabel: "Alimentos",
    collectionSlug: "dreams",
    image: "/images/patilandia/royal-bed.png",
    galleryImages: ["/images/patilandia/royal-bed.png"],
    price: 25900,
    compareAtPrice: 31900,
    reviewCount: 53,
    rating: 4.8,
    badge: "Recurrencia",
    theme: "royal",
    shortDescription: "Un premio práctico para sumar a tus compras recurrentes.",
    description:
      "Perfecto para acompañar rutinas, entrenamiento y momentos de cariño durante la semana.",
    shippingClass: "heavy",
    weightKg: 8.5
  })
];

export const benefits: Benefit[] = [
  {
    title: "Envíos a todo el país",
    description: "Arquitectura preparada para cotizar según peso, volumen y destino.",
    icon: "truck"
  },
  {
    title: "Compra segura",
    description: "Checkout real conectado a Vendure, listo para sumar Wompi y Mercado Pago.",
    icon: "shield"
  },
  {
    title: "Textiles premium",
    description: "Nuestro foco inicial: camas, cojines y mantas con identidad propia.",
    icon: "sparkles"
  },
  {
    title: "Atención cercana",
    description: "Una marca familiar que diseña pensando en la vida real de cada mascota.",
    icon: "heart"
  }
];

export function findProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getProductsByCategory(categorySlug: string) {
  return products.filter((product) => product.categorySlug === categorySlug);
}

export function getProductsByCollection(collectionSlug: string) {
  return products.filter((product) => product.collectionSlug === collectionSlug);
}

export function getFeaturedProducts(limit = 6) {
  return products.filter((product) => product.featured).slice(0, limit);
}

export function getCartSubtotal(items: CartLineItem[]) {
  return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
}
