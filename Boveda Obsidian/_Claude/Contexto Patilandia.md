---
title: Contexto Patilandia
date: 2026-09-04
tags:
  - claude
  - contexto
  - patilandia
status: activo
updated: 2026-09-11 (migración completa de Medusa a Vendure — ver [[Decisiones y Razonamiento]])
---

# Contexto Patilandia

> [!info] Uso de esta nota
> Estado del arte del proyecto Patilandia. Actualizar al final de cada sesión relevante.

## Qué es Patilandia

E-commerce premium especializado en productos para mascotas. Marca: **PATILANDIA**. Slogan: **"Un mundo hecho para ellos."**

Producto diferencial inicial: camas y textiles para mascotas (fabricación propia/proveedores cercanos), con roadmap hacia cojines, mantas, juguetes, alimentación, snacks, higiene y accesorios. Ver especificación completa en [[Patilandia — Brief Original]] y pilares de marca en [[Identidad de Marca]].

## Stack tecnológico (confirmado en `package.json`)

- **Next.js** 15 (App Router) + **React** 19 + **TypeScript** 5, `strict: true`.
- **Tailwind CSS** 4 vía `@tailwindcss/postcss` (no `tailwind.config.*` — Tailwind v4 usa CSS-first config, tokens en `globals.css`).
- **Fuentes self-hosted** vía `@fontsource/baloo-2` y `@fontsource/nunito` (no Google Fonts CDN — mejor control de privacidad/perf).
- **Vendure** — no instalado como dependencia (es un backend externo, headless, repo hermano `patilandia-vendure`). El frontend le habla por GraphQL vía `fetch`, sin SDK ni codegen todavía.
- Sin librería de estado (Zustand/Redux) — Context API + `localStorage`.
- Sin Framer Motion instalado todavía (el brief lo sugiere como opcional).
- Sin framework de testing configurado.

## Estructura de rutas (App Router, `src/app/`)

| Ruta | Archivo | Componente | Server/Client |
|------|---------|------------|----------------|
| `/` | `page.tsx` | inline (`HomePage`) | Server |
| `/tienda` | `tienda/page.tsx` | `CatalogView` | Server (fetch async) |
| `/categorias` | `categorias/page.tsx` | inline | Server |
| `/categorias/[slug]` | `categorias/[slug]/page.tsx` | `CatalogView` (filtrado) | Server (fetch async) |
| `/producto/[slug]` | `producto/[slug]/page.tsx` | `ProductDetail` | Server (fetch async) |
| `/carrito` | `carrito/page.tsx` | `CartPage` | Client (usa `useStore`) |
| `/checkout` | `checkout/page.tsx` | `CheckoutPage` | Client (usa `useStore`) |
| `/cuenta` | `cuenta/page.tsx` | inline | Server (placeholder estático) |
| `/wishlist` | `wishlist/page.tsx` | `WishlistPage` | Client (usa `useStore`) |

Detalle de componentes por ruta en [[Mapa de Rutas y Componentes]].

## Capa de comercio (`src/lib/`)

- **`storefront.ts`** — punto único de entrada para leer productos. `getStorefrontProducts()` pide un query GraphQL a la Shop API de Vendure (`vendureFetch`); si no hay respuesta (Vendure caído) cae a los mocks de `data/mock-store.ts`. Las 9 rutas pasan por `lib/storefront.ts` de forma consistente — ningún componente sabe si el dato vino de Vendure o de un mock.
- **`vendure/client.ts`** — `vendureFetch<T>()`: POST a la Shop API. Falla en silencio (retorna `null`) ante cualquier error de red o de GraphQL — mismo principio fail-soft que tenía el cliente de Medusa.
- **`vendure/adapters.ts`** — `adaptVendureProduct()`: convierte el nodo `Product` de la Shop API (facetValues, variants, customFields) al tipo `StorefrontProduct`. Categoría/colección temática/petType salen de Facets; talla/color de ProductVariants reales; el resto de customFields tipados. También expone `adaptVendureOrderLine()` para construir líneas de carrito desde un `OrderLine` real.
- **`vendure/shop-client.ts`** — cliente de sesión para carrito/checkout (bearer token en `localStorage`): `addItemToOrder`, `adjustOrderLine`, `removeOrderLine`, `setCustomerEmail`/`updateCustomerName`, `setShippingAddress`, `setShippingMethod`, `placeOrder`.
- **`shipping.ts`** — `getShippingPreview(items)`: NO calcula un número. Devuelve un mensaje contextual ("cotización pendiente" si hay producto `bulky`/`heavy`/`custom` o peso total ≥ 8kg; "se calcula en checkout" si el carrito está vacío) — usado solo como estimado previo al checkout; el envío real (tarifa fija por transportadora, no por peso todavía) se calcula en `/checkout` contra Vendure. Ver razonamiento en [[Shipping — Arquitectura de Envíos]].

