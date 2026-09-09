---
title: Pendientes Claude
date: 2026-09-04
tags:
  - claude
  - pendientes
  - tareas
status: activo
---

# Pendientes Claude

> [!tip] Cómo usar esta nota
> Al iniciar una sesión, revisar **Bugs activos** y **Alta prioridad**. Al terminar, mover lo completado a **Completados** y agregar nuevos pendientes. Esta lista sale de comparar el código real contra [[Patilandia — Brief Original]] el 2026-09-04.

## Bugs activos

- [ ] **ESLint roto** — `npm run lint` falla inmediatamente: `.eslintrc.json` es formato legacy (ESLint <9) pero el paquete instalado es `eslint@9.39.5`, que requiere `eslint.config.js` (flat config). Hoy el proyecto tiene **cero linting real corriendo**. Fix: migrar `.eslintrc.json` → `eslint.config.js` usando `eslint-config-next` en formato flat (ya está en `devDependencies`).

## Alta prioridad (brechas directas del brief)

- [ ] **Home sin `<h1>` real en HTML** — al reemplazar el hero por `imagen-home.png` (que ya trae el titular dibujado adentro), se sacó el `<h1>` HTML que antes vivía en `HomeHero` (ver [[Decisiones y Razonamiento]], 2026-09-09). Queda solo como `alt` de la imagen — insuficiente para SEO real. Evaluar si conviene agregar un `<h1>` visualmente oculto (`sr-only`) con el mismo texto, o rediseñar el hero con texto HTML real sobre una versión "solo foto" de la imagen.

- [ ] **Catálogo — filtro de precio** — `CatalogView` filtra por tamaño, tipo de mascota, categoría, búsqueda y orden, pero **no** por rango de precio (brief sección 8 lo pide explícitamente).
- [ ] **Catálogo — filtro de disponibilidad** — no existe filtro por stock/disponibilidad (brief sección 8), aunque `StorefrontProduct.stock` ya existe como campo.
- [ ] **Catálogo — paginación / carga progresiva** — `CatalogView` renderiza todos los `visibleProducts` de una vez, sin paginar ni infinite scroll (brief sección 8).
- [ ] **SEO por producto** — `producto/[slug]/page.tsx` no exporta `generateMetadata`; toda página de producto hereda el `<title>`/OG genérico del layout raíz en vez de título, descripción e imagen específicos del producto (brief sección 18/19). Mismo problema en `categorias/[slug]/page.tsx`.
- [ ] **`sitemap.xml` / `robots.txt`** — no existen (`src/app/sitemap.ts` / `src/app/robots.ts` de Next.js). Brief sección 18 pide "URLs amigables" y buena base SEO.
- [ ] **Checkout sin estado real** — `CheckoutPage` es un formulario 100% estático (`<input>` sin `value`/`onChange`, sin validación, sin submit handler real). El botón "Continuar con pago seguro" no hace nada. Falta al menos: estado de formulario, validación básica, y el punto de integración hacia Medusa/Wompi (aunque sea un stub).

## Media prioridad
- [ ] **Animaciones/microinteracciones** — brief sección 13 sugiere Framer Motion "si aporta valor" para fades/slides de entrada de sección. Hoy solo hay transiciones CSS (`hover:-translate-y-1`, `transition duration-300`). No está instalado `framer-motion` ni `motion`.
- [ ] **`/cuenta` sin lógica** — es un placeholder visual (4 tarjetas estáticas), correcto para esta fase pero sin ningún hook hacia auth/clientes de Medusa todavía.
- [ ] **Sin tests** — no hay Jest/Vitest/Playwright configurado. El brief no lo exige explícitamente pero sección 17 pide "calidad de código" y "arquitectura limpia".

## Nuevo tras la pasada de diseño/mobile (2026-09-05)

- [ ] **Re-sincronizar el catálogo real de Medusa con el storefront** — `patilandia-backend/apps/backend/src/scripts/patilandia-seed.ts` todavía crea la categoría "Snacks" y no tiene los campos de imagen nuevos; el storefront (`data/mock-store.ts`) ya no tiene "Snacks" (eliminada, `snack-crunch-pollo` ahora es "Alimentos"). Mientras no se re-corra un seed actualizado, el Medusa real y los mocks del storefront están desalineados en categorías.
- [ ] **Wishlist consolidado a medias** — se quitó el ícono de corazón del header (desktop y mobile), pero el bottom nav mobile sigue con su propia pestaña de Wishlist independiente de Cuenta (decisión explícita: solo tocar el header, no el bottom nav). Si más adelante se quiere unificar wishlist dentro de Cuenta, falta tocar `MobileBottomNav` y `AccountPage`.
- [x] ~~`MenuIcon`/`CloseIcon` sin usar~~ — vuelven a estar en uso, ver 2026-09-09 abajo.

