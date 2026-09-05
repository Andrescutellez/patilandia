---
title: Arquitectura Técnica — Patilandia
date: 2026-09-04
tags:
  - arquitectura
  - tecnico
status: activo
---

# Arquitectura Técnica — Patilandia

> [!info] Fuente
> Generado a partir de indexación real del repo (`codebase-memory`, 248 nodos / 588 edges) el 2026-09-04, no de suposiciones.

## Stack confirmado

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | ^15.0.0 |
| UI | React | ^19.0.0 |
| Lenguaje | TypeScript (`strict: true`) | ^5.0.0 |
| Estilos | Tailwind CSS (CSS-first config v4) | ^4.0.0 |
| Tipografía | `@fontsource/baloo-2`, `@fontsource/nunito` | ^5.0.0 |
| Commerce backend | Medusa (externo, headless, vía Store API REST) | no desplegado aún |
| Base de datos | PostgreSQL (a través de Medusa, no directo) | — |
| Estado cliente | React Context + `localStorage` (sin librería externa) | — |

`tsconfig.json` mapea `@/*` → `./src/*`. `next.config.ts` solo configura formatos de imagen (`avif`, `webp`).

## Capas y límites (fan-in/fan-out real, no estimado)

```
app (entry)  →  components (internal)  →  lib / store / data (core)
```

| De | A | Nº de llamadas |
|---|---|---|
| `app` | `components` | 19 |
| `components` | `lib` | 17 |
| `components` | `store` | 15 |
| `lib` | `data` | 4 |
| `app` | `lib` | 4 |
| `store` | `data` | 1 |
| `store` | `lib` | 1 |
| `app` | `store` | 1 |
| `app` | `data` | 1 |

`lib`, `store` y `data` son la capa **core** (alto fan-in, bajo fan-out) — es donde vive la lógica de negocio y de datos, tal como pide el brief sección 14 ("separar UI, datos, integración Medusa, lógica de negocio"). `app` es la capa de entrada (páginas, solo llama hacia afuera). `components` es la capa intermedia.

## Entry points (rutas Next.js)

Ver tabla completa en [[Mapa de Rutas y Componentes]]. Las 9 rutas (`HomePage`, `StorePage`, `CategoriesPage`, `CategoryPage`, `ProductPage`, `CartRoute`, `CheckoutRoute`, `AccountPage`, `WishlistRoute`) son los únicos puntos sin llamadas entrantes en el grafo — confirma que no hay rutas huérfanas ni componentes usados como página sin pasar por `app/`.

## Hotspots del código (mayor fan-in — tocar con cuidado)

| Símbolo | Archivo | Fan-in | Rol |
|---|---|---|---|
| `Svg` | `components/ui/icons.tsx` | 21 | Wrapper base de todos los íconos SVG |
| `buttonStyles` | `components/ui/button.tsx` | 11 | Generador de clases de botón, usado también como `<Link>` styled |
| `cn` | `lib/utils.ts` | 8 | Helper de concatenación de clases condicionales |
| `useStore` | `store/store-provider.tsx` | 7 | Hook de acceso a carrito/wishlist |
| `HeartIcon` | `components/ui/icons.tsx` | 5 | Wishlist en header, product card, product detail |
| `ProductCard` | `components/products/product-card.tsx` | 4 | Reutilizado en home, catálogo, wishlist, relacionados |
| `formatCurrency` | `lib/utils.ts` | 4 | Formato COP (`Intl.NumberFormat`) |
| `getStorefrontProducts` | `lib/storefront.ts` | 4 | Punto único de lectura de catálogo |

Cambiar la firma de cualquiera de estos siete símbolos tiene efecto ancho — revisar todos los call sites antes de tocarlos.

## Clusters funcionales (detección de comunidades sobre el grafo de llamadas)

El análisis Leiden agrupa el código en 8 comunidades reales (no por carpeta, por acoplamiento real):

1. **Núcleo de producto** (cohesión 0.65): `ProductCard`, `ProductDetail`, `buttonStyles`, `CartPage`, `useStore`.
2. **Layout/shell** (cohesión 0.44): `cn`, `HeartIcon`, `SiteFooter`, `HomeHero`, `SiteShell`.
3. **Navegación/header** (cohesión 0.47): `Svg`, `SiteHeader`, `CartIcon`, `MenuIcon`, `CloseIcon`.
4. **Home/categorías** (cohesión 0.52): `HomePage`, `CategoryIcon`, `SectionHeading`, `CategoriesPage`, `ChevronRightIcon`.
5. **Catálogo** (cohesión 0.5): `CatalogView`, `getStorefrontProducts`, `PawIcon`, `ChevronDownIcon`, `FilterIcon`.
6. **Product page** (cohesión 0.71, la más cohesionada): `getStorefrontProduct`, `ProductPage`, `getFallbackRelatedProducts`, `findProductBySlug`, `getFallbackProduct`.
7. **Quantity selector** (cohesión 0.5): `QuantitySelector`, `updateQuantity`, `clampQuantity`, `MinusIcon`, `PlusIcon`.
8. **Adaptador Medusa** (cohesión 1.0, perfectamente aislado): `adaptMedusaProduct`, `readString`, `readNumber`.

El cluster 8 con cohesión 1.0 confirma que la capa de adaptación a Medusa está genuinamente desacoplada del resto — nadie más importa sus internals.

## Componentización (`src/components/`)

```
components/
├── cart/           cart-page.tsx
├── catalog/        catalog-view.tsx
├── checkout/       checkout-page.tsx
├── home/           home-hero.tsx, category-strip.tsx, benefits-strip.tsx, collection-card.tsx
├── layout/         site-header.tsx, site-footer.tsx, site-shell.tsx, mobile-bottom-nav.tsx
├── patilandia/      logo.tsx
├── product/         product-detail.tsx
├── products/         product-card.tsx, product-gallery.tsx
├── ui/               button.tsx, icons.tsx, quantity-selector.tsx, section-heading.tsx
└── wishlist/         wishlist-page.tsx
```

Coincide casi 1:1 con la estructura sugerida en el brief sección 14, con dos variaciones intencionales: `navigation/` se fusionó dentro de `layout/` (el header ya incluye la navegación) y se agregó `patilandia/` para el logo (coincide con lo pedido).

Ver también [[Integración Medusa]], [[Shipping — Arquitectura de Envíos]] y [[Mapa de Rutas y Componentes]].

Tags: #arquitectura #tecnico
