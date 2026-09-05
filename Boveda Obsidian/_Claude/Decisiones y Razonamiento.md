---
title: Decisiones y Razonamiento
date: 2026-09-04
tags:
  - claude
  - decisiones
  - arquitectura
---

# Decisiones y Razonamiento

> [!warning] Antes de revertir una decisión
> Leer el razonamiento completo. Varias de estas decisiones ya están reflejadas en código funcionando, no son solo intención.

## Formato de entrada

```
### [FECHA] Título de la decisión
**Contexto:** Por qué surgió esta decisión.
**Opciones evaluadas:** Qué alternativas se consideraron.
**Decisión:** Qué se eligió.
**Por qué:** Razonamiento técnico detallado.
**Impacto:** Qué afecta esta decisión.
```

---

## Decisiones registradas

### [2026-09-03] Medusa como commerce backend headless, no un backend propio

**Contexto:** El brief original ([[Patilandia — Brief Original]], sección 2) es explícito: "NO quiero construir otro backend de e-commerce desde cero."

**Opciones evaluadas:** Backend custom (Node/Express) vs. Medusa vs. Shopify headless.

**Decisión:** Medusa + PostgreSQL, consumido vía Store API REST.

**Por qué:** Medusa cubre productos, variantes, precios, carrito, clientes, órdenes, inventario, promociones, checkout, payments y fulfillment out-of-the-box, y es open-source/self-hostable (relevante para Colombia + integraciones locales como Wompi). Construir eso a mano sería reinventar la rueda sin beneficio.

**Impacto:** El frontend nunca debe asumir estructura interna de Medusa; toda lectura pasa por [[Integración Medusa]].

---

### [2026-09-03] Capa de adaptación desacoplada en vez de acoplar componentes a la Store API de Medusa

**Contexto:** Medusa todavía no está desplegado (sin backend corriendo, `.env.example` con key vacía), pero la storefront debía ser navegable desde el día uno.

**Opciones evaluadas:**
- Hardcodear productos directamente en los componentes visuales.
- Consumir el shape de Medusa directamente en los componentes.
- Definir un tipo propio (`StorefrontProduct`) + funciones adaptadoras (`adaptMedusaProduct`) + una función de entrada única (`getStorefrontProducts`) que decide la fuente.

**Decisión:** La tercera opción — capa de adaptación en `src/lib/medusa/adapters.ts` + `src/lib/storefront.ts`.

**Por qué:** Ningún componente visual (`ProductCard`, `CatalogView`, `ProductDetail`) sabe si el producto vino de Medusa o de un mock — ambos se normalizan al mismo `StorefrontProduct`. Esto cumple exactamente el brief sección 8: "No acoples los componentes visuales directamente a una estructura de datos rígida. Crea una capa/adaptador si es necesario." Cuando Medusa esté desplegado, basta con setear las env vars — cero cambios en componentes.

**Impacto:** Cualquier campo nuevo de Medusa que se quiera exponer debe pasar primero por `adaptMedusaProduct` y por el tipo `StorefrontProduct` en `types/commerce.ts`.

---

### [2026-09-03] `medusaFetch` falla en silencio (retorna `null`) cuando no hay publishable key

**Contexto:** Sin Medusa desplegado, cualquier `fetch` fallido rompería el build/SSR de cada página que lista productos.

**Decisión:** `medusaFetch` retorna `null` inmediatamente si `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` está vacío, sin intentar la llamada de red.

**Por qué:** Permite que `getStorefrontProducts()` caiga a mocks de forma predecible y rápida (sin esperar timeout de red), manteniendo la storefront 100% navegable en desarrollo sin Medusa corriendo.

**Impacto:** Si Medusa está mal configurado (key presente pero backend caído), sí lanza error (`response.ok` check) — el fail-soft es solo para "Medusa no configurado", no para "Medusa configurado pero roto". Diferencia importante a la hora de debuggear.

---

### [2026-09-03] Envío sin costo fijo — arquitectura de "cotización pendiente" en vez de un número inventado

**Contexto:** Brief sección 10: Patilandia venderá productos pesados (arena, alimento, sacos grandes) junto a productos livianos (accesorios). Un costo de envío fijo sería incorrecto desde el día uno.

**Opciones evaluadas:**
- Costo de envío fijo (ej. $10.000 COP) como placeholder.
- Sin mostrar nada de envío hasta checkout real.
- Mensaje contextual basado en reglas simples (peso total, `shippingClass`) sin calcular un número real.

**Decisión:** Tercera opción — `getShippingPreview()` en `lib/shipping.ts`.

**Por qué:** Cada `StorefrontProduct` ya tiene `weightKg` y `shippingClass: "standard" | "bulky" | "heavy" | "custom"`. La función detecta si el carrito necesita cotización especial (algún ítem `bulky`/`heavy`/`custom`, o peso total ≥ 8kg) y comunica correctamente al usuario que el envío se calculará después, en vez de mentir con un número fijo que luego habría que romper visualmente al conectar la lógica real. El *snack* de ejemplo (`snack-crunch-pollo`) se marcó deliberadamente `shippingClass: "heavy"` con `weightKg: 8.5` para forzar y validar este camino con datos mock.

