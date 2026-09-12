---
title: Decisiones y Razonamiento
date: 2026-09-04
tags:
  - claude
  - decisiones
  - arquitectura
---

# Decisiones y Razonamiento

> [!warning] Antes de revertir una decisión
> Leer el razonamiento completo. Varias de estas decisiones ya están reflejadas en código funcionando, no son solo intención.

## Formato de entrada

```
### [FECHA] Título de la decisión
**Contexto:** Por qué surgió esta decisión.
**Opciones evaluadas:** Qué alternativas se consideraron.
**Decisión:** Qué se eligió.
**Por qué:** Razonamiento técnico detallado.
**Impacto:** Qué afecta esta decisión.
```

---

### [2026-09-12] Patipuntos — contraentrega no gana puntos hasta que se confirma la entrega

**Contexto:** el usuario notó, después de terminar Patipuntos, que otorgar `PURCHASE`/`FIRST_PURCHASE` en `PaymentAuthorized` está bien para pago prepago (la plata ya está asegurada) pero es incorrecto para contraentrega — en ese caso `PaymentAuthorized` solo significa "el pedido quedó armado", el cliente todavía puede rechazarlo. Exactamente el mismo error que ya se había evitado con "no dar puntos por pedidos cancelados".

**Decisiones acordadas explícitamente con el usuario antes de programar:**
1. La confirmación de entrega la hace el admin a mano desde el Dashboard, usando el flujo nativo de fulfillment de Vendure (no hay integración de transportadora todavía, así que no tenía sentido construir nada más automático).
2. Contraentrega no existía como método de pago — se creó un scaffold real (`cash-on-delivery`), reusando el mismo `dummy-payment-handler` que ya usa `standard-payment` (ninguno de los dos tiene pasarela real todavía, así que no hacía falta un handler nuevo, solo un código distinto para que Patipuntos pueda diferenciarlos).

**Arquitectura:** el disparador de `PURCHASE`/`FIRST_PURCHASE` pasó a depender del método de pago de la orden (`order.payments[].method`). Prepago sigue premiando en `PaymentAuthorized`, exactamente como antes. Contraentrega se salta ese paso y espera un nuevo listener sobre `OrderStateTransitionEvent → Delivered`. La lógica de otorgamiento (antes un solo bloque) se extrajo a una función compartida `awardPurchaseAndFirstPurchase`, invocada desde cualquiera de los dos disparadores — un pedido prepago que además llegue a `Delivered` más adelante no duplica nada, porque `award()` ya es idempotente por diseño (la comprobación de método de pago evita incluso el intento redundante). Nada que revertir si un pedido contraentrega se cancela antes de la entrega, porque nunca se llegaron a otorgar puntos — más seguro por construcción que "otorgar y después revertir".

**Hallazgo real, no asumido:** `Delivered` **no es alcanzable directamente desde `PaymentAuthorized`** en la máquina de estados de Vendure — hace falta pasar primero por `PaymentSettled` (el admin tiene que liquidar el pago explícitamente, `settlePayment`, algo que para contraentrega representa "el transportador cobró el efectivo"), después crear un Fulfillment, y recién ahí transicionarlo a `Shipped` y `Delivered` (el estado de la orden sigue automáticamente). Se verificó contra el servidor real: intentar `Delivered` directo desde `PaymentAuthorized`, o incluso desde `PaymentSettled` sin un Fulfillment ya en `Delivered`, es rechazado por las propias guardas de Vendure. Quedó documentado en el código exactamente qué pasos tiene que hacer el admin.

**Storefront:** el checkout ahora tiene un selector real de método de pago ("Pago en línea" / "Pago contraentrega"), y el mensaje post-compra distingue los dos casos — prepago dice "¡Ganaste N Patipuntos!" (inmediato), contraentrega dice "Vas a ganar N Patipuntos" + "se acreditan apenas confirmemos que recibiste tu pedido" (evita prometer algo que todavía no pasó, mismo criterio de "no ser engañoso" del brief original).

**Verificado de punta a punta contra el servidor real:** pedido contraentrega llega a `PaymentAuthorized` → cero puntos de compra (solo el `SIGNUP` de antes). Se liquida el pago, se crea el fulfillment, se transiciona a `Shipped` y `Delivered` → recién ahí se acreditan `PURCHASE`+`FIRST_PURCHASE`. Prueba de regresión en paralelo: un pedido prepago sigue ganando de inmediato en `PaymentAuthorized`, y si ese mismo pedido prepago también llega más tarde a `Delivered`, no duplica nada. Verificado también en el navegador con Playwright (selector de método de pago, mensaje de confirmación diferenciado, sin errores de consola).

---

### [2026-09-12] Patipuntos — sistema de fidelización completo (ganar + canjear), cuarto plugin propio

**Contexto:** El usuario pidió un sistema de fidelización completo con un brief extremadamente detallado (economía configurable, ledger auditable, anti-fraude, extensible a campañas). Pidió explícitamente arquitectura + plan aprobado antes de programar (se usó Plan Mode: 3 agentes de exploración + 1 de validación de arquitectura, todo verificado contra el código real de `@vendure/core` instalado, no la documentación — ver el plan completo en el historial de la sesión).

**Hallazgo que cambió el alcance:** la identidad por correo (igual a Mascotas/Wishlist) no verifica nada — cualquiera escribe un correo inventado. Sin canje eso es cosmético; con canje es plata regalable sin fricción (signup+mascota+reseña ≈ 250 puntos ≈ $2.500 COP gratis, repetible). Se lo planteé al usuario con el argumento de costo de fraude, no solo "menos trabajo". El usuario decidió: construir el ciclo completo (ganar **y** canjear) ya, pero el canje exige **señales reales de confianza** en vez de una regla arbitraria de antigüedad — cuenta creada + **correo verificado** (mini flujo propio) + **al menos una compra real completada**. Diseñado como lista extensible de chequeos (`LoyaltyEligibilityService`), no un `if` rígido.

**Arquitectura — plugin nuevo `patilandia-vendure/src/plugins/patilandia-loyalty`:**
- `LoyaltyAccount` (saldo cacheado + contadores), `LoyaltyTransaction` (el ledger, append-only, con `idempotencyKey` único), `LoyaltyRule` (economía configurable — código, `FLAT`/`PER_CURRENCY_UNIT`, activable/desactivable, editable desde el Dashboard sin deploy), `LoyaltySettings` (valor del punto y % máximo de canje, singleton), `LoyaltyVerificationToken` (verificación de correo propia, sin contraseña — **no** la nativa de Vendure, que exige un `User` real con password, justo la autenticación que el proyecto tiene diferida).
- **Anti-duplicados:** cada transacción lleva una `idempotencyKey` determinística; el servicio inserta esa fila primero, sola, y solo si entra bloquea la cuenta y actualiza el saldo — un choque de unicidad se trata como "ya se otorgó", no como error (necesario porque en Postgres una sentencia fallida envenena el resto de la transacción).
- **Verificación de correo:** magic link propio (`requestLoyaltyEmailVerification`/`confirmLoyaltyEmailVerification`), token hasheado en DB, expira a los 30 min, cooldown de reenvío. Nuevo `EmailEventHandler` (`loyaltyVerificationHandler`) sumado a los `defaultEmailHandlers` del `EmailPlugin` ya configurado, con plantilla propia calcada de las que ya existen.
- **Cuándo se gana:** `OrderStateTransitionEvent → PaymentAuthorized` (única señal de "compra válida" en esta app, confirmado que `refundOrder` ni siquiera es alcanzable con el checkout actual), `CustomerEvent('created')` para el bono de registro, eventos propios nuevos (`PetProfileCreatedEvent`, `ProductReviewApprovedEvent`) publicados por Mascotas/Reseñas y consumidos solo por Loyalty (nadie más los conoce — mismo patrón de desacople que ya usa `OrderStateTransitionEvent`), y una `ScheduledTask` diaria para el bono de cumpleaños (reutilizando el `DefaultSchedulerPlugin` que ya estaba activo, nunca usado hasta ahora).
- **Canje — una sola transacción:** `applyLoyaltyRedemption` valida dueño de la orden + elegibilidad + tope (mínimo entre lo pedido, el saldo y el 20% del subtotal), y en la misma transacción inserta el `REDEEM`, descuenta el saldo y llama `addSurchargeToOrder` — si el surcharge falla, el débito se revierte con él. Se aplica una sola vez, justo antes de `placeOrder()`, no como un paso separado de "reservar" — evita necesitar un ciclo de vida de reserva/liberación aparte, aceptando como límite conocido y documentado que un canje aplicado fuera del flujo normal de la UI y luego abandonado quedaría huérfano (Vendure tampoco expira carritos solo).
- **Reconciliación diaria** (misma tarea programada): corrige el desvío de puntos por cancelación parcial o `modifyOrder` (alcanzables hoy desde el Dashboard de Admin sin pasarela real, y ninguno dispara `Cancelled`) y libera canjes huérfanos de pedidos viejos nunca completados.

**Bugs reales encontrados y corregidos, todos por verificación contra el servidor y el navegador real (no por tipos):**
1. Dos condiciones de carrera reales: la cuenta se creaba dos veces en paralelo (el propio resolver y el handler de `SIGNUP` corriendo al mismo tiempo) y eso hacía que el propio `CustomerService.createOrUpdate` de Vendure chocara al asignar el canal dos veces — se resolvió evitando la llamada redundante, no reintentando.
2. TypeORM no puede inferir el tipo de columna para campos `string | null` sin un `type` explícito (`ruleCode`, `referenceType`, `referenceId` tiraban `DataTypeNotSupportedError` al arrancar).
3. Guardar una `Order` directamente (no vía `OrderService`) requiere que `lines` y `surcharges` estén cargados — si no, los getters computados de Vendure (`discounts`, `taxSummary`) explotan al persistir.
4. El chequeo de "ya hay un canje activo" no contemplaba que el ledger es inmutable — después de quitar un canje, la fila original seguía existiendo y bloqueaba canjes nuevos. Se corrigió calculando el neto de REDEEM+REVERSAL en vez de "¿existe alguna fila?".
5. **Bug real y grave, preexistente, no de Patipuntos:** `updateCustomerName` en `store-provider.tsx` leía `order?.customerEmail` de un closure obsoleto — en el primer checkout de un cliente nuevo, esta llamada (inmediatamente después de `setCustomerEmail`) sobreescribía el correo del pedido a `""`. Afectaba a **todo primer checkout desde que existe Fase 5**, no solo a Patipuntos — el mensaje de confirmación mostraba "Te escribimos a  con los detalles" (correo vacío) y el pedido quedaba asociado a un cliente fantasma. Se corrigió pasando el correo explícito como parámetro en vez de leerlo del estado.
6. El subtotal que usa el checkout para mostrar precios es `subTotalWithTax` (con el 19% de IVA), pero el backend calcula los puntos y el tope de canje sobre `subTotal` (sin impuesto) — la estimación de "ganaste N puntos" usaba el campo equivocado y mostraba ~19% de más. Se agregó `OrderSummary.productSubtotal` (el campo correcto) y se lo usó específicamente en los cálculos de Patipuntos, dejando `subtotal` intacto para la visualización de precios. Verificado que la estimación coincide exactamente con el monto real acreditado (288 = 288) tras el fix.

**Descubrimiento no obvio, documentado en el código:** un `Surcharge` (el descuento de Patipuntos) sí reduce `Order.subTotal` en esta versión de Vendure — contradice lo que decía la documentación consultada antes de implementar, pero verificado empíricamente contra el servidor real. Resultó ser deseable: significa que canjear puntos no permite "farmear" más puntos sobre la porción ya descontada del mismo pedido.

**Storefront:** `patipuntos-client.ts` (mismo patrón `shopFetch` que los demás), `AccountPatipuntosCard` (calco de `AccountPetsCard`), `/cuenta/patipuntos` con `PatipuntosManager` (saldo, valor en COP, elegibilidad con motivos, banner de verificación, "cómo ganar puntos", historial), `/patipuntos/verificar` (recibe el token del email), widget de canje en el checkout (slider, tope calculado en cliente pero siempre revalidado en `applyLoyaltyRedemption`, aplicado una sola vez justo antes de `placeOrder()`), mensaje "¡Ganaste N Patipuntos!" en la confirmación.

**Verificado de punta a punta, no asumido:** secuencia completa contra el servidor real por GraphQL (SIGNUP → PET_REGISTERED → verificación de correo con el token real del mailbox de dev → compra real → PURCHASE+FIRST_PURCHASE → elegibilidad → canje con recorte automático → cancelación de orden con reversa completa de ambas transacciones — la aritmética cerró exacta en un escenario con 2 ciclos de canje) y con Playwright contra Chrome del sistema simulando el flujo real del storefront (primera compra → mensaje de puntos ganados → verificar correo → segunda compra canjeando el máximo → total con descuento reflejado → estimación exacta contra el ledger real). `typecheck`/`lint`/`test` (34/34)/`build` (17/17 páginas) limpios en `patilandia`, `tsc --noEmit` limpio en el server y sin errores propios en el Dashboard de Vendure (4 extensiones de Dashboard detectadas correctamente).

**Impacto:** el admin ya puede cambiar toda la economía (tasa de puntos, valor del punto, % máximo de canje, activar/desactivar reglas) desde el Dashboard sin tocar código — verificado en vivo (bajar SIGNUP de 100 a 80 puntos se reflejó de inmediato en una cuenta nueva). Quedan preparados pero sin construir: campañas/multiplicadores (el seam `getActiveMultiplier` ya existe), expiración activa (campos listos, sin job de barrido), `REVIEW_WITH_PHOTO` (sembrada pero inerte, `ProductReview` no tiene campo de foto todavía), y un dashboard de métricas avanzadas (la data ya es consultable vía `loyaltyTransactions`/`loyaltyAccounts`). Ver [[Pendientes Claude]].

---

### [2026-09-12] Wishlist real — tercer plugin propio, con "local + sync perezoso" en vez del gate de correo de Mascotas

**Contexto:** Primer ítem del roadmap restante (de los 8 que quedaban tras Reseñas/Mascotas/Recomendaciones). A diferencia de Mascotas, la wishlist ya existía como feature 100% funcional (local, `localStorage`) y se usa desde un corazón de un solo tap en cualquier card del catálogo — copiar el patrón de Mascotas literalmente (pedir correo antes de usarla) habría metido fricción nueva en una acción que hoy es instantánea. Se le preguntó al usuario explícitamente cómo resolver la tensión "necesita `Customer` en Vendure" vs. "el corazón no puede pedir nada".

**Opciones evaluadas:**
- Gate como Mascotas: primer uso pide correo antes de continuar. Real desde el día uno, pero agrega fricción a una acción de un tap.
- Local + prompt opcional no bloqueante después del primer click.
- **Local + sync perezoso:** el corazón sigue 100% instantáneo y local (como hoy) mientras no haya un correo conocido; en el momento en que un correo se vuelve conocido (checkout o el email gate de Mascotas), se sincroniza en segundo plano hacia Vendure sin bloquear nada.

**Decisión:** la tercera opción, elegida explícitamente por el usuario.

