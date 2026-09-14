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

## Estado rápido al 2026-09-14 (noche) — Proveedores y Órdenes de Compra (abastecimiento), décimo plugin propio, MVP sin ERP

El usuario pidió, con una lista larga de exclusiones explícitas (nada de pronóstico de demanda, reorden automático, comparación de proveedores, multi-moneda, facturación, contabilidad, multi-bodega, automatización de compras, IA — "esto debe ser un MVP sólido y extensible, no un ERP"), saber de dónde se abastece cada producto, armar órdenes de compra a proveedores, y registrar recepción de mercancía sin duplicar catálogo ni arriesgar el stock real. Plugin nuevo `patilandia-procurement`, el más grande de la sesión en entidades (6): `Supplier`, `SupplierProductVariant` (relación proveedor↔`ProductVariant` real de Vendure — SKU del proveedor, `INVENTARIO_PROPIO`/`DROPSHIPPING`, costo actual — nunca se duplica catálogo), `PurchaseOrder`/`PurchaseOrderLine` (`BORRADOR→ENVIADA→PARCIALMENTE_RECIBIDA→RECIBIDA`), y `GoodsReceipt`/`GoodsReceiptLine` (la recepción como evento auditable, no un contador mutable).

Dos hallazgos de investigación (contra el código real de Vendure 3.7.3, no supuestos) definieron el diseño: el stock vive en una entidad separada `StockLevel` (no una columna plana en `ProductVariant`), y el método nativo de Vendure para ajustarlo **no es atómico** (lee y escribe en JavaScript, lost-update real bajo carrera). Por eso la recepción hace su propio `UPSERT` atómico de Postgres sobre `StockLevel`, dentro de la misma transacción, y solo para líneas `INVENTARIO_PROPIO` — dropshipping nunca toca stock físico. Las recepciones duplicadas se evitan con el mismo patrón de `idempotencyKey` que ya usaba `LoyaltyTransaction` en Patipuntos (comprobado explícitamente que la validación de cantidad sola no alcanzaba).

El Dashboard tuvo un pivote de arquitectura real: se intentó usar por primera vez el framework de CRUD "oficial" de Vendure (`ListPage`/`useDetailPage`), pero `tsc` mostró ~25 errores reales — sus genéricos necesitan un `TypedDocumentNode` con un branding que solo genera el helper `graphql()` propio de Vendure, no `gql` de `graphql-tag` (la convención que ya usan los 9 plugins anteriores). Se volvió al patrón a mano ya probado (`Page`/`Table`/`api.query`/`api.mutate`/`useState` + `@tanstack/react-router` directo), reusando sin cambios los sub-componentes que ya eran independientes de ese framework.

Verificado de punta a punta contra el servidor real por curl, con el ejemplo numérico completo del pedido del usuario (orden de 20+10 unidades → recepción parcial de 12 propias+10 dropshipping → stock 18→30 en la propia, dropshipping intacto en 18 → reintento del mismo `idempotencyKey` confirmado como no-op → recepción final de las 8 restantes → stock 38, `RECIBIDA`) — la verificación backend más exhaustiva de la sesión. `tsc --noEmit` limpio en ambos tsconfigs, servidor y Dashboard reiniciados y arrancando limpios ("Found 11 plugins"). Sin verificación visual con Playwright — esta sesión de Claude Code no tenía esa herramienta disponible, a diferencia de sesiones anteriores. Detalle técnico completo en [[Decisiones y Razonamiento]] y estado en [[Pendientes Claude]].

## Estado rápido al 2026-09-14 — WhatsApp: botón flotante y mensajes contextuales, noveno plugin propio (sin la API oficial todavía)

