---
title: Contexto Patilandia
date: 2026-09-04
tags:
  - claude
  - contexto
  - patilandia
status: activo
updated: 2026-09-04 (Medusa instalado y conectado en local)
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
- **Medusa** — no instalado como dependencia (es un backend externo, headless). El frontend le habla por HTTP vía `fetch`, sin SDK.
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

- **`storefront.ts`** — punto único de entrada para leer productos. `getStorefrontProducts()` pide `/store/products?fields=+metadata,+images.url` a Medusa (el `fields` explícito es necesario — la Store API de Medusa v2 **no** incluye `metadata` ni `images` por defecto); si no hay respuesta (publishable key vacía) cae a los mocks de `data/mock-store.ts`. **Arreglado 2026-09-04:** `HomePage` y `WishlistPage` ya no importan `mock-store.ts` directamente — `HomePage` ahora es `async` y usa `getHomepageProducts()`/`getHomepageCollections()`; `WishlistRoute` hace `await getStorefrontProducts()` y pasa el resultado a `WishlistPage` como prop. Las 9 rutas pasan por `lib/storefront.ts` de forma consistente.
- **`medusa/client.ts`** — `medusaFetch<T>()`: fetch tipado con header `x-publishable-api-key`. Si `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` está vacío, retorna `null` sin lanzar error (fail-soft intencional).
- **`medusa/adapters.ts`** — `adaptMedusaProduct()`: convierte el JSON crudo de Medusa (`title`, `handle`, `thumbnail`, `metadata.*`) al tipo `StorefrontProduct`. Todo el negocio (categoría, colección, tema, colores, tallas, materiales) hoy vive en `metadata` de Medusa con defaults conservadores si falta el campo.
- **`shipping.ts`** — `getShippingPreview(items)`: NO calcula un número. Devuelve un mensaje contextual ("cotización pendiente" si hay producto `bulky`/`heavy`/`custom` o peso total ≥ 8kg; "se calcula en checkout" si el carrito está vacío). Ver razonamiento en [[Shipping — Arquitectura de Envíos]].

Detalle completo en [[Integración Medusa]].

## Estado global de cliente (`src/store/store-provider.tsx`)

`StoreProvider` (Context API) expone `cart`, `wishlist`, `addToCart`, `updateQuantity`, `removeFromCart`, `toggleWishlist`, `isWishlisted`, más `cartCount`/`wishlistCount`/`subtotal` derivados con `useMemo`. Persistencia en `localStorage` bajo la key **`patilandia-storefront-v1`**, con hidratación diferida (`isHydrated`) para evitar mismatch SSR/CSR. El id de línea de carrito es `${slug}-${size}-${colorName}` (variantes distintas = líneas distintas).

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

El logo real (`public/images/patilandia/logo-patilandia.png`) ya muestra el concepto de marca completo: perro dorado + gato gris con corona y pañoleta, silueta de castillo morado detrás, huella y estrellas doradas, wordmark "Patilandia" en script morado con el slogan debajo. Las imágenes de producto (`hero-fantasy.png`, `royal-bed.png`, `galaxy-bed.png`, `forest-bed.png`, `safari-bed.png`, `dreams-bed.png`) son renders IA de mascotas reales sobre camas temáticas en escenarios de castillo/fantasía — **no fotos de stock genéricas**, ya siguen el lenguaje visual del brief (ver sección 4 y 7 de [[Patilandia — Brief Original]]).

Detalle de tokens, componentes y patrones visuales en [[Design System]].

## Qué es real vs. qué es mock (actualizado 2026-09-04 — Medusa ya está conectado)

| Capa | Estado |
|---|---|
| Diseño visual / identidad de marca | ✅ Real, aplicado en producción de código |
| Navegación entre 8 rutas | ✅ Real, funcional |
| Carrito y wishlist | ✅ Real, persistente (localStorage) — **todavía no habla con el carrito de Medusa**, sigue siendo local únicamente |
| Catálogo con filtros (tamaño, tipo mascota, categoría, búsqueda, orden) | ✅ Real, ahora sobre datos reales de Medusa (con fallback a mock si Medusa se cae) |
| Datos de producto (8 productos) | ✅ **Real, viven en Medusa** (`patilandia_medusa` DB) — migrados desde `data/mock-store.ts`, que sigue existiendo como fallback y como fuente de verdad del *contenido* (ver [[Decisiones y Razonamiento]]) |
| Conexión a Medusa | ✅ **Backend Medusa corriendo en local** (`http://localhost:9000`), `.env.local` del storefront apunta a él con la publishable key real. Ver [[Entorno de Desarrollo Local]] |
| Checkout (formulario) | ⚠️ Solo UI estática, sin estado ni validación ni envío |
| Pagos (Wompi/Mercado Pago) | ❌ No iniciado (correcto según brief, es fase posterior) |
| Cuenta/autenticación | ❌ Placeholder visual, sin lógica |
| Cálculo real de envío por peso/volumen/destino | ❌ Solo mensaje contextual, sin cálculo (ver [[Shipping — Arquitectura de Envíos]]) |

## Medusa backend — ahora existe (2026-09-04)

Repo hermano: `C:\Users\Leonardo\Desktop\patilandia-backend` (git inicializado localmente, aún sin commits — sin remote). Detalle completo de cómo levantarlo, credenciales y arquitectura del monorepo en [[Entorno de Desarrollo Local]] e [[Integración Medusa]].

## Build health (verificado 2026-09-04)

- `npm run typecheck` (storefront) → ✅ limpio, incluso después de los cambios de conexión a Medusa.
- `npm run lint` (storefront) → ❌ **roto**. `.eslintrc.json` es formato legacy; ESLint instalado es v9.39.5 y exige `eslint.config.js` (flat config). El comando falla antes de analizar un solo archivo. Ver [[Pendientes Claude]] para el fix.
- No se corrió `npm run build` en esta sesión (solo `dev` para verificación visual/HTTP).

Tags: #claude #contexto #patilandia