**Arquitectura — backend:** plugin nuevo `patilandia-vendure/src/plugins/patilandia-wishlist`, mismo molde que Mascotas/Reseñas: entidad `WishlistItem` (FK a `Customer` y a `Product`, ambas `onDelete: 'CASCADE'`, sin constraint único en DB — el dedupe es a nivel de servicio, igual de simple que el resto del proyecto), servicio con `add`/`remove` idempotentes y un `sync(customerEmail, productIds)` que **fusiona sin nunca borrar** — pensado específicamente para el momento en que se conoce el correo por primera vez y hay que empujar lo que ya se había guardado localmente, sin perder nada que ya existiera del lado del servidor (ej. de otro dispositivo). `sync` tolera ids de producto inválidos (localStorage viejo apuntando a un producto borrado) salteándolos en vez de romper todo el merge — `add`/`remove` sí son estrictos porque vienen de una acción real del usuario sobre un producto que existe en pantalla. Shop API: `myWishlist`, `addToWishlist`, `removeFromWishlist`, `syncWishlist`. Admin API de solo lectura + borrado de soporte (`wishlistItems`, `adminRemoveWishlistItem`), con página nueva en el Dashboard (tabla simple, mismo patrón que Mascotas) en la sección "Patilandia" ya existente.

**Arquitectura — storefront:** `wishlist` en `store-provider.tsx` pasa de guardar **slugs** a guardar **`StorefrontProduct.id`** (el campo que ya existía desde Reseñas, con fallback al slug en mocks) — necesario porque Vendure identifica productos por id, no por slug. Se actualizaron los 4 call sites (`ProductCard`, `ProductDetail`, `WishlistPage`, `AccountWishlistCard`). La identidad de correo reutiliza literalmente `getStoredAccountEmail`/`storeAccountEmail` de `pets-client.ts` (clave `patilandia-account-email`) — unificando: ahora el flujo de checkout (`setCustomerEmail`) también graba ese mismo correo si todavía no estaba guardado, así un correo conocido por cualquiera de los dos caminos (carrito o Mascotas) alimenta el sync de la wishlist.

**Bug real encontrado en la verificación contra el servidor y el browser real (no solo por tipo):** dos bugs de relaciones de TypeORM no cargadas (`findForCustomerEmail` no traía `relations: ['customer']`, y el camino idempotente de `add()` no traía relaciones en absoluto) rompían con "Cannot return null for non-nullable field" apenas un caller pedía esos campos — invisibles a `tsc` porque el tipado de TypeORM no fuerza relaciones cargadas en tiempo de compilación. Y un bug más sutil en React: `toggleWishlist` originalmente disparaba la llamada de red **desde dentro** del callback de `setWishlist`, que React (StrictMode, en dev) invoca dos veces para detectar funciones impuras — el corazón terminaba mandando `addToWishlist` duplicado por cada click. Se sacó el efecto secundario del callback (que ahora es puro), confirmado con Playwright contra Chrome del sistema que un click produce exactamente una llamada de red.

**Verificado, no asumido:** secuencia completa contra Vendure real vía curl (sync con id inválido mezclado, add idempotente, remove, confirmación en Admin), y en el browser real con Playwright (Chrome del sistema, mismo mecanismo ya usado el 2026-09-09 por falta de red para el Chromium embebido): corazón instantáneo sin correo conocido → aparece en `/wishlist` → se establece el correo vía el gate de Mascotas → el siguiente corazón dispara `addToWishlist` una sola vez → recarga de página conserva todo. Cero errores de consola. `typecheck`/`lint`/`test` (34/34) limpios en `patilandia`, `tsc --noEmit` limpio en el server de Vendure, y `tsc --noEmit -p tsconfig.dashboard.json` sin errores propios del plugin nuevo (mismo ruido preexistente de siempre).

**Impacto:** patrón "local + sync perezoso" queda documentado como alternativa válida al gate de Mascotas para futuras funcionalidades "de cliente sin login" que además necesiten permanecer instantáneas (ej. si Patipuntos alguna vez necesitara una acción de un tap). Ver [[Pendientes Claude]].

---

### [2026-09-11] Recomendaciones de producto — reemplazo real de "Relacionados", sin necesitar un plugin nuevo

**Contexto:** Tercer ítem del roadmap. A diferencia de Reseñas y Mascotas, esta funcionalidad resultó no necesitar backend nuevo: `producto/[slug]/page.tsx` ya venía llamando a `getFallbackRelatedProducts()`, que SIEMPRE filtraba contra el array mock hardcodeado (`data/mock-store.ts`), sin importar si el producto que se estaba viendo venía de datos reales de Vendure o no — un bug real, no solo deuda técnica cosmética, documentado desde el trabajo de SEO del 2026-09-11 y señalado explícitamente como candidato a resolverse acá.

**Decisión:** No se construyó un plugin Vendure nuevo — el catálogo real ya trae todo lo necesario (Facets de categoría/tema/petType, ya modelados desde la Fase 2 de la migración). Se reemplazó la función mock por `getRelatedProducts()` real en `storefront.ts`, que combina dos señales en vez de solo "más de lo mismo":
- **"Más como este":** misma categoría, con la misma colección/tema como desempate — para comparar opciones parecidas.
- **"Va bien con esto":** categorías complementarias vía un mapa explícito (`COMPLEMENTARY_CATEGORIES` — camitas ↔ accesorios/alimentos/higiene, etc.) — cross-sell real (ej. quien mira una cama también puede necesitar snacks o arena), que la similitud pura nunca puede producir por sí sola. El usuario lo pidió explícitamente al revisar el primer resultado ("si compran un cojín me gustaría que sugieran un snack o arena si la mascota es un gato").

Ambos pools se filtran primero por compatibilidad de `petType` (un juguete para perro no es una sugerencia útil bajo un producto de gato) y se intercalan — no se concatenan — para que el cross-sell realmente aparezca en el resultado en vez de perder siempre contra las coincidencias de la misma categoría. Dentro del pool complementario, además, se alterna una por categoría (no se ordena todo junto por rating) — se encontró que con el catálogo real (todos los productos en rating 0 hoy, sin reseñas aún) ordenar solo por rating dejaba que camitas (6 productos) taparan completamente al único snack por simple empate; alternar por categoría garantiza que cada categoría complementaria con stock aparezca. Si después de ambos pools sigue faltando para completar el límite, se rellena con cualquier otro producto compatible por rating (evita una sección vacía para una categoría sin pareja configurada todavía, ej. "ropa"). Hereda el fallback a mocks automáticamente porque llama a `getStorefrontProducts()` en vez de reimplementarlo.

**Por qué no un plugin:** las funcionalidades anteriores (Reseñas, Mascotas) necesitaban modelar datos nuevos que Vendure no tiene (una reseña, un perfil de mascota). "Productos parecidos por categoría/tema" ya es 100% derivable de datos que Vendure ya expone — construir un plugin solo para esto habría sido complejidad sin necesidad. Queda documentado como v1 honesta: es un recomendador por similitud de catálogo, no personalización por historial de compra — eso sí necesitaría datos de órdenes/Patipuntos acumulados, y es un paso natural futuro sobre esta misma base si se quiere.

**Testing:** se extrajo la lógica a una función pura `rankRelatedProducts(product, allProducts, limit)`, separada del wrapper async que hace el fetch — mismo criterio ya aplicado a `adapters.ts`/`shipping.ts` (probar lógica pura, no mockear red). 7 tests (`storefront.test.ts`): excluye al propio producto, prioriza tema+categoría sobre categoría sola, cross-sell real (el escenario exacto que dio el usuario: cama de gato → sugiere snack y arena de gato, nunca un juguete de perro), nunca sugiere `petType` incompatible ni siquiera como relleno, rellena cuando una categoría no tiene pareja configurada, no deja que una categoría con más stock tape a una con un solo ítem (el caso real del cojín/snack), y respeta el límite.

**Verificado:** contra el servidor real — "Camita Galaxy Orbit" ahora recomienda una mezcla real de otras camitas + el cojín + el snack (antes solo mostraba camitas); "Cojín Artesanal Nube" (sin otros accesorios en el catálogo) recomienda camitas Y el snack, no solo camitas — confirmando que el ajuste de alternancia por categoría funciona con datos reales, no solo en los tests sintéticos. `typecheck`/`lint`/`test` (34/34, antes 27) limpios.

**Impacto:** función mock `getRelatedProducts` de `mock-store.ts` eliminada (quedó sin uso). Deja una base reutilizable — el mismo scoring por Facets es el punto de partida obvio si más adelante se quiere sumar señal de comportamiento real (compras, Patipuntos) en vez de solo similitud de catálogo. Ver [[Pendientes Claude]].

---

### [2026-09-11] Perfiles de mascotas — segundo plugin propio, identidad por correo sin login real

**Contexto:** Segundo ítem del roadmap de 10 funcionalidades propias (orden a criterio de Claude, delegado por el usuario). A diferencia de Reseñas, esta funcionalidad es inherentemente "de un cliente" — un perfil de mascota le pertenece a alguien — lo que choca de frente con que la autenticación de clientes está explícitamente diferida (ver "Correctamente diferido" en [[Pendientes Claude]]). Había que resolver esa tensión sin construir login real.

**Opciones evaluadas:**
- Guardar los perfiles 100% en `localStorage`, como el wishlist — más simple, pero no es un "plugin sobre Vendure" real (no aparece en el Dashboard, no sirve de base para recomendaciones/Patipuntos que sí necesitan verlo desde el backend), y se pierde si el cliente cambia de navegador.
- Construir autenticación real de clientes (password) para poder usar `activeCustomer` de Vendure — descartado: es exactamente el trabajo que el brief pidió diferir, y hacerlo "de paso" para esta funcionalidad sería una decisión de alcance que no corresponde tomar sola.
- Identificar al cliente solo por correo, sin contraseña — mismo nivel de confianza que ya tiene el carrito (`setCustomerEmail` en `shop-client.ts`, pedido explícito del usuario en la Fase 5).

**Decisión:** La tercera opción. Se confirmó que es un patrón que el propio Vendure sanciona explícitamente: `CustomerService.createOrUpdate()` — el mismo método que probablemente usa el resolver nativo de `setCustomerForOrder` — trae en su docblock oficial: *"For guest checkouts, we assume that a matching email address is the same customer."* Es decir, Vendure ya asume esta misma heurística para todo el checkout de invitado; usarla acá para "iniciar sesión" con solo el correo no es una desviación del proyecto, es el mismo modelo de confianza ya presente en el checkout, aplicado a una superficie nueva.

**Arquitectura:** Plugin `patilandia-vendure/src/plugins/patilandia-pets`, mismo molde que `patilandia-reviews`: entidad `PetProfile` (FK a `Customer` de `@vendure/core`, `onDelete: 'CASCADE'`), servicio con `findForCustomerEmail`/`create`/`update`/`delete` (estos dos últimos verifican que el `customerEmail` recibido coincida con el dueño real antes de tocar el registro — no es seguridad real, es honestidad: evita que alguien borre la mascota de otro por simple prueba y error de IDs consecutivos, aunque conocer el correo exacto de alguien sigue alcanzando para verla, limitación explícita) y extensiones de schema separadas (Shop API pública: `myPetProfiles`, `createPetProfile`, `updatePetProfile`, `deletePetProfile`; Admin API de solo lectura + borrado de soporte: `petProfiles`, `adminDeletePetProfile`, bajo `Permission.ReadCustomer`/`DeleteCustomer` — los permisos nativos de Vendure para datos de cliente, no los de Catálogo que usa Reseñas).

**Dashboard:** la página placeholder "Mascotas" de la Fase 6 (vivía en `patilandia-admin/dashboard/index.tsx`) se reemplazó por la real, movida al nuevo plugin `patilandia-pets/dashboard/index.tsx` en la misma ruta (`/patilandia/mascotas`) y la misma sección de navegación "Patilandia" — sin volver a declarar `navSections` (lección ya aprendida con Reseñas: declarar el mismo `id` de sección desde dos plugins duplica la sección visualmente). `patilandia-admin` ahora solo aporta el branding de login y la sección de navegación compartida, sin rutas propias.

**Storefront:** nueva ruta `/cuenta/mascotas` (`PetsManager`, componente cliente): sin correo guardado en `localStorage` (`patilandia-account-email`, clave nueva) muestra un formulario para "ingresar" solo con el correo; con correo guardado, lista las mascotas reales con alta/edición/borrado. La tarjeta "Mascotas" de `/cuenta` (antes "Próximamente") ahora es `AccountPetsCard`, con conteo real.

**Bug real encontrado y corregido durante la implementación:** una descripción GraphQL de varias líneas escrita con comillas simples (`"texto\ncontinúa"`) rompe el parser (`GraphQLError: Syntax Error: Unterminated string`) — las descripciones GraphQL de una sola comilla no soportan saltos de línea, hace falta bloque triple (`"""..."""`) o una sola línea. Tumbó el server al reiniciar; se corrigió uniendo la descripción en una sola línea.

**Verificado:** secuencia completa contra el servidor real — crear mascota desde un correo nuevo (crea el Customer automáticamente vía `createOrUpdate`), listarla por correo, actualizarla con el correo correcto, confirmar que un correo distinto es rechazado sin revelar que la mascota existe ("Perfil de mascota no encontrado" en ambos casos), verla en la consulta de Admin con los datos del dueño, borrarla. `npx tsc --noEmit` limpio en server y Dashboard (solo ruido preexistente de `node_modules`/módulos virtuales). En `patilandia`: `typecheck`/`lint`/`test` (27/27) limpios, `build` con las 15 páginas generadas (nueva `/cuenta/mascotas` incluida).

**Impacto:** el patrón "identidad por correo, sin login" queda validado y documentado para reutilizar en las próximas funcionalidades que también son "de un cliente" — Patipuntos y Wishlist-en-Vendure son las siguientes candidatas obvias del roadmap que se benefician directamente de este mismo mecanismo. Ver [[Pendientes Claude]].

---

### [2026-09-11] Reseñas de producto — primer plugin propio de Patilandia sobre Vendure (backend + Dashboard + storefront)

**Contexto:** Tras terminar la migración a Vendure, el usuario dejó a criterio de Claude el orden de las 10 funcionalidades propias de Patilandia pendientes (perfiles de mascotas, Patipuntos, reseñas, recomendaciones, etc.). Se eligió Reseñas primero por ser autocontenida (no depende de autenticación de clientes, diferida a propósito) y por su valor de SEO real vía structured data (`AggregateRating`/`Review`), que además tapa el hueco de que `Product.customFields.rating/reviewCount` habían quedado con datos fabricados del seed original (ej. "4.9 estrellas, 124 reseñas" sin una sola reseña real detrás).

**Decisión — arquitectura:** plugin Vendure independiente `patilandia-vendure/src/plugins/patilandia-reviews`, mismo molde que `patilandia-admin` (Fase 6): entidad TypeORM propia (`ProductReview`, FK a `Product` con `onDelete: 'CASCADE'`), servicio (`ProductReviewService`), extensiones de schema separadas para Admin API (moderación: `productReviews`, `approveProductReview`, `rejectProductReview`, `deleteProductReview`, todas detrás de `@Allow(Permission.*Catalog)`) y Shop API (pública, sin login: `productReviews(productId)` solo-aprobadas, `submitProductReview` — auth de clientes sigue diferida, así que cualquiera puede dejar reseña, exactamente como en la mayoría de tiendas reales que no exigen cuenta para reseñar). Aprobar/rechazar/borrar una reseña recalcula `Product.customFields.rating/reviewCount` vía `AVG`/`COUNT` sobre las reseñas aprobadas — el storefront y el JSON-LD ya leían ese campo, así que no hubo que tocar nada más para que empezaran a mostrar números reales.