El usuario preguntó qué se podía construir de WhatsApp sin depender de la API oficial de Meta (verificación de negocio, aprobación de plantillas, cobra por conversación) — decidió explícitamente NO integrarla todavía, solo links `wa.me` con mensajes ya escritos, dejando la arquitectura lista para el salto futuro. Plugin nuevo `patilandia-whatsapp`, el más chico de la sesión: una sola entidad singleton (número, activado/desactivado, mensaje genérico), calco exacto del molde de `LoyaltySettings` de Patipuntos, con mejor permiso nativo de Vendure (`ReadSettings`/`UpdateSettings` en vez de reusar `UpdateCustomer` como Patipuntos).

Toda la lógica de mensajes vive en un solo módulo del storefront (`src/lib/whatsapp.ts`) — un builder por contexto (genérico, producto, ayuda con producto+variante+URL, resumen de carrito compartido entre carrito y checkout, consulta de pedido). El botón flotante vive en `SiteShell` (donde ya vivía todo el "chrome" global) y cambia su mensaje según la página vía una pieza nueva y mínima de estado global (`whatsappMessage` en `store-provider.tsx`) que cada página setea al montar y limpia al desmontar. Cinco puntos de contacto: flotante contextual, "¿Necesitás ayuda?" en producto, "Contactar por WhatsApp" en carrito y checkout, y "Consultar mi pedido" en la confirmación (el único lugar hoy con el código de pedido visible, porque todavía no hay página de seguimiento de pedidos).

Verificado de punta a punta contra el servidor real (lectura pública, escritura rechazada sin sesión, y el botón flotante desapareciendo de verdad al desactivarlo — esperando explícitamente a que venciera la caché de 60s, no asumido) y con Playwright contra Chrome real (mensaje contextual correcto y su limpieza al navegar, link de ayuda con producto+variante+URL, resúmenes de carrito/checkout, confirmación de pedido con el código real). Detalle técnico completo en [[Decisiones y Razonamiento]] y estado en [[Pendientes Claude]].

## Estado rápido al 2026-09-13/14 (noche) — Suscripciones (recompras programadas), octavo plugin propio

El usuario validó el alcance con un prompt a ChatGPT y pidió un MVP deliberadamente honesto: como todavía no hay pasarela de pago real, una "suscripción" nunca cobra sola — solo programa un recordatorio. El flujo real es recordatorio → el cliente confirma → checkout de siempre → pago normal → nueva orden. Configurable producto por producto desde el admin con un solo booleano (sin bloque de Dashboard propio, el genérico ya alcanza), frecuencia fija de 15/30/45/60/90 días, y una decisión de arquitectura central: la dirección de la suscripción vive en la libreta de direcciones NATIVA de Vendure (no una copia propia), porque tiene que sobrevivir más que un solo pedido. Eso reveló que esa libreta exige sesión autenticada real — confirmado contra el código real de Vendure — así que Suscripciones es la primera funcionalidad de la sesión que **requiere cuenta con login, sin invitados**.

"Comprar ahora" no inventa ningún mecanismo nuevo: reusa `addItemToOrder` (con un `subscriptionId` en el customField de la línea, mismo molde que ya usaba Personalización) y `setShippingAddress` (ya existente, de Regalos) — el checkout de siempre no sabe que existe una suscripción. Al pagar, un event-subscriber (calco de Patipuntos) recalcula la próxima fecha con una única regla documentada: ancla al momento real del pago, nunca a la fecha vieja. El recordatorio corre en una tarea programada diaria (mismo molde que el cumpleaños de mascota de Patipuntos) con correo propio.

Se encontraron y corrigieron 3 bugs reales, los tres con la misma causa raíz: `Product.name` es un campo traducible sin columna propia, así que leerlo como propiedad cruda de TypeScript (en vez de vía GraphQL) da `undefined` — rompió el asunto del correo de recordatorio y la búsqueda por producto del admin (`column product.name does not exist` en un filtro SQL crudo), ambos corregidos con `TranslatorService`/un join a `translations`. El tercero, encontrado ya en el navegador: si el stock se agotaba entre el correo y el click en "Comprar ahora", el flujo automático fallaba en silencio — se le agregó un mensaje de error visible. Verificado de punta a punta contra el servidor real (incluida la tarea programada corrida manualmente vía `runScheduledTask`, con idempotencia confirmada) y con Playwright contra Chrome real (ciclo de vida completo, deep-link del correo funcionando). Detalle técnico completo en [[Decisiones y Razonamiento]] y estado en [[Pendientes Claude]].

