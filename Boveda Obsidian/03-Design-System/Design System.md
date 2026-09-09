---
title: Design System — Patilandia
date: 2026-09-04
tags:
  - design-system
  - ui
  - marca
status: activo
---

# Design System — Patilandia

> [!info] Fuente
> Extraído directamente de `src/app/globals.css` y de los componentes `ui/` reales — no son propuestas, es lo que ya está en pantalla.

## Color

Definidos como CSS custom properties en `:root` (`globals.css`), consumidos en Tailwind vía `bg-[var(--token)]` / `text-[var(--token)]`:

| Token | Hex | Uso principal |
|---|---|---|
| `--brand-violet` | `#7261ff` | Acento primario: botones primarios, subrayado de nav activo, badge de carrito |
| `--brand-violet-deep` | `#20308d` | Texto de marca: precios, categoría del producto, hover de links |
| `--brand-soft` | `#efeaff` | Fondos suaves: chips de categoría, highlights, fondo activo de tabs |
| `--brand-pink` | `#ff9fe0` | Acento secundario: subtítulo del hero, corazón de wishlist activo |
| `--brand-gold` | `#f3cb73` | Badges de producto, botón variante `gold`, iconos de "promesa" en footer |
| `--surface` | `#fffaf3` | Fondo base cálido (mobile menu, panel) |
| `--surface-elevated` | `rgba(255,255,255,0.85)` | Superficies flotantes |
| `--ink` | `#22305f` | Texto principal |
| `--muted` | `#5f6790` | Texto secundario/descripciones |
| `--line` | `rgba(126,134,195,0.2)` | Bordes sutiles |

Fondo global de `<body>`: gradiente radial blanco en la parte superior + gradiente lineal crema→lila claro→crema (`#fffdf8 → #fbf4ff → #fff9f0`) — nunca un blanco plano, siempre con ese tinte lavanda/crema de marca.

## Tipografía

| Token | Fuente | Uso |
|---|---|---|
| `--font-display` | Baloo 2 (700), fallback Trebuchet MS/Segoe UI | Todos los títulos (`.font-display`) — redondeada, tierna, con presencia |
| `--font-body` | Nunito (400/700), fallback Aptos/Segoe UI | Cuerpo de texto, UI |

Ambas cargadas self-hosted vía `@fontsource` (ver [[Decisiones y Razonamiento]]).

Escala real observada: títulos de sección `text-4xl`/`text-5xl` (`leading-none`), hero `text-5xl` → `text-7xl` en desktop, nombre de producto en card `text-3xl`, precio `text-2xl` a `text-5xl` según contexto (card vs. detalle).

## Radios y sombras

- Border radius grande y consistente: `rounded-[2rem]` para secciones/hero/cards grandes, `rounded-[1.8rem]` para paneles internos, `rounded-full` para botones, chips, iconos circulares.
- Sombras siempre coloreadas con el tinte de marca, nunca `shadow-black`: ej. `shadow-[0_20px_50px_rgba(33,38,84,0.08)]` en cards, `shadow-[0_18px_30px_rgba(94,76,214,0.28)]` en el botón primario (sombra violeta), `shadow-[0_18px_30px_rgba(242,199,111,0.22)]` en el botón `gold` (sombra dorada).
- Hover consistente: `hover:-translate-y-0.5` o `hover:-translate-y-1` en botones/cards — elevación sutil, no scale agresivo.

## Botones (`components/ui/button.tsx`)

`buttonStyles({ variant, size, className })` — usado tanto en `<Button>` como directamente en `<Link className={buttonStyles(...)}>` para CTAs que navegan.

| Variant | Estilo |
|---|---|
| `primary` (default) | Gradiente violeta 135° (`--brand-violet` → `--brand-violet-deep`), texto blanco, sombra violeta |
| `secondary` | Blanco 88% opacidad, borde `--line`, texto `--ink` |
| `ghost` | Transparente, texto violeta oscuro, hover fondo `--brand-soft` |
| `gold` | Gradiente dorado, texto `--ink`, sombra dorada — reservado para CTAs "premium/realeza" (ej. "Preparado para integrarse con Medusa") |

| Size | Alto | Padding | Texto |
|---|---|---|---|
| `sm` | 40px | `px-4` | `text-sm` |
| `md` (default) | 48px | `px-5` | `text-sm` |
| `lg` | 56px | `px-6` | `text-base` |

Siempre `rounded-full`, siempre `font-semibold`, siempre `transition duration-300`.

