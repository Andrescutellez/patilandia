---
title: Patilandia sobre Medusa Admin — Diagnóstico y Roadmap
date: 2026-09-04
tags:
  - arquitectura
  - medusa
  - admin
  - roadmap
status: activo
---

# Patilandia sobre Medusa Admin — Diagnóstico y Roadmap

> [!info] Por qué existe esta nota
> El pedido original era "llevar el diseño del storefront al admin de Medusa". La investigación (código instalado + discusiones oficiales del repo de Medusa) mostró que eso no es viable sin forkear `@medusajs/dashboard`. Esta nota documenta el diagnóstico completo y la estrategia híbrida que se decidió en su lugar: Medusa Admin nativo para todo lo estándar, extensiones propias para lo diferencial de Patilandia. Ver también [[Integración Medusa]] y [[Entorno de Desarrollo Local]].

## Por qué no un reskin global ni un fork

- `@medusajs/admin-sdk` 2.20.1 solo expone `defineWidgetConfig`, `defineRouteConfig`, `defineLayoutConfig` — ninguna API de tema/marca global. Confirmado leyendo `node_modules/@medusajs/admin-sdk/dist/index.d.ts` directamente, no por memoria.
- La comunidad ya pidió esto exacto (GitHub discussion #14938, "Supported way to theme/style native Medusa Admin UI globally?") — **cero respuesta de mantenedores**, sin solución oficial.
- Caminos reales que sí existen (fork como git submodule, admin propio desde cero) implican mantenimiento pesado (resincronizar en cada upgrade de Medusa) o construir el equivalente a un panel de e-commerce completo desde cero. Se descartaron por ahora — decisión explícita del usuario.

## Estrategia adoptada: híbrida y progresiva

```
Patilandia Storefront
         ↓
      Medusa (motor de comercio: productos, variantes, inventario,
              pedidos, clientes, precios, promociones, pagos, fulfillment)
         ↑
Patilandia Admin (hoy: extensiones sobre el admin nativo — mañana,
                   posiblemente, un frontend propio sin rehacer backend)
```

Medusa Admin nativo se queda para todo lo estándar. Las funcionalidades diferenciales de Patilandia se construyen usando los puntos de extensión oficiales — nunca forkeando ni modificando `@medusajs/dashboard`.

## Diagnóstico — dónde va cada feature

| Feature pedida | Vehículo correcto | Por qué |
|---|---|---|
| Dashboard/Analytics Patilandia | **UI Route** (`defineRouteConfig`) | Solo presentación sobre datos que Medusa ya tiene (productos, órdenes). No requiere módulo nuevo. |
| Ver/editar bonito los campos de `metadata` en producto (categoryLabel, theme, badge, colorHex, rating...) | **Widget** en zona `product.details.side.after` (o `.before`) | Reemplaza el editor JSON genérico de metadata por un formulario con la marca Patilandia. Zona confirmada real en `INJECTION_ZONES` de `@medusajs/admin-shared`, no una suposición. |
| Mascotas de los clientes | **Módulo custom `pet`** + link a `customer` + widget en `customer.details.side.after` | Medusa no modela mascotas. Es el feature más "Patilandia" de la lista — buen primer módulo custom: dominio aislado, bajo riesgo, no toca checkout/pagos. |
| Proveedores | **Módulo custom `supplier`** + UI Route propia `/suppliers` | Medusa no tiene concepto de proveedor/vendor para compras. No hay zona de widget natural (es una entidad nueva) — necesita su propia página en el sidebar. |
| Compras y abastecimiento | **Módulo custom `purchase-order`**, depende de `supplier` | Más complejo (estados, items, recepción de inventario) — fase posterior, a construir una vez validado el patrón con `pet`/`supplier`. |
| Logística por peso / productos pesados (`shippingClass`, `weightKg`) | **Fulfillment Provider custom** (`AbstractFulfillmentProviderService.calculatePrice`/`canCalculate`), **no** un módulo nuevo | Es exactamente el punto de extensión que Medusa ya ofrece para pricing dinámico de envío. Resuelve directamente el placeholder "cotización pendiente" de `getShippingPreview()` — ver [[Shipping — Arquitectura de Envíos]]. **Riesgo real reportado por la comunidad** (GitHub discussion #9495: "Does the Fulfillment Provider in v2 actually do anything?"): `calculatePrice`/`canCalculate` a veces no se disparan en v2. Necesita spike de verificación antes de construir la lógica real encima (ver Fase 4). |
| Fidelización | **Módulo custom `loyalty`** + subscriber sobre evento de orden | Necesita persistencia (puntos, transacciones) + reacción a eventos (`src/subscribers/`, patrón confirmado con ejemplo real de Medusa `product.created`). Fase posterior. |
| Suscripciones/recompras | **Módulo custom `subscription`** + scheduled job (`src/jobs/`, patrón cron confirmado) | Necesita persistencia + ejecución periódica. Fase posterior, mayor riesgo porque toca creación de órdenes. |
| Recomendaciones | **Fuera de alcance del admin** — es trabajo de storefront | Ya existe una versión básica (`getRelatedProducts` por categoría/colección en `data/mock-store.ts`). No es una feature de "admin", queda fuera de este roadmap. |

## Principio de desacoplamiento (para que un futuro Patilandia Admin no requiera rehacer el backend)

Toda funcionalidad custom se construye en 3 capas — nunca lógica de negocio directa dentro del componente React del widget/route del admin:

1. **Módulo** (modelo DML vía `model.define()` de `@medusajs/framework/utils` + service) — capa de datos. Ej. `src/modules/pet/`.
2. **Workflows** — orquestan pasos de negocio reutilizables (crear mascota, otorgar puntos, etc.). Mismo patrón que ya usa `patilandia-seed.ts` con los workflows core de Medusa.
3. **API routes admin** (`src/api/admin/pets/route.ts`, patrón file-based ya usado por Medusa) — exponen los workflows por HTTP.

Los widgets/UI routes del admin nativo son **solo una capa de presentación delgada** que le pega a esas API routes — mismo patrón que ya usa `lib/storefront.ts` del storefront contra la Store API (ver [[Integración Medusa]]), y el mismo patrón que ya usa `argus-web-operador` contra `Argus Backend`. El día que exista un Patilandia Admin propio, ese frontend nuevo apuntaría a las mismas rutas `/admin/*` ya construidas — cero cambios de backend necesarios.

## Roadmap por fases

> [!warning] Nada de esto está construido todavía
> Esta nota documenta el diagnóstico y el plan — la implementación queda para sesiones futuras, fase por fase. Ver [[Pendientes Claude]] para el estado activo.

- **Fase 1** — Dashboard Patilandia (UI Route) + widget de metadata en producto. Sin módulos nuevos, bajo riesgo, valida el pipeline de extensión completo (build, registro, zona de inyección) antes de comprometerse a nada más grande.
- **Fase 2** — Módulo `pet` (mascotas de clientes) + link a `customer` + widget en cliente. Primer módulo custom real — establece el patrón (modelo → service → link → workflow → API route → widget) que las fases siguientes van a repetir.
- **Fase 3** — Módulo `supplier` (proveedores) + UI Route `/suppliers`.
- **Fase 4** — Spike de Fulfillment Provider por peso: crear un shipping option `calculated` de prueba y verificar en logs que `calculatePrice`/`canCalculate` sí se invocan (por el riesgo documentado arriba) **antes** de construir la lógica real de `weightKg`/`shippingClass`. Si falla en esta versión de Medusa (2.20.1), documentar el hallazgo aquí y evaluar plan B (ej. workflow custom en el flujo de checkout en vez de `FulfillmentProviderService`).
- **Fase 5** — Módulo `purchase-order` (compras/abastecimiento) — depende de que Fase 3 (`supplier`) ya exista.
- **Fase 6** — Módulo `loyalty` (fidelización) + subscriber sobre orden completada (`order.placed`/`order.completed` — nombre exacto del evento a confirmar en runtime, no está tipado como enum en el framework).
- **Fase 7** — Módulo `subscription` (recompras) + scheduled job diario que revisa próximas recompras.

## Referencias técnicas confirmadas contra el código instalado (v2.20.1)

Para no tener que re-investigar en la próxima sesión — todo esto viene de leer `node_modules/@medusajs/*` directamente, no de memoria:

- `model.define()` — importar de `@medusajs/framework/utils`. Ejemplo real completo en `node_modules/@medusajs/customer/dist/models/customer.js`.
- `Module()` (registrar un módulo) — importar de `@medusajs/framework/utils` (no de `modules-sdk`, que es otro paquete distinto para plumbing interno).
- `defineLink()` — importar de `@medusajs/framework/utils`. Patrón real en `apps/backend/src/links/README.md`: `defineLink(ProductModule.linkable.product, BlogModule.linkable.post)`. Los módulos core de Medusa se importan como `@medusajs/medusa/<module>` (ej. `@medusajs/medusa/product`), no `@medusajs/<module>` directo.
- Zonas de widget válidas — lista completa y exacta en `node_modules/@medusajs/admin-shared/dist/index.d.ts`, constante `INJECTION_ZONES`. Incluye `product.details.side.after`, `customer.details.side.after`, `login.before`/`login.after`, `topbar`, entre ~150 zonas más.
- Rutas anidadas (`RouteConfig.nested`) solo pueden ir bajo una de seis secciones core: `/orders`, `/products`, `/inventory`, `/customers`, `/promotions`, `/price-lists`. Una ruta nueva como `/suppliers` o `/patilandia` sería top-level, no anidada.
- Scheduled jobs — archivo en `src/jobs/`, exporta `default` (handler `(container) => Promise<unknown>`) + `config: { name, schedule }` (cron string). Ejemplo real en `apps/backend/src/jobs/README.md`.
- Subscribers — archivo en `src/subscribers/`, exporta `default` (handler) + `config: { event: string | string[] }`. Ejemplo real en `apps/backend/src/subscribers/README.md` (`product.created`).
- Fulfillment provider custom — extender `AbstractFulfillmentProviderService` de `@medusajs/framework/utils`, registrar en `medusa-config.ts` bajo `modules: [{ resolve: Modules.FULFILLMENT, options: { providers: [{ resolve: "...", id: "..." }] } }]`. Referencia real de un provider funcionando: `node_modules/@medusajs/fulfillment-manual` (el mismo `manual_manual` que ya usa el seed de Patilandia — ver [[Entorno de Desarrollo Local]]).

Tags: #arquitectura #medusa #admin #roadmap