**Decisión — Dashboard de moderación:** se evaluó el framework `DataTable`/`PaginatedListDataTable` de `@vendure/dashboard` (tipado fuerte vía `TypedDocumentNode` + `@tanstack/react-query`/`react-table`, pensado para integrarse con el codegen GraphQL del propio Dashboard) contra usar directamente el cliente `api` más simple que exporta el paquete (`api.query`/`api.mutate`, misma clase `AwesomeGraphQLClient` que ya maneja el token de sesión en `localStorage`). Se eligió el cliente simple: el framework tipado exige wiring de codegen que no estaba montado para este plugin y no aportaba nada que una tabla hecha a mano con los componentes `Table`/`Badge`/`Button` del propio Dashboard no resolviera igual de bien para una cola de moderación con pocas filas. Página nueva en `patilandia-reviews/dashboard/index.tsx`, agregada a la sección de navegación "Patilandia" ya creada en la Fase 6 (sin volver a declarar `navSections` — declarar el mismo `id` dos veces desde dos plugins duplicaba la sección en la barra lateral, confirmado leyendo `addNavMenuSection`/`addNavMenuItem` en el código fuente de `@vendure/dashboard`; alcanza con referenciar `sectionId: 'patilandia'` en el `navMenuItem` de la ruta nueva). Tabs cliente-side (Pendientes/Publicadas/Todas) con acciones Aprobar/Ocultar/Eliminar.

**Decisión — storefront:** `StorefrontProduct` ganó un campo `id` real (antes no existía — no hacía falta hasta ahora) para poder pedir/enviar reseñas por producto; los productos mock/fallback usan el `slug` como `id` de relleno (sin reseñas reales posibles ahí, coherente con el resto del fail-soft del proyecto). Nuevo componente `ProductReviews` (lista + formulario de envío) en la página de producto, y un componente `RatingStars` compartido que reemplaza el patrón viejo de "siempre 5 estrellas doradas sin importar el rating real" (activamente engañoso para productos en 0) por relleno proporcional al rating real, con el texto "Sin reseñas todavía" en vez de "0.0 (0 reseñas)" en `ProductCard` y `ProductDetail` cuando `reviewCount` es 0.

**JSON-LD:** `producto/[slug]/page.tsx` (componente servidor) genera `<script type="application/ld+json">` con `Product`/`Offer` siempre, y `aggregateRating`/`review` **solo cuando hay datos reales** (`reviewCount > 0` / hay reseñas aprobadas) — se decidió omitir el bloque entero en vez de mandar `ratingValue: 0` a Google, que sería tan engañoso como las estrellas doradas falsas que se acaban de sacar del front.

**Verificado:** secuencia completa contra el servidor real corriendo — enviar reseña por la mutación pública (queda `approved: false`, oculta en la query pública), verla pendiente en Admin, aprobarla, verla aparecer en la query pública y en `Product.customFields.rating/reviewCount`, borrarla y confirmar que el agregado vuelve a 0/0. Página de producto real (`camita-castillo-real`) mostrando el JSON-LD completo con reseña real antes de limpiar los datos de prueba, y sin `aggregateRating`/`review` en el HTML después de borrarlos. `npx tsc --noEmit -p tsconfig.dashboard.json` sin errores propios (el ruido de `node_modules`/módulos virtuales de Vite es preexistente, no de este plugin). En `patilandia`: `npm run typecheck`, `npm run lint` (cero warnings) y `npm test` (27/27) limpios, `npm run build` con las 14 páginas generadas contra datos reales de Vendure.

**Impacto:** primer plugin propio construido de punta a punta (backend + Dashboard + storefront), sirve de plantilla de referencia más completa que "Mascotas" (que era solo un placeholder) para las próximas 9 funcionalidades del roadmap. Ver [[Pendientes Claude]].

---

### [2026-09-10] Migración de Medusa a Vendure — auditoría, plan y Fases 1-2 ejecutadas

**Contexto:** El usuario pidió reemplazar Medusa por Vendure como motor ecommerce, manteniendo el storefront Next.js/React/Tailwind propio (sin el storefront ni el dashboard genéricos de Vendure) y construyendo un "Patilandia Admin" sobre las extensiones oficiales del nuevo Vendure Dashboard (React, no el Admin UI Angular legacy). Pidió explícitamente auditoría + plan antes de cualquier cambio destructivo, y no borrar Medusa hasta que Vendure funcione y no queden dependencias activas.

**Auditoría (frontend `patilandia`):** gracias a la capa de adaptación ya decidida el 2026-09-03 (ver más abajo, "Capa de adaptación desacoplada"), la dependencia real de Medusa se reduce a 3 archivos: `src/lib/medusa/client.ts`, `src/lib/medusa/adapters.ts` y `src/lib/storefront.ts` (más las env vars `NEXT_PUBLIC_MEDUSA_*`). El resto de rutas/componentes solo pasan por `getStorefrontProducts()`/`getStorefrontProduct()` y no saben de dónde viene el dato — así que no se tocan hasta la Fase 3. Auditoría del backend (`patilandia-backend`): confirmado que no existe ninguna personalización real construida (los `src/modules`, `src/api/*`, `src/workflows`, `src/links`, `src/jobs`, `src/subscribers` son placeholders del scaffold) — el roadmap "Patilandia sobre Medusa Admin" de 7 fases documentado el 2026-09-04 nunca se empezó a construir. Solo hay que migrar el seed de 8 productos y el env config.

**Decisión — arquitectura objetivo:** repo hermano nuevo `patilandia-vendure` (mismo patrón que separar `patilandia-backend`, confirmado con el usuario), Postgres en un contenedor Docker completamente aislado del de Medusa (decisión explícita del usuario ante la pregunta directa: aislado vs. reutilizar contenedor), Vendure Dashboard (paquete `@vendure/dashboard`, React) en vez del viejo Admin UI Angular, GraphQL Shop API para el storefront. Plan de migración en 7 fases, progresivo y no destructivo, con checkpoint de confirmación del usuario antes de cada fase — documentado en detalle en el plan aprobado de la sesión (no se transcribe completo acá; ver [[Pendientes Claude]] para el estado fase por fase).

**Fase 1 ejecutada:** `npx @vendure/create patilandia-vendure --ci --db postgres --use-npm` scaffoldeó Vendure 3.7.3. El instalador trae su propio `docker-compose.yml` con Postgres ya bien configurado (puerto 6543, volumen, labels) — se descartó el contenedor Postgres manual que se había creado antes de correr el instalador, en favor del que ya trae el proyecto (más correcto: viene con volumen persistente y healthcheck, evita mantener dos configuraciones de infraestructura para lo mismo). De paso se encontró que el Postgres de Medusa (`patilandia-postgres`) estaba apagado desde el cierre de la sesión anterior — se reinició, no relacionado con el trabajo de Vendure.

**Fase 2 — diseño del modelo de datos (la parte que exige adaptar, no renombrar):** Medusa guardaba casi todo el negocio de Patilandia en un `metadata` JSON libre sobre un único variant "Única" por producto. Vendure tiene primitivas nativas mejores para cada pieza:
- `categorySlug` (camitas, juguetes, ...) y `collectionSlug`/theme (royal, galaxy, ...) → un Facet por dimensión (`category`, `theme`) + una Collection por cada FacetValue, con `filters: [facet-value-filter]` para que la membresía de la Collection se calcule sola (mecanismo estándar de Vendure, no una tabla de asignación manual).
- `petType` → Facet `pet-type` (valores `dogs`/`cats`; "all" simplemente no lleva ese FacetValue).
- Talla y color (antes un solo variant "Única" + campos sueltos en `metadata`) → ProductOptionGroups reales (`size`, `color`) con ProductVariants reales por combinación — esto **resuelve de raíz** la deuda técnica que Medusa nunca resolvió (ver la decisión "[2026-09-04] Esquema de metadata en Medusa" más abajo). Cada color lleva su hex real como customField en `ProductOption` (no en `ProductOptionValue` — esa entidad no admite customFields en esta versión de Vendure).
- Todo lo demás sin equivalente nativo (`materials`, `care`, `highlights`, `rating`, `reviewCount`, `badge`, `shortDescription`, `weightKg`, `shippingClass`) → customFields tipados en `Product`/`ProductVariant`/`Collection` (`highlights` usa el tipo `struct`, listas usan `list: true`) — declarados en `vendure-config.ts`.
- Precio: Vendure guarda `Money` como entero en la unidad menor de la moneda. COP tiene 2 decimales en la tabla ISO 4217 de Vendure (no está en su lista de monedas "zero-decimal" como JPY/KRW), así que $149.900 COP se guarda como `14990000`, no `149900` — de ahí la constante `MONEY_FACTOR` en el seed en vez de un número mágico.

