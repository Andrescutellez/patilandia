---
title: Modelo de Datos y Mocks — Patilandia
date: 2026-09-04
tags:
  - catalogo
  - producto
  - datos
status: activo
---

# Modelo de Datos y Mocks — Patilandia

> [!info] Fuente
> `src/types/commerce.ts` (contrato) + `src/data/mock-store.ts` (datos). Ver [[Integración Medusa]] para cómo estos mismos tipos se llenan desde Medusa en vez de mocks.

## `StorefrontProduct` — el tipo central

```ts
export interface StorefrontProduct {
  slug: string;
  sku: string;
  name: string;
  categorySlug: string;
  categoryLabel: string;
  collectionSlug: string;
  petType: "dogs" | "cats" | "all";
  shortDescription: string;
  description: string;
  image: string;
  galleryImages: string[];
  price: number;
  compareAtPrice?: number;
  rating: number;
  reviewCount: number;
  badge?: string;
  theme: "royal" | "galaxy" | "magic" | "safari" | "dreams";
  colors: ProductColor[];       // { name, hex }
  sizes: ("S" | "M" | "L" | "XL")[];
  materials: string[];
  care: string[];
  highlights: ProductFeature[]; // { title, description, icon }
  shippingClass: "standard" | "bulky" | "heavy" | "custom";
  weightKg: number;
  stock: number;
  featured?: boolean;
  tags: string[];
}
```

`price`/`compareAtPrice` están en pesos colombianos como entero (ej. `149900` = $149.900 COP), formateados con `formatCurrency()` (`Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })`).

## Categorías (7, `data/mock-store.ts` — actualizado 2026-09-05, "Snacks" eliminada)

| Slug | Nombre | Tagline | Imagen |
|---|---|---|---|
| `camitas` | Camitas | "Descanso con magia" | `categoria camas.png` |
| `juguetes` | Juguetes | "Diversión encantada" | `categoria juguetes.png` |
| `alimentos` | Alimentos | "Nutrición feliz" | `categoria comida.png` |
| `accesorios` | Accesorios | "Estilo y comodidad" | `categoria accesorios.png` |
| `higiene` | Higiene | "Rutinas suaves" | `categoria higiene.png` |
| `transporte` | Transporte | "Viajes tranquilos" | `categoria viaje.png` |
| `ropa` | Ropa | "Capas encantadas" | `categoria ropa.png` |

Todas las rutas de imagen son `/images/patilandia/categoria <nombre>.png` (con espacio literal en el nombre de archivo). Cada una es una foto ilustrada propia (estilo Patilandia: halo circular de gradiente pastel + producto/escena flotando) que reemplaza al ícono SVG plano de `CategoryIcon` — ver [[Design System]]. `CategoryIcon` se mantiene como fallback en el tipo (`Category.image` es opcional) por si se agrega una categoría nueva sin foto todavía.

> [!warning] "Snacks" se eliminó el 2026-09-05
> La categoría `snacks` (icon `treat`) se quitó porque no llegó imagen para ella. El producto `snack-crunch-pollo`, que antes tenía `categorySlug: "snacks"`, se reasignó a `categorySlug: "alimentos"` / `categoryLabel: "Alimentos"` para no dejarlo huérfano (decisión de Claude al ejecutar el pedido, no explícitamente indicada por el usuario — avisar si se prefiere otra categoría). El catálogo real ya migrado a Medusa (`patilandia-seed.ts`) **todavía no se actualizó** con este cambio — sigue teniendo "Snacks" como categoría Medusa nativa. Ver [[Pendientes Claude]].

## Colecciones (5 "themes" visuales, no categorías de producto)

| Slug | Título | Subtítulo | Imagen |
|---|---|---|---|
| `royal` | Royal | "Princesas y príncipes" | `royal-bed.png` |
| `galaxy` | Galaxy | "Dormir entre estrellas" | `galaxy-bed.png` |
| `magic` | Magic Forest | "Bosques encantados" | `forest-bed.png` |
| `safari` | Safari | "Aventura cálida" | `safari-bed.png` |
| `dreams` | Dreams | "Luna, nube y descanso" | `dreams-bed.png` |