## Product Card (`components/products/product-card.tsx`)

Sigue exactamente el sistema que pide el brief sección 7: **imagen → fondo Patilandia → composición → sombra → información → CTA**.

1. **Imagen** en `aspect-[1.04]`, con `object-cover`, `group-hover:scale-[1.04]` (zoom sutil al hover de la card completa).
2. **Fondo Patilandia**: cada card tiene un gradiente de fondo específico por `theme` de colección (no es gris/blanco plano detrás de la imagen):

   | Theme | Gradiente de fondo |
   |---|---|
   | `royal` | `from-[#ffe2f2] via-[#fff8fd] to-[#fef4ff]` (rosa suave) |
   | `galaxy` | `from-[#dfe4ff] via-[#f7f6ff] to-[#f2ecff]` (azul/lila) |
   | `magic` | `from-[#e0f4df] via-[#f7fbf2] to-[#edf8eb]` (verde bosque suave) |
   | `safari` | `from-[#f8ead7] via-[#fff7ee] to-[#fdf2e5]` (arena/tierra) |
   | `dreams` | `from-[#dde5ff] via-[#fbfaff] to-[#f2ecff]` (azul noche suave) |

3. **Composición**: overlay radial blanco sutil arriba (`radial-gradient(circle_at_top,...)`), badge dorado arriba-izquierda si existe, botón de wishlist circular blanco arriba-derecha.
4. **Sombra**: `shadow-[0_20px_50px_rgba(33,38,84,0.08)]`, se intensifica en hover.
5. **Información**: categoría en mayúsculas/tracking ancho, nombre en `font-display text-3xl` con link al detalle, descripción corta `line-clamp-2`, rating con 5 estrellas + número + conteo de reseñas, precio actual grande + precio anterior tachado + badge de `-X%` si hay descuento.
6. **CTA**: botón primario full-width "Agregar al carrito" con ícono.

Este mismo mapa `themeMap`/`overlayMap` por colección se repite en `CollectionCard` (con overlays de gradiente sobre la imagen en vez de fondo detrás) — es un patrón de diseño consistente, no una casualidad de un solo componente.

### Responsive de `ProductCard` (actualizado 2026-09-05)

Desde que los grids pasaron a 2 columnas en mobile (ver [[Decisiones y Razonamiento]]), `ProductCard` tiene dos escalas — compacta por defecto (mobile, cards de ~160-170px), tamaño "normal" desde `sm:` (640px, donde el card ya tiene 250px+ de ancho):

| Elemento | Mobile (base) | Desde `sm:` |
|---|---|---|
| Padding interno | `p-3` | `p-5` |
| Nombre del producto | `text-lg` | `text-2xl` (`lg:text-3xl`) |
| Categoría (label) | `text-[10px]` | `text-xs` |
| Precio | `text-lg` | `text-2xl` |
| Badge / botón wishlist | más chicos y pegados a la esquina (`left-2 top-2`, `h-8 w-8`) | tamaño original (`left-4 top-4`, `h-10 w-10`) |
| Botón CTA | dice solo **"Agregar"** (`size="sm"`) | dice **"Agregar al carrito"** completo |

El botón CTA usa dos `<span>` (`hidden sm:inline` / `sm:hidden`) para el texto — evita que "Agregar al carrito" se parta en dos líneas en una tarjeta angosta, sin depender de cálculos de ancho de fuente.

## Categorías con imagen (2026-09-05)

Las categorías (`Category.image`, opcional) ahora pueden traer una foto ilustrada propia en vez de solo el ícono SVG plano de `CategoryIcon`. Se renderiza como `next/image fill object-cover` dentro de un contenedor `relative overflow-hidden rounded-full` (mismo círculo que antes tenía el ícono) — si no hay `image`, cae al `CategoryIcon` de siempre (hoy solo pasa con categorías que no tengan foto subida). Usado en `CategoryStrip` (home, 80px), `CatalogView` (chips de categoría, 56px) y `categorias/page.tsx` (56px). Ver [[Modelo de Datos y Mocks]] para la lista de imágenes por categoría.

## Iconografía (`components/ui/icons.tsx`)