**Bugs reales encontrados y corregidos durante la implementación (no eran errores de sintaxis, sino de modelo/API):**
1. `FacetService.create()` ignora el campo `values` de `CreateFacetInput` pese a que el tipo GraphQL lo acepta — esa parte la resuelve el resolver, no el servicio. Al llamar los servicios directamente (patrón "stand-alone script" de Vendure) hay que crear cada `FacetValue` a mano con `FacetValueService.create(ctx, facet, input)` después.
2. Mismo patrón en `ProductOptionGroupService.create()`: no acepta `options` (su tipo TS es `Omit<CreateProductOptionGroupInput, 'options'>`) — cada opción se crea aparte con `ProductOptionService.create(ctx, groupId, input)`.
3. `RequestContext` cachea el canal (moneda, idioma) al crearse. El script actualizaba el canal a COP/es pero seguía usando el mismo `ctx` creado antes del cambio para todo lo demás — las primeras variantes se crearon en USD igual. Fix: crear un `ctx` nuevo después de actualizar el canal.
4. `GlobalSettings.availableLanguages` bloquea qué idiomas puede usar un canal (`LANGUAGE_NOT_AVAILABLE_ERROR`) — hubo que habilitar `es` ahí antes de poder ponerlo como idioma del canal.
5. **Bug real de Vendure en Windows:** `LocalAssetStorageStrategy.filePathToIdentifier()` arma el identificador del asset con `path.join()` (separador de Windows, `\`), y ese identificador se concatena tal cual en la URL pública (`/assets/preview\aa\archivo.png`) — una URL inválida que ningún browser resuelve. Se corrigió con un `storageStrategyFactory` custom en `vendure-config.ts` que envuelve la estrategia default y normaliza `\`→`/` en `toAbsoluteUrl`. Verificado con `curl` que la imagen ya carga (200, `image/png`).
6. Los jobs asíncronos de `apply-collection-filters` pueden perder una carrera cuando el producto que hace falcet-match para una Collection se crea *después* de que la Collection ya existe (el job incremental no siempre alcanza a recomputar el estado final antes de que el script termine) — se agregó un paso final que vuelve a aplicar los mismos `filters` de cada Collection una vez creado todo el catálogo, forzando un recompute completo y confiable.

**Verificado end-to-end vía Shop API GraphQL** (no solo por la consola del seed): 8 productos, 96 variantes, precios en COP correctos, `customFields` (incluido el `struct` de `highlights`) devueltos correctamente, las 12 Collections con el conteo de variantes esperado, y las imágenes sirviendo con URLs válidas.

**Pendiente antes de considerar la Fase 2 cerrada del todo:** `dbConnectionOptions.synchronize` quedó en `true` (recomendado por el propio README de Vendure durante desarrollo inicial); falta generar la migración real con `npx vendure migrate` sobre una base limpia antes de tratar esto como listo para producción. Ver [[Pendientes Claude]].

**Impacto:** Medusa (`patilandia-backend`) sigue corriendo intacto — el storefront real todavía le lee el catálogo a él, no a Vendure. La Fase 3 (que si toca `patilandia`) no se hizo todavía; se confirma con el usuario antes de arrancarla.

---

### [2026-09-11] Fase 3 — el storefront pasa a leer de Vendure

**Contexto:** Con Vendure ya modelado (Fase 2), tocaba conectar el storefront real. Antes de tocar `patilandia`, se auditaron los componentes que realmente consumen `StorefrontProduct` (`ProductCard`, `ProductDetail`, `CatalogView`) para confirmar qué campos usa la UI de verdad — apareció que **la Fase 2 había dejado dos huecos reales**: `compareAtPrice` (precio tachado + badge de descuento, usado en `ProductCard` y `ProductDetail`) y `featured` (filtro del home) nunca se escribieron en Vendure, aunque el tipo `StorefrontProduct` sí los esperaba. Se corrigió antes de escribir el adaptador: `compareAtPrice` como customField nullable de `ProductVariant`, `featured` como customField boolean de `Product` (los 8 productos reales son `featured: true`, igual que en `data/mock-store.ts`), seed re-corrido.

**Decisión — arquitectura del adaptador:** mismo patrón exacto que ya existía para Medusa: `src/lib/vendure/client.ts` (`vendureFetch`, POST GraphQL a `NEXT_PUBLIC_VENDURE_SHOP_API_URL`, fail-soft — devuelve `null` en cualquier error de red o de GraphQL) + `src/lib/vendure/adapters.ts` (`adaptVendureProduct`, mapea el nodo `Product` de la Shop API a `StorefrontProduct`) + un solo cambio en `src/lib/storefront.ts` (la query GraphQL y la llamada a `vendureFetch` en vez de `medusaFetch`). **Cero cambios en componentes o rutas** — se cumplió la promesa que permitía la capa adaptadora desde el 2026-09-03.

**Detalles de mapeo que exigieron pensar, no solo copiar nombres:**
- `categoryLabel`/`collectionSlug`(theme)/`petType` salen de `facetValues` (no existe un campo plano equivalente en Vendure) — se pidió `name` además de `code` en la query para no inventar el label a partir del slug.
- `sizes`/`colors` (arrays completos de opciones disponibles, usados por el selector en `ProductDetail` y el filtro de talla en `CatalogView`) se derivan deduplicando las `options` de **todas** las variantes del producto — antes, con Medusa, no existía este problema porque solo había un variant "Única".
- `price`/`compareAtPrice` se leen de la **primera variante** y se dividen por 100 (`VENDURE_MONEY_FACTOR`) — hoy todas las variantes de un producto comparten precio, así que es una simplificación válida, documentada en el código para cuando deje de serlo.
- `next.config.ts` necesitó `images.remotePatterns` nuevo: las imágenes de Vendure son URLs absolutas de su asset server (`http://localhost:3000/assets/...`), a diferencia de los mocks/Medusa que usaban rutas relativas servidas por el propio Next.js.

**Por qué no se usó graphql-codegen/gql.tada todavía:** la query que necesita el storefront hoy es una sola (`products` con un fragment fijo) — se tipó a mano el shape exacto en `adapters.ts` (`VendureProduct`, `VendureProductVariant`, etc.), sin generar contra el schema completo. Es TypeScript estricto igual (nada usa `any`), simplemente no hay codegen de por medio. Si el catálogo de queries crece (checkout, cuenta, búsqueda), vale la pena reconsiderar — quedó anotado como pendiente, no descartado.

**Verificado, no asumido:** `npm run typecheck` limpio, `npm run build` completo (12/12 páginas; home y tienda se prerenderizan en build time con datos reales de Vendure, confirmando que el build tiene conectividad real, no solo el dev server), y las 9 rutas con `curl` mostrando nombres/precios/colores reales — incluido confirmar que el filtro por categoría (`/categorias/camitas`) de verdad excluye productos de otras categorías (se verificó por los `href` de cada card, no por buscar el nombre en el HTML crudo, porque el payload de hidratación de Next.js serializa la lista completa sin filtrar aunque el DOM visible sí esté filtrado — un falso positivo fácil de cometer al verificar). También se confirmó que el proxy de optimización de imágenes de Next.js (`/_next/image`) puede bajar los assets de Vendure en runtime, no solo que la URL aparece en el HTML.

**Impacto:** Medusa sigue corriendo, intacto, sin usarse — es la red de seguridad hasta la Fase 7. Este mismo trabajo satisface lo que pedía la Fase 4 (verificación de paridad) del plan original, así que no hizo falta un paso aparte.

---

### [2026-09-11] Fase 5 — carrito y checkout reales contra el `activeOrder` de Vendure

**Contexto:** El usuario pidió carrito/checkout reales y, específicamente, preguntó si se podía pedir el correo electrónico apenas el usuario entra a `/carrito` (antes de mostrar nada más), o si había que seguir el flujo "tal cual lo trae Vendure". Respuesta corta que se le dio: Vendure no impone ningún orden de UI — el Shop API es solo un conjunto de mutaciones (`addItemToOrder`, `setCustomerForOrder`, `setOrderShippingAddress`, `setOrderShippingMethod`, `transitionOrderToState`, `addPaymentToOrder`) y el storefront decide cuándo llamar a cada una. Pedir el correo primero es una decisión de UX nuestra, 100% soportada.

**Decisión — sesión del carrito:** Vendure soporta token de sesión por cookie o por bearer header. Se eligió **bearer token guardado en `localStorage`** (`src/lib/vendure/shop-client.ts`, key `patilandia-vendure-token`) en vez de cookies — evita toda la complejidad de CORS/`credentials: include`/`SameSite` entre el origen del storefront y el de Vendure (relevante ya en dev, con puertos distintos 3001/3000, y más todavía en producción con dominios distintos). Esto significa que las mutaciones de carrito solo pueden dispararse desde el cliente (donde vive el token) — encaja perfecto con `StoreProvider`, que ya era un componente 100% cliente desde el diseño original.

**Decisión — `StoreProvider` pasa de estado local a espejo del `activeOrder`:** se reemplazó el array `cart` en memoria/localStorage por un `order: OrderSummary | null` hidratado desde Vendure al montar, y cada mutación (`addToCart`, `updateQuantity`, `removeFromCart`, `setCustomerEmail`, etc.) llama al Shop API y reemplaza `order` completo con lo que Vendure devuelve — así el estado del cliente nunca se desincroniza del servidor. El wishlist se mantuvo intacto (sigue 100% local, Vendure no modela ese concepto); se le dio su propia key de `localStorage` (`patilandia-wishlist-v1`) ya que la vieja key compartida `patilandia-storefront-v1` dejó de tener sentido sin un carrito local.

**Gap real encontrado en el camino:** para agregar un producto real al carrito hace falta el ID de la variante exacta (talla+color), que la Fase 3 nunca expuso porque no hacía falta todavía. Se agregó `StorefrontProduct.variants?: {id, size, colorName}[]` (opcional — el fallback a mocks/Medusa, ya sin uso real, sigue compilando sin tocarlo) y `adaptVendureProduct` lo puebla desde las variantes reales.

**Gap real de la API de Vendure (no de nuestro código):** `setCustomerForOrder` exige `firstName`/`lastName`, no solo `emailAddress`, aunque el usuario solo quería pedir el correo. Se resolvió sin agregar fricción: el paso de `/carrito` manda un nombre placeholder derivado del correo, y el formulario de dirección del checkout (que sí pide nombre completo) corrige el registro del cliente llamando a `setCustomerForOrder` de nuevo con el nombre real — Vendure actualiza el mismo cliente de la orden, no crea uno duplicado.

**Infraestructura de Vendure que hizo falta cerrar para que el checkout funcionara de verdad:** el scaffold de `@vendure/create` ya trae, sin que la Fase 2 lo tocara, un método de pago (`standard-payment`, `dummy-payment-handler`) y dos de envío (`standard-shipping`/`express-shipping`, elegibles para cualquier pedido) con Colombia ya en la zona "Americas". Lo único que hacía falta corregir eran las tarifas de envío, que seguían en la escala de la sample data original (500/1000 ≈ $5-10, pensadas para USD) — script nuevo `patilandia-vendure/src/scripts/configure-checkout.ts` las deja en $12.000/$25.000 COP. La tasa de impuesto (20%, "Standard Tax Americas") se dejó sin tocar — no bloquea el flujo, pero no es el 19% real de Colombia; queda anotado como pendiente antes de producción.

**Verificado de punta a punta, no solo por tipo:** además de `npm run typecheck`/`npm run build` limpios, se simuló la secuencia completa de mutaciones por `curl` (agregar ítem → correo → nombre real → dirección → método de envío → transición a `ArrangingPayment` → pago) contra el Vendure real, confirmando en Postgres que la orden quedó creada con estado `PaymentAuthorized`, el cliente y el total correctos. De paso se encontró y corrigió un detalle de UX: la pantalla de confirmación del pedido no puede depender del mismo estado de "carrito activo" que se resetea después de pagar (para que `/carrito` vuelva a estar vacío en la próxima visita) — `placeOrder()` ahora devuelve el resumen de la orden completada directamente a quien lo llama, en vez de que el componente lo relea del contexto global.

**Impacto:** Medusa sigue sin usarse, intacto. Pagos reales (Wompi/Mercado Pago) siguen diferidos tal como estaba decidido — el punto de integración (`addPaymentToOrder`) ya existe y funciona con el handler dummy, listo para cuando se conecte un gateway real.

---

### [2026-09-11] Fase 6 — Patilandia Admin sobre el Dashboard de Vendure

**Contexto:** Tocaba personalizar visualmente el Dashboard de Vendure y probar el patrón de extensión plugin→Dashboard antes de construir las funcionalidades propias reales (mascotas, Patipuntos, etc.), tal como preveía el plan de migración.

**Investigación antes de escribir código (evitando adivinar la API):** se inspeccionó el código fuente de `@vendure/dashboard` instalado (no solo la doc) para entender qué es realmente "marca" en este Dashboard. Hallazgo clave: el wordmark de Vendure (`LogoMark`, un SVG) **solo se usa en la pantalla de login** (`login-form.tsx`) — la barra lateral de la app autenticada no tiene ningún logo, muestra el **Channel activo** (código/iniciales, vía `channel-switcher.tsx`, un patrón "team switcher" de shadcn). Esto cambia el objetivo de "reemplazar el logo de Vendure" a algo más preciso: el único logo reemplazable es el del login (hay un extension point oficial para eso, `login.logo`, desde Vendure 3.4), y lo demás de "marca" pasa por colores de tema, no por logos.

**Decisión — cómo se construyó:** se usó el flujo oficial (`npx vendure add -p PatilandiaAdmin` y luego `npx vendure add -d PatilandiaAdminPlugin`) para scaffoldear el plugin real en vez de escribir `defineDashboardExtension` a mano desde cero — así se partió de código generado y verificado por la propia CLI de Vendure, no de una API adivinada. Sobre ese scaffold:
- `login.logo` → logo real de Patilandia (`logo-rectangular.png`, copiado desde `patilandia/public/images/patilandia/` al plugin — los dos repos no comparten `public/`, así que el asset de marca vive duplicado ahí, es la única forma razonable dado que son proyectos separados).
- `login.beforeForm` → "Bienvenido a Patilandia Admin" en vez del texto genérico de Vendure.
- `theme.light`/`theme.dark` en `vite.config.mts` → paleta violeta/dorado real de `patilandia/src/app/globals.css` (`--brand-violet`, `--brand-violet-deep`, `--brand-soft`) mapeada a los tokens que expone el Dashboard (`primary`, `brand`, `sidebar`, `sidebar-primary`, `sidebar-accent`, etc.).
- `navSections` + `routes` → sección "Patilandia" nueva (ícono `PawPrint`, `placement: 'top'` para que aparezca primero) con una página "Mascotas" placeholder — no hace nada todavía a propósito, es la prueba de que el patrón plugin→Dashboard funciona de punta a punta antes de invertir en la funcionalidad real.

**Límite real de la plataforma, no de esfuerzo:** no existe ningún extension point (a la fecha, Vendure 3.7.3) para tocar el `<title>`/favicon de la SPA del Dashboard ni ocultar cualquier mención a Vendure fuera del logo de login — se confirmó leyendo el código fuente (`vendureDashboardPlugin`'s `VitePluginVendureDashboardOptions` no tiene esos campos) antes de intentar hackearlo vía edición de `node_modules` (deliberadamente evitado: no versionado, se pierde en cualquier reinstalación). Esto es exactamente el techo que ya se había anticipado en la decisión de estrategia híbrida para el admin (ver "[2026-09-04] Estrategia híbrida para el admin" más abajo) — usar el Dashboard nativo da hasta acá de marca propia; ir más allá significa construir un "Patilandia Admin" verdaderamente propio, que sigue siendo la visión de largo plazo, no algo descartado.

**Gotcha real de tooling que casi pasa desapercibido:** `patilandia-vendure/tsconfig.json` excluye explícitamente `src/plugins/**/dashboard/*` — hay un `tsconfig.dashboard.json` aparte (project reference) que es el que realmente tipa el código de extensión del Dashboard (JSX, resolución de módulos "bundler", paths a `@vendure/dashboard`). Correr `tsc` contra el tsconfig equivocado da una falsa sensación de "compila limpio" sin haber tipado ni una línea del plugin. Se encontró un error real así (`Cannot find module './assets/logo.png'` — faltaba la declaración ambiente de Vite para imports de imagen) y se corrigió con un `vite-env.d.ts` (`/// <reference types="vite/client" />`) dentro de la carpeta `dashboard/` del plugin, igual al que trae el propio paquete `@vendure/dashboard`.

**Verificado, no solo "compiló":** el log del servidor Vite del Dashboard confirma `Found 1 dashboard extensions` en tiempo de ejecución (no solo en el escaneo estático), el módulo del plugin se transformó sin error a través del dev server (200), el asset del logo sirve como imagen real (200, `image/png`), y el CSS del tema compilado contiene exactamente los valores configurados (`--primary:#7261ff`, `--sidebar:#fffaf3`, `--sidebar-accent-foreground:#20308d`, etc. — se verificaron los valores reales devueltos por el servidor, no solo que la config los declaraba). `npx tsc --noEmit -p tsconfig.dashboard.json` queda limpio para el código propio (el único error restante en esa corrida es preexistente, dentro del propio paquete `@vendure/dashboard`, no del plugin).

**Impacto:** Medusa sigue sin tocarse. Queda un patrón claro y probado para construir cada funcionalidad futura de Patilandia (mascotas, wishlist, Patipuntos, reseñas, etc.) como su propio plugin con su propia porción de Dashboard, siguiendo exactamente esta misma estructura. Ver [[Pendientes Claude]].

---

### [2026-09-11] Fase 7 — baja de Medusa, migración completa

**Contexto:** Con las Fases 3-6 verificadas y funcionando, el usuario pidió explícitamente borrar Medusa. Antes de tocar nada se le preguntó puntualmente qué hacer con `patilandia-backend` (el repo del backend Medusa) — nunca tuvo commits ni remote configurado (ver [[Entorno de Desarrollo Local]]), así que borrarlo es irreversible, sin ninguna copia de respaldo en ningún lado. Se le dieron tres opciones (archivar sin borrar, borrar todo, no tocar la carpeta todavía) y el usuario eligió explícitamente **borrar todo definitivamente**, a pesar de la advertencia — decisión informada, no un descuido.

**Qué se borró:**
- `patilandia/src/lib/medusa/` (client.ts, adapters.ts) — código muerto desde la Fase 3, nunca más importado por `storefront.ts`.
- Las env vars `NEXT_PUBLIC_MEDUSA_BACKEND_URL`/`NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` de `.env.local` y `.env.example`.
- El contenedor Docker `patilandia-postgres` (Postgres de Medusa, puerto 5433) — parado y eliminado. No tenía volumen Docker nombrado, así que no quedó nada que limpiar aparte.
- El repo completo `C:\Users\Leonardo\Desktop\patilandia-backend` — borrado del disco por completo, tal como pidió el usuario.

**Por qué el copy no fue un simple find-replace de "Medusa" por "Vendure":** se encontraron 7 archivos con menciones a Medusa en texto visible (home, categorías, cuenta, footer, metadata del layout, product-detail, `shipping.ts`). Varias frases estaban escritas en tiempo futuro/preparatorio — "Preparado para integrarse con Medusa", "Carrito y checkout preparados para... Medusa" — que ya no son ciertas: la integración con Vendure ya existe y el carrito/checkout ya son reales desde la Fase 5. Reemplazar solo la palabra habría dejado frases con el tiempo verbal equivocado (ej. "preparado para integrarse con Vendure" cuando ya está integrado). Se reescribió cada una para que describa el estado real actual, no una promesa futura. La única excepción real fue `shipping.ts`, donde el cálculo de envío por peso/volumen sigue diferido de verdad (independiente de qué backend se use) — ahí se generalizó el texto a "una transportadora real" en vez de nombrar un producto específico.

**Verificado, no asumido:** `npm run typecheck` y `npm run build` limpios después de borrar `src/lib/medusa/`, y ambos servidores (Vendure en `localhost:3000`, storefront en `localhost:3001`) respondiendo 200 al terminar — nada se rompió al sacar la red de seguridad.

**Impacto:** La migración de Medusa a Vendure, planeada en 7 fases el 2026-09-10, queda completa el 2026-09-11. Patilandia corre 100% sobre Vendure: catálogo, carrito, checkout y el Dashboard de administración. `patilandia-vendure` sigue sin commits — pendiente para cuando el usuario lo pida (ver [[Pendientes Claude]]).

---

### [2026-09-11] Idioma de la interfaz del Dashboard (distinto del idioma de contenido)

**Contexto:** El usuario mandó una captura del Dashboard con los menús en inglés ("Sellers", "Catalog", "Sales"...) pese a que el canal ya mostraba "Language: Spanish" arriba a la izquierda.

**Por qué pasaba:** son dos configuraciones completamente distintas en Vendure. El idioma de contenido (`Channel.defaultLanguageCode`, lo que se ve en el selector de canal) controla en qué idioma se editan las *traducciones* de productos/colecciones/etc. — no tiene ningún efecto sobre el idioma de los propios textos de la interfaz (menús, botones, labels), que se configura aparte, a nivel de build del Dashboard, vía la opción `i18n` de `vendureDashboardPlugin` en `vite.config.mts`.

**Decisión:** se agregó `i18n: { defaultLanguage: LanguageCode.es, defaultLocale: 'CO', availableLanguages: [en, es] }`. `@vendure/dashboard` ya trae la traducción `es.po` completa de fábrica (confirmado en `node_modules/@vendure/dashboard/src/i18n/locales/es.po`) — no hizo falta traducir nada a mano, solo activarla. `defaultLocale: 'CO'` además ajusta el formato de moneda/fecha a Colombia.

**Verificado:** el virtual module `vendure-ui-config` (lo que el Dashboard lee en tiempo de ejecución) devuelve `"defaultLanguage":"es","defaultLocale":"CO"` tras el reinicio del servidor.

**Impacto:** ninguno sobre el resto del sistema — es config del Dashboard únicamente, no toca el schema ni el storefront.

---

### [2026-09-11] ESLint roto arreglado (migración a flat config) e impuesto corregido al 19% real de Colombia

**Contexto:** El usuario pidió puntualmente estos dos pendientes de la lista.

**ESLint — qué se encontró, no solo lo que ya se sabía:** el diagnóstico original (`.eslintrc.json` formato legacy vs. `eslint@9` que exige flat config) era correcto, pero migrar reveló un segundo problema real: el flat config no excluye `.next/` automáticamente como sí lo hacía `next lint` con el setup legacy. El primer `npm run lint` con el `eslint.config.mjs` nuevo (usando `FlatCompat` de `@eslint/eslintrc` para seguir extendiendo `next/core-web-vitals`/`next/typescript`, ya que `eslint-config-next@15.5.25` todavía no exporta un flat config nativo) tiró **6296 problemas** — casi todos en archivos generados por Next (`.next/types/validator.ts`, `.next/types/routes.d.ts`, `next-env.d.ts`). Se agregó un bloque `ignores` explícito y el conteo real del proyecto bajó a un solo warning genuino (`postcss.config.mjs` exportando un objeto anónimo, `import/no-anonymous-default-export`), que también se corrigió. `npm run lint` queda en cero errores, cero warnings — la primera vez que corre limpio en este proyecto.

**Impuesto — el diagnóstico que ya estaba en la bóveda resultó estar mal, y valió la pena verificar antes de "arreglarlo":** la nota de pendientes decía que la zona activa era "Americas" (20%, sample data de Vendure). Antes de tocar nada se consultó la base de datos directamente (`channel.defaultTaxZoneId`) y resultó ser **"Europe"**, no "Americas" — ambas zonas de la sample data tienen la misma tasa genérica del 20%, así que el número coincidía mientras la zona real era otra; el registro anterior se había escrito asumiendo cuál zona sin verificarlo. Un hallazgo más profundo en el camino: `DefaultTaxZoneStrategy` (la estrategia de Vendure que este proyecto usa sin cambios) **no mira la dirección de envío del pedido para nada** — `determineTaxZone()` devuelve directamente `channel.defaultTaxZone`, siempre, sin importar a qué país se esté enviando. Esto significa que Vendure, tal como está configurado hoy, no puede aplicar automáticamente distintas tasas de impuesto según el país de destino — aplica siempre la misma, la que el canal tenga como default. Como Patilandia hoy vende solo a Colombia, esto no es un problema práctico, pero es relevante si algún día se vende a otro país: haría falta una `TaxZoneStrategy` custom que sí mire la dirección, no solo agregar más zonas.

**Decisión:** se creó una zona "Colombia" real (con el país CO como único miembro) y una tasa "Standard Tax Colombia" al 19% para la categoría de impuesto "Standard Tax" que ya traía la sample data, y se apuntó `channel.defaultTaxZone` a esa zona nueva — en `patilandia-vendure/src/scripts/configure-checkout.ts` (extendido, no un script nuevo — es la misma pieza que ya configuraba las tarifas de envío, incluir el impuesto ahí mantiene junta toda la config de checkout que no es catálogo). Script idempotente: verificado corriéndolo dos veces seguidas sin duplicar nada.

**Verificado, no asumido:** simulación real vía GraphQL (`addItemToOrder`) — `taxSummary` de la orden devuelve `taxRate: 19`, no 20. `npm run typecheck`/`build`/`lint` limpios en el storefront tras el cambio de ESLint.

**Impacto:** ninguno sobre el storefront (cambio 100% del lado de Vendure). Queda documentado el límite real de `DefaultTaxZoneStrategy` para cuando (si) Patilandia venda fuera de Colombia.

---

### [2026-09-11] SEO real (metadata dinámica, sitemap, robots, h1) y filtros de catálogo pendientes del brief

**Contexto:** El usuario pidió explícitamente estos 6 ítems de "Alta prioridad" de la lista de pendientes, insistiendo en el SEO ("trabájelo arto... para ver si posicionamos Patilandia").

**SEO — qué se hizo, más allá de lo mínimo pedido:**
- `src/lib/site-config.ts` (nuevo): centraliza `SITE_URL` (default `https://patilandia.com.co`, el dominio de producción ya documentado como destino — pisable con `NEXT_PUBLIC_SITE_URL` si se quiere probar con URLs absolutas locales), `SITE_NAME`, `SITE_TAGLINE`.
- `layout.tsx`: se agregó `metadataBase` (arreglaba además el warning de build "`metadataBase` no está seteado" que aparecía desde el principio), `keywords`, `alternates.canonical`, OpenGraph y Twitter card completos. La meta description del sitio se reescribió — antes decía "...preparada para integrarse con Medusa/construida sobre Vendure", que es información de stack técnico, irrelevante y hasta confusa para alguien buscando en Google. Ahora describe lo que un comprador busca: "Camitas, juguetes, accesorios y alimento premium para perros y gatos... Envíos a toda Colombia."
- `producto/[slug]/page.tsx` y `categorias/[slug]/page.tsx`: `generateMetadata` real (async, con los mismos datos que ya trae la página — Next.js dedupea el fetch, no se duplica la llamada a Vendure), con título/descripción/OG/canonical específicos de cada producto/categoría. Maneja el caso "no encontrado" sin romper.
- `/tienda` y `/categorias` (antes solo tenían `title`) ganaron `description` + `alternates.canonical`.
- `sitemap.ts` (nuevo): home, tienda, categorías (índice + cada una), cada producto — generado dinámicamente contra el catálogo real de Vendure, no una lista hardcodeada. `/carrito`, `/checkout`, `/cuenta` quedan afuera a propósito (transaccionales/personales, sin contenido único, y carrito/checkout dependen de un token de sesión por usuario — un rastreador nunca vería nada útil ahí).
- `robots.ts` (nuevo): permite todo excepto esas mismas 3 rutas, referencia el sitemap.
- `<h1>` real en el home: el titular grande sigue viviendo dibujado dentro de la imagen del hero (no se tocó el diseño), pero se agregó un `<h1 class="sr-only">` con el mismo texto que ya tenía el `alt` — visualmente invisible, perfectamente real para buscadores y lectores de pantalla. Era una de las dos opciones que ya estaban anotadas desde el 2026-09-09 (la otra, rediseñar el hero con texto HTML real sobre una imagen "solo foto", habría requerido pedirle al usuario una versión nueva de la imagen).

**Catálogo — los 3 filtros que pedía el brief (sección 8), sección "no había ni el campo":**
- **Precio**: inputs de mínimo/máximo en `CatalogView`, con placeholder mostrando el rango real del catálogo actual (se calcula de los productos recibidos, no hardcodeado).
- **Disponibilidad**: checkbox "Solo disponibles" — reveló un gap real: `StorefrontProduct.stock` en el adaptador de Vendure estaba **hardcodeado a `10` siempre** desde la Fase 3 (documentado en su momento como "no se usa en ningún lado de la UI todavía" — cierto hasta hoy). Un filtro de disponibilidad real necesitaba un valor real, así que se agregó `stockLevel` a la query GraphQL y el adaptador ahora devuelve stock > 0 solo si al menos una variante no está `OUT_OF_STOCK` (el Shop API de Vendure no expone el conteo exacto de inventario a propósito — solo este enum computado —, así que `stock` sigue siendo una proyección booleana, no un conteo real; suficiente para lo que la UI necesita).
- **Paginación**: client-side, 12 productos por página, en `CatalogView`. Con el catálogo de 8 productos de hoy nunca se activa (1 sola página, controles ocultos a propósito para no mostrar UI sin sentido) — deliberadamente NO se rehizo `storefront.ts` para paginación server-side (`skip`/`take` en la query), porque para el tamaño actual del catálogo sería diseñar para un requisito hipotético; el patrón ya queda listo para activarse solo cuando el catálogo crezca lo suficiente para necesitarlo de verdad.

**Encontrado de paso, fuera de alcance, anotado:** `producto/[slug]/page.tsx` sigue usando `getFallbackRelatedProducts()`, que calcula "relacionados" contra el array mock de `data/mock-store.ts`, no contra el catálogo real de Vendure — funciona hoy por coincidencia porque el seed real espeja los slugs/categorías de los mocks, pero no es una búsqueda real de productos relacionados. No se tocó (no era parte de lo pedido), queda para una próxima sesión.

**Verificado, no asumido:** `npm run typecheck`, `npm run lint` (cero errores/warnings) y `npm run build` (14/14 páginas, incluidas `/sitemap.xml` y `/robots.txt` como rutas reales) limpios. Con el servidor corriendo se confirmó por HTTP: el sitemap trae las 18 URLs reales esperadas (3 estáticas + 7 categorías + 8 productos, crecerá con el catálogo) apuntando al dominio de producción, el robots.txt bloquea las 3 rutas correctas, los `<title>`/`<meta description>`/`<link canonical>` de una página de producto y una de categoría salen con datos reales (no el genérico heredado), el `<h1 class="sr-only">` está presente en el home, y el filtro de precio en `/tienda` muestra el rango real del catálogo en el placeholder.

**Impacto:** ninguna regresión visual — todo lo de catálogo sigue el mismo patrón visual que los filtros que ya existían (tamaño/tipo de mascota), y el `<h1>` no cambia nada visible. Cierra 6 de los ítems de "Alta prioridad" del brief original.

---

### [2026-09-11] Los 5 pendientes de "Media prioridad": tarjetas oscuras, wishlist en Cuenta, tests, animaciones

**Contexto:** El usuario pidió proceder con los 5 ítems de "Media prioridad" tal como estaban en la lista.

**Tarjetas oscuras con gradiente → relleno plano.** Eran 5 tarjetas (`page.tsx` x2, `cuenta/page.tsx`, `categorias/page.tsx`, `product-detail.tsx`) con `bg-[linear-gradient(135deg,...)]` y texto blanco. La nota vieja decía que aplanarlas "requeriría decidir un nuevo color de texto", pero en vez de inventar una decisión nueva se aplicó exactamente el mismo patrón que ya se había decidido para los botones el 2026-09-09 ("gradiente → relleno plano `var(--brand-violet)`, texto blanco sin tocar") — consistencia con un precedente ya validado por el usuario, no una decisión de diseño nueva. La tarjeta de "Nuestra historia" (`page.tsx`) usa `--brand-violet-deep` en vez de `--brand-violet` porque queda al lado de otra tarjeta clara en la misma fila y necesitaba algo de distinción visual entre las dos. **No se tocó** la tarjeta con gradiente *claro* de `page.tsx` (`#edf1ff,#f5efff`, sin texto blanco) — esa nunca estuvo en la lista de "tarjetas oscuras", es un fondo decorativo distinto.

**`/cuenta` — se le dio lógica real donde se pudo, sin cruzar una línea ya trazada.** La nota pedía "sacarlo del placeholder", pero el brief también tiene "Autenticación de clientes" explícitamente en la lista de "Correctamente diferido" (decisión consciente, no un pendiente) — 3 de las 4 tarjetas de Cuenta (Órdenes, Direcciones, Mascotas) necesitan de verdad saber quién es el cliente logueado, así que construirles lógica real habría significado construir autenticación completa por la puerta de atrás, contradiciendo una decisión ya tomada. En vez de eso: la tarjeta de Favoritos **sí** se volvió real (`AccountWishlistCard`, nuevo, lee el wishlist real del store — ya era una feature funcional, solo le faltaba un lugar donde vivir dentro de Cuenta) y las otras 3 pasaron de "simular ser reales" (texto genérico sobre autenticación futura) a decirlo explícitamente con un badge "Próximamente" — más honesto que un placeholder que no se distingue de contenido real.

**Wishlist consolidado — resuelto a medias, a propósito.** Con Favoritos ya viviendo en Cuenta, la wishlist deja de ser "solo una pestaña aislada del bottom nav". **No se tocó** `MobileBottomNav` — sacar esa pestaña sería una decisión de navegación aparte (reduce el bottom nav de 5 a 4 ítems), y el pendiente original la dejaba como "si más adelante se quiere" — no una instrucción directa. Se avisa acá para que el usuario decida si quiere ir más allá.

**Tests — Vitest, no Jest ni Playwright, y no en todo el código.** Se priorizó cobertura real sobre cobertura total: 27 tests, apuntados exactamente a la lógica más valiosa y menos obvia del proyecto — `lib/utils.ts` (formato de moneda, cálculo de descuento, clamp de cantidad), `lib/shipping.ts` (`getShippingPreview`, incluida la regla del umbral de 8kg), y sobre todo `lib/vendure/adapters.ts` (`adaptVendureProduct`: deduplicación de talla/color entre variantes, conversión de precio desde centavos, lectura de facets con fallback, cómputo de stock desde `stockLevel`). Cero tests de componentes React — eso requeriría `@testing-library/react` + entorno jsdom, una inversión de setup mayor para un beneficio menor hoy (la lógica de negocio pura es donde vive el riesgo real de romper algo silenciosamente, no el JSX). Playwright/e2e queda fuera de esta pasada — Vitest ya deja `npm test` funcionando de verdad, que es lo que hacía falta para dejar de tener "cero tests corriendo".

**Animaciones — `motion` (sucesor de `framer-motion`), aplicado con criterio, no en todo el sitio.** Un solo componente reusable (`FadeIn`, fade + slide-up al entrar en viewport, dispara una sola vez) aplicado a las 4 secciones del home que están debajo del pliegue (colecciones, destacados, producto propio, nuestra historia). El hero y el strip de categorías, visibles apenas carga la página, se dejaron sin animar — animar algo que ya está a la vista al cargar no aporta nada y puede sentirse raro. Coincide con lo que pedía el brief sección 13: "fades/slides de entrada de sección... si aporta valor", no "animar todo".

**Verificado, no asumido:** `npm run typecheck`, `npm run lint` (cero errores/warnings), `npm test` (27/27) y `npm run build` (14/14 páginas) limpios. Con el servidor corriendo se confirmó por HTTP: cero gradientes oscuros restantes en los 4 archivos tocados (el gradiente claro de `page.tsx` sigue ahí, a propósito), la tarjeta de Favoritos y los 3 badges "Próximamente" renderizan en `/cuenta`, y los `<div>` de `FadeIn` en el home traen su estado inicial (`opacity:0`, `translateY(24px)`) en el HTML servido por el servidor — confirma que la animación está realmente conectada, no que el import simplemente no rompió nada.

**Impacto:** ninguna regresión — todo lo agregado es aditivo (nuevos componentes, nuevas dependencias de dev) o sigue patrones visuales ya validados por el usuario. Cierra los 5 ítems de "Media prioridad" que quedaban del brief.

---

### [2026-09-09] Segunda tipografía de display (`Permanent Marker`) solo para el título de "Nuestras colecciones"

**Contexto:** El usuario preguntó cómo elegir/probar fuentes nuevas. Se probó `Permanent Marker` (Google Fonts) como reemplazo global de `--font-display` — instalada vía `@fontsource/permanent-marker` (mismo patrón self-hosted que Baloo 2/Nunito, no CDN, consistente con la decisión ya registrada de tipografía self-hosted). Tras ver la vista previa en todo el sitio, el usuario decidió: volver a Baloo 2 en general, pero mantener Permanent Marker específicamente para el título "Mundos mágicos para cada personalidad" (sección "Nuestras colecciones" del home).

**Decisión:** `--font-display` vuelve a `"Baloo 2", ...`. Se agregó una variable y clase nuevas, paralelas: `--font-marker` + `.font-marker`. `SectionHeading` (`src/components/ui/section-heading.tsx`) ganó una prop `titleFont?: "display" | "marker"` (default `"display"`) que elige **una sola** clase de fuente de forma condicional (`titleFont === "marker" ? "font-marker" : "font-display"`) — nunca las dos apiladas a la vez, siguiendo la lección aprendida en el bug de `HeaderLink`/`mobile-bottom-nav` de esta misma sesión (clases de la misma propiedad CSS apiladas = conflicto de orden de generación impredecible en Tailwind). Solo la sección de colecciones en `page.tsx` pasa `titleFont="marker"`.

**Por qué no afecta al `<h1>` del hero:** el título grande del hero ("En un solo lugar, hecho con magia real") vive dibujado dentro de la imagen PNG (`imagen-home.png`/`imagen-home-destok.png`), no es HTML — ningún cambio de `--font-display` lo toca. Se le explicó esto al usuario explícitamente para que no esperara verlo cambiar ahí.

**Impacto:** `SectionHeading.description` pasó de requerida a opcional (`description?: string`) — el usuario pidió sacar el párrafo descriptivo de "Nuestras colecciones" y "Destacados" en el home; en vez de pasar string vacío, ahora el `<p>` de descripción ni se renderiza si no hay `description`. Las otras dos llamadas a `SectionHeading` (en `categorias/page.tsx`) siguen con su descripción intacta — no se tocaron. Ver [[Pendientes Claude]].

---

### [2026-09-09] Bug real: `a { color: inherit }` sin `@layer` rompía `text-white` (y cualquier color de texto) en todos los `<Link>` del sitio

**Contexto:** El usuario dijo que el botón del hero "no está con letras blancas" a pesar de que `buttonStyles` sí tenía `text-white`. Se verificó con `getComputedStyle` en vez de confiar en capturas de pantalla — el color real era `rgb(34, 48, 95)` (`--ink`, texto oscuro), no blanco.

**Causa raíz:** `globals.css` tiene `a { color: inherit; text-decoration: none; }` declarado **fuera de cualquier `@layer`**, después de `@import "tailwindcss"`. Tailwind v4 declara sus propias capas (`@layer theme, base, components, utilities`). En CSS, **las reglas sin capa (unlayered) le ganan a cualquier regla dentro de una capa, sin importar la especificidad** — así que ese `a { color: inherit }` (especificidad bajísima, un selector de elemento) le ganaba a `.text-white` (una utilidad de Tailwind, especificidad de clase, mucho más alta) porque vive en la capa `utilities`. Este bug llevaba presente desde el inicio del proyecto (la regla ya estaba en la carga inicial), afectando a **cualquier** `<Link>`/`<a>` con una utilidad de color de texto de Tailwind aplicada directamente — no solo el botón del hero.

**Por qué no se había notado antes:** la mayoría de los colores de texto usados en `<Link>`s (`--ink`, `--brand-violet-deep`) son tonos oscuros parecidos entre sí — visualmente casi indistinguibles en una captura rápida. El caso del botón (blanco vs. `--ink` oscuro) sí debía notarse a simple vista, pero en las capturas de Playwright revisadas antes se leyó como "blanco" sin verificar el color real con DevTools/`getComputedStyle`.

**Fix:** envolver esa regla (y `button, input, select { font: inherit }`) en `@layer base { ... }` en `globals.css`. Así queda en la capa `base`, que Tailwind coloca **antes** de `utilities` en el orden de capas — cualquier utilidad de color (`text-white`, `text-[var(--brand-violet-deep)]`, etc.) vuelve a ganarle normalmente por especificidad, como se espera.

**Bug relacionado encontrado de paso (mismo síntoma, causa distinta):** el estado "activo" de los links de navegación (`HeaderLink` en `site-header.tsx`, ítems de `mobile-bottom-nav.tsx`) nunca mostraba el violeta de "página actual" — tenían **dos clases de color de texto a la vez** en el mismo elemento (`text-[var(--ink)]` fijo + `text-[var(--brand-violet-deep)]` condicional cuando está activo), y como ambas son utilidades dentro de la misma capa `utilities` con la misma especificidad, cuál gana depende del orden de generación interno de Tailwind, no de cuál aparece primero en el string de clases — en este caso ganaba `--ink` casi siempre. Se corrigió haciendo las clases mutuamente excluyentes (`isActive ? "...violeta" : "...ink"` en vez de apilar ambas). Verificado con `getComputedStyle`: el link activo ahora sí devuelve `rgb(32, 48, 141)` (`--brand-violet-deep`).

**Impacto:** Corrección de raíz, no un parche — cualquier futuro `<Link>` con color de texto por utilidad ahora funciona como se espera, sin tener que acordarse de este detalle de capas. Lección para code review futuro: **nunca confiar en el color de una captura de pantalla como prueba definitiva** — verificar con `getComputedStyle` cuando el usuario reporta que un color "no se ve como debería", puede haber una capa de CSS ganándole a la utilidad sin que se note a simple vista.

---

### [2026-09-09] Botón del hero: tamaño y posición distintos en mobile vs. desktop

**Contexto:** Con el botón centrado (decisión inmediatamente anterior), el usuario pidió específicamente para mobile: achicarlo, confirmar letras blancas (ya lo eran, variant `primary`) y moverlo a la izquierda de la imagen.

**Decisión:** `HomeHero` ahora renderiza dos `<Link>` en contenedores separados (uno `md:hidden`, otro `hidden md:flex`) en vez de uno solo con clases responsivas mezcladas — evita el bug de "dos botones visibles a la vez" que ya había ocurrido antes al intentar alternar tamaños con `sm:hidden`/`hidden sm:inline-flex` sobre el mismo elemento (`hidden` compite con el `inline-flex` fijo de `buttonStyles` en la misma propiedad `display`, con resultado impredecible). Mobile: `size: "sm"`, alineado a la izquierda (`justify-start px-4`), `bottom-[8%]`. Desktop: sin cambios, `size: "lg"`, centrado, `bottom-[6%]`.

**Por qué el botón chico a la izquierda no repite el problema de superposición de antes:** con el ancho fijo por `aspect-ratio` (no crop), el bloque de texto siempre termina en la misma proporción vertical (~66% de alto) sin importar el ancho de pantalla. Un botón más chico dentro del hueco de pavimento que queda debajo del párrafo (los últimos ~34% de alto) cabe sin tocar el texto — el botón grande (`lg`, 56px) sí quedaba muy justo ahí; el chico (`sm`, 40px) tiene margen de sobra. Verificado con captura real en 390px: sin superposición.

**Impacto:** Patrón para futuros ajustes de este hero: mobile y desktop son dos overlays independientes (tamaño, alineación y offset propios), no una única variante con clases responsivas — más verboso pero evita la clase de bug de "display" que ya salió dos veces. Ver [[Pendientes Claude]].

---

### [2026-09-09] Botón del hero de vuelta dentro de la imagen (centrado abajo); sistema de botones sin gradientes

**Contexto:** El usuario vio el botón "Explorar la tienda" en su propia franja debajo de la imagen (decisión inmediatamente anterior) y no le gustó — lo quería de vuelta encima de la imagen, tanto en mobile como en desktop.

**Decisión — hero:** El botón vuelve a ser un overlay `absolute` dentro de la `<section>`, pero ahora **centrado horizontalmente** (`inset-x-0 flex justify-center`) en vez de alineado a la izquierda como en el intento original que causó el problema de superposición. Centrado, el botón cae sobre el área de la cama/mascotas (foto, sin texto horneado ahí) en vez de sobre el bloque de texto izquierdo, que es lo que rompía la legibilidad antes. Verificado con capturas en 390/1440px — sin superposición con ningún texto de la imagen en ninguno de los dos anchos.

**Decisión — sistema de botones, pedido en la misma sesión:** "quitale los gradientes de botones y demás, dejale el morado clarito." Se aplicó a `buttonStyles` (`src/components/ui/button.tsx`): el variant `primary` pasó de gradiente (`linear-gradient(135deg, var(--brand-violet), var(--brand-violet-deep))`) a relleno plano `bg-[var(--brand-violet)]` (el token de marca, `#7261ff`). El variant `gold` (gradiente dorado, solo usado en 2 lugares — `cuenta/page.tsx` y `categorias/page.tsx`, ambos como CTA secundario sobre una tarjeta oscura) se **eliminó** en vez de dejarlo con gradiente dorado: ambos usos pasaron a variant por defecto (`primary`, ya plano morado). Se optó por borrar el variant en vez de dejarlo sin uso, seg��n la convención del proyecto de no dejar código muerto "por si se usa en otro lado".

**Qué NO se tocó y por qué:** las tarjetas grandes de fondo oscuro con degradado violeta/azul (`page.tsx` x2, `cuenta/page.tsx`, `categorias/page.tsx`, `product-detail.tsx`) siguen con su gradiente — no son "botones", tienen texto blanco encima que depende de un fondo oscuro para ser legible (aplanarlas a morado clarito sin cambiar el color del texto habría roto la legibilidad). Tampoco se tocaron: el scrim del hero de `CatalogView` (gradiente funcional para contraste de texto sobre foto, no decorativo), el fondo crema de `globals.css`, el footer (gradiente azul marino, no violeta), ni los efectos sutiles blancos de brillo en `ProductCard`/`category-strip` (no son parte del sistema de "gradiente violeta" que se pidió sacar). Si el usuario quiere que esas tarjetas oscuras también pierdan el gradiente, hay que decidir a la vez qué pasa con el color del texto — no es un cambio de una sola línea como en los botones.

**Impacto:** Verificado con capturas en home, tienda (grid de productos), cuenta y categorías (las dos páginas con la tarjeta oscura + botón) — el botón morado plano se sigue leyendo bien tanto sobre el hero de imagen como sobre las tarjetas oscuras sin tocar. `npm run build` limpio. Ver [[Pendientes Claude]].

---

### [2026-09-09] Hero de home en mobile: mismo tratamiento `aspect-ratio` que desktop, botón fuera de la imagen

**Contexto:** Tras el ajuste anterior (mismo día, ver debajo), el usuario probó mobile y pidió que la imagen "abarque a todo lo ancho" — el mobile seguía usando el patrón viejo (altura fija 450px + `object-left`), que recorta ~65% del contenido horizontal de la imagen para que quepa en un viewport angosto. El usuario quería ver la imagen completa, no un recorte.

**Decisión:** Mobile pasa a usar el mismo mecanismo que ya se había validado para desktop — `aspect-ratio` (`aspect-[1786/881]`, la proporción real de `imagen-home.png`) en la `<section>`, sin `object-position` (ya no hace falta, no hay recorte). Con esto la imagen se muestra **completa** en cualquier ancho de mobile, tal como ya pasaba en desktop.

**El problema nuevo que esto generó — y cómo se resolvió:** a `aspect-ratio` de 2.03:1, un mobile de 390px de ancho da solo ~192px de alto. El botón "Explorar la tienda", que hasta ahora vivía superpuesto sobre la imagen (`items-end` dentro de la sección), ya no tenía margen seguro para no tapar la última línea del párrafo horneado en la imagen — a esa altura tan baja, prácticamente cualquier posición del botón caería encima de texto. Se intentó primero un parche (dos variantes de botón, chica para mobile/grande para desktop, alternadas con clases `sm:hidden`/`hidden sm:inline-flex`) que **falló**: ambas quedaban visibles a la vez, porque `hidden` y `inline-flex` (esta última ya viene fija en `buttonStyles`) compiten por la misma propiedad `display` y Tailwind no garantiza que el modificador responsivo gane solo por aparecer después en el string de clases. Se descartó el parche.

**Decisión final:** el botón sale de la imagen. `HomeHero` ahora renderiza dos bloques hermanos (la `<section>` de la imagen, sin overlay, y un `<div>` aparte debajo con el mismo fondo `bg-[#1d256d]` para continuidad visual) — el CTA vive en ese segundo bloque, en flujo normal de página, nunca superpuesto a la imagen. Esto elimina el problema de raíz para cualquier altura de imagen futura, no solo para esta imagen puntual.

**Por qué no se intentó ajustar la posición del botón en vez de sacarlo:** a 192px de alto no hay ningún hueco "seguro" garantizado — depende de exactamente dónde termine el texto horneado en la imagen, que puede variar si el usuario vuelve a cambiar la imagen. Sacar el botón de la imagen es la solución que no depende de conocer esa posición.

**Impacto:** Verificado con Playwright en 390 (mobile) y 768/1024/1280/1920 (desktop) — imagen completa sin recorte en todos los anchos, botón siempre en su propia franja, cero riesgo de superposición. Mismo criterio para desktop y mobile ahora: sección = solo imagen a `aspect-ratio` real, CTA en un bloque separado debajo.

---

### [2026-09-09] Hero de home: imagen distinta por breakpoint (mobile vs. desktop), `aspect-ratio` en vez de altura fija en desktop

**Contexto:** El usuario probó el hero recién implementado (ver decisión inmediatamente debajo, misma fecha) y pidió dos ajustes: 1) la imagen `imagen-home.png` se queda **solo para mobile**, pero "no se ve bien" — hacía falta que abarcara mejor la pantalla; 2) subió una imagen nueva, `imagen-home-destok.png` (2098×749, ratio ~2.8:1, misma composición pero más panorámica — el texto y la tarjeta "Pequeños detalles" quedan más separados de los bordes), para usar en desktop.

