---
title: Entorno de Desarrollo Local — Patilandia
date: 2026-09-04
tags:
  - arquitectura
  - devops
  - entorno-local
status: activo
updated: 2026-09-11 (baja de Medusa — reescrita para reflejar el entorno actual sobre Vendure)
---

# Entorno de Desarrollo Local — Patilandia

> [!info] Por qué existe esta nota
> Levantar el sistema completo (storefront + Vendure + Postgres) tiene varios pasos y un par de gotchas de este equipo específico (puerto de Postgres, separador de rutas en Windows). Esta nota es la referencia para no tener que redescubrirlos.

> [!note] Medusa ya no existe en este proyecto
> Hasta el 2026-09-11 el backend era Medusa (`patilandia-backend`). Se migró completo a Vendure (ver [[Decisiones y Razonamiento]], fases 1-7) y el repo de Medusa se borró del disco a pedido explícito del usuario. Si algo de código o de memoria vieja todavía menciona Medusa, está desactualizado.

## Piezas del sistema y dónde viven

| Pieza | Carpeta | Repo git |
|---|---|---|
| Storefront (Next.js) | `C:\Users\Leonardo\Desktop\patilandia` | Sí — el repo principal |
| Backend Vendure | `C:\Users\Leonardo\Desktop\patilandia-vendure` | Sí, inicializado por `@vendure/create`, **sin commits todavía** |
| Postgres de Vendure | Contenedor Docker `patilandia-vendure-postgres_db-1` (puerto 6543, vía el `docker-compose.yml` propio del proyecto) | — |

## Levantar todo desde cero (tras reiniciar la máquina)

```bash
# 1. Docker Desktop debe estar corriendo (Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" si no arrancó solo)

# 2. Postgres de Vendure (contenedor propio del proyecto)
cd "C:\Users\Leonardo\Desktop\patilandia-vendure"
docker compose up -d postgres_db

# 3. Vendure: server + worker + Dashboard juntos
npm run dev
# → Shop API:  http://localhost:3000/shop-api
# → Admin API: http://localhost:3000/admin-api
# → Dashboard: http://localhost:3000/dashboard   (superadmin / superadmin — temporal)
# → GraphiQL:  http://localhost:3000/graphiql/shop  y  /graphiql/admin

# 4. Storefront (en otra terminal)
cd "C:\Users\Leonardo\Desktop\patilandia"
npm run dev
# → http://localhost:3000 normalmente, pero como Vendure ya ocupa el 3000,
#   Next.js detecta el puerto ocupado y arranca solo en el 3001 (http://localhost:3001)
```

Si hace falta re-sembrar el catálogo real de Patilandia (idempotente — limpia sample data/assets viejos y recrea todo):

```bash
cd "C:\Users\Leonardo\Desktop\patilandia-vendure"
npx ts-node src/scripts/seed-patilandia.ts
```

## Gotcha importante: puerto de Postgres

Esta máquina ya tiene una instancia **nativa** de PostgreSQL corriendo como servicio de Windows en el puerto **5432** (no instalada por nosotros, no la tocamos). El Postgres de Vendure se publica en el puerto **6543** vía `docker-compose.yml` (lo trae así el propio scaffold de `@vendure/create`, no hubo que elegirlo a mano).

## Gotcha real de Vendure en Windows: separadores de ruta en las URLs de assets

`LocalAssetStorageStrategy` arma el identificador público de cada asset con `path.join()` de Node, que en Windows usa `\` — eso rompe cualquier URL de imagen en el browser (`/assets/preview\aa\archivo.png` no es una URL válida). Se corrigió con un `storageStrategyFactory` custom en `patilandia-vendure/src/vendure-config.ts` que normaliza `\`→`/`. Si se reinstala Vendure desde cero en Windows, este parche hay que volver a aplicarlo (no es parte del scaffold por defecto).

## Credenciales de desarrollo (solo local, no usar en producción)

| Cosa | Valor |
|---|---|
| Dashboard Vendure — usuario | `superadmin` |
| Dashboard Vendure — password | `superadmin` (temporal, cambiar cuando se quiera) |
| Postgres user/pass | ver `patilandia-vendure/.env` (generado por el scaffold, no versionado) |
| Postgres DB | `vendure` en `localhost:6543` |

El storefront lee la URL de la Shop API desde `patilandia/.env.local` (gitignored, no versionado — si se clona el repo en otra máquina hay que recrearlo a mano: `NEXT_PUBLIC_VENDURE_SHOP_API_URL=http://localhost:3000/shop-api`).

## Catálogo real (seed de Patilandia)

Los 8 productos reales de Patilandia se siembran vía `patilandia-vendure/src/scripts/seed-patilandia.ts` (idempotente: limpia catálogo de muestra + assets huérfanos y recrea todo desde cero en cada corrida). Modela categorías y colecciones temáticas como Collections filtradas por Facet, talla/color como ProductVariants reales, y el resto de campos propios de Patilandia como customFields tipados — detalle completo del porqué en [[Decisiones y Razonamiento]] (entrada del 2026-09-10, Fase 2).

Tags: #arquitectura #devops #entorno-local