**Impacto:** Cuando exista integración real de fulfillment (por peso/volumen/destino/transportadora), solo hay que reemplazar el cuerpo de `getShippingPreview` — el contrato (`ShippingPreview { label, detail, status }`) y los call sites (`CartPage`, `CheckoutPage`) no cambian.

---

### [2026-09-03] Estado global simple (Context + localStorage) en vez de Zustand/Redux

**Contexto:** Carrito y wishlist necesitan persistir entre sesiones y ser accesibles desde header, catálogo, producto, carrito y checkout.

**Decisión:** `StoreProvider` con React Context + `useState` + `localStorage`, sin librería externa.

**Por qué:** El estado es simple (dos arrays: `cart`, `wishlist`) y de un solo tenant (no hay sincronización multi-pestaña en tiempo real ni estado de servidor complejo que justifique Zustand/Redux/TanStack Query en esta etapa). Añadir una librería de estado sería complejidad prematura frente al brief sección 17 ("Evita soluciones... código duplicado... No diseñes para requisitos hipotéticos").

**Impacto:** Si más adelante se necesita sincronizar carrito con un customer autenticado en Medusa (carrito server-side), este provider es el punto de reemplazo natural — la interfaz pública (`useStore()`) no debería cambiar para los consumidores.

---

### [2026-09-04] Medusa vive en un repo hermano (`patilandia-backend`), no dentro de `patilandia`

**Contexto:** Había que instalar Medusa. El brief pide frontend desacoplado de Medusa; el patrón ya validado en otros proyectos del usuario (Argus) es un repo por servicio.

**Decisión:** `create-medusa-app` se ejecutó apuntando a `C:\Users\Leonardo\Desktop\patilandia-backend`, sibling de `patilandia`, con su propio git (inicializado, sin commits/remote aún).

**Por qué:** Mismo razonamiento que separar `Argus Backend` de `argus-web-usuario` — servicios con ciclos de vida, deploys y stacks distintos no deberían compartir repo. Confirmado explícitamente por el usuario ante la pregunta directa.

**Impacto:** Cualquier cambio al backend se commitea en `patilandia-backend`, no en `patilandia`. Ver [[Entorno de Desarrollo Local]].

---

### [2026-09-04] Catálogo real migrado a Medusa vía workflows oficiales, no SQL directo

**Contexto:** Tras instalar Medusa, había que decidir cómo poblarlo con los 8 productos reales de Patilandia en vez de dejar el catálogo demo genérico de Medusa (camisetas).

**Opciones evaluadas:**
- Insertar filas directamente en Postgres con SQL.
- Usar la Admin API REST con curl/fetch.
- Escribir un script ejecutado con `medusa exec`, usando los workflows oficiales de `@medusajs/medusa/core-flows` (`createProductsWorkflow`, `createProductCategoriesWorkflow`, etc.).

**Decisión:** La tercera opción.

**Por qué:** Medusa v2 modela productos con muchas tablas de enlace (`product_sales_channel`, `product_variant_price_set`, `product_variant_inventory_item`, etc. — ver el bloque "Created following links tables" que imprime la migración inicial). Escribir eso a mano por SQL es extremadamente frágil. Los workflows encapsulan toda esa complejidad y son literalmente el mismo mecanismo que usa el propio `initial-data-seed.ts` que genera Medusa al instalarse — copiar ese patrón garantiza compatibilidad con la versión instalada (2.20.1).

**Impacto:** El script vive en `patilandia-backend/apps/backend/src/scripts/patilandia-seed.ts`. Si se agregan más productos a `data/mock-store.ts` en el storefront, hay que reflejarlos manualmente en este script también (no hay sincronización automática — decisión consciente de no construir esa infraestructura todavía).

---

### [2026-09-04] Esquema de `metadata` en Medusa: solo los campos que `adaptMedusaProduct` ya lee

**Contexto:** Al crear los productos reales en Medusa había que decidir qué guardar en `metadata` (namespace libre de Medusa) vs. usar entidades nativas de Medusa (variantes reales por talla/color, categorías nativas, etc.).

**Decisión:** El `metadata` de cada producto en Medusa replica exactamente las claves que `adaptMedusaProduct()` (`src/lib/medusa/adapters.ts`) ya leía desde antes: `categorySlug`, `categoryLabel`, `collectionSlug`, `petType`, `shortDescription`, `price`, `compareAtPrice`, `rating`, `reviewCount`, `badge`, `theme`, `colorName`, `colorHex`, `stock`, `featured`, `tag`. Cada producto tiene un único variant "Única" (no variantes reales de Medusa por talla/color).