## Estado rápido al 2026-09-13 (noche) — Regalos: comprar como regalo desde el checkout, séptimo plugin propio

"Regalos" era un placeholder de roadmap sin definir. El usuario pidió, para el MVP, que cualquier producto del catálogo pueda comprarse como regalo desde el checkout: envoltorio, mensaje de tarjeta, remitente (o anónimo), y una dirección de entrega distinta a la del comprador (nombre, teléfono, dirección, ciudad, barrio, indicaciones adicionales) — sin gift cards ni listas de regalo todavía, sin que el precio aparezca nunca en el paquete físico, y sin romper el checkout si el toggle no se activa.

La investigación previa (grep/lectura directa contra el código real de `@vendure/core`, no un agente) encontró que Vendure ya trae de fábrica todo lo necesario: la mutación nativa `setOrderCustomFields` (pensada para que el cliente guarde sus propios customFields en el pedido) y el hecho de que declarar customFields en `Address` extiende automáticamente también `OrderAddress` (el tipo de los snapshots `shippingAddress`/`billingAddress`), viajando solo a través de `setOrderShippingAddress`. Por eso `patilandia-gifts` es el primer plugin propio de la sesión **sin entidades ni resolvers** — solo customFields nuevos en `Order`/`Address` y un cartel propio "🎁 Pedido para regalo" inyectado en el detalle de pedido del Dashboard (`pageBlocks` sobre `pageId: 'order-detail'`, con `detailForms.extendDetailDocument` para traer los customFields anidados de `shippingAddress` que la query nativa de esa página no incluía).

Verificado de punta a punta contra el servidor real (curl Shop+Admin API) y con Playwright contra Chrome real: comprador y destinatario correctamente separados en el mismo pedido (`Order.customer` nunca se toca, `shippingAddress` pasa a ser la del destinatario), un pedido de control que nunca toca el toggle sale exactamente igual que antes. El click-through visual del cartel en el Dashboard quedó sin completar por la misma inestabilidad de arranque en frío de Vite ya documentada para Preguntas/Personalización — el propio log de arranque confirmó el plugin cargado sin errores. Detalle técnico completo en [[Decisiones y Razonamiento]] y estado en [[Pendientes Claude]].

## Estado rápido al 2026-09-13 (tarde) — Personalización de productos, sexto plugin propio

"Camita Personalizada Luna" prometía desde el primer día del proyecto (2026-09-04) "personaliza color, tamaño y nombre" con badge "Personalizable" — nunca se construyó, se vendía igual que cualquier otra camita. El usuario pidió resolverlo de una vez con un sistema **genérico**, marcando explícitamente que no quería nada hardcodeado a Luna: cualquier producto se marca personalizable desde el Dashboard (campos de texto y de selección con swatch de color configurables, precio adicional configurable), sin tocar código. Pidió también, antes de programar, que se le explicara qué se iba a tocar y por qué — se investigó a fondo contra el código real instalado de Vendure antes de diseñar nada.

Plugin nuevo `patilandia-personalization` con entidades relacionales reales (no un JSON en un customField — los `struct` de Vendure no soportan listas anidadas). Dos piezas técnicas centrales, ambas confirmadas contra el código real antes de construir: el precio de una línea del carrito puede depender de sus propios datos personalizados vía `OrderItemPriceCalculationStrategy` (mecanismo oficial de Vendure pensado literalmente para "product configurators" — el servidor siempre decide el recargo desde su propia configuración, nunca desde lo que manda el cliente), y el Dashboard permite inyectar un bloque propio directo dentro de la página real de editar producto (`pageBlocks`, primera vez que este proyecto usa ese punto de extensión en vez de crear una página nueva).