**El problema real de fondo:** ambas imágenes traen texto de marketing dibujado cerca de los dos bordes horizontales (título a la izquierda, tarjeta "Pequeños detalles..." a la derecha). Con `object-cover` y una altura fija en píxeles (el patrón que se venía usando), el recorte necesario para llenar el ancho de pantalla variaba con el viewport de forma no lineal: en pantallas anchas (1280px+), una altura fija obliga a un zoom mayor de lo esperado (el recorte se vuelve "ancho-dominante" en vez de "alto-dominante"), lo que en la práctica **recortaba texto de un lado o el botón terminaba superpuesto sobre la última línea del párrafo** — se verificó con capturas reales en 768/1024/1280/1920px: con altura fija, 768 y 1024 se veían bien pero 1280 y 1920 mostraban el botón tapando "de la magia."

**Opciones evaluadas:**
- Seguir ajustando alturas fijas por breakpoint a mano (`md:min-h-[Xpx] lg:min-h-[Ypx]`), afinando por prueba y error para cada ancho común.
- Usar `aspect-ratio` (Tailwind `aspect-[2098/749]`) igual a la proporción real del archivo, aplicado a la `<section>` completa (no al contenedor interno `max-w-7xl`) desde `md:` en adelante.

**Decisión:** `aspect-ratio` en la sección, no en el contenedor interno. Con esto la altura del hero en desktop siempre es `ancho_de_pantalla / 2.801`, lo que garantiza que la imagen se muestra **completa, sin ningún recorte**, en cualquier ancho de escritorio — porque el contenedor y la imagen tienen exactamente la misma proporción, `object-cover` no tiene nada que recortar.

