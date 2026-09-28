---
title: Shipping — Arquitectura de Envíos
date: 2026-09-04
tags:
  - arquitectura
  - shipping
  - envios
status: activo
---

# Shipping — Arquitectura de Envíos

> [!success] Actualizado 2026-09-27/28 — la regla de abajo ya se cumple
> Esta nota describe el estado histórico (previo a Mi Paquete). El sistema real de envíos hoy cotiza contra la API v2 de Mi Paquete (peso/dimensiones reales, destino real, sin tarifa fija) — ver [[Integración mipaquete.com — API v2]] para la referencia de la API y [[Decisiones y Razonamiento]] (entrada 2026-09-27/28) para la arquitectura implementada y los bugs encontrados. El contenido de abajo queda como registro histórico de por qué se necesitaba, no como el diseño vigente.

> [!warning] Regla del brief que no debe romperse
> "El sistema de shipping NO debe asumir un costo fijo." Patilandia venderá productos livianos (accesorios) junto a productos pesados (arena, alimento, sacos grandes). Cualquier cambio a esta lógica debe preservar esa flexibilidad — ver [[Patilandia — Brief Original]] sección 10.

## Campos de datos que ya soportan esto

En `StorefrontProduct` (`src/types/commerce.ts`):

```ts
export type ShippingClass = "standard" | "bulky" | "heavy" | "custom";
// ...
shippingClass: ShippingClass;
weightKg: number;
```

Cada uno de los 8 productos mock ya tiene ambos campos poblados con valores realistas — desde `standard` / `2.2kg` (una camita chica) hasta `heavy` / `8.5kg` (el snack, deliberadamente pesado para forzar el camino de cotización especial). Ver [[Modelo de Datos y Mocks]].

## `src/lib/shipping.ts` — lo que existe hoy

```ts
export interface ShippingPreview {
  label: string;
  detail: string;
  status: "quote" | "standard";
}

export function getShippingPreview(items: CartLineItem[]): ShippingPreview
```

Lógica:
1. Carrito vacío → `{ label: "Se calcula en checkout", status: "quote" }`.
2. Si algún ítem es `bulky`/`heavy`/`custom`, **o** el peso total del carrito ≥ 8kg → `{ label: "Cotización inteligente pendiente", status: "quote" }`.
3. Si no → `{ label: "Envío estimado en checkout", status: "standard" }`.

**Importante: no calcula ni muestra ningún número de pesos/costo.** Solo comunica al usuario, con texto honesto, que el envío se resolverá en checkout — evita mostrar un precio inventado que luego contradiga el cálculo real.

Consumido en dos lugares: `CartPage` (resumen del carrito) y `CheckoutPage` (resumen del pedido), ambos vía `getShippingPreview(cart)`.

## Lo que falta para envío real (explícitamente fuera de alcance hoy, brief sección 10)

El brief pide que la arquitectura permita calcular después el envío según:
- Peso ✅ (`weightKg` ya existe por producto)
- Volumen ❌ (no hay campo de dimensiones/volumen en `StorefrontProduct` todavía)
- Destino ❌ (checkout no captura ciudad/departamento de forma funcional — el formulario es estático, ver [[Pendientes Claude]])
- Tipo de producto / clase de envío ✅ (`shippingClass` ya existe)
- Transportadora ❌ (no hay concepto de transportadora en el modelo todavía)
- Entrega local ❌ (mencionado como texto en el checkout, sin lógica)
- Productos pesados ✅ (cubierto por `weightKg` + umbral de 8kg)

Cuando se conecte fulfillment real (probablemente vía Medusa Fulfillment + un proveedor de cotización colombiano), el punto de reemplazo es el cuerpo de `getShippingPreview` — su firma (`items: CartLineItem[]` → `ShippingPreview`) puede mantenerse o evolucionar a async si la cotización requiere una llamada de red, pero los call sites (`CartPage`, `CheckoutPage`) deberían necesitar cambios mínimos.

> [!note] Actualización 2026-09-27 — nota histórica: este párrafo menciona "Medusa Fulfillment", ya superado por la migración a Vendure. El candidato concreto para "Transportadora" es **mipaquete.com** (agregador logístico colombiano) — ver [[Integración mipaquete.com — API v2]], con toda la referencia de endpoints, quirks y flujo de integración ya documentada, lista para cuando se decida construir el plugin real. Ese documento reemplaza este párrafo como fuente de verdad para el "cómo", no solo el "qué falta".

Tags: #arquitectura #shipping #envios
