---
title: Claude — Segundo Cerebro
date: 2026-09-04
tags:
  - claude
  - contexto
  - indice
aliases:
  - Segundo Cerebro
  - Claude Hub
---

# Claude — Segundo Cerebro

> [!abstract] Qué es esto
> Hub raíz de mi memoria operativa. Punto de entrada en cada conversación sobre el proyecto Patilandia.

## Protocolo de sesión

Al iniciar una conversación, leer en orden:
1. [[Pendientes Claude]] — ¿qué quedó pendiente frente al brief?
2. [[Contexto Patilandia]] — ¿cuál es el estado actual del sistema, qué es real y qué es mock?
3. [[Decisiones y Razonamiento]] — ¿qué ya fue decidido y por qué?

## Notas de Claude

| Nota | Propósito |
|------|-----------|
| [[Contexto Patilandia]] | Estado del sistema, stack, estructura de la bóveda |
| [[Decisiones y Razonamiento]] | Log de decisiones técnicas con razonamiento |
| [[Pendientes Claude]] | Brechas frente al brief original, tareas activas |

## Mapa rápido de la bóveda

### Entrada principal
→ [[PATILANDIA_INDEX]]

### Visión y marca
→ [[Patilandia — Brief Original]] · [[Identidad de Marca]]

### Arquitectura
→ [[Arquitectura Técnica]] · [[Integración Medusa]] · [[Entorno de Desarrollo Local]] · [[Patilandia sobre Medusa Admin — Diagnóstico y Roadmap]] · [[Shipping — Arquitectura de Envíos]]

### Design System
→ [[Design System]]

### Catálogo
→ [[Modelo de Datos y Mocks]]

### Páginas
→ [[Mapa de Rutas y Componentes]]

---

## Estado rápido al 2026-09-12 (tarde) — Patipuntos, cuarto plugin propio: ganar y canjear

Se construyó **Patipuntos**, el sistema de fidelización completo (ganar → acumular → canjear → volver a comprar), a partir de un brief muy detallado del usuario. Se usó Plan Mode explícitamente: 3 agentes de exploración + 1 de validación de arquitectura antes de escribir código, todo verificado contra el código real de `@vendure/core` instalado.

**Decisión clave del usuario:** dado que la identidad por correo (igual a Mascotas/Wishlist) no verifica nada — se le planteó que sin canje eso es cosmético pero con canje es plata regalable sin fricción —, decidió construir el ciclo completo YA, pero condicionando el canje a señales reales: correo verificado (magic link propio, sin contraseña) + al menos una compra completada, en vez de una regla arbitraria de antigüedad de cuenta.

La verificación contra el servidor y el navegador reales encontró y corrigió 6 bugs, el más importante de todos **no era de Patipuntos**: `updateCustomerName` en el checkout tenía un closure obsoleto que borraba el correo del cliente a `""` en el primer pedido de cualquier cliente nuevo — un bug real desde la Fase 5, nunca detectado hasta ahora, visible en la pantalla de confirmación ("Te escribimos a  con los detalles"). Ya corregido.

Quedan 6 funcionalidades del roadmap sin empezar: configurador de camitas, regalos, suscripciones, WhatsApp, analítica propia, proveedores. Detalle técnico completo en [[Decisiones y Razonamiento]] y estado en [[Pendientes Claude]].

## Estado rápido al 2026-09-12 — Wishlist real, tercer plugin propio

Se retomó el roadmap de funcionalidades propias (8 pendientes tras Reseñas/Mascotas/Recomendaciones) y se construyó **Wishlist real** sobre Vendure, con una variante de diseño nueva frente a Mascotas: en vez de pedir correo antes de usarla (el gate de Mascotas), se le preguntó al usuario y eligió explícitamente **"local + sync perezoso"** — el corazón del catálogo sigue siendo 100% instantáneo y local mientras no hay un correo conocido; apenas aparece uno (por checkout o por el email gate de Mascotas), se sincroniza a Vendure en segundo plano sin bloquear nada ni perder lo que ya hubiera guardado.

Plugin nuevo `patilandia-vendure/src/plugins/patilandia-wishlist` (mismo molde que Mascotas/Reseñas). La verificación contra el servidor real y el browser real (Playwright contra Chrome del sistema) encontró y corrigió tres bugs reales que ni `tsc` ni el build hubieran detectado: dos de relaciones TypeORM no cargadas en el backend, y uno de React (un efecto secundario de red viviendo dentro de un callback de `setState`, duplicado por StrictMode en dev). Quedan 7 funcionalidades del roadmap sin empezar (Patipuntos, configurador de camitas, regalos, suscripciones, WhatsApp, analítica propia, proveedores). Detalle técnico completo en [[Decisiones y Razonamiento]] y estado en [[Pendientes Claude]].

## Estado rápido al 2026-09-11 (fin de sesión) — migración completa + SEO real + pulido post-migración