**Por qué:** El adaptador ya estaba escrito así antes de que existiera Medusa real (ver decisión "[2026-09-03] Capa de adaptación desacoplada"). En vez de rediseñar el adaptador y el esquema de datos al mismo tiempo que se instala Medusa por primera vez, se migró el catálogo respetando el contrato existente — esto garantiza paridad visual 1:1 con lo que ya mostraban los mocks (mismos precios, mismas imágenes, mismos badges) apenas se conecta, cero regresión.

**Impacto — deuda técnica reconocida, no resuelta:** Esto significa que hoy Medusa **no** modela tallas/colores como variantes reales compra-bles, y el sistema de precios/monedas nativo de Medusa (`variant.prices`) es casi decorativo — el precio que se muestra sale de `metadata.price`, no de la pricing engine de Medusa. Cuando se implemente checkout real contra el carrito de Medusa, esto va a necesitar rediseñarse (variantes reales por talla/color, precios en la pricing engine). Ver [[Pendientes Claude]] e [[Integración Medusa]].

---

### [2026-09-04] Imágenes de producto en Medusa como rutas relativas (`/images/patilandia/*.png`), no URLs absolutas

**Contexto:** Medusa necesita una URL para `thumbnail`/`images` de cada producto. Las imágenes reales viven en `patilandia/public/images/patilandia/`, servidas por el storefront Next.js, no por Medusa.

**Decisión:** Se guardó la misma ruta relativa que ya usaban los mocks (ej. `/images/patilandia/royal-bed.png`) como valor de `thumbnail`/`images[].url` en Medusa, en vez de una URL absoluta a algún storage.

**Por qué:** `next/image` resuelve rutas relativas contra el `public/` del propio storefront sin importar de dónde vino el dato (Medusa o mock) — es exactamente el mismo mecanismo que ya funcionaba. Usar una URL absoluta (ej. `http://localhost:3000/images/...`) habría requerido configurar `images.remotePatterns` en `next.config.ts` y se habría roto en producción (el dominio cambia). Esto es válido mientras las imágenes sean las mismas del storefront; el día que haya fotografía real de producto subida a un storage (S3/Medusa File module), ahí sí tocará usar URLs absolutas y configurar `remotePatterns`.

**Impacto:** `adaptMedusaProduct` se actualizó para leer `record.images` (array real de Medusa) y mapearlo a `galleryImages`, con fallback a `[thumbnail]` — antes solo usaba `thumbnail` repetido, así que esto también fue una mejora real del adaptador (la galería de producto ahora muestra múltiples imágenes reales en vez de una sola repetida).

---

### [2026-09-04] Estrategia híbrida para el admin: Medusa nativo + extensiones propias, sin fork ni admin completo

**Contexto:** El usuario pidió aplicar el diseño del storefront al admin de Medusa. Investigación (código instalado + discusión GitHub #14938 sin respuesta de mantenedores) confirmó que no hay forma soportada de re-temear el dashboard nativo globalmente.

**Opciones evaluadas:**
- Forkear `@medusajs/dashboard` como git submodule (community pattern documentado, pero implica resincronizar el fork en cada upgrade de Medusa).
- Construir un admin propio 100% desde cero, con paridad total con el admin de Medusa (productos, órdenes, promociones, impuestos, roles, etc.) — descartado por el propio usuario al ver el tamaño real del esfuerzo (equivalente a reconstruir un panel tipo Shopify admin).
- Estrategia híbrida: Medusa nativo para todo lo estándar + extensiones oficiales (`defineWidgetConfig`/`defineRouteConfig`) y módulos custom para lo diferencial de Patilandia (mascotas, proveedores, envío por peso, fidelización, suscripciones).

**Decisión:** La estrategia híbrida — explícitamente pedida por el usuario tras ver los costos reales de las otras dos.

**Por qué:** Cubre exactamente lo que Medusa no modela (mascotas de clientes, proveedores) sin pagar el costo de mantenimiento de un fork ni el costo de reconstruir funcionalidad que Medusa ya resuelve bien (productos, pedidos, pagos). Todo lo custom se construye en 3 capas (módulo → workflow → API route admin) para que un futuro "Patilandia Admin" separado solo necesite construir frontend contra rutas que ya existen — sin rehacer backend.

**Impacto:** Roadmap de 7 fases documentado en [[Patilandia sobre Medusa Admin — Diagnóstico y Roadmap]]. Nada construido todavía — es la base de decisión para las próximas sesiones de trabajo en `patilandia-backend`.

---

### [2026-09-03] Tipografía self-hosted vía `@fontsource` en vez de Google Fonts CDN

**Contexto:** Brief pide identidad "premium", "mágica" — Baloo 2 (display, redondeada) + Nunito (body).

**Decisión:** `@fontsource/baloo-2` y `@fontsource/nunito` como dependencias npm, importadas en `globals.css` con `@import`.

**Por qué:** Evita una petición externa a Google Fonts en cada carga (mejor performance/privacy, consistente con brief sección 18 de SEO/performance), y las fuentes quedan versionadas junto al código.

**Impacto:** Actualizar la tipografía significa cambiar la versión del paquete npm, no una URL externa.

Tags: #claude #decisiones #arquitectura