**Por qué falló el primer intento con `aspect-ratio` en el contenedor interno:** se probó primero poner el `aspect-[2098/749]` en el `<div>` interno (el que tiene `max-w-7xl` y contiene el botón) en vez de en la `<section>`. Como ese div está acotado a 1280px de ancho máximo, calculaba una altura basada en su propio ancho limitado — mientras que las imágenes (`fill`, posicionadas respecto a la `<section>` completa) siguen ocupando el ancho real del viewport, mucho más ancho en pantallas grandes. Resultado: la altura calculada quedaba corta para el ancho real de la imagen, y volvía a recortar. Se corrigió moviendo `aspect-ratio` a la `<section>` (ancho real = viewport) y el contenedor interno pasó a `md:h-full` (se estira al 100% de la altura ya resuelta por la sección, en vez de calcular la suya propia).

**Mobile no usa esta técnica a propósito:** en mobile se mantiene el patrón anterior (altura fija + `object-left`, ver decisión debajo) porque ahí SÍ se quiere recorte deliberado — mostrar la imagen completa sin recortar en un viewport angosto (390px de ancho / ~2:1 de aspect ratio) da una tira de ~192px de alto, demasiado corta para sentirse como un hero. Se subió la altura mobile de 300px a 450px (más "abarca la pantalla", como pidió el usuario) mantieniendo `object-left` para no perder el texto.