## Roadmap Patilandia Admin (2026-09-04 — solo diagnóstico, nada construido)

Ver [[Patilandia sobre Medusa Admin — Diagnóstico y Roadmap]] para el diagnóstico completo. Nada de esto está implementado — son 7 fases a ejecutar en sesiones futuras:

- [ ] **Fase 1** — Dashboard Patilandia (UI Route) + widget de metadata en producto.
- [ ] **Fase 2** — Módulo `pet` (mascotas de clientes) + widget en cliente.
- [ ] **Fase 3** — Módulo `supplier` (proveedores) + UI Route `/suppliers`.
- [ ] **Fase 4** — Spike de Fulfillment Provider por peso (verificar que `calculatePrice` se dispara en Medusa 2.20.1 antes de construir la lógica real).
- [ ] **Fase 5** — Módulo `purchase-order` (compras/abastecimiento).
- [ ] **Fase 6** — Módulo `loyalty` (fidelización).
- [ ] **Fase 7** — Módulo `subscription` (recompras).

## Nuevo tras conectar Medusa (2026-09-04)

- [ ] **Cambiar la contraseña de admin de Medusa** — quedó una temporal (`Patilandia2026!`) para poder avanzar sin depender de un flujo de invitación por navegador. Ver [[Entorno de Desarrollo Local]].
- [ ] **Categorías demo huérfanas en Medusa** (Shirts, Sweatshirts, Pants, Merch) — `deleteProductCategoriesWorkflow` da error en Medusa 2.20.1 (bug/limitación de esta versión, no nuestro), así que quedaron sin borrar. Solo desorden cosmético en `/app`, borrar a mano cuando se quiera.
- [ ] **Variantes reales por talla/color en Medusa** — hoy cada producto tiene un único variant "Única"; talla/color siguen siendo campos de `metadata`, no variantes Medusa reales con su propio inventario/precio. Es deuda técnica consciente (ver [[Decisiones y Razonamiento]]), necesaria antes de un checkout real contra el carrito de Medusa.
- [ ] **Región "Colombia" recién creada, sin terminar de configurar** — existe con moneda COP y país `co`, pero no tiene shipping options ni fulfillment set propio todavía (el único fulfillment/warehouse que existe sigue siendo el "European Warehouse" que trae Medusa por defecto). Falta antes de que un checkout real funcione para envíos a Colombia.
- [ ] **`patilandia-backend` sin commits** — el repo se inicializó (`git init`) pero no se ha hecho ningún commit ni configurado remote. Hacerlo cuando el usuario lo pida explícitamente.
- [ ] **Sincronización manual entre `data/mock-store.ts` y el catálogo real de Medusa** — no hay ningún mecanismo que mantenga sincronizados los 8 productos mock del storefront con los 8 productos reales ya creados en Medusa (`patilandia-seed.ts`). Si se edita uno, hay que editar el otro a mano.
- [ ] **Redis no configurado** — Medusa corre con "fake redis"/event bus local en memoria. Válido para desarrollo con una sola instancia; no sirve para producción con múltiples procesos.
- [ ] **Revisar `AGENTS.md` y `CLAUDE.md`** que `create-medusa-app` generó automáticamente dentro de `patilandia-backend` — son guías propias de Medusa para agentes de IA trabajando en ese repo, todavía no leídas a fondo.

## Correctamente diferido (no es pendiente, es decisión consciente — no tocar sin razón)

- Wompi / Mercado Pago — brief los marca como fase posterior explícitamente.
- Cálculo real de envío por peso/volumen/destino/transportadora — arquitectura preparada, ver [[Shipping — Arquitectura de Envíos]].
- Autenticación de clientes.
- Dominios de producción (`patilandia.com.co`, `administrador.patilandia.com.co`, `api.patilandia.com.co`) y servidor real (VPS/GCP con PM2+nginx, al estilo Argus) — hoy todo corre en local, el despliegue es un paso futuro explícitamente pospuesto.

## Media prioridad

