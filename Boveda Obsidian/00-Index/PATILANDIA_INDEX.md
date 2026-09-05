---
title: PATILANDIA Index
date: 2026-09-04
tags:
  - index
aliases:
  - Index
  - Índice
---

# PATILANDIA Index

> [!abstract] Punto de entrada
> Navega desde aquí a cualquier sección del proyecto. Para Claude: empezar siempre por [[SEGUNDO_CEREBRO]].

## Claude — Segundo Cerebro

| Nota | Propósito |
|------|-----------|
| [[SEGUNDO_CEREBRO]] | Hub principal de contexto operativo |
| [[Contexto Patilandia]] | Estado actual del sistema (qué es real, qué es mock) |
| [[Decisiones y Razonamiento]] | Log de decisiones técnicas con su porqué |
| [[Pendientes Claude]] | Brechas frente al brief original, tareas activas |

## Notas canónicas por dominio

### Visión y marca

| Nota | Contenido |
|------|-----------|
| [[Patilandia — Brief Original]] | Especificación completa entregada por el usuario (fuente de verdad) |
| [[Identidad de Marca]] | Slogan, personalidad, paleta, restricciones de copyright |

### Arquitectura

| Nota | Contenido |
|------|-----------|
| [[Arquitectura Técnica]] | Stack, capas, límites entre módulos, entry points |
| [[Integración Medusa]] | Capa de adaptación, `medusaFetch`, Medusa ya corriendo en local |
| [[Entorno de Desarrollo Local]] | Cómo levantar Medusa + Postgres + storefront, credenciales dev |
| [[Patilandia sobre Medusa Admin — Diagnóstico y Roadmap]] | Por qué no se puede re-temear el admin nativo; roadmap de 7 fases para extensiones propias (mascotas, proveedores, envío por peso, fidelización...) |
| [[Shipping — Arquitectura de Envíos]] | Por qué el envío no es un costo fijo, qué falta conectar |

### Design System

| Nota | Contenido |
|------|-----------|
| [[Design System]] | Tokens de color/tipografía, botones, tarjetas, gradientes por colección |

### Catálogo y producto

| Nota | Contenido |
|------|-----------|
| [[Modelo de Datos y Mocks]] | `StorefrontProduct`, categorías, colecciones, los 8 productos mock |

### Páginas y rutas

| Nota | Contenido |
|------|-----------|
| [[Mapa de Rutas y Componentes]] | Cada ruta, su página, su componente y su fuente de datos |

## Estructura de carpetas

```
patilandia/
└── Boveda Obsidian/
    ├── _Claude/          ← segundo cerebro de Claude
    ├── _Templates/       ← plantillas reutilizables
    ├── 00-Index/         ← este archivo
    ├── 01-Vision-y-Marca/
    ├── 02-Arquitectura/
    ├── 03-Design-System/
    ├── 04-Catalogo-y-Producto/
    ├── 05-Paginas-y-Rutas/
    └── 08-Daily/         ← bitácoras de sesión (se llena con el tiempo)
```

## Convenciones

Ver [[CONVENTIONS]]

Tags: #index