**Impacto:** Verificado con Playwright en 390 (mobile), 768/1024/1280/1920 (desktop) — cero texto recortado, cero superposición del botón, en todos los anchos probados. Esta técnica (`aspect-ratio` en el contenedor full-bleed real, no en uno acotado) es la que debería usarse para cualquier hero futuro con imagen de fondo que traiga texto propio cerca de los bordes.

---

### [2026-09-09] Hero de home reemplazado por imagen full-bleed con texto propio; se saca el `<h1>` HTML del overlay

**Contexto:** El usuario pidió que la imagen principal del home (`imagen-home.png`, nueva, provista por él) llegara hasta las orillas completamente (antes vivía dentro de una tarjeta con `max-w-7xl`, padding y bordes redondeados) y que se quitara el botón secundario "Ver camitas propias" dejando solo "Explorar la tienda". Al implementarlo apareció un problema real: la imagen nueva **ya trae el copy de marketing dibujado adentro** ("Todo lo que tu mascota necesita", "En un solo lugar", la bajada, y la tarjeta "Pequeños detalles, grandes momentos" que antes era un `<div>` HTML aparte) — el `<h1>`/`<p>`/tarjeta decorativa de `HomeHero` quedaban superpuestos encima, duplicando el texto y viéndose roto.

**Opciones evaluadas:**
- Sacar el overlay de texto HTML (h1, p, tarjeta decorativa) y dejar que la imagen hable por sí sola, solo con el botón CTA encima.
- Pedir/generar una versión "solo foto" de la imagen (sin el texto incrustado) para poder mantener el `<h1>` semántico real por SEO.

**Decisión:** La primera opción — consultada y confirmada explícitamente con el usuario. `HomeHero` quedó reducido a: imagen full-bleed (`object-cover object-left`, sin contenedor `max-w-7xl`/rounded/border) + un degradado sutil hacia abajo + el botón "Explorar la tienda" anclado abajo-izquierda dentro de un contenedor `max-w-7xl` (solo para alinear el botón con el resto del layout, no para acotar la imagen).

**Por qué `object-left` y no `object-center`:** La imagen es paisaje ancho (1786×881, ratio ~2.03:1) con el texto útil concentrado en el tercio izquierdo. Con `object-center` en mobile (contenedor angosto y proporcionalmente alto) el recorte de `object-cover` cortaba justo ese texto por la izquierda — se verificó con captura real y el texto salía truncado ("...E TU", "...NECESITA"). Con `object-left`, el recorte prioriza mostrar desde el borde izquierdo de la imagen, así el texto siempre queda completo aunque en mobile se pierda parte del lado derecho (la tarjeta "Pequeños detalles..."). Verificado con capturas Playwright en 390px y 1440px tras el cambio: mobile ya muestra el texto completo, desktop esencialmente muestra la imagen entera sin crop relevante.

**Impacto — deuda de SEO nueva y real:** El home ya no tiene ningún `<h1>` en HTML (antes vivía en `HomeHero`, ahora el titular solo existe como píxeles dentro del PNG). Se compensó parcialmente con un `alt` descriptivo en la imagen, pero eso no reemplaza a un `<h1>` real para SEO/accesibilidad. **No estaba en [[Pendientes Claude]] antes de esta sesión** — se agrega ahí como pendiente nuevo. Cualquier imagen de hero futura que traiga texto incrustado debería evaluarse con este mismo criterio (¿hay `<h1>` real en algún lado de la página?).

---

### [2026-09-09] Búsqueda del header conectada al filtro existente de `CatalogView`, sin backend de búsqueda nuevo

**Contexto:** El buscador del header (mobile y desktop) era solo visual desde su restauración. El usuario preguntó si se podía implementar la funcionalidad real sin tener el catálogo final de productos — la respuesta fue sí, porque `CatalogView` ya filtraba localmente por texto (`search` state) sobre lo que devuelve `getStorefrontProducts()`, el mismo mecanismo que ya usan los filtros de tamaño/mascota/categoría.

**Opciones evaluadas:**
- Construir un endpoint/lógica de búsqueda nueva (ej. ruta API dedicada, búsqueda server-side en Medusa).
- Conectar el input del header al filtro de texto que `CatalogView` ya tenía implementado, vía query param de URL.

**Decisión:** La segunda opción. Los formularios de búsqueda del header hacen `router.push('/tienda?buscar=' + query)`; `CatalogView` (ya client component) lee `buscar` con `useSearchParams()` de `next/navigation` como valor inicial de su `search` state, con un `useEffect` que resincroniza si el query param cambia (navegación repetida desde el header estando ya en `/tienda`).

**Por qué:** Cero lógica de filtrado nueva — el `search` state de `CatalogView` ya matcheaba contra `name`/`shortDescription`/`categoryLabel` de `StorefrontProduct`. Escala automáticamente con cualquier cantidad de productos reales en Medusa, sin tocar nada cuando el catálogo crezca o cambie. Consistente con el patrón de capa de adaptación ya establecido (componentes visuales no saben ni les importa si el dato es mock o Medusa real).

**Impacto:** `tienda/page.tsx` y `categorias/[slug]/page.tsx` envuelven `<CatalogView>` en `<Suspense>` — requisito de Next.js para usar `useSearchParams` en un client component dentro de una ruta que puede prerenderse estáticamente (sin el Suspense, Next.js emite warning de build y fuerza CSR completo en esa ruta). Verificado con `npm run build` (con `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` vacío para aislar del hecho de que Medusa no estaba corriendo — build real con Medusa activo no se probó en esta sesión) sin warnings, y con Playwright headless (Chrome del sistema, sin red para el Chromium embebido) confirmando el filtrado end-to-end en mobile y desktop. Ver [[Pendientes Claude]].

---

### [2026-09-09] Cuenta/Carrito fuera del header en mobile, reemplazados por lupa de búsqueda directa

**Contexto:** Tras restaurar la hamburguesa (ver decisión inmediatamente debajo), el usuario notó que Cuenta y Carrito seguían arriba en el header aunque el bottom nav mobile ya los cubre (con badge de cantidad incluido en Carrito) — redundancia real. Preguntó directamente si convenía sacarlos y poner la lupa, o dejar la búsqueda escondida dentro del menú hamburguesa.

**Opciones evaluadas:**
- Dejar todo como estaba tras la restauración de la hamburguesa (búsqueda solo dentro del drawer del menú).
- Sacar Cuenta/Carrito del header en mobile y poner un botón de lupa que abra la búsqueda directamente, sacando el buscador duplicado de dentro del menú.

**Decisión:** La segunda opción, solo por debajo de `md` (donde vive el bottom nav, `mobile-bottom-nav.tsx` es `md:hidden`). El botón de lupa alterna un panel de búsqueda que aparece debajo del header (mismo patrón visual que tenía el drawer del menú). El menú hamburguesa ya no incluye el input de búsqueda — solo navegación. Desde `md:` en adelante nada cambia: siguen los íconos de Cuenta/Carrito y la barra de búsqueda de escritorio, porque ahí no hay bottom nav.

**Por qué:** Confirmé en `mobile-bottom-nav.tsx` que Cuenta y Carrito (con badge) ya están cubiertos en mobile — mantenerlos arriba era pura redundancia, mismo argumento que ya se usó para sacar wishlist y hamburguesa el 2026-09-05. La lupa a un tap es más descubrible que escondida dentro de un menú de dos pasos.

**Impacto:** Verificado con Playwright headless contra Chrome del sistema (no había red para descargar el Chromium embebido de Playwright) en 390px y 1024px — sin errores de consola, ambos breakpoints se comportan como se esperaba. `SiteHeader` ahora maneja dos estados independientes (`isMenuOpen`, `isSearchOpen`) que se cierran mutuamente al abrir el otro. Buscador sigue siendo solo visual (sin `onChange`), la funcionalidad real queda pendiente. Ver [[Pendientes Claude]].

---

### [2026-09-09] Menú hamburguesa mobile restaurado — reversión parcial de la decisión del 2026-09-05

**Contexto:** El usuario sintió que al header le faltaba el menú hamburguesa en mobile tras haberlo quitado el 2026-09-05 (ver decisión "Header mobile sin hamburguesa ni wishlist"). Pidió explícitamente devolverlo y dejar visible la lupa de búsqueda, sin darle funcionalidad todavía.

**Decisión:** `SiteHeader` recupera el botón hamburguesa (`lg:hidden`) y el drawer desplegable con navegación + buscador, tal como existía antes del 2026-09-05. **No** se restauró el ícono de wishlist en el header — el usuario no lo pidió, y el bottom nav mobile lo sigue cubriendo.

**Por qué:** El usuario prioriza la sensación de completitud del header sobre la redundancia con el bottom nav que había motivado quitarlo. El buscador queda visual-only (`<input>` sin `onChange`) a propósito — se implementa la lógica en una sesión futura.

**Impacto:** El header vuelve a tener dos accesos a los mismos 5 destinos en mobile (hamburguesa + bottom nav) — redundancia consciente, aceptada por el usuario. `MenuIcon`/`CloseIcon` en `components/ui/icons.tsx` vuelven a estar en uso (el pendiente de "revisar si eliminarlos" queda obsoleto). Ver [[Pendientes Claude]].

---

### [2026-09-03] Medusa como commerce backend headless, no un backend propio

**Contexto:** El brief original ([[Patilandia — Brief Original]], sección 2) es explícito: "NO quiero construir otro backend de e-commerce desde cero."

**Opciones evaluadas:** Backend custom (Node/Express) vs. Medusa vs. Shopify headless.

**Decisión:** Medusa + PostgreSQL, consumido vía Store API REST.

**Por qué:** Medusa cubre productos, variantes, precios, carrito, clientes, órdenes, inventario, promociones, checkout, payments y fulfillment out-of-the-box, y es open-source/self-hostable (relevante para Colombia + integraciones locales como Wompi). Construir eso a mano sería reinventar la rueda sin beneficio.

**Impacto:** El frontend nunca debe asumir estructura interna de Medusa; toda lectura pasa por [[Integración Medusa]].

---

### [2026-09-03] Capa de adaptación desacoplada en vez de acoplar componentes a la Store API de Medusa

**Contexto:** Medusa todavía no está desplegado (sin backend corriendo, `.env.example` con key vacía), pero la storefront debía ser navegable desde el día uno.

**Opciones evaluadas:**
- Hardcodear productos directamente en los componentes visuales.
- Consumir el shape de Medusa directamente en los componentes.
- Definir un tipo propio (`StorefrontProduct`) + funciones adaptadoras (`adaptMedusaProduct`) + una función de entrada única (`getStorefrontProducts`) que decide la fuente.

**Decisión:** La tercera opción — capa de adaptación en `src/lib/medusa/adapters.ts` + `src/lib/storefront.ts`.

**Por qué:** Ningún componente visual (`ProductCard`, `CatalogView`, `ProductDetail`) sabe si el producto vino de Medusa o de un mock — ambos se normalizan al mismo `StorefrontProduct`. Esto cumple exactamente el brief sección 8: "No acoples los componentes visuales directamente a una estructura de datos rígida. Crea una capa/adaptador si es necesario." Cuando Medusa esté desplegado, basta con setear las env vars — cero cambios en componentes.

**Impacto:** Cualquier campo nuevo de Medusa que se quiera exponer debe pasar primero por `adaptMedusaProduct` y por el tipo `StorefrontProduct` en `types/commerce.ts`.

---

### [2026-09-03] `medusaFetch` falla en silencio (retorna `null`) cuando no hay publishable key

**Contexto:** Sin Medusa desplegado, cualquier `fetch` fallido rompería el build/SSR de cada página que lista productos.

**Decisión:** `medusaFetch` retorna `null` inmediatamente si `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` está vacío, sin intentar la llamada de red.

**Por qué:** Permite que `getStorefrontProducts()` caiga a mocks de forma predecible y rápida (sin esperar timeout de red), manteniendo la storefront 100% navegable en desarrollo sin Medusa corriendo.

**Impacto:** Si Medusa está mal configurado (key presente pero backend caído), sí lanza error (`response.ok` check) — el fail-soft es solo para "Medusa no configurado", no para "Medusa configurado pero roto". Diferencia importante a la hora de debuggear.

---

### [2026-09-03] Envío sin costo fijo — arquitectura de "cotización pendiente" en vez de un número inventado

**Contexto:** Brief sección 10: Patilandia venderá productos pesados (arena, alimento, sacos grandes) junto a productos livianos (accesorios). Un costo de envío fijo sería incorrecto desde el día uno.

**Opciones evaluadas:**
- Costo de envío fijo (ej. $10.000 COP) como placeholder.
- Sin mostrar nada de envío hasta checkout real.
- Mensaje contextual basado en reglas simples (peso total, `shippingClass`) sin calcular un número real.

**Decisión:** Tercera opción — `getShippingPreview()` en `lib/shipping.ts`.