- [ ] **Tarjetas oscuras con gradiente violeta/azul sin tocar** — al quitar los gradientes de los botones (ver [[Decisiones y Razonamiento]], 2026-09-09), quedaron sin tocar las tarjetas grandes de fondo oscuro con degradado (`page.tsx` x2, `cuenta/page.tsx`, `categorias/page.tsx`, `product-detail.tsx`) porque tienen texto blanco que depende de ese fondo oscuro para ser legible — aplanarlas a "morado clarito" sin más requeriría también decidir un nuevo color de texto. Si se quiere extender el look plano a esas tarjetas, es la próxima pieza.

## Completados

- [x] **2026-09-09 — Botón del hero: chico y a la izquierda en mobile, grande y centrado en desktop.** `HomeHero` separó el CTA en dos overlays independientes (`md:hidden` / `hidden md:flex`) en vez de un solo botón con clases responsivas mezcladas, evitando el bug de doble-botón-visible por conflicto de `display` en Tailwind. Verificado con Playwright en 390/1440px y `npm run build`. Ver [[Decisiones y Razonamiento]].
- [x] **2026-09-09 — Botón del hero de vuelta dentro de la imagen, centrado; botones sin gradiente.** El CTA "Explorar la tienda" volvió a ser overlay sobre la imagen del hero (mobile y desktop), ahora centrado horizontalmente para no pisar el texto horneado en la imagen (el intento anterior, alineado a la izquierda, sí lo pisaba). Por separado: `buttonStyles` (variant `primary`) pasó de gradiente violeta a relleno plano `var(--brand-violet)`; el variant `gold` (gradiente dorado, 2 usos) se eliminó y esos 2 botones pasaron a `primary`. Verificado con Playwright en home/tienda/cuenta/categorías y `npm run build`. Ver [[Decisiones y Razonamiento]].
- [x] **2026-09-09 — Hero mobile también a `aspect-ratio` completo, botón fuera de la imagen.** Mobile dejó el recorte `object-left` (que ocultaba ~65% de la imagen) y pasó a `aspect-[1786/881]` como desktop — imagen completa, sin recortar, en cualquier ancho. El botón "Explorar la tienda" ya no vive superpuesto sobre la imagen (a 192px de alto en mobile no había margen seguro) — ahora es un bloque separado debajo, mismo color de fondo, en flujo normal. Verificado con Playwright en 390/768/1024/1280/1920px y `npm run build`. Ver [[Decisiones y Razonamiento]].
- [x] **2026-09-09 — Hero con imagen distinta por breakpoint + `aspect-ratio` para desktop.** `HomeHero` ahora usa `imagen-home.png` solo en mobile (`md:hidden`, altura fija 450px, `object-left`) e `imagen-home-destok.png` (2098×749, subida por el usuario) desde `md:` en adelante, con `aspect-[2098/749]` en la `<section>` (no en el contenedor interno) para que la imagen se muestre siempre completa sin recortar texto en ningún ancho de escritorio. Verificado con Playwright en 390/768/1024/1280/1920px y `npm run build`. Ver [[Decisiones y Razonamiento]].
- [x] **2026-09-09 — Hero del home reemplazado por `imagen-home.png`, full-bleed.** `HomeHero` ya no vive dentro de una tarjeta `max-w-7xl` con bordes redondeados — la imagen llega hasta las orillas (`object-cover object-left`, sesgada a la izquierda para no cortar el texto incrustado en la imagen en mobile). Se sacó el `<h1>`/`<p>`/tarjeta decorativa HTML (duplicaban el texto que la imagen nueva ya trae dibujado) y el botón secundario "Ver camitas propias" — queda solo "Explorar la tienda". Verificado con Playwright en 390px/1440px y `npm run build`. Genera deuda de SEO nueva (`<h1>` faltante, ver arriba). Ver [[Decisiones y Razonamiento]].
- [x] **2026-09-09 — Buscador del header funcional, navega a `/tienda?buscar=...`.** Los dos inputs de búsqueda del header (barra desktop `md:` y panel mobile) ahora son `<form>` controlados: al enviar (Enter), navegan a `/tienda?buscar=<query>` vía `router.push`. `CatalogView` lee el param `buscar` con `useSearchParams` y lo usa como valor inicial/sincronizado de su filtro de búsqueda ya existente — mismo mecanismo que ya filtraba por tamaño/mascota/categoría, sin necesitar catálogo "final" (funciona igual con los 8 productos actuales). `tienda/page.tsx` y `categorias/[slug]/page.tsx` envuelven `CatalogView` en `<Suspense>` (requisito de Next.js para `useSearchParams` en build estático). Verificado con `npm run build` (mock fallback) sin warnings, y con Playwright en mobile/desktop: buscar "snack" y "camita galaxy" filtran correctamente. Ver [[Decisiones y Razonamiento]].
- [x] **2026-09-09 — Cuenta/Carrito fuera del header mobile, lupa directa.** Por debajo de `md`, `SiteHeader` reemplaza los íconos de Cuenta/Carrito (redundantes con el bottom nav) por un botón de lupa que abre un panel de búsqueda visual (sin `onChange`). El menú hamburguesa quedó solo con navegación. Desde `md:` sigue igual (íconos + barra de búsqueda de escritorio). Verificado con Playwright en 390px y 1024px, sin errores de consola. Ver [[Decisiones y Razonamiento]].
- [x] **2026-09-09 — Menú hamburguesa mobile restaurado.** `SiteHeader` recupera el botón hamburguesa (`lg:hidden`) con drawer de navegación. Wishlist se queda fuera del header, como en el rediseño del 2026-09-05. Ver [[Decisiones y Razonamiento]].
- [x] **2026-09-05 — Logo real + favicon completo.** Arreglado el bug de aspect-ratio del logo (declaraba 220×80, el archivo real era 1254×1254 cuadrado — causaba que el header saltara de tamaño al cargar); reemplazado por `logo-rectangular.png` (lockup horizontal). Agregado `src/app/apple-icon.png` (180×180) — sin él, iOS/Android no mostraban ícono. `icon.png` regenerado más grande y con menos padding.
- [x] **2026-09-05 — Categorías con imágenes reales, "Snacks" eliminada.** 7 categorías con foto propia cada una (antes ícono SVG plano). `snack-crunch-pollo` reasignado a "Alimentos". Grids de 8→7 columnas donde correspondía.
- [x] **2026-09-05 — Mobile-first en cards de producto y colección.** Todos los grids de `ProductCard`/`CollectionCard` pasan a 2 columnas desde el primer breakpoint (antes 1 columna hasta 640px). `ProductCard` responsive real: paddings, tamaños de texto, badge, botón wishlist y botón "Agregar"/"Agregar al carrito" (se acorta en mobile) todos con `sm:` breakpoint.
- [x] **2026-09-05 — Header simplificado.** Sin menú hamburguesa (bottom nav mobile ya cubre navegación), logo centrado en mobile vía grid `[1fr_auto_1fr]`, sin ícono de wishlist en el header (queda solo en bottom nav mobile).
- [x] **2026-09-04 — Instalar y conectar Medusa.** Backend Medusa 2.20.1 corriendo en local (`patilandia-backend`, repo hermano), Postgres en Docker (puerto 5433, evitando conflicto con una instancia nativa de Postgres ya presente en la máquina), usuario admin creado, publishable key generada y linkeada al Default Sales Channel. Ver [[Entorno de Desarrollo Local]].
- [x] **2026-09-04 — Migrar los 8 productos Patilandia a Medusa.** Catálogo demo genérico de Medusa (camisetas) borrado (soft-delete); los 8 productos reales creados vía workflows oficiales con `metadata` fiel al esquema que `adaptMedusaProduct` ya esperaba — cero regresión visual. Ver [[Decisiones y Razonamiento]].
- [x] **2026-09-04 — `HomePage` y `WishlistPage` ya no rompen la capa de adaptación.** `HomePage` es ahora `async` y usa `getHomepageProducts()`/`getHomepageCollections()` de `lib/storefront.ts`; `WishlistRoute` hace `await getStorefrontProducts()` y pasa los productos como prop a `WishlistPage`. Las 9 rutas pasan consistentemente por `lib/storefront.ts`.
- [x] **2026-09-04 — Adaptador Medusa mejorado: galería de imágenes real.** `adaptMedusaProduct` ahora lee `record.images` (array real de Medusa) para `galleryImages`, con fallback a `[thumbnail]` — antes solo repetía el thumbnail.
- [x] **2026-09-04 — `.env.local` del storefront apuntado a Medusa real**, con `NEXT_PUBLIC_MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` reales. Verificado con `npm run typecheck` limpio y las 9 rutas respondiendo 200 con datos reales de Medusa (precio, imágenes, título todos correctos).

*(Antes de esta sesión, el código ya traía resuelto: homepage, catálogo con filtros parciales, product detail con galería/variantes, carrito y wishlist persistentes, identidad visual completa, capa de adaptación Medusa — ver [[Contexto Patilandia]].)*

Tags: #claude #pendientes #tareas
