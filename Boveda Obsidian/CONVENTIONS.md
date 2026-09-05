# CONVENTIONS

## Nombres canónicos
- `Patilandia Storefront` — nombre del proyecto Next.js (`package.json` → `patilandia-storefront`).
- `Medusa` — commerce backend headless. Aún **no conectado** (no hay backend corriendo); la capa de adaptación ya está lista para cuando exista.
- `StoreProvider` — contexto React que gestiona carrito y wishlist, persistido en `localStorage` bajo la key `patilandia-storefront-v1`.
- `StorefrontProduct` — tipo central de producto, definido en `src/types/commerce.ts`. Es el contrato que todo componente visual consume, venga de Medusa o de los mocks.
- `CatalogView` — componente compartido por `/tienda` y `/categorias/[slug]` (filtros + grid + orden).

## Idioma
- Español para textos de UI, títulos de notas y descripciones humanas.
- Inglés para identificadores de código (camelCase en componentes/funciones, kebab-case en nombres de archivo).
- Slugs y rutas en español (`/tienda`, `/carrito`, `/categorias`, `/producto`, `/cuenta`) — refuerza identidad de marca, no es un detalle técnico casual.

## Estructura de carpetas del código (`src/`)
- `app/` — rutas Next.js App Router (Server Components por defecto; `"use client"` solo donde hay estado/interactividad).
- `components/` — UI organizada por dominio: `layout/`, `home/`, `products/`, `product/`, `catalog/`, `cart/`, `checkout/`, `wishlist/`, `ui/`, `patilandia/`.
- `lib/` — utilidades y capa de comercio (`storefront.ts`, `shipping.ts`, `utils.ts`, `medusa/client.ts`, `medusa/adapters.ts`).
- `store/` — estado global de cliente (`store-provider.tsx`).
- `data/` — mocks realistas (`mock-store.ts`), siempre marcados como fallback, nunca fuente de verdad final.
- `types/` — contratos TypeScript compartidos (`commerce.ts`).

## Regla de arquitectura que no debe romperse
Ningún componente visual debe importar `mock-store.ts` directamente para pintar catálogo/producto en una ruta — debe pasar por `lib/storefront.ts`, que decide Medusa vs. mock. Excepciones actuales conocidas (ambas rompen la regla hoy): `wishlist-page.tsx` importa `products` de los mocks directamente, y `app/page.tsx` (`HomePage`) importa `getFeaturedProducts`/`collections` directo de los mocks en vez de usar `getHomepageProducts`/`getHomepageCollections` de `lib/storefront.ts` (que existen pero están sin usar). Ver [[Pendientes Claude]].

## Estructura de la bóveda
`00-Index`, `01-Vision-y-Marca`, `02-Arquitectura`, `03-Design-System`, `04-Catalogo-y-Producto`, `05-Paginas-y-Rutas`, `08-Daily`, `_Claude`, `_Templates`.

Mantener enlaces bidireccionales `[[Nota]]` cuando sea posible.

Tags: #conventions