**Por qué:** Cada `StorefrontProduct` ya tiene `weightKg` y `shippingClass: "standard" | "bulky" | "heavy" | "custom"`. La función detecta si el carrito necesita cotización especial (algún ítem `bulky`/`heavy`/`custom`, o peso total ≥ 8kg) y comunica correctamente al usuario que el envío se calculará después, en vez de mentir con un número fijo que luego habría que romper visualmente al conectar la lógica real. El *snack* de ejemplo (`snack-crunch-pollo`) se marcó deliberadamente `shippingClass: "heavy"` con `weightKg: 8.5` para forzar y validar este camino con datos mock.

**Impacto:** Cuando exista integración real de fulfillment (por peso/volumen/destino/transportadora), solo hay que reemplazar el cuerpo de `getShippingPreview` — el contrato (`ShippingPreview { label, detail, status }`) y los call sites (`CartPage`, `CheckoutPage`) no cambian.

---

### [2026-09-03] Estado global simple (Context + localStorage) en vez de Zustand/Redux

**Contexto:** Carrito y wishlist necesitan persistir entre sesiones y ser accesibles desde header, catálogo, producto, carrito y checkout.

**Decisión:** `StoreProvider` con React Context + `useState` + `localStorage`, sin librería externa.

**Por qué:** El estado es simple (dos arrays: `cart`, `wishlist`) y de un solo tenant (no hay sincronización multi-pestaña en tiempo real ni estado de servidor complejo que justifique Zustand/Redux/TanStack Query en esta etapa). Añadir una librería de estado sería complejidad prematura frente al brief sección 17 ("Evita soluciones... código duplicado... No diseñes para requisitos hipotéticos").

**Impacto:** Si más adelante se necesita sincronizar carrito con un customer autenticado en Medusa (carrito server-side), este provider es el punto de reemplazo natural — la interfaz pública (`useStore()`) no debería cambiar para los consumidores.

---

### [2026-09-04] Medusa vive en un repo hermano (`patilandia-backend`), no dentro de `patilandia`

**Contexto:** Había que instalar Medusa. El brief pide frontend desacoplado de Medusa; el patrón ya validado en otros proyectos del usuario (Argus) es un repo por servicio.

**Decisión:** `create-medusa-app` se ejecutó apuntando a `C:\Users\Leonardo\Desktop\patilandia-backend`, sibling de `patilandia`, con su propio git (inicializado, sin commits/remote aún).

**Por qué:** Mismo razonamiento que separar `Argus Backend` de `argus-web-usuario` — servicios con ciclos de vida, deploys y stacks distintos no deberían compartir repo. Confirmado explícitamente por el usuario ante la pregunta directa.

**Impacto:** Cualquier cambio al backend se commitea en `patilandia-backend`, no en `patilandia`. Ver [[Entorno de Desarrollo Local]].

---

### [2026-09-04] Catálogo real migrado a Medusa vía workflows oficiales, no SQL directo

**Contexto:** Tras instalar Medusa, había que decidir cómo poblarlo con los 8 productos reales de Patilandia en vez de dejar el catálogo demo genérico de Medusa (camisetas).

**Opciones evaluadas:**
- Insertar filas directamente en Postgres con SQL.
- Usar la Admin API REST con curl/fetch.
- Escribir un script ejecutado con `medusa exec`, usando los workflows oficiales de `@medusajs/medusa/core-flows` (`createProductsWorkflow`, `createProductCategoriesWorkflow`, etc.).

**Decisión:** La tercera opción.

**Por qué:** Medusa v2 modela productos con muchas tablas de enlace (`product_sales_channel`, `product_variant_price_set`, `product_variant_inventory_item`, etc. — ver el bloque "Created following links tables" que imprime la migración inicial). Escribir eso a mano por SQL es extremadamente frágil. Los workflows encapsulan toda esa complejidad y son literalmente el mismo mecanismo que usa el propio `initial-data-seed.ts` que genera Medusa al instalarse — copiar ese patrón garantiza compatibilidad con la versión instalada (2.20.1).

**Impacto:** El script vive en `patilandia-backend/apps/backend/src/scripts/patilandia-seed.ts`. Si se agregan más productos a `data/mock-store.ts` en el storefront, hay que reflejarlos manualmente en este script también (no hay sincronización automática — decisión consciente de no construir esa infraestructura todavía).

---

### [2026-09-04] Esquema de `metadata` en Medusa: solo los campos que `adaptMedusaProduct` ya lee

**Contexto:** Al crear los productos reales en Medusa había que decidir qué guardar en `metadata` (namespace libre de Medusa) vs. usar entidades nativas de Medusa (variantes reales por talla/color, categorías nativas, etc.).

**Decisión:** El `metadata` de cada producto en Medusa replica exactamente las claves que `adaptMedusaProduct()` (`src/lib/medusa/adapters.ts`) ya leía desde antes: `categorySlug`, `categoryLabel`, `collectionSlug`, `petType`, `shortDescription`, `price`, `compareAtPrice`, `rating`, `reviewCount`, `badge`, `theme`, `colorName`, `colorHex`, `stock`, `featured`, `tag`. Cada producto tiene un único variant "Única" (no variantes reales de Medusa por talla/color).

**Por qué:** El adaptador ya estaba escrito así antes de que existiera Medusa real (ver decisión "[2026-09-03] Capa de adaptación desacoplada"). En vez de rediseñar el adaptador y el esquema de datos al mismo tiempo que se instala Medusa por primera vez, se migró el catálogo respetando el contrato existente — esto garantiza paridad visual 1:1 con lo que ya mostraban los mocks (mismos precios, mismas imágenes, mismos badges) apenas se conecta, cero regresión.

**Impacto — deuda técnica reconocida, no resuelta:** Esto significa que hoy Medusa **no** modela tallas/colores como variantes reales compra-bles, y el sistema de precios/monedas nativo de Medusa (`variant.prices`) es casi decorativo — el precio que se muestra sale de `metadata.price`, no de la pricing engine de Medusa. Cuando se implemente checkout real contra el carrito de Medusa, esto va a necesitar rediseñarse (variantes reales por talla/color, precios en la pricing engine). Ver [[Pendientes Claude]] e [[Integración Medusa]].

---

### [2026-09-04] Imágenes de producto en Medusa como rutas relativas (`/images/patilandia/*.png`), no URLs absolutas

**Contexto:** Medusa necesita una URL para `thumbnail`/`images` de cada producto. Las imágenes reales viven en `patilandia/public/images/patilandia/`, servidas por el storefront Next.js, no por Medusa.

**Decisión:** Se guardó la misma ruta relativa que ya usaban los mocks (ej. `/images/patilandia/royal-bed.png`) como valor de `thumbnail`/`images[].url` en Medusa, en vez de una URL absoluta a algún storage.

**Por qué:** `next/image` resuelve rutas relativas contra el `public/` del propio storefront sin importar de dónde vino el dato (Medusa o mock) — es exactamente el mismo mecanismo que ya funcionaba. Usar una URL absoluta (ej. `http://localhost:3000/images/...`) habría requerido configurar `images.remotePatterns` en `next.config.ts` y se habría roto en producción (el dominio cambia). Esto es válido mientras las imágenes sean las mismas del storefront; el día que haya fotografía real de producto subida a un storage (S3/Medusa File module), ahí sí tocará usar URLs absolutas y configurar `remotePatterns`.

**Impacto:** `adaptMedusaProduct` se actualizó para leer `record.images` (array real de Medusa) y mapearlo a `galleryImages`, con fallback a `[thumbnail]` — antes solo usaba `thumbnail` repetido, así que esto también fue una mejora real del adaptador (la galería de producto ahora muestra múltiples imágenes reales en vez de una sola repetida).

---

### [2026-09-05] Header mobile sin hamburguesa ni wishlist — el bottom nav es la navegación mobile real

**Contexto:** El header tenía un menú hamburguesa mobile que duplicaba exactamente lo que ya resuelve `MobileBottomNav` (Inicio, Categorías, Wishlist, Cuenta, Carrito), y un ícono de corazón/wishlist en el cluster de íconos de arriba.

**Decisión:** Se eliminó el botón hamburguesa y todo su menú desplegable mobile de `SiteHeader`. Se eliminó el ícono de wishlist del header (desktop y mobile) — el usuario fue explícito: **solo del header**, el bottom nav mobile se queda con su propia pestaña de Wishlist tal cual estaba (no se tocó `MobileBottomNav`).

**Por qué:** El bottom nav ya cubre navegación completa en mobile — mantener dos formas idénticas de llegar a los mismos 5 destinos era redundancia pura. El corazón en el header quedó fuera de scope de "el resto te lo dejo a ti" porque el usuario pidió explícitamente sacarlo solo de ahí, dejando la pestaña de wishlist del bottom nav intacta — es una decisión deliberadamente asimétrica, no un descuido.

**Impacto:** Quitar la hamburguesa se llevó consigo el único lugar donde el buscador aparecía en mobile (vivía dentro del menú desplegable). El usuario confirmó explícitamente "sin buscador en mobile por ahora" al preguntárselo — no agregar un ícono de lupa sin que lo pidan. Ver [[Pendientes Claude]].

---

### [2026-09-05] Logo cuadrado reemplazado por lockup rectangular — bug de aspect-ratio real, no solo estético

**Contexto:** El header se veía "muy grande o vacío". Investigando, el HTML real de Next.js mostraba `width="220" height="80"` en el `<Image>` del logo, pero el archivo real (`logo-patilandia.png`) era un cuadrado perfecto de 1254×1254px. El navegador reserva espacio con el ratio declarado (220:80) al inicio y, al cargar la imagen real, recalcula el alto `auto` usando el ratio REAL del archivo (1:1) — el logo saltaba de ~51px a ~140px de alto tras la carga, inflando el header.

**Opciones evaluadas:**
- Solo arreglar el bug de proporción y mostrar el logo cuadrado completo como insignia compacta (~48px) — el nombre "Patilandia" queda ilegible a ese tamaño.
- Recortar solo la porción de texto del PNG cuadrado existente — inviable limpio: las patas de las mascotas se superponen físicamente con las letras en el diseño original, no hay línea de corte limpia (se probó, quedaban fragmentos de patas sueltos).
- Usar el nuevo `logo-rectangular.png` que el usuario subió (lockup horizontal: ilustración a la izquierda, wordmark + slogan a la derecha, 1512×600px).

**Decisión:** La tercera opción — `Logo` ahora usa `logo-rectangular.png` con `width={1512} height={600}` (coincide exactamente con el archivo real) y `h-16 w-auto` (antes `w-[140px] h-auto`, la causa raíz del bug).

**Por qué:** Es la única opción que resuelve el bug de raíz (proporción declarada = proporción real, sin saltos de layout) Y mantiene el wordmark "Patilandia" legible a tamaño de header — el PNG cuadrado viejo nunca pudo lograr ambas cosas a la vez.

**Impacto:** El PNG cuadrado original (`logo-patilandia.png`) sigue existiendo y se sigue usando en el footer (aunque ahí el intento de invertir el texto a blanco vía CSS `[&_span]` nunca funcionó — el `Logo` solo renderiza una `<Image>`, no hay `<span>`s que targetear; problema preexistente, no introducido ahora, documentado pero no arreglado por no ser lo pedido).

---

### [2026-09-05] Grids de producto/colección en 2 columnas desde el primer breakpoint, no desde `sm:`

**Contexto:** Pedido explícito del usuario: "que las cards de productos hayan 2 por fila" en mobile. Todos los grids (`ProductCard`, `CollectionCard`) usaban `sm:grid-cols-2` — es decir, 1 columna en cualquier pantalla menor a 640px, que es literalmente todo el rango de teléfonos reales.

**Decisión:** Cambiar la clase base a `grid-cols-2` (sin el prefijo `sm:`) en los 7 grids afectados, y hacer `ProductCard`/`CollectionCard` responsive de verdad (`sm:` como el breakpoint que agranda texto/padding, no el que activa 2 columnas).

**Por qué:** A ~160-170px de ancho de card (2 columnas en un teléfono de 375-428px), el contenido pensado para cards de ancho completo se ve apretado o se desborda — nombre de producto en `text-3xl`, botón "Agregar al carrito" en `text-sm px-5`. En vez de solo cambiar el grid y dejar que se vea mal, se ajustó cada pieza de `ProductCard` con un par de tamaños (compacto por defecto, tamaño original desde `sm:`), incluyendo que el botón diga solo **"Agregar"** en mobile y **"Agregar al carrito"** desde `sm:` — evita que el texto se parta en dos líneas en una tarjeta angosta.

**Impacto:** Cualquier componente nuevo de tarjeta que se agregue debería seguir el mismo patrón (base = mobile compacto, `sm:` = tamaño "normal") en vez de asumir que el contenido cabe igual a cualquier ancho de card.

---

### [2026-09-04] Estrategia híbrida para el admin: Medusa nativo + extensiones propias, sin fork ni admin completo

**Contexto:** El usuario pidió aplicar el diseño del storefront al admin de Medusa. Investigación (código instalado + discusión GitHub #14938 sin respuesta de mantenedores) confirmó que no hay forma soportada de re-temear el dashboard nativo globalmente.

**Opciones evaluadas:**
- Forkear `@medusajs/dashboard` como git submodule (community pattern documentado, pero implica resincronizar el fork en cada upgrade de Medusa).
- Construir un admin propio 100% desde cero, con paridad total con el admin de Medusa (productos, órdenes, promociones, impuestos, roles, etc.) — descartado por el propio usuario al ver el tamaño real del esfuerzo (equivalente a reconstruir un panel tipo Shopify admin).
- Estrategia híbrida: Medusa nativo para todo lo estándar + extensiones oficiales (`defineWidgetConfig`/`defineRouteConfig`) y módulos custom para lo diferencial de Patilandia (mascotas, proveedores, envío por peso, fidelización, suscripciones).

**Decisión:** La estrategia híbrida — explícitamente pedida por el usuario tras ver los costos reales de las otras dos.

**Por qué:** Cubre exactamente lo que Medusa no modela (mascotas de clientes, proveedores) sin pagar el costo de mantenimiento de un fork ni el costo de reconstruir funcionalidad que Medusa ya resuelve bien (productos, pedidos, pagos). Todo lo custom se construye en 3 capas (módulo → workflow → API route admin) para que un futuro "Patilandia Admin" separado solo necesite construir frontend contra rutas que ya existen — sin rehacer backend.

**Impacto:** Roadmap de 7 fases documentado en [[Patilandia sobre Medusa Admin — Diagnóstico y Roadmap]]. Nada construido todavía — es la base de decisión para las próximas sesiones de trabajo en `patilandia-backend`.

---

### [2026-09-03] Tipografía self-hosted vía `@fontsource` en vez de Google Fonts CDN

**Contexto:** Brief pide identidad "premium", "mágica" — Baloo 2 (display, redondeada) + Nunito (body).

**Decisión:** `@fontsource/baloo-2` y `@fontsource/nunito` como dependencias npm, importadas en `globals.css` con `@import`.

**Por qué:** Evita una petición externa a Google Fonts en cada carga (mejor performance/privacy, consistente con brief sección 18 de SEO/performance), y las fuentes quedan versionadas junto al código.

**Impacto:** Actualizar la tipografía significa cambiar la versión del paquete npm, no una URL externa.

Tags: #claude #decisiones #arquitectura
