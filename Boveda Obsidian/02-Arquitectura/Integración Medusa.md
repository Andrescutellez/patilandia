---
title: Integración Medusa — Capa de Adaptación
date: 2026-09-04
tags:
  - arquitectura
  - medusa
  - integracion
status: histórico
---

# Integración Medusa — Capa de Adaptación

> [!failure] SUPERADA — Medusa ya no existe en el proyecto (2026-09-11)
> Patilandia migró de Medusa a Vendure (7 fases, ver [[Decisiones y Razonamiento]]). `patilandia-backend` se borró del disco por completo y `src/lib/medusa/` ya no existe en el storefront. Esta nota queda como registro histórico de cómo funcionaba la integración con Medusa — no describe el sistema actual. Para la integración real y vigente, ver [[Decisiones y Razonamiento]] (Fase 2 y 3) y [[Entorno de Desarrollo Local]].

> [!success] Estado histórico al 2026-09-04 (ya no vigente)
> Medusa **estaba instalado, corriendo en local y conectado** — no era solo una capa preparada en teoría. Backend en `patilandia-backend` (repo hermano), catálogo real de 8 productos migrado, storefront apuntando a él vía `.env.local`. Lo que sigue en esta nota describe la capa de código tal como funcionaba contra Medusa real en ese momento.
>
> Para el lado **admin** de Medusa (no el storefront): ver [[Patilandia sobre Medusa Admin — Diagnóstico y Roadmap]] — diagnóstico de qué se puede extender oficialmente (widgets/UI routes/módulos custom) vs. qué no es viable (re-temear el dashboard nativo globalmente).

## Variables de entorno (`.env.example`)

```
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=
NEXT_PUBLIC_STORE_CURRENCY=COP
```

`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` está vacío por defecto — esto es lo que activa el modo fallback-a-mocks (ver [[Decisiones y Razonamiento]] para el porqué).

## Los tres archivos que forman la capa

### 1. `src/lib/medusa/client.ts` — transporte

```ts
export function isMedusaConfigured() {
  return Boolean(MEDUSA_BACKEND_URL && MEDUSA_PUBLISHABLE_KEY);
}

export async function medusaFetch<T>(path, init?) {
  if (!MEDUSA_PUBLISHABLE_KEY) return null;   // fail-soft, no lanza
  // ...fetch con header x-publishable-api-key...
  if (!response.ok) throw new Error(...);      // sí lanza si Medusa responde con error
  return response.json() as T;
}
```

`isMedusaConfigured()` existe pero **no se usa todavía en ningún componente** — es un helper preparado, no consumido aún.

### 2. `src/lib/medusa/adapters.ts` — normalización

`adaptMedusaProduct(record: Record<string, unknown>): StorefrontProduct` toma el JSON crudo de un producto de Medusa y lo mapea a `StorefrontProduct`. Puntos clave:

- `title`, `handle`, `thumbnail`, `description`, `id` vienen de los campos estándar de Medusa.
- **Todo lo específico de Patilandia** (categoría, colección, tema visual, tallas, colores, precio, rating, featured) se lee de `record.metadata` — es decir, hoy depende de que el catálogo en Medusa use el namespace `metadata` para estos campos de negocio. Si Medusa tuviera Product Categories/Collections nativas, habría que decidir si migrar `categorySlug`/`collectionSlug` a esos objetos nativos en vez de `metadata` (**decisión de diseño pendiente para cuando exista Medusa real** — no está definida todavía).
- Cada campo tiene un default conservador si falta en `metadata` (ej. `theme` cae a `"dreams"`, `colorHex` a `#8b73ff`, `stock` a `10`) — nunca rompe el render por dato faltante.
- Limitación conocida: `sizes` siempre se fuerza a `["S", "M", "L"]` fijo, y `colors` siempre trae un único color desde `metadata` — no hay soporte real todavía para múltiples variantes de Medusa (tallas/colores como opciones reales del producto). Esto es una simplificación temporal, no una decisión final.

### 3. `src/lib/storefront.ts` — punto único de entrada

```ts
export async function getStorefrontProducts() {
  const response = await medusaFetch<MedusaProductsResponse>("/store/products");
  if (response?.products?.length) return response.products.map(adaptMedusaProduct);
  return products; // fallback a data/mock-store.ts
}
```

Todas las páginas Server Component (`/tienda`, `/categorias/[slug]`, `/producto/[slug]`) llaman `getStorefrontProducts()` / `getStorefrontProduct(slug)` — nunca importan Medusa ni los mocks directamente. Esto es la regla de arquitectura documentada en [[CONVENTIONS]].

`getFallbackProduct` / `getFallbackRelatedProducts` son atajos síncronos directos a los mocks, usados como fallback adicional dentro de `getStorefrontProduct` cuando ni Medusa ni el array combinado tienen el slug buscado.

## Diagrama de flujo (página `/tienda`)

```
StorePage (Server Component)
  → getStorefrontProducts()
      → medusaFetch("/store/products")
          → sin publishable key: null inmediato
          → con key: fetch real a Medusa
      → si hay productos Medusa: .map(adaptMedusaProduct)
      → si no: products (mock-store.ts)
  → <CatalogView products={...} />   ← no sabe ni le importa el origen
```

## Checklist — qué ya está hecho y qué falta (actualizado 2026-09-04)

1. ~~Levantar Medusa + Postgres, configurar `NEXT_PUBLIC_MEDUSA_BACKEND_URL` y `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` reales.~~ ✅ Hecho — ver [[Entorno de Desarrollo Local]].
2. Modelo de metadata: se decidió **mantener** `product.metadata` como fuente de los campos de negocio (no migrar a Product Categories/Collections nativas de Medusa por ahora) — ver [[Decisiones y Razonamiento]]. Las 8 categorías de Patilandia sí se crearon como Product Categories nativas de Medusa (para `category_ids`), pero el storefront sigue sin consumirlas — sigue leyendo `categorySlug`/`categoryLabel` de `metadata`.
3. ~~Resolver variantes reales (tallas/colores)~~ ❌ Sigue pendiente — cada producto tiene un único variant "Única"; es deuda técnica reconocida, ver [[Pendientes Claude]].
4. ~~Decidir si `WishlistPage` sigue importando mocks directamente~~ ✅ Corregido 2026-09-04 — `WishlistPage` y `HomePage` ya pasan por `lib/storefront.ts`.
5. Conectar carrito/checkout a los endpoints de carrito de Medusa (`/store/carts`) en vez de (o además de) el `StoreProvider` local — **todavía sin decidir ni implementar**. El carrito sigue siendo 100% local (`localStorage`), Medusa no sabe que existe.
6. **Nuevo, no estaba en el checklist original:** la Store API de Medusa v2 no incluye `metadata` ni `images` en la respuesta por defecto — hay que pedirlos explícitamente con `?fields=+metadata,+images.url`. `getStorefrontProducts()` ya lo hace.

Tags: #arquitectura #medusa #integracion
