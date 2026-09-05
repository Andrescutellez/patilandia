---
title: Patilandia — Brief Original
date: 2026-09-04
tags:
  - vision
  - brief
  - fuente-de-verdad
status: activo
---

# Patilandia — Brief Original

> [!important] Fuente de verdad
> Este es el prompt/brief completo entregado por el usuario el 2026-09-04, pegado sin editar. Ante cualquier duda de diseño o arquitectura no cubierta explícitamente en otra nota, **este documento manda**. Jerarquía de decisión declarada por el usuario: **Referencia visual > Consistencia de marca > UX > Convención técnica.**
>
> Las "imágenes de referencia" que menciona el brief no están adjuntas a esta nota (llegaron como adjuntos de chat), pero su lenguaje visual ya quedó plasmado en los assets reales del proyecto — ver [[Identidad de Marca]] y [[Design System]].

---

## 1. Contexto del proyecto

Patilandia es un e-commerce especializado en productos para mascotas.

**Marca:** PATILANDIA
**Slogan:** "Un mundo hecho para ellos."

La identidad visual debe sentirse: Premium, Tierna, Mágica, Moderna, Divertida, Familiar, Pet-centric, con estética de mundo fantástico/castillo, sin parecer infantil de forma excesiva, con una identidad propia y consistente.

Producto diferencial inicial: camas y productos textiles para mascotas fabricados por nosotros/proveedores cercanos.

Roadmap: Camas, Cojines, Mantas, Juguetes, Alimentación, Snacks, Higiene, Accesorios, Productos recurrentes.

## 2. Arquitectura

Stack deseado: Next.js, TypeScript, Tailwind CSS, Medusa como commerce backend/headless commerce, PostgreSQL a través de Medusa, arquitectura modular y mantenible.

NO construir otro backend de e-commerce desde cero. Medusa se encarga de: productos, variantes, precios, carrito, clientes, órdenes, inventario, promociones, checkout, payments, fulfillment.

El frontend debe estar desacoplado de Medusa. Si el proyecto ya tiene estructura existente, analizarla primero antes de modificarla. No reemplazar tecnologías existentes sin razón clara.

## 3. Primer paso: analizar antes de programar

Antes de escribir código: inspeccionar repo completo, identificar tecnologías instaladas, identificar integración existente con Medusa, revisar `package.json`, estructura de carpetas, config de Tailwind, config de Next.js, componentes reutilizables existentes, variables de entorno necesarias, qué funciona y qué falta construir. No destruir funcionalidad existente innecesariamente; reutilizar lo que ya está bien implementado.

## 4. Referencia visual

Las imágenes adjuntas son el DESIGN SYSTEM de referencia. Analizar: layout, header, hero, tipografía y escala, colores, gradientes, bordes, border radius, sombras, espaciado, botones, product cards, badges, iconografía, ilustraciones, fondos, decoraciones, jerarquía visual, uso del espacio, composición de imágenes, animaciones/transiciones, responsive behavior.

No copiar literalmente los textos de las imágenes — reproducir el LENGUAJE VISUAL. Si una sección visual de referencia no tiene implementación backend todavía, crear primero el componente con datos mock/placeholder claramente separados de los datos reales de Medusa.

## 5. Identidad Patilandia

Identidad consistente en todo el sitio. Paleta base aproximada: morados/lavandas como color principal, tonos claros y suaves para fondos, dorado/amarillo como acento, blanco/crema para superficies, texto oscuro para legibilidad. El morado es central a la identidad — no introducir colores aleatorios que la rompan.

Logo utilizable en versión completa y wordmark. Concepto visual: mascotas, patitas, estrellas, corazones, mundo fantástico, castillo, elementos suaves y mágicos.

**IMPORTANTE:** no usar personajes protegidos por copyright ni copiar diseños reconocibles de Disney, Pixar, etc. Todo debe ser identidad original de Patilandia.

## 6. Página principal

Homepage completa con, como mínimo:

**HEADER:** Logo, navegación, categorías, buscador, favoritos, cuenta, carrito, responsive mobile menu.

**HERO:** Composición visual similar a referencias, mensaje principal, slogan, CTA, elementos decorativos, imagen/ilustración principal, responsive.

**CATEGORÍAS:** ej. Perros, Gatos, Camas, Alimentación, Juguetes, Higiene, Accesorios.

**PRODUCTOS DESTACADOS:** usando las product cards del diseño de referencia.

**CATEGORÍA DESTACADA:** sección visualmente más grande para camas/productos propios.

**BENEFICIOS:** ej. Envíos, productos seleccionados, compra segura, atención, calidad.

**SECCIÓN PARA MASCOTAS:** refuerza la idea de mundo diseñado alrededor de las mascotas.

**FOOTER:** completo y profesional.

## 7. Product card

Componente MUY importante, debe seguir visualmente las referencias. Debe poder mostrar: imagen del producto, categoría, nombre, descripción corta, rating, precio, precio anterior, descuento, badge, favorito, agregar al carrito.

La imagen del producto debe tener protagonismo. Cuando sea posible, los productos deben visualizarse sobre fondos consistentes con Patilandia, no sobre fotografías aleatorias de proveedores. Sistema consistente para imágenes: Product image → fondo Patilandia → composición → sombra → información → CTA. Componente reutilizable.