Detalle completo de la migración de Medusa a Vendure en [[Decisiones y Razonamiento]] (entradas del 2026-09-10 y 2026-09-11).

## Estado global de cliente (`src/store/store-provider.tsx`)

`StoreProvider` (Context API) expone `cart` (espejo del `activeOrder` real de Vendure, ya no local), `wishlist` (local + sincronizada a Vendure apenas hay un correo conocido — ver [[Decisiones y Razonamiento]] 2026-09-12), `addToCart`/`updateQuantity`/`removeFromCart` (ahora async, mutan la orden real), `setCustomerEmail`/`updateCustomerName`/`setShippingAddress`/`setShippingMethod`/`placeOrder`, `toggleWishlist`, `isWishlisted`, más `cartCount`/`wishlistCount`/`subtotal`/`shippingTotal`/`total` derivados. La sesión de carrito vive en un bearer token guardado en `localStorage` (`patilandia-vendure-token`); el wishlist tiene su propia key (`patilandia-wishlist-v1`).

## Identidad visual ya aplicada (no es un mockup, es código real)

Tokens en `src/app/globals.css` (`:root`):

| Token | Valor | Uso |
|---|---|---|
| `--brand-violet` | `#7261ff` | Acento primario, botones, links activos |
| `--brand-violet-deep` | `#20308d` | Texto de marca, precios, hover |
| `--brand-soft` | `#efeaff` | Fondos suaves (chips, highlights) |
| `--brand-pink` | `#ff9fe0` | Acento secundario (hero, wishlist activo) |
| `--brand-gold` | `#f3cb73` | Badges, CTA dorado, detalles "realeza" |
| `--surface` | `#fffaf3` | Fondo base cálido |
| `--ink` / `--muted` | `#22305f` / `#5f6790` | Texto principal / secundario |
| `--font-display` | Baloo 2 | Títulos (redondeada, tierna, con carácter) |
| `--font-body` | Nunito | Cuerpo de texto |

El logo real usado en el header desde 2026-09-05 es `public/images/patilandia/logo-rectangular.png` (lockup horizontal: ilustración perro+gato+castillo a la izquierda, wordmark "Patilandia" + slogan a la derecha) — reemplazó al PNG cuadrado original (`logo-patilandia.png`, que sigue vivo solo en el footer) tras un bug real de aspect-ratio que hacía crecer el header al cargar la página. Favicon propio también nuevo (`src/app/icon.png` + `apple-icon.png`, la "P" con corona). Las imágenes de producto (`hero-fantasy.png`, `royal-bed.png`, `galaxy-bed.png`, `forest-bed.png`, `safari-bed.png`, `dreams-bed.png`) son renders IA de mascotas reales sobre camas temáticas en escenarios de castillo/fantasía — **no fotos de stock genéricas**, ya siguen el lenguaje visual del brief (ver sección 4 y 7 de [[Patilandia — Brief Original]]). Las 7 categorías también tienen ahora foto propia (`categoria *.png`), ver [[Modelo de Datos y Mocks]].

Detalle de tokens, componentes y patrones visuales en [[Design System]]. Detalle de los cambios de logo/favicon/categorías/mobile de esta sesión en [[Decisiones y Razonamiento]] y en el estado rápido de [[SEGUNDO_CEREBRO]].