Se encontraron y corrigieron 3 bugs reales en el camino: la estrategia de precio no podía inyectar el servicio del propio plugin (vive fuera de cualquier módulo de Nest al declararse directo en la config, solo alcanza providers genuinamente globales); el mismo bug de TypeORM con columnas `string | null` sin tipo explícito ya visto en Patipuntos, repetido en una entidad nueva; y un campo de selección guardaba el valor interno en vez de la etiqueta visible, encontrado recién en el navegador real. Verificado de punta a punta contra el servidor real (recargo exacto, líneas separadas por personalización distinta, un producto no configurado ignora cualquier intento de forzarla) y en el navegador (panel dinámico, validación de campos obligatorios, carrito/checkout correctos). Detalle técnico completo en [[Decisiones y Razonamiento]] y estado en [[Pendientes Claude]].

## Estado rápido al 2026-09-13 — Anti-abuso de Patipuntos por reseña + Preguntas y Respuestas

Apenas terminadas las cuentas reales, el usuario cayó en la cuenta de que las reseñas no tenían ningún freno: cualquiera podía escribir muchas reseñas (con cualquier correo) y cobrar 50 Patipuntos por cada una que un moderador aprobara, sin haber comprado nunca nada. Se cerró exigiendo una compra verificada de ese producto específico y un único premio por cliente y por producto para siempre, reusando la identidad por sesión real recién construida y la misma distinción prepago/contraentrega que ya usaba el resto de Patipuntos. En la misma conversación se agregó, además, una sección de "Preguntas y respuestas" en la página de producto (plugin nuevo `patilandia-qa`, mismo molde que Reseñas) — a propósito **sin** puntos, porque preguntar es justo para quien todavía no compró.

Se encontraron y corrigieron dos bugs reales en el camino: el mensaje de "¡Gracias!" nunca llegaba a mostrarse ni en Reseñas ni en Preguntas (el formulario se autodestruía antes de pintar su propio estado de éxito), y un proceso `vendure dev dashboard` huérfano de una sesión anterior dejaba el Dashboard en blanco por una lista de archivos permitidos de Vite desactualizada. Verificado de punta a punta contra el servidor real con casos adversariales (compra real → puntos exactos; reseña repetida → rechazada; producto nunca comprado → cero puntos; correo desconocido → sin cuenta fantasma). Detalle técnico completo en [[Decisiones y Razonamiento]] y estado en [[Pendientes Claude]] (queda pendiente solo la verificación visual del Dashboard en navegador, las mutaciones ya están probadas).

## Estado rápido al 2026-09-12 (noche, después del despliegue en VPS) — Cuentas reales de cliente, correo+contraseña

El usuario notó, revisando el proyecto, que Mascotas/Wishlist/Patipuntos identificaban al cliente solo por un correo enviado por el navegador (sin contraseña ni sesión real) y pidió agregar cuentas reales. Se construyó sobre la autenticación nativa de Vendure (`NativeAuthenticationStrategy`, activa de fábrica desde siempre pero nunca usada): registro con verificación por correo, login/logout, recuperación de contraseña, 6 páginas nuevas bajo `/cuenta`. Dos decisiones del usuario guiaron el diseño: el checkout de invitado se mantiene (cuenta opcional, no obligatoria), y los datos ya cargados por correo (mascotas, wishlist, puntos, pedidos) se vinculan automáticamente al registrarse con el mismo correo — esto último salió casi gratis, porque `registerCustomerAccount` de Vendure le agrega la contraseña a la misma fila de `Customer` que ya existía como invitado, y los tres plugins apuntan por FK a esa fila.

