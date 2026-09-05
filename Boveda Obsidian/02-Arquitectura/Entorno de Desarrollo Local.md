---
title: Entorno de Desarrollo Local — Patilandia
date: 2026-09-04
tags:
  - arquitectura
  - devops
  - entorno-local
status: activo
---

# Entorno de Desarrollo Local — Patilandia

> [!info] Por qué existe esta nota
> Levantar el sistema completo (storefront + Medusa + Postgres) tiene varios pasos y un par de gotchas de este equipo específico (puerto de Postgres, prompts interactivos del instalador). Esta nota es la referencia para no tener que redescubrirlos.

## Piezas del sistema y dónde viven

| Pieza | Carpeta | Repo git |
|---|---|---|
| Storefront (Next.js) | `C:\Users\Leonardo\Desktop\patilandia` | Sí — el repo principal |
| Backend Medusa | `C:\Users\Leonardo\Desktop\patilandia-backend` | Sí, inicializado 2026-09-04, **sin commits ni remote todavía** |
| Postgres | Contenedor Docker `patilandia-postgres` | — |

## Gotcha importante: puerto de Postgres

Esta máquina ya tiene una instancia **nativa** de PostgreSQL corriendo como servicio de Windows en el puerto **5432** (no instalada por nosotros, no la tocamos). Por eso el Postgres de Docker para Medusa se publicó en el puerto **5433**, no el 5432 por defecto. Si algún día se reinstala el contenedor, usar `-p 5433:5432` y `DATABASE_URL` con `:5433`.

## Cómo levantar todo desde cero (tras reiniciar la máquina)

```bash
# 1. Docker Desktop debe estar corriendo (Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" si no arrancó solo)

# 2. Levantar Postgres (si el contenedor ya existe, solo iniciarlo)
docker start patilandia-postgres
# si no existe todavía:
docker run -d --name patilandia-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=patilandia_medusa -p 5433:5432 postgres:16

# 3. Backend Medusa
cd "C:\Users\Leonardo\Desktop\patilandia-backend"
npm run dev
# → Admin dashboard: http://localhost:9000/app
# → Store API: http://localhost:9000/store/*

# 4. Storefront (en otra terminal)
cd "C:\Users\Leonardo\Desktop\patilandia"
npm run dev
# → http://localhost:3000
```

## Credenciales de desarrollo (solo local, no usar en producción)

| Cosa | Valor |
|---|---|
| Admin Medusa — email | `admin@patilandia.com.co` |
| Admin Medusa — password | `Patilandia2026!` (temporal, cambiar cuando se quiera) |
| Publishable API key | `pk_a099b3c8d0cfb6bb4e500f4ad14209d1f2640e76b053f7428a0c81662a1cdc99` |
| Postgres user/pass | `postgres` / `postgres` |
| Postgres DB | `patilandia_medusa` en `localhost:5433` |

El storefront lee la key desde `patilandia/.env.local` (gitignored, no versionado — si se clona el repo en otra máquina hay que recrear este archivo a mano con estos valores o los que correspondan a ese entorno).

## Instalar `create-medusa-app` de nuevo (si hay que reinstalar desde cero) — lecciones aprendidas

El instalador (`npx create-medusa-app@latest`) es interactivo por diseño y **no respeta** `CI=true` ni redirigir stdin a `/dev/null` (esto último hace que se cierre solo sin crear nada). Lo que sí funciona: pipear las respuestas por stdin:

```bash
printf 'n\nn\nn\nn\nn\nn\nn\nn\nn\nn\n' | npx create-medusa-app@latest patilandia-backend \
  --db-url "postgres://postgres:postgres@localhost:5433/patilandia_medusa" \
  --no-browser --use-npm --verbose
```

(El `n` responde "No" a "¿Instalar el Next.js Starter Storefront?" — no lo necesitamos, ya tenemos nuestro propio storefront.)

## Estructura del proyecto Medusa (monorepo Turborepo)

`create-medusa-app` generó un monorepo con Turborepo, no un proyecto Medusa plano:

```
patilandia-backend/
├── apps/
│   └── backend/           ← el servidor Medusa real
│       ├── medusa-config.ts
│       ├── .env           ← DATABASE_URL, JWT_SECRET, CORS, etc.
│       └── src/
│           ├── migration-scripts/
│           │   └── initial-data-seed.ts   ← seed genérico de Medusa (referencia)
│           └── scripts/
│               └── patilandia-seed.ts     ← nuestro seed real, ver abajo
├── AGENTS.md / CLAUDE.md  ← generados automáticamente por Medusa para agentes de IA
└── package.json           ← scripts turbo (dev/build/start/lint)
```

`npm run dev` en la raíz corre `turbo dev`, que a su vez corre `medusa develop` dentro de `apps/backend`.

## Catálogo real migrado (2026-09-04)

Los 8 productos mock de Patilandia (ver [[Modelo de Datos y Mocks]]) se migraron a productos reales de Medusa vía un script propio: `patilandia-backend/apps/backend/src/scripts/patilandia-seed.ts`, ejecutado con:

```bash
cd patilandia-backend/apps/backend
npx medusa exec ./src/scripts/patilandia-seed.ts
```

Qué hizo el script (usando los workflows oficiales de Medusa, no SQL directo — ver por qué en [[Decisiones y Razonamiento]]):
1. Agregó `cop` como moneda soportada de la tienda.
2. Creó una región "Colombia" (país `co`, moneda `cop`) y su tax region.
3. Borró (soft-delete) los 4 productos demo de Medusa (T-Shirt, Sweatshirt, Sweatpants, Shorts).
4. Creó las 8 categorías de Patilandia (`camitas`, `juguetes`, etc.).
5. Creó los 8 productos reales, cada uno con:
   - Un único variant "Única" (no hay variantes reales de talla/color en Medusa todavía — coincide con la limitación ya documentada en [[Integración Medusa]]).
   - `images` con las mismas rutas relativas (`/images/patilandia/*.png`) que ya sirve el storefront — así que las imágenes se ven exactamente igual que con los mocks, sin necesidad de subir nada a un storage externo.
   - `metadata` con **exactamente** los campos que `adaptMedusaProduct()` espera (`categorySlug`, `price`, `theme`, `colorName`, etc.) — ver [[Integración Medusa]] para el porqué de este esquema.

**Nota:** las 4 categorías demo de Medusa (Shirts, Sweatshirts, Pants, Merch) quedaron huérfanas — `deleteProductCategoriesWorkflow` da error en esta versión de Medusa (2.20.1) ("Trying to query by not existing property ProductCategory.ids"). Es solo desorden cosmético en el admin, se puede borrar a mano desde `http://localhost:9000/app` cuando se quiera. Ver [[Pendientes Claude]].

Tags: #arquitectura #devops #entorno-local