## Qué es real vs. qué es mock (actualizado 2026-09-11 — migración a Vendure completa)

| Capa | Estado |
|---|---|
| Diseño visual / identidad de marca | ✅ Real, aplicado en producción de código |
| Navegación entre 9 rutas | ✅ Real, funcional |
| Catálogo con filtros (tamaño, tipo mascota, categoría, búsqueda, orden) | ✅ Real, sobre datos reales de Vendure (con fallback a mock si Vendure se cae) |
| Datos de producto (8 productos, 96 variantes reales) | ✅ **Real, viven en Vendure** — categorías/colecciones temáticas como Collections, talla/color como ProductVariants reales, resto como customFields tipados. Ver [[Decisiones y Razonamiento]] (Fase 2) |
| Carrito y checkout | ✅ **Real**, contra el `activeOrder` de Vendure — agregar/quitar/ajustar ítems, correo, dirección, método de envío y confirmación de pedido (queda `PaymentAuthorized`) todo funciona de verdad. Ver [[Decisiones y Razonamiento]] (Fase 5) |
| Wishlist | ✅ Real — local e instantánea (localStorage) mientras no hay correo conocido; se sincroniza a Vendure (plugin `patilandia-wishlist`) apenas hay uno, sin borrar nunca. Ver [[Decisiones y Razonamiento]] (2026-09-12) |
| Patipuntos (fidelización) | ✅ Real — se gana por compra/registro/mascota/reseña/cumpleaños, ledger auditable, y se canjea en el checkout (tope 20% del subtotal, gate de correo verificado + primera compra). Plugin `patilandia-loyalty`. Ver [[Decisiones y Razonamiento]] (2026-09-12) |
| Conexión a Vendure | ✅ **Backend Vendure corriendo en local** (`http://localhost:3000`), `.env.local` del storefront apunta a la Shop API. Ver [[Entorno de Desarrollo Local]] |
| Dashboard de administración | ✅ Real — "Patilandia Admin" sobre el Dashboard de Vendure, con marca propia (login, colores) y una sección de navegación propia. Ver [[Decisiones y Razonamiento]] (Fase 6) |
| Pagos reales (Wompi/Mercado Pago) | ❌ No iniciado a propósito (correcto según brief, es fase posterior) — el punto de integración (`addPaymentToOrder`) ya funciona con un handler de prueba |
| Cuenta/autenticación de clientes | ❌ Placeholder visual, sin lógica |
| Cálculo real de envío por peso/volumen/destino | ⚠️ Envío real por tarifa fija (no por peso todavía) — mensaje contextual de "cotización pendiente" para pedidos pesados/voluminosos en el carrito. Ver [[Shipping — Arquitectura de Envíos]] |
| Tasa de impuesto | ⚠️ Genérica (20%, zona "Americas" de la sample data de Vendure), no el 19% real de Colombia — pendiente antes de producción |

## Backend Vendure

Repo hermano: `C:\Users\Leonardo\Desktop\patilandia-vendure` (inicializado por `@vendure/create`, aún sin commits). Reemplazó por completo a Medusa (`patilandia-backend`, borrado del disco el 2026-09-11 a pedido explícito del usuario — ver [[Decisiones y Razonamiento]]). Detalle de cómo levantarlo, credenciales y estructura en [[Entorno de Desarrollo Local]].

## Build health (verificado 2026-09-11, tras la baja de Medusa)

- `npm run typecheck` (storefront) → ✅ limpio.
- `npm run build` (storefront) → ✅ limpio, 12/12 páginas.
- `npm run lint` (storefront) → ❌ sigue **roto** (no relacionado a la migración). `.eslintrc.json` es formato legacy; ESLint instalado es v9.39.5 y exige `eslint.config.js` (flat config). Ver [[Pendientes Claude]] para el fix.
- `npx tsc --noEmit -p tsconfig.dashboard.json` (plugin de Dashboard en `patilandia-vendure`) → ✅ limpio para código propio.

Tags: #claude #contexto #patilandia
