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