El cambio de seguridad central en `patilandia-pets`/`patilandia-wishlist`/`patilandia-loyalty`: una sesión real siempre gana, y un correo de invitado solo sigue siendo válido como identificación si ese correo **no** tiene ya una cuenta registrada — antes de este fix, cualquiera podía seguir leyendo/editando los datos de alguien ya registrado con solo escribir su correo. Se encontraron y corrigieron 3 bugs reales: los tres clientes GraphQL del storefront tenían cada uno su propio `shopFetch` que nunca mandaba el header de sesión (arreglado unificándolos en `shop-fetch.ts` nuevo); `checkout-page.tsx` llamaba a una mutación sin condición que Vendure rechaza para un cliente logueado, bloqueando silenciosamente su checkout; y las URLs de los correos nativos de verificación/reset en `vendure-config.ts` tenían placeholders de otra plantilla, nunca actualizados. Verificado de punta a punta contra el servidor real (secuencias completas por curl) y con Playwright contra Chrome del sistema (registro→verificación real vía el dev mailbox→login→checkout completo→aislamiento contra un desconocido→banner de conflicto de correo). Detalle técnico completo en [[Decisiones y Razonamiento]] y estado en [[Pendientes Claude]].

## Estado rápido al 2026-09-12 (noche) — Patilandia desplegado en VPS (staging, compartido con Argus)

Se desplegó Patilandia por primera vez fuera de local, en el mismo VPS de GCP que ya hospeda un proyecto ajeno (**Argus**), bajo una regla explícita e innegociable: cero impacto en Argus. Se respetó de punta a punta — nunca se tocó `/opt/argus`, la DB `argus`/`argus_user`, los puertos 3000/9000/9001, ni los server blocks de Nginx de Argus, todo verificado en cada paso antes de avanzar al siguiente.

Arquitectura montada: PostgreSQL 16 ya instalado en el VPS reutilizado (sin instalar una segunda instancia) con una DB `patilandia`/usuario `patilandia_user` aislados; Vendure (server+worker, puerto 3010) y el storefront Next.js (puerto 3011) corriendo bajo **PM2** (ya instalado para Argus, ahora gestiona 4 procesos: `argus-api` + `patilandia-api`/`patilandia-worker`/`patilandia-storefront`); Nginx con un archivo nuevo y separado (`sites-available/patilandia`, nunca se tocó el de Argus) proxyeando `patilandia.com.co`→3011 y `api.patilandia.com.co`→3010; Certbot (ya instalado) emitió el certificado SSL para los 3 dominios en una sola corrida, igual que ya tenía Argus. El Dashboard de administración vive en `api.patilandia.com.co/dashboard` (Vendure 3.x lo sirve en el mismo proceso que la Admin API) — decisión explícita del usuario de NO usar un subdominio `admin.` aparte, por simplicidad.

**Bug real descubierto y corregido durante el despliegue:** `seed-patilandia.ts` fallaba en una DB nueva porque `configure-checkout.ts` asumía que Colombia/zona de impuesto/métodos de envío y pago ya existían (poblados hace semanas por el scaffold de `@vendure/create`, nunca versionado en git). Se hizo `configure-checkout.ts` autosuficiente (crea todo si falta) y se documentó el orden correcto: siempre correrlo ANTES de `seed-patilandia.ts` en una base nueva.

**Importante — este VPS es temporal.** Es el mismo servidor de Argus, compartido solo para probar el despliegue; al usuario le quedan ~24 días de este VPS (dicho el 2026-09-12, o sea hasta ~2026-10-06). Cuando se monte en el VPS definitivo hay que reproducir toda esta arquitectura **y además aplicar el endurecimiento que se dejó pendiente a propósito** (ver [[Pendientes Claude]] y la entrada correspondiente en [[Decisiones y Razonamiento]]): CORS restringido a los dominios reales, CSRF de login activado, `trustProxy` revisado, y el bug del placeholder de `assetUrlPrefix` corregido antes de sacar el backend del modo `dev`.

## Estado rápido al 2026-09-12 (tarde) — Patipuntos, cuarto plugin propio: ganar y canjear

