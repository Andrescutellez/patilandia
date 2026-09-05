---
title: Mapa de Rutas y Componentes — Patilandia
date: 2026-09-04
tags:
  - rutas
  - componentes
  - paginas
status: activo
---

# Mapa de Rutas y Componentes — Patilandia

> [!info] Fuente
> Las 9 rutas confirmadas como entry points por el grafo de código (`get_architecture`, 2026-09-04). Coincide exactamente con la lista pedida en [[Patilandia — Brief Original]] sección 19.

## Tabla completa

| Ruta | Archivo de página | Componente principal | Fuente de datos | Notas |
|---|---|---|---|---|
| `/` | `src/app/page.tsx` | `HomePage` (inline) | ⚠️ `mock-store.ts` directo (no `lib/storefront.ts`) | Hero, categorías, beneficios, colecciones, destacados, sección "producto propio", sección historia |
| `/tienda` | `src/app/tienda/page.tsx` | `StorePage` → `CatalogView` | ✅ `getStorefrontProducts()` | Catálogo completo, sin filtro de categoría preseleccionado |
| `/categorias` | `src/app/categorias/page.tsx` | `CategoriesPage` (inline) | Mocks estáticos (`categories`, `collections`) | Índice de categorías + colecciones, sin fetch |
| `/categorias/[slug]` | `src/app/categorias/[slug]/page.tsx` | `CategoryPage` → `CatalogView` | ✅ `getStorefrontProducts()` + filtro `activeCategory` | `notFound()` si el slug no existe en `categories` |
| `/producto/[slug]` | `src/app/producto/[slug]/page.tsx` | `ProductPage` → `ProductDetail` | ✅ `getStorefrontProduct(slug)` + `getFallbackRelatedProducts` | `notFound()` si no hay producto; sin `generateMetadata` (ver [[Pendientes Claude]]) |
| `/carrito` | `src/app/carrito/page.tsx` | `CartRoute` → `CartPage` | `useStore()` (Context + localStorage) | Client Component |
| `/checkout` | `src/app/checkout/page.tsx` | `CheckoutRoute` → `CheckoutPage` | `useStore()` para resumen; formulario sin estado | Client Component, formulario 100% estático |
| `/cuenta` | `src/app/cuenta/page.tsx` | `AccountPage` (inline) | Ninguna (placeholder) | 4 tarjetas estáticas: órdenes, direcciones, favoritos/recurrencia, perfil de mascotas |
| `/wishlist` | `src/app/wishlist/page.tsx` | `WishlistRoute` → `WishlistPage` | ⚠️ `products` de `mock-store.ts` directo + `useStore().wishlist` | Client Component |

## Árbol de componentes compartidos

```
SiteShell (layout global)
├── SiteHeader          — logo, nav, buscador (no funcional), favoritos/cuenta/carrito con badge
├── SiteFooter          — nav, categorías, "promesa" de marca
└── MobileBottomNav     — 5 accesos, solo mobile

HomePage
├── HomeHero
├── CategoryStrip        (reutiliza CategoryIcon)
├── BenefitsStrip
├── CollectionCard × 5   (también reutilizado en CategoriesPage)
└── ProductCard × 6      (también reutilizado en CatalogView, WishlistPage, ProductDetail-relacionados)

CatalogView (compartido por /tienda y /categorias/[slug])
├── filtros (búsqueda, tamaño, tipo mascota, categorías) — estado local useState/useMemo
├── grid de categorías (chips con CategoryIcon)
└── ProductCard × N

ProductDetail
├── ProductGallery       (thumbnails + imagen activa, useState local)
├── QuantitySelector
├── selector de color / talla (estado local del componente)
└── ProductCard × 4      (relacionados)

CartPage / CheckoutPage
└── QuantitySelector, resumen con getShippingPreview()
```

`ProductCard`, `Button`/`buttonStyles`, `SectionHeading`, `QuantitySelector` y los íconos son los bloques verdaderamente reutilizables — ver hotspots en [[Arquitectura Técnica]].

## Metadata por ruta (estado SEO)

| Ruta | `export const metadata` |
|---|---|
| `/` (via layout) | Título/descripción/OG por defecto del sitio (`RootLayout`) |
| `/tienda` | ✅ `{ title: "Tienda" }` |
| `/categorias` | ✅ `{ title: "Categorías" }` |
| `/categorias/[slug]` | ❌ ninguno — hereda el default del layout |
| `/producto/[slug]` | ❌ ninguno — hereda el default del layout, sin título/imagen específicos del producto |
| `/carrito` | ✅ `{ title: "Carrito" }` |
| `/checkout` | ✅ `{ title: "Checkout" }` |
| `/cuenta` | ✅ `{ title: "Cuenta" }` |
| `/wishlist` | ✅ `{ title: "Wishlist" }` |

Ver gap de SEO dinámico por producto en [[Pendientes Claude]].

Tags: #rutas #componentes #paginas
