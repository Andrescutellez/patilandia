---
title: Identidad de Marca — Patilandia
date: 2026-09-04
tags:
  - marca
  - branding
  - vision
status: activo
---

# Identidad de Marca — Patilandia

> [!info] Fuente
> Destilado de [[Patilandia — Brief Original]] (secciones 1 y 5) contrastado contra los assets reales ya presentes en `public/images/patilandia/`.

## Marca

- **Nombre:** PATILANDIA
- **Slogan:** "Un mundo hecho para ellos."
- **Categoría:** e-commerce pet-centric, foco inicial en camas/textiles propios, roadmap hacia alimentación, snacks, higiene, accesorios y recurrencia.

## Personalidad (los 8 adjetivos del brief)

Premium · Tierna · Mágica · Moderna · Divertida · Familiar · Pet-centric · Estética de mundo fantástico/castillo — **sin caer en infantil excesivo**.

Frase-guía para cualquier decisión de tono: *"Entré a un mundo creado para mi mascota"*, no *"otra tienda genérica hecha con Next.js."*

## Concepto visual

- Mascotas (perro + gato, no una sola especie).
- Patitas / huellas.
- Estrellas y corazones.
- Mundo fantástico, castillo.
- Elementos suaves y mágicos (nubes, brillos, coronas).

> [!danger] Restricción legal explícita del usuario
> **No usar personajes protegidos por copyright** ni copiar diseños reconocibles de Disney, Pixar, etc. Todo debe ser una identidad 100% original de Patilandia. Esto aplica a cualquier asset nuevo que se genere o encargue — el estilo "castillo fantástico pastel" es válido como lenguaje visual, los personajes deben ser originales de Patilandia (el logo actual ya lo hace bien: perro dorado + gato gris genéricos, no personajes de franquicia).

## Paleta (ya implementada en `globals.css`, ver [[Design System]] para el detalle técnico)

Morado/lavanda como color principal, dorado como acento, tonos crema/blanco para superficies, texto oscuro para legibilidad. El morado **no es negociable** como color central — no introducir paletas alternativas sin razón explícita del usuario.

## Logo

`public/images/patilandia/logo-patilandia.png` — versión completa ya diseñada: perro dorado sonriente con corona y pañoleta morada + gato gris con corona pequeña y collar dorado, silueta de castillo morado de fondo con banderines, huella blanca sobre la pañoleta, destellos dorados alrededor, wordmark "Patilandia" en letras redondeadas script-bold moradas con detalle de huella en la "P", slogan en morado más claro debajo con guiones decorativos a los lados.

Usado en dos contextos hoy:
- **Header** (`SiteHeader`, `Logo` component): imagen completa a 140px de ancho.
- **Footer** (`SiteFooter`): mismo componente `Logo`, pero con clases Tailwind que invierten el wordmark a blanco/blanco-70 sobre el fondo morado oscuro del footer (`[&_span:last-child]:text-white/70 [&_span:first-child]:text-white`).

> [!warning] Gap conocido
> El brief pide que el logo pueda usarse "tanto en versión completa como wordmark" (texto solo, sin ilustración). Hoy solo existe el PNG de versión completa — no hay un asset de wordmark-only separado. Si se necesita en un contexto muy angosto (favicon, loading state), habría que generarlo.

## Assets de producto ya generados

Todas en `public/images/patilandia/`, estilo consistente "mascota real + escenario de castillo/fantasía pastel, iluminación cálida, IA generativa premium":

| Archivo | Uso | Descripción visual |
|---|---|---|
| `hero-fantasy.png` | Hero de home y tienda | Golden retriever + gato en cama-sillón morado/lila flotando entre nubes, castillo dorado-morado al atardecer de fondo |
| `royal-bed.png` | Colección Royal | Golden retriever en cama-castillo rosa/dorado con escudo y corona |
| `galaxy-bed.png` | Colección Galaxy | Tema espacial nocturno |
| `forest-bed.png` | Colección Magic Forest | Tema bosque encantado |
| `safari-bed.png` | Colección Safari | Tema aventura cálida/tonos tierra |
| `dreams-bed.png` | Colección Dreams | Tema luna/nube nocturno |

Esto ya cumple el brief sección 7: "los productos deben visualizarse sobre fondos consistentes con Patilandia, no sobre fotografías aleatorias de proveedores" — aunque hoy son renders IA usados como **mock/placeholder**, no fotografía de producto real todavía (correcto según brief sección 4, que permite mock explícitamente separado de datos reales).

## Rutas y copy en español

Toda la navegación usa slugs en español (`/tienda`, `/categorias`, `/carrito`, `/cuenta`) y el copy de UI está en español rioplatense/colombiano neutro ("Tu carrito está esperando magia", "Tus favoritos encantados") — refuerza que la marca es local y cercana, no una traducción de plantilla en inglés.

Tags: #marca #branding #vision