Las colecciones son un eje transversal de estilo visual (cada producto tiene un `theme` de colección independiente de su `categorySlug`) — no reemplazan a las categorías, las complementan. Esto es lo que le da a Patilandia su lenguaje visual distintivo por línea (ver `themeMap` en [[Design System]]).

## Los 8 productos mock (`products` en `mock-store.ts`)

| Slug | Nombre | Categoría | Colección | Precio | shippingClass / peso |
|---|---|---|---|---|---|
| `camita-castillo-real` | Camita Castillo Real | Camitas | royal | $149.900 (antes $189.900) | `bulky` / 4.2kg |
| `camita-galaxy-orbit` | Camita Galaxy Orbit | Camitas | galaxy | $139.900 (antes $169.900) | `standard` / 2.8kg |
| `camita-bosque-encantado` | Camita Bosque Encantado | Camitas | magic | $134.900 (antes $159.900) | `bulky` / 3.6kg |
| `camita-safari-leon` | Camita Safari León | Camitas | safari | $139.900 (antes $164.900) | `bulky` / 3.9kg |
| `camita-luna-estrellas` | Camita Luna y Estrellas | Camitas | dreams | $129.900 (antes $149.900) | `standard` / 2.2kg |
| `camita-personalizada-luna` | Camita Personalizada Luna | Camitas | dreams | $179.900 (antes $209.900) | `custom` / 4.4kg — producto propio diferencial, personalizable |
| `cojin-artesanal-nube` | Cojín Artesanal Nube | Accesorios | dreams | $69.900 (antes $89.900) | `standard` / 1.1kg |
| `snack-crunch-pollo` | Snack Crunch Pollo | Alimentos *(era Snacks, reasignado 2026-09-05)* | royal | $25.900 (antes $31.900) | `heavy` / **8.5kg** — deliberadamente pesado, valida el camino de cotización especial en [[Shipping — Arquitectura de Envíos]] |

`createProduct()` es un factory con defaults compartidos (materiales, cuidados, highlights, 4 tallas, 3 colores) — cada producto solo sobreescribe lo que lo distingue. Todos con `featured: true` salvo que se sobreescriba explícitamente (ninguno lo hace hoy — los 6 primeros del array son los que aparecen en `getHomepageProducts()`/`getFeaturedProducts(6)`).

## Funciones helper (`mock-store.ts`)

| Función | Uso |
|---|---|
| `findProductBySlug(slug)` | Fallback síncrono para producto individual |
| `getProductsByCategory(slug)` | No usado directamente hoy por `CatalogView` (que filtra en memoria con `activeCategory`), disponible para uso futuro |
| `getProductsByCollection(slug)` | Idem — disponible, no consumido activamente en UI hoy |
| `getFeaturedProducts(limit=6)` | Usado **directamente por `HomePage`** (`app/page.tsx`) para los "Productos con identidad Patilandia" — importado de `data/mock-store` sin pasar por `lib/storefront.ts` |
| `getRelatedProducts(product, limit=4)` | Mismo `collectionSlug` o `categorySlug`, excluyendo el producto actual — usado en `ProductDetail` |
| `getCartSubtotal(items)` | `sum(price * quantity)`, usado por `StoreProvider` |

> [!bug] Hallazgo: código muerto en `lib/storefront.ts`
> `getHomepageProducts()` y `getHomepageCollections()` están definidas en `lib/storefront.ts` (la capa que sí debería usar Medusa con fallback) pero **no las importa nadie** — `HomePage` usa `getFeaturedProducts` y `collections` directo de `data/mock-store.ts`. Es decir: la homepage nunca mostrará productos reales de Medusa aunque esté conectado, porque no pasa por la capa de adaptación. Ver [[Pendientes Claude]] y la excepción documentada en [[CONVENTIONS]].

Tags: #catalogo #producto #datos