Set propio de SVG inline (sin librería externa tipo lucide/heroicons) construidos sobre un wrapper `Svg` común. Inventario: `SearchIcon`, `UserIcon`, `HeartIcon`, `CartIcon`, `PawIcon`, `SparklesIcon`, `CrownIcon`, `TruckIcon`, `ShieldIcon`, `StarIcon`, `ChevronRightIcon`, `ChevronDownIcon`, `MinusIcon`, `PlusIcon`, `FilterIcon`, `HomeIcon`, `GridIcon`, `ShirtIcon`, más `CategoryIcon` (dispatcher que mapea el string `icon` de cada categoría — `bed`, `ball`, `bowl`, `collar`, `brush`, `carrier`, `shirt` — al SVG correspondiente, usado como fallback cuando la categoría no tiene `image`). `MenuIcon`/`CloseIcon` siguen exportados pero **ya no se usan en ningún lado** desde que se quitó el menú hamburguesa del header (2026-09-05) — candidatos a limpiar si nadie más los importa.

## Layout global (`SiteShell`)

```
SiteHeader (sticky, blur, top-0, z-50)
  → main (contenido de la ruta)
SiteFooter (gradiente morado oscuro, siempre al final)
MobileBottomNav (fixed bottom, solo <768px, 5 accesos: Inicio/Categorías/Wishlist/Cuenta/Carrito)
```

### `SiteHeader` — actualizado 2026-09-05, sin hamburguesa

- **Logo**: `logo-rectangular.png` (lockup horizontal: ilustración + wordmark, 1512×600px real), `h-16 w-auto`, `py-2`. Ya no usa el PNG cuadrado viejo (`logo-patilandia.png`, que sigue existiendo pero solo se usa en el footer).
- **Sin menú hamburguesa**: se eliminó por completo (botón + dropdown mobile con buscador+nav). El `MobileBottomNav` es la única navegación en mobile.
- **Logo centrado en mobile**: el contenedor del header es `grid grid-cols-[1fr_auto_1fr] items-center` por debajo de `lg:` (un div vacío a la izquierda balancea el ancho real del cluster de íconos a la derecha, centrando el logo matemáticamente sin importar cuántos íconos haya) y vuelve a `flex` normal desde `lg:` (logo izquierda, nav, buscador, íconos — layout desktop sin cambios).
- **Sin ícono de wishlist en el header** (ni desktop ni mobile) — solo quedan Cuenta y Carrito en el cluster de íconos. El corazón de wishlist sigue vivo en `MobileBottomNav` (decisión asimétrica explícita, ver [[Decisiones y Razonamiento]]).
- **Buscador solo desde `md:`** (768px) — no existe ningún acceso a búsqueda por debajo de ese ancho desde que se quitó la hamburguesa (decisión consciente, no bug).

### Favicon (nuevo 2026-09-05)

- `src/app/icon.png` (512×512) y `src/app/apple-icon.png` (180×180) — convención de Next.js App Router, autodetectados sin config manual. Generados recortando `public/images/patilandia/favicon.png` (la "P" con corona y patita) con distinto padding cada uno (8% para el favicon normal, 16% para el apple-touch-icon porque iOS redondea las esquinas automáticamente).
- Sin `apple-icon.png`, iOS/Android no mostraban ningún ícono en mobile — es un archivo aparte de `icon.png`, no basta con tener uno solo.

`body` tiene `padding-bottom: 88px` en mobile (`@media max-width: 767px`) para no quedar tapado por el `MobileBottomNav` fijo — detalle de responsive ya resuelto.

## Responsive — patrón observado (no es "reducir desktop")

- Header (actualizado 2026-09-05): nav completa y buscador solo desde `lg:`/`md:` respectivamente; en mobile el logo va centrado (grid `[1fr_auto_1fr]`) y solo quedan los íconos de Cuenta y Carrito — sin hamburguesa, sin buscador, sin wishlist.
- Bottom nav dedicado solo mobile (`md:hidden`), es la única navegación mobile (ya no hay una segunda copia en un menú hamburguesa).
- Grids de producto/colección (actualizado 2026-09-05): **2 columnas desde el primer breakpoint** (`grid-cols-2`), no desde `sm:` — sube a 3 (`xl:grid-cols-3`, catálogo/destacados), 4 (`lg:grid-cols-4`, relacionados/wishlist) o 5 (`xl:grid-cols-5`, colecciones) en pantallas más grandes. Antes era 1 columna hasta 640px; se corrigió a pedido explícito del usuario. `ProductCard`/`CollectionCard` tienen su propia escala compacta en mobile para que el contenido no se vea apretado a ~160px de ancho (ver sección Product Card arriba).
- Catálogo: filtros en sidebar fija `lg:block` en desktop, colapsados detrás de un botón "Filtros" en mobile (`mobileFiltersOpen` state).

Tags: #design-system #ui #marca