Las 7 fases del plan de migración Medusa → Vendure están hechas. Patilandia corre 100% sobre Vendure — catálogo, carrito, checkout, Dashboard de administración ("Patilandia Admin"). **Medusa ya no existe en el proyecto**: `patilandia-backend` se borró del disco por completo (a pedido explícito del usuario, con advertencia previa de que era irreversible por no tener commits ni remote), su contenedor Postgres se eliminó, y todo el código/env vars/copy que lo mencionaba en `patilandia` se limpió.

En la misma sesión, después de cerrada la migración, se resolvieron varios pendientes reales más:
- Idioma del Dashboard corregido a español (era una config aparte del idioma de contenido del canal).
- ESLint migrado a flat config — corría en cero desde hacía tiempo, ahora corre limpio en cero errores/warnings.
- Impuesto corregido al 19% real de Colombia (no era la zona "Americas" como se creía, era "Europe" — se verificó contra la DB antes de asumir).
- SEO real: `generateMetadata` dinámico en producto/categoría, `sitemap.xml`/`robots.txt`, `<h1>` real (sr-only) en el home, meta description reescrita con copy orientado a búsqueda en vez de mencionar el stack técnico.
- Catálogo: filtro de precio, filtro de disponibilidad (reveló y corrigió que `stock` estaba hardcodeado desde la Fase 3), paginación.

Ver [[Decisiones y Razonamiento]] para el detalle técnico completo de cada pieza y [[Pendientes Claude]] para lo que queda suelto (nada urgente: `synchronize`/migración real de Vendure antes de producción, facet color huérfano cosmético, Wompi/Mercado Pago diferidos, límites de branding del Dashboard nativo, roadmap de funcionalidades propias de Patilandia sin empezar).

## Estado rápido al 2026-09-10 — arranca la migración Medusa → Vendure

El usuario pidió reemplazar Medusa por Vendure (GraphQL, PostgreSQL, Dashboard React extensible), manteniendo el storefront Next.js propio intacto. Se hizo la auditoría completa, se aprobó un plan de 7 fases no destructivo, y se ejecutaron las **Fases 1 y 2**: Vendure 3.7.3 corriendo en el repo hermano nuevo `patilandia-vendure` (Postgres aislado, puerto 6543), con el catálogo real de los 8 productos migrado a un modelo de datos correcto (Collections + Facets + ProductVariants reales, no un port literal del `metadata` de Medusa). Detalle técnico completo, bugs encontrados (incluido uno real de Vendure en Windows) y el estado fase-por-fase en [[Decisiones y Razonamiento]] y [[Pendientes Claude]].

**Medusa sigue intacto y es la fuente de datos real del storefront** — no se toca hasta que el storefront ya lea de Vendure (Fase 3+) y todo esté verificado. Ver [[Entorno de Desarrollo Local]] para cómo levantar ambos backends en paralelo.

**Update 2026-09-11 — Fase 3 hecha:** el storefront (`patilandia`) ya lee el catálogo real de Vendure (`src/lib/storefront.ts` → `src/lib/vendure/*`), no de Medusa. Cero cambios en componentes/rutas. Verificado con build + las 9 rutas reales. Medusa sigue corriendo intacto, sin usarse. Detalle en [[Decisiones y Razonamiento]] y [[Pendientes Claude]].

**Update 2026-09-11 — Fase 5 hecha, mismo día:** carrito y checkout dejaron de ser mock — `/carrito` y `/checkout` operan contra el `activeOrder` real de Vendure (sesión por bearer token en `localStorage`). Se implementó el pedido explícito del usuario: el correo se pide apenas hay algo en el carrito, antes de mostrar los ítems (confirmado que Vendure no impone ningún orden acá). Verificado con una simulación real de todo el flujo que terminó en una orden `PaymentAuthorized` persistida en Vendure. Pagos reales (Wompi/Mercado Pago) siguen diferidos a propósito. Detalle técnico completo en [[Decisiones y Razonamiento]].

**Update 2026-09-11 — Fase 6 hecha, mismo día:** nace "Patilandia Admin" — plugin propio (`patilandia-vendure/src/plugins/patilandia-admin`) sobre el Dashboard de Vendure: logo y bienvenida propios en el login, paleta de marca violeta/dorado en toda la interfaz, sección "Patilandia" nueva en el menú con una página placeholder "Mascotas" que prueba el patrón plugin→Dashboard de punta a punta. Se investigó a fondo (código fuente de `@vendure/dashboard`, no solo doc) qué tan lejos llega la personalización hoy — el techo real es el logo de login + colores, nada más, coherente con la estrategia híbrida de admin ya decidida. Solo queda la Fase 7 (baja de Medusa) del plan original. Detalle en [[Decisiones y Razonamiento]] y [[Pendientes Claude]].

## Estado rápido al 2026-09-05 — pasada de diseño y mobile en el storefront

Sesión de ajustes visuales rápidos sobre `patilandia` (no `patilandia-backend`), a pedido directo del usuario mientras navegaba el sitio en el browser:

- **Logo real arreglado**: bug de aspect-ratio corregido (el PNG cuadrado 1254×1254 tenía declarado un ratio falso 220:80, causando que el header saltara de tamaño al cargar) y reemplazado por `logo-rectangular.png` (lockup horizontal nuevo que subió el usuario). Tamaño final `h-16` con `py-2` de aire.
- **Favicon real**: `src/app/icon.png` (512×512, recorte ajustado) + `src/app/apple-icon.png` nuevo (180×180) — sin el segundo, iOS/Android no mostraban ícono en mobile/pantalla de inicio.
- **Categorías con imágenes reales**: 7 categorías (se eliminó "Snacks") con foto ilustrada propia cada una; el producto `snack-crunch-pollo` se reasignó a "Alimentos". Grids ajustados de 8 a 7 columnas.
- **Mobile-first en cards de producto**: todos los grids de `ProductCard`/`CollectionCard` pasan a 2 columnas desde el primer breakpoint (antes 1 columna hasta 640px). `ProductCard` se hizo responsive de verdad (paddings, tamaños de texto, botón "Agregar" que se acorta en mobile).
- **Header simplificado**: sin menú hamburguesa (el bottom nav mobile ya cubre la navegación), logo centrado en mobile vía grid de 3 columnas simétricas, sin ícono de corazón/wishlist en el header (se queda solo en el bottom nav mobile — decisión explícita del usuario, no tocar el bottom nav).

**Deuda técnica nueva a vigilar:** el catálogo real en Medusa (`patilandia-seed.ts`) todavía tiene el esquema VIEJO de categorías (con "Snacks", sin las imágenes nuevas) — no se volvió a correr el seed tras estos cambios. Ver [[Pendientes Claude]].

## Estado rápido al 2026-09-04 (noche) — diagnóstico de Medusa Admin

El usuario pidió llevar el diseño del storefront al admin de Medusa. Investigación (código instalado + discusiones oficiales sin resolver del repo de Medusa) confirmó que **no hay forma soportada de re-temear el dashboard nativo globalmente**, y que forkearlo o construir un admin propio completo tienen costos altos que el usuario no quiere asumir todavía. Se acordó una **estrategia híbrida**: admin nativo de Medusa para todo lo estándar, extensiones propias (widgets/routes/módulos custom) para lo diferencial de Patilandia (mascotas, proveedores, envío por peso, fidelización, suscripciones), diseñadas desde el día uno para que un futuro "Patilandia Admin" separado no requiera rehacer el backend. Diagnóstico completo y roadmap de 7 fases en [[Patilandia sobre Medusa Admin — Diagnóstico y Roadmap]]. **Nada de esto está construido todavía** — es solo el plan, a ejecutar fase por fase en sesiones futuras.

## Estado rápido al 2026-09-04 (tarde) — Medusa instalado y conectado

Mismo día, sesión posterior a la indexación inicial: se instaló Medusa 2.20.1 en un repo hermano (`patilandia-backend`), corriendo en local con Postgres en Docker (puerto 5433, no 5432 — ver [[Entorno de Desarrollo Local]] para el porqué). Se migraron los 8 productos reales de Patilandia a Medusa (reemplazando el catálogo demo genérico) y se conectó el storefront vía `.env.local`. De paso se corrigieron los dos bugs de arquitectura más importantes que había marcado la indexación inicial: `HomePage` y `WishlistPage` ya no importan mocks directamente, ambos pasan por `lib/storefront.ts`. Verificado con `npm run typecheck` limpio y las 9 rutas respondiendo con datos reales.

**Lo que sigue sin existir:** conexión del carrito/checkout al carrito real de Medusa (sigue siendo 100% local vía `localStorage`), variantes reales de talla/color en Medusa (sigue siendo un único variant "Única" por producto, con la info real en `metadata`), y el `.eslintrc.json` roto sigue sin arreglar. Detalle completo en [[Pendientes Claude]].

## Estado rápido al 2026-09-04 (primera indexación)

Este es el primer levantamiento completo del proyecto. Resumen de lo encontrado:

**El proyecto ya está mucho más avanzado de lo que el brief original hace pensar.** No es un punto de partida vacío: existe una storefront Next.js 15 + React 19 + Tailwind v4 completamente navegable, con 8 rutas funcionales, identidad visual Patilandia ya aplicada de forma consistente (paleta morado/dorado, tipografía Baloo 2 + Nunito, logo real con perro+gato+castillo), 8 productos mock con imágenes generadas en estética "castillo fantástico", carrito y wishlist persistidos en `localStorage`, y una capa de adaptación a Medusa ya escrita (aunque Medusa no está corriendo — `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` vacío en `.env.example`).

**Verificación de salud del build (2026-09-04):**
- `npm run typecheck` → ✅ limpio, sin errores.
- `npm run lint` → ❌ roto: el proyecto tiene `.eslintrc.json` (formato legacy) pero `eslint` instalado es v9.39.5, que requiere `eslint.config.js` (flat config). ESLint ni siquiera arranca. Ver [[Pendientes Claude]].

Detalle completo del estado en [[Contexto Patilandia]]. Brechas priorizadas frente al brief en [[Pendientes Claude]].

Tags: #claude #indice #segundo-cerebro