## 8. Catálogo

Página de tienda/catálogo con: grid responsive, filtros, categorías, ordenamiento, buscador, rango de precio, disponibilidad, product cards, paginación o carga progresiva.

La información debe poder venir después directamente de Medusa. No acoplar componentes visuales a estructura de datos rígida — crear capa/adaptador si es necesario.

## 9. Product detail

Página de producto premium con: galería de imágenes, nombre, precio, precio anterior, descuento, rating, descripción, variantes, cantidad, agregar al carrito, comprar ahora, disponibilidad, información de envío, características, productos relacionados.

Para camas y productos propios, además: materiales, tamaños, colores, medidas, información de fabricación, recomendaciones de cuidado.

## 10. Carrito

Carrito completamente funcional: productos, cantidades, precio, subtotal, envío, total, eliminar, modificar cantidad, CTA checkout.

**IMPORTANTE:** el sistema de shipping NO debe asumir un costo fijo. Habrá productos pesados (arena, alimento, sacos grandes). La arquitectura debe permitir calcular después el envío según: peso, volumen, destino, tipo de producto, clase de envío, transportadora, entrega local, productos pesados. Dejar esta lógica preparada para integración real futura.

## 11. Checkout

Checkout compatible con Medusa: datos del cliente, dirección, ciudad, departamento, método de envío, resumen del pedido, método de pago, confirmación.

La integración real de pagos debe mantenerse desacoplada. Después se integrará Wompi y posiblemente Mercado Pago. NO almacenar información sensible de tarjetas.

## 12. Responsive

Diseñado desde el inicio para desktop, tablet, mobile. No solo reducir el desktop — el diseño mobile debe ser una adaptación real: navegación mobile, cards adaptadas, hero adaptado, grid responsive, espaciados correctos, CTA accesibles, checkout usable.

## 13. Animaciones

Experiencia moderna, animaciones sutiles: hover, fade, slide, microinteracciones, transiciones, entrada de secciones. No abusar. Debe sentirse premium y fluida, no llena de efectos. Se puede usar Framer Motion/Motion si realmente aporta valor.

## 14. Componentización

No una página gigante con todo en `page.tsx`. Crear componentes reutilizables, por ejemplo:

```
components/
├── layout/
├── navigation/
├── hero/
├── products/
├── product-card/
├── categories/
├── cart/
├── checkout/
├── ui/
└── patilandia/
```

Separar claramente: UI, datos, integración Medusa, lógica de negocio.

## 15. Datos mock

Si Medusa no está conectado o no hay productos reales: crear datos mock realistas para poder visualizar toda la tienda. Ejemplos: cama premium para gato, cama nube para perro, cojín artesanal, manta, arena para gatos, alimento para gatos, juguetes, accesorios. Dejar la arquitectura preparada para reemplazar los mocks por Medusa sin reconstruir los componentes.

## 16. Experiencia de marca

El resultado debe sentirse como: "Entré a un mundo creado para mi mascota." No como "otra tienda genérica hecha con Next.js." Cada sección debe reforzar la identidad de Patilandia. El diseño debe tener personalidad.

## 17. Calidad del código

Prioridades: 1) Fidelidad visual a las referencias. 2) UX. 3) Arquitectura limpia. 4) Componentización. 5) Responsive. 6) Accesibilidad. 7) Performance. 8) Integración limpia con Medusa.

Usar TypeScript correctamente. Evitar: `any` innecesarios, componentes monolíticos, código duplicado, lógica de negocio dentro de componentes visuales, estilos inline innecesarios, soluciones temporales difíciles de reemplazar.

## 18. SEO y performance

Preparar correctamente: metadata, Open Graph, titles, descriptions, URLs amigables, optimización de imágenes, lazy loading cuando corresponda, server components cuando tenga sentido, client components únicamente donde sean necesarios.

## 19. Resultado esperado

No solo una landing page. Construir la BASE REAL DEL FRONTEND DE UN E-COMMERCE. Al terminar debe existir una experiencia navegable con:

```
/
├── Home
├── Tienda
├── Categorías
├── Producto
├── Carrito
├── Checkout
├── Cuenta
└── Wishlist
```

Y una arquitectura preparada para conectar completamente con Medusa.

## 20. Forma de trabajo

Trabajar de forma incremental:

1. Analizar el repositorio.
2. Analizar las imágenes de referencia.
3. Definir la arquitectura visual.
4. Identificar componentes.
5. Implementar el design system.
6. Construir el layout global.
7. Construir homepage.
8. Construir catálogo.
9. Construir product detail.
10. Construir carrito.
11. Preparar checkout.
12. Conectar Medusa donde ya sea posible.
13. Ejecutar lint/typecheck/build.
14. Corregir errores.
15. Revisar consistencia visual.

NO avanzar dejando errores de TypeScript o build.

Cuando haya que tomar una decisión de diseño no definida explícitamente, priorizar: **REFERENCIA VISUAL > CONSISTENCIA DE MARCA > UX > CONVENCIÓN TÉCNICA.**

## Objetivo final

El resultado debe parecer una tienda real de una marca que podría competir visualmente con e-commerce modernos y premium, no un template. Patilandia debe sentirse como una marca propia.

"Un mundo hecho para ellos."

Tags: #vision #brief #fuente-de-verdad