Se construyó **Patipuntos**, el sistema de fidelización completo (ganar → acumular → canjear → volver a comprar), a partir de un brief muy detallado del usuario. Se usó Plan Mode explícitamente: 3 agentes de exploración + 1 de validación de arquitectura antes de escribir código, todo verificado contra el código real de `@vendure/core` instalado.

**Decisión clave del usuario:** dado que la identidad por correo (igual a Mascotas/Wishlist) no verifica nada — se le planteó que sin canje eso es cosmético pero con canje es plata regalable sin fricción —, decidió construir el ciclo completo YA, pero condicionando el canje a señales reales: correo verificado (magic link propio, sin contraseña) + al menos una compra completada, en vez de una regla arbitraria de antigüedad de cuenta.

La verificación contra el servidor y el navegador reales encontró y corrigió 6 bugs, el más importante de todos **no era de Patipuntos**: `updateCustomerName` en el checkout tenía un closure obsoleto que borraba el correo del cliente a `""` en el primer pedido de cualquier cliente nuevo — un bug real desde la Fase 5, nunca detectado hasta ahora, visible en la pantalla de confirmación ("Te escribimos a  con los detalles"). Ya corregido.

Quedan 6 funcionalidades del roadmap sin empezar en ese momento: configurador de camitas, regalos, suscripciones, WhatsApp, analítica propia, proveedores — todas menos analítica propia ya se completaron en sesiones posteriores (ver las entradas de estado más recientes arriba). Detalle técnico completo en [[Decisiones y Razonamiento]] y estado en [[Pendientes Claude]].

## Estado rápido al 2026-09-12 — Wishlist real, tercer plugin propio

Se retomó el roadmap de funcionalidades propias (8 pendientes tras Reseñas/Mascotas/Recomendaciones) y se construyó **Wishlist real** sobre Vendure, con una variante de diseño nueva frente a Mascotas: en vez de pedir correo antes de usarla (el gate de Mascotas), se le preguntó al usuario y eligió explícitamente **"local + sync perezoso"** — el corazón del catálogo sigue siendo 100% instantáneo y local mientras no hay un correo conocido; apenas aparece uno (por checkout o por el email gate de Mascotas), se sincroniza a Vendure en segundo plano sin bloquear nada ni perder lo que ya hubiera guardado.

Plugin nuevo `patilandia-vendure/src/plugins/patilandia-wishlist` (mismo molde que Mascotas/Reseñas). La verificación contra el servidor real y el browser real (Playwright contra Chrome del sistema) encontró y corrigió tres bugs reales que ni `tsc` ni el build hubieran detectado: dos de relaciones TypeORM no cargadas en el backend, y uno de React (un efecto secundario de red viviendo dentro de un callback de `setState`, duplicado por StrictMode en dev). Quedan 7 funcionalidades del roadmap sin empezar (Patipuntos, configurador de camitas, regalos, suscripciones, WhatsApp, analítica propia, proveedores). Detalle técnico completo en [[Decisiones y Razonamiento]] y estado en [[Pendientes Claude]].

## Estado rápido al 2026-09-11 (fin de sesión) — migración completa + SEO real + pulido post-migración

Las 7 fases del plan de migración Medusa → Vendure están hechas. Patilandia corre 100% sobre Vendure — catálogo, carrito, checkout, Dashboard de administración ("Patilandia Admin"). **Medusa ya no existe en el proyecto**: `patilandia-backend` se borró del disco por completo (a pedido explícito del usuario, con advertencia previa de que era irreversible por no tener commits ni remote), su contenedor Postgres se eliminó, y todo el código/env vars/copy que lo mencionaba en `patilandia` se limpió.

