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

## Logo (actualizado 2026-09-05 — ya existe la versión wordmark que faltaba)

Dos versiones reales del logo conviven hoy en `public/images/patilandia/`:

- **`logo-rectangular.png`** (1512×600px, lockup horizontal) — perro dorado con corona + gato gris con collar dorado y castillo morado a la izquierda, wordmark "Patilandia" + slogan "Un mundo hecho para ellos." a la derecha. **Este es el que usa el header** (`Logo` component, `h-16 w-auto`) — resuelve el gap que existía antes (brief pedía poder usar "versión completa" y "wordmark"; este lockup horizontal cumple ambas funciones a la vez, ilustración + texto lado a lado en vez de apilados).
- **`logo-patilandia.png`** (1254×1254px, cuadrado) — la versión original: mismo concepto pero con el wordmark apilado DEBAJO de la ilustración en vez de al lado. Sigue usándose en el **footer** (`SiteFooter`), aunque ahí el intento de invertir el texto a blanco vía CSS (`[&_span]:text-white`) nunca funcionó — `Logo` solo renderiza una `<Image>`, no hay `<span>`s reales que ese selector pueda alcanzar. Problema preexistente, no crítico (el texto morado oscuro sobre el fondo navy del footer tiene contraste bajo pero no es ilegible), documentado en [[Decisiones y Razonamiento]].

> [!info] Bug de aspect-ratio corregido (2026-09-05)
> El header llegó a mostrarse "muy grande o vacío" porque el código declaraba un `width`/`height` en `next/image` que NO coincidía con las dimensiones reales del archivo — el navegador reservaba un espacio angosto al inicio y saltaba a un espacio más alto al cargar la imagen real. Ver [[Decisiones y Razonamiento]] para el diagnóstico completo. Lección para cualquier imagen nueva que se agregue: los props `width`/`height` de `next/image` deben coincidir con la proporción REAL del archivo, no con el tamaño que se quiere mostrar en pantalla (eso se controla aparte, con CSS).

## Favicon (nuevo 2026-09-05)

`public/images/patilandia/favicon.png` — la "P" de Patilandia sola, con corona y huella blanca adentro, sin el resto de la ilustración ni el wordmark. Es el ícono más reducible de la marca (funciona incluso a 16px). De ahí se generaron dos derivados en `src/app/` (convención de Next.js, autodetectados):
- `icon.png` (512×512) — favicon estándar de pestaña.
- `apple-icon.png` (180×180) — ícono de pantalla de inicio/pestaña en iOS y Android. Sin este archivo separado, el sitio no mostraba ningún ícono en mobile — no basta con `icon.png` solo.

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

**Imágenes de categoría (nuevas 2026-09-05):** `categoria camas.png`, `categoria juguetes.png`, `categoria comida.png`, `categoria accesorios.png`, `categoria higiene.png`, `categoria viaje.png`, `categoria ropa.png` — mismo estilo (halo circular pastel + producto/escena flotando), una por categoría del catálogo. Ver [[Modelo de Datos y Mocks]] y [[Design System]] para cómo se usan.

## Rutas y copy en español

Toda la navegación usa slugs en español (`/tienda`, `/categorias`, `/carrito`, `/cuenta`) y el copy de UI está en español rioplatense/colombiano neutro ("Tu carrito está esperando magia", "Tus favoritos encantados") — refuerza que la marca es local y cercana, no una traducción de plantilla en inglés.

Tags: #marca #branding #vision