En la misma sesión, después de cerrada la migración, se resolvieron varios pendientes reales más:
- Idioma del Dashboard corregido a español (era una config aparte del idioma de contenido del canal).
- ESLint migrado a flat config — corría en cero desde hacía tiempo, ahora corre limpio en cero errores/warnings.
- Impuesto corregido al 19% real de Colombia (no era la zona "Americas" como se creía, era "Europe" — se verificó contra la DB antes de asumir).
- SEO real: `generateMetadata` dinámico en producto/categoría, `sitemap.xml`/`robots.txt`, `<h1>` real (sr-only) en el home, meta description reescrita con copy orientado a búsqueda en vez de mencionar el stack técnico.
- Catálogo: filtro de precio, filtro de disponibilidad (reveló y corrigió que `stock` estaba hardcodeado desde la Fase 3), paginación.

Ver [[Decisiones y Razonamiento]] para el detalle técnico completo de cada pieza y [[Pendientes Claude]] para lo que queda suelto (nada urgente: `synchronize`/migración real de Vendure antes de producción, facet color huérfano cosmético, Wompi/Mercado Pago diferidos, límites de branding del Dashboard nativo, roadmap de funcionalidades propias de Patilandia sin empezar).

## Estado rápido al 2026-09-10 — arranca la migración Medusa → Vendure

El usuario pidió reemplazar Medusa por Vendure (GraphQL, PostgreSQL, Dashboard React extensible), manteniendo el storefront Next.js propio intacto. Se hizo la auditoría completa, se aprobó un plan de 7 fases no destructivo, y se ejecutaron las **Fases 1 y 2**: Vendure 3.7.3 corriendo en el repo hermano nuevo `patilandia-vendure` (Postgres aislado, puerto 6543), con el catálogo real de los 8 productos migrado a un modelo de datos correcto (Collections + Facets + ProductVariants reales, no un port literal del `metadata` de Medusa). Detalle técnico completo, bugs encontrados (incluido uno real de Vendure en Windows) y el estado fase-por-fase en [[Decisiones y Razonamiento]] y [[Pendientes Claude]].

**Medusa sigue intacto y es la fuente de datos real del storefront** — no se toca hasta que el storefront ya lea de Vendure (Fase 3+) y todo esté verificado. Ver [[Entorno de Desarrollo Local]] para cómo levantar ambos backends en paralelo.

**Update 2026-09-11 — Fase 3 hecha:** el storefront (`patilandia`) ya lee el catálogo real de Vendure (`src/lib/storefront.ts` → `src/lib/vendure/*`), no de Medusa. Cero cambios en componentes/rutas. Verificado con build + las 9 rutas reales. Medusa sigue corriendo intacto, sin usarse. Detalle en [[Decisiones y Razonamiento]] y [[Pendientes Claude]].

**Update 2026-09-11 — Fase 5 hecha, mismo día:** carrito y checkout dejaron de ser mock — `/carrito` y `/checkout` operan contra el `activeOrder` real de Vendure (sesión por bearer token en `localStorage`). Se implementó el pedido explícito del usuario: el correo se pide apenas hay algo en el carrito, antes de mostrar los ítems (confirmado que Vendure no impone ningún orden acá). Verificado con una simulación real de todo el flujo que terminó en una orden `PaymentAuthorized` persistida en Vendure. Pagos reales (Wompi/Mercado Pago) siguen diferidos a propósito. Detalle técnico completo en [[Decisiones y Razonamiento]].

**Update 2026-09-11 — Fase 6 hecha, mismo día:** nace "Patilandia Admin" — plugin propio (`patilandia-vendure/src/plugins/patilandia-admin`) sobre el Dashboard de Vendure: logo y bienvenida propios en el login, paleta de marca violeta/dorado en toda la interfaz, sección "Patilandia" nueva en el menú con una página placeholder "Mascotas" que prueba el patrón plugin→Dashboard de punta a punta. Se investigó a fondo (código fuente de `@vendure/dashboard`, no solo doc) qué tan lejos llega la personalización hoy — el techo real es el logo de login + colores, nada más, coherente con la estrategia híbrida de admin ya decidida. Solo queda la Fase 7 (baja de Medusa) del plan original. Detalle en [[Decisiones y Razonamiento]] y [[Pendientes Claude]].

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
