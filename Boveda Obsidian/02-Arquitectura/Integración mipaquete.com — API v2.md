---
title: Integración mipaquete.com — API v2
date: 2026-09-27
tags:
  - arquitectura
  - shipping
  - envios
status: activo
---

# Integración API mipaquete.com v2 — Node.js + Axios

> [!success] Estado: implementado (2026-09-27/28)
> Construido como el plugin propio `patilandia-mipaquete` — ver [[Decisiones y Razonamiento]] (entrada 2026-09-27/28) para la arquitectura real, los bugs encontrados/corregidos, y [[Pendientes Claude]] para lo que sigue abierto. Esta nota queda como la referencia técnica de la API en sí (endpoints, campos, quirks documentados) — sigue siendo el documento a consultar para cualquier cambio futuro sobre la integración.

> Documento de referencia para Claude Code. Fuente: https://api.documentacion.mipaquete.com/ (documentación Postman oficial, revisada el 2026-09-27).
> Objetivo: implementar un cliente Node.js con **axios** que cubra todos los endpoints de la API v2 de mipaquete.com (cotizar, crear envíos, rastrear, cancelar, ciudades DANE, usuarios, direcciones y webhooks).

---

## 1. Resumen de la API

mipaquete.com es un agregador logístico (Colombia principalmente; también México y Argentina). La API permite:

- Cotizar envíos con todas las transportadoras que cubren una ruta origen → destino (incluye pago contra entrega).
- Crear envíos eligiendo transportadora por **id** o por **criterio automático** (`price`, `time`, `score`).
- Generar guía (URL del PDF) y, opcionalmente, solicitar recogida automática.
- Consultar envíos (con filtros y paginación) y su tracking.
- Cancelar envíos.
- Listar ciudades/municipios con código DANE.
- Crear y actualizar usuarios.
- Gestionar direcciones alternativas de recogida (bodegas).
- Suscribir webhooks para recibir la guía creada y los cambios de estado.

---

## 2. Base URL y entornos

| Entorno | Base URL |
|---|---|
| Desarrollo / pruebas (la que aparece en la doc) | `https://api-v2.dev.mpr.mipaquete.com` |
| Producción | **No aparece en la documentación.** Probablemente `https://api-v2.mpr.mipaquete.com` — **confirmar con soporte de mipaquete antes de salir a producción.** |

Implementar la base URL como variable de entorno (`MIPAQUETE_BASE_URL`), nunca hardcodeada.

> Nota: los IDs de transportadoras, usuarios, etc. de los ejemplos son del entorno dev; en producción pueden diferir. Siempre obtenerlos con `GET /getDeliveryCompanies`.

---

## 3. Autenticación y headers

Todas las peticiones usan dos headers:

| Header | Obligatorio | Descripción |
|---|---|---|
| `apikey` | Sí (excepto `generateapikey` y `createUser`) | JWT obtenido con `POST /generateapikey`. **No expira por petición**: se genera una vez y se reutiliza siempre (según la doc). |
| `session-tracker` | Sí (en todos) | Un UUID. La doc usa UUIDs fijos de ejemplo; se recomienda generar uno con `crypto.randomUUID()` (por sesión o por petición). |
| `Content-Type` | Sí en POST/PUT/DELETE con body | `application/json` |

> ⚠️ La documentación pública contiene API keys de ejemplo reales (JWT). **No usarlas.** Generar la propia y guardarla en `.env`.

Variables de entorno sugeridas:

```env
MIPAQUETE_BASE_URL=https://api-v2.dev.mpr.mipaquete.com
MIPAQUETE_API_KEY=eyJ...            # resultado de /generateapikey
MIPAQUETE_EMAIL=tu@correo.com       # solo si se quiere regenerar la apikey
MIPAQUETE_PASSWORD=********
MIPAQUETE_USER_ID=                  # _id del usuario (de GET /getUser), usado en createSending.user
```

---

## 4. Advertencias importantes (quirks de la documentación)

1. **Los ejemplos de Postman envían el body como string con comentarios `//`** → eso es JSON inválido. En la implementación enviar **objetos JS** en `data` (axios los serializa).
2. **Dimensiones**: en `quoteShipping` el largo es `length`; en `createSending` (dentro de `productInformation`) el largo es **`large`**.
3. **Enteros**: alto, ancho, largo (cm) y peso (kg) deben ser **números enteros**.
4. **`requestPickup`**: un ejemplo lo envía como string `"false"`; usar **boolean**.
5. **Tiempos** (`shippingTime`, `pickupTime`) en la cotización vienen en **minutos**.
6. **`createSending` re-cotiza internamente**: si los valores difieren de la cotización previa, el costo final puede cambiar.
7. **`deliveryCompany` vs `criteria`** en `createSending`: se espera uno de los dos; si se envían ambos, **`criteria` tiene prioridad**.
8. **`getSendings`** devuelve muchas claves **en español con espacios y tildes** (ej. `"Número de Guía"`, `"Código mipaquete"`). Acceder con `obj["Número de Guía"]` y mapear a un DTO propio.
9. **`updateUser` es `POST`** (no PUT).
10. **`DELETE /myDirections` lleva body** → en axios usar `axios.delete(url, { data: [...] })`.
11. Los ejemplos de `createUser`/`updateUser` apuntan a `http://localhost:4050`; ignorarlo, usar la base URL.
12. Códigos de ubicación: Colombia usa **código DANE de 8 dígitos como string** (`"05001000"` Medellín, `"11001000"` Bogotá). Conservar ceros a la izquierda (siempre string).
13. Códigos de país: `"170"` Colombia, `"484"` México, `"032"` Argentina.

---

## 5. Endpoints

Resumen:

| # | Método | Ruta | Uso |
|---|---|---|---|
| 1 | POST | `/generateapikey` | Obtener API key (email + password) |
| 2 | GET | `/getUser` | Datos del usuario autenticado (saldo, direcciones, banco…) |
| 3 | GET | `/getLocations?locationCode=` | Ciudades/municipios con código DANE |
| 4 | GET | `/getDeliveryCompanies` | Lista de transportadoras |
| 5 | POST | `/quoteShipping` | Cotizar envío |
| 6 | POST | `/createSending` | Crear envío (guía y recogida opcional) |
| 7 | POST | `/getSendings/{page}` | Listar envíos con filtros y paginación |
| 8 | GET | `/getSendingTracking?mpCode=` | Tracking de un envío |
| 9 | PUT | `/cancelSending` | Cancelar envío |
| 10 | POST | `/createUser` | Crear usuario |
| 11 | POST | `/updateUser` | Actualizar usuario |
| 12 | GET | `/myDirections` | Listar direcciones alternativas |
| 13 | POST | `/myDirections` | Crear direcciones alternativas |
| 14 | PUT | `/myDirections` | Actualizar direcciones alternativas |
| 15 | DELETE | `/myDirections` | Eliminar direcciones alternativas |
| 16 | POST | `/createWebHook` | Registrar URLs de webhook |
| 17 | PUT | `/updateAndDisableWebhook` | Actualizar / desactivar webhooks |

---

### 5.1 POST `/generateapikey`

Genera el APIKEY. No es necesario generarlo en cada solicitud.

Headers: `session-tracker`.

Body:
```json
{ "email": "correo@registro.com", "password": "TuPassword123$" }
```

Respuesta 200:
```json
{ "APIKey": "eyJhbGciOi..." }
```
> Ojo: la propiedad es `APIKey` (mayúsculas), pero el header que se envía es `apikey`.

---

### 5.2 GET `/getUser`

Headers: `apikey`, `session-tracker`.

Respuesta 200 (campos relevantes):
```json
{
  "_id": "5d3088e34dabd25ee4e3e664",       // id del usuario → usar en createSending.user
  "name": "Test-mi-paquete-real",
  "surname": "Junior",
  "address": "CARRERA 43 #21-B33",          // dirección de recogida principal
  "email": "correo@dominio.com",
  "role": { "type": "user" },
  "cash": 10196366,                         // saldo disponible
  "accountEnabled": true,                   // cuenta confirmada
  "tyc": true,                              // términos aceptados
  "businessName": "Test-mi-paquete-real",
  "documentType": "CC",
  "documentNumber": "1000284657",
  "cellPhone": "3103321021",
  "prefix": "+57",
  "createdAt": "2019-07-18T14:57:39.044Z",
  "updatedAt": "2021-08-18T00:00:22.640Z",
  "locationCode": "05001000",               // DANE ciudad origen
  "accountBank": {
    "bank": "BANCOLOMBIA", "beneficiaryName": "Test", "accountType": "ahorros",
    "accountNumber": "*******456", "typeId": "CC", "numberId": "*******456"
  },
  "tradeName": "Razón social",
  "alternativeDirections": [ { "name": "Boulevar", "address": "Calle 10 - 15 # 20" } ],
  "productType": "textile"
}
```

---

### 5.3 GET `/getLocations`

Devuelve localidades con código DANE, departamento y nombre, según el filtro.

Headers: `apikey`, `session-tracker`.
Query params: `locationCode` (opcional, filtra por código DANE, ej. `05001000`). Sin filtro devuelve todas (cachear localmente).

Respuesta 200:
```json
[
  {
    "_id": "5aa1bc45b63d79e54e7da306",
    "locationName": "AMALFI",
    "departmentOrStateName": "ANTIOQUIA",
    "locationCode": "05031000",
    "departmentOrStateCode": "5",
    "tccCode": "485",
    "countryId": "5ff5f3319c9f7d1afa0d0e2b",
    "countryCode": "170"
  }
]
```

---

### 5.4 GET `/getDeliveryCompanies`

Headers: `apikey`, `session-tracker`.

Respuesta: `[ { _id, name, image } ]`. Valores de ejemplo (entorno dev):

| _id | name |
|---|---|
| `5cb0f5fd244fe2796e65f9fc` | COORDINADORA |
| `6080a75ef08a770ddd9724fd` | ENVIA |
| `5fceb46c8229797cb139a7aa` | SERVIENTREGA |
| `5ca22d9587981510092322f6` | TCC |
| `5ea34d5e254c3206ee0fc628` | TEMPO EXPRESS |

(En `createSending` también se menciona **Interrapidísimo**, que usa `locate.interCode`.)

---

### 5.5 POST `/quoteShipping`

Genera la cotización: cobertura por transportadora, comisiones de recaudo (contra entrega) y tiempos aproximados de recogida/entrega (**en minutos**).

Headers: `apikey`, `session-tracker`.

Body:

| Campo | Tipo | Req. | Descripción |
|---|---|---|---|
| `originLocationCode` | string | Sí | Código DANE origen |
| `destinyLocationCode` | string | Sí | Código DANE destino |
| `originCountryCode` | string | No* | Código país origen (`"170"`, `"484"`, `"032"`). *Necesario fuera de Colombia |
| `destinyCountryCode` | string | No* | Código país destino |
| `height` | int | Sí | Alto cm |
| `width` | int | Sí | Ancho cm |
| `length` | int | Sí | Largo cm |
| `weight` | int | Sí | Peso kg |
| `quantity` | int | Sí | Nº de paquetes con mismas medidas y peso |
| `declaredValue` | number | Sí | Valor declarado/asegurado por unidad |
| `saleValue` | number | No | Valor de venta (para pago contra entrega) |

Ejemplo:
```json
{
  "originLocationCode": "05001000",
  "destinyLocationCode": "11001000",
  "height": 14, "width": 25, "length": 35, "weight": 3,
  "quantity": 1,
  "declaredValue": 200000,
  "saleValue": 200000
}
```

Respuesta 200 (array, una entrada por transportadora):
```json
[
  {
    "id": "60b4920de0692b26737e0dd1",              // id interno de la cotización
    "deliveryCompanyName": "COORDINADORA",
    "deliveryCompanyImgUrl": "https://.../coordinadora.png",
    "shippingCost": 22200,                          // costo del envío
    "collectionCommissionWithRate": 9984,           // comisión recaudo si al valor a recaudar se le suma el flete
    "collectionCommissionWithOutRate": 8600,        // comisión recaudo si NO se suma el flete
    "isMessengerService": true,                     // servicio de mensajería
    "shippingTime": 2880,                           // minutos (promedio entrega)
    "realWeightVolume": 5,                          // peso real/volumétrico
    "officeAddress": "km 1.5 vía Parcelas, Cota",   // oficina para recoger en punto
    "forwardingService": false,                     // servicio con reexpedidor
    "singleOfficeDelivery": false,                  // solo entrega en oficina (no domicilio)
    "pickupService": true,                          // ofrece recogida
    "pickupTime": 360,                              // minutos (promedio recogida)
    "deliveryCompanyId": "5cb0f5fd244fe2796e65f9fc",// usar en createSending.deliveryCompany
    "score": 4                                      // calificación del servicio
  }
]
```

---

### 5.6 POST `/createSending`

Crea el envío, con o sin solicitud de recogida. Re-cotiza internamente.

Headers: `apikey`, `session-tracker`.

Body:

| Campo | Tipo | Req. | Descripción |
|---|---|---|---|
| `sender` | object | Sí | Remitente (ver abajo) |
| `receiver` | object | Sí | Destinatario (ver abajo) |
| `productInformation` | object | Sí | Producto (ver abajo) |
| `locate` | object | Sí | Origen/destino (ver abajo) |
| `channel` | string | Sí | Nombre de la tienda/canal que consume el servicio |
| `deliveryCompany` | string | Uno de los dos | `_id` de la transportadora |
| `criteria` | `"price"` \| `"time"` \| `"score"` | Uno de los dos | Selección automática: menor precio, menor tiempo, mejor calificación. Prioritario si vienen ambos |
| `description` | string | Sí | Descripción del contenido |
| `comments` | string | No | Comentarios / observaciones |
| `paymentType` | number | Sí | `101` = pago con saldo mipaquete · `102` = descontar el envío del recaudo (contra entrega) |
| `valueCollection` | number | Sí | Valor a recaudar (contra entrega); `0` si no aplica |
| `requestPickup` | boolean | Sí | Solicitar recogida en la dirección del remitente |
| `adminTransactionData.saleValue` | number | Sí | Valor de venta (contra entrega); `0` si no aplica |
| `user` | string | No | `_id` del usuario (aparece en el body de ejemplo) |

`sender`:

| Campo | Descripción |
|---|---|
| `name`, `surname` | Nombre y apellido |
| `cellPhone` | Celular (string) |
| `prefix` | Indicativo, ej. `"+57"` |
| `email` | Email |
| `pickupAddress` | Dirección de recogida |
| `nit` | Nº de documento |
| `nitType` | Tipo documento (`"CC"`, `"NIT"`, …) |

`receiver`:

| Campo | Descripción |
|---|---|
| `name`, `surname`, `email`, `prefix`, `cellPhone` | Datos básicos |
| `destinationAddress` | Dirección de entrega |
| `nit`, `nitType` | **Obligatorios si el destinatario recoge en oficina/punto** de la transportadora |

`productInformation`:

| Campo | Tipo | Descripción |
|---|---|---|
| `quantity` | int | Unidades con mismas dimensiones y peso |
| `width` | int | Ancho cm |
| `large` | int | **Largo** cm (ojo: `large`, no `length`) |
| `height` | int | Alto cm |
| `weight` | int | Peso kg |
| `forbiddenProduct` | boolean | `true` = declara que NO envía artículos prohibidos |
| `productReference` | string | Referencia del producto |
| `declaredValue` | number | Valor asegurado |

`locate`:

| Campo | Descripción |
|---|---|
| `originDaneCode` | DANE origen |
| `destinyDaneCode` | DANE destino |
| `originCountryCode` / `destinyCountryCode` | Código país (necesario fuera de Colombia) |
| `interCode` | Código de sucursal para envíos con Interrapidísimo (opcional) |

Ejemplo:
```json
{
  "sender": {
    "name": "Jesus", "surname": "Ramirez", "cellPhone": "3013528220", "prefix": "+57",
    "email": "remitente@dominio.com", "pickupAddress": "Calle 20 #32b 143",
    "nit": "1152456886", "nitType": "CC"
  },
  "receiver": {
    "name": "Maria", "surname": "Ruiz", "email": "destinatario@dominio.com", "prefix": "+57",
    "cellPhone": "3013528220", "destinationAddress": "Carrera 70 #32N 143",
    "nit": "1152456886", "nitType": "CC"
  },
  "productInformation": {
    "quantity": 1, "width": 20, "large": 20, "height": 10, "weight": 1,
    "forbiddenProduct": true, "productReference": "JEAN A17", "declaredValue": 10000
  },
  "locate": { "originDaneCode": "11001000", "destinyDaneCode": "11001000" },
  "channel": "Mi Tienda",
  "deliveryCompany": "5ca22d9587981510092322f6",
  "criteria": "price",
  "description": "JEANS",
  "comments": "comentarios adicionales",
  "paymentType": 101,
  "valueCollection": 0,
  "requestPickup": false,
  "adminTransactionData": { "saleValue": 0 }
}
```

Respuesta 200:
```json
{ "mpCode": 254562, "message": "Envio generado correctamente" }
```
`mpCode` = código mipaquete del envío. Guardarlo: se usa para tracking, consulta y cancelación. El número de guía y el PDF llegan después (vía webhook `urlForGuides` o consultando `getSendings`).

---

### 5.7 POST `/getSendings/{page}`

Lista los envíos del usuario con filtros y paginación. `{page}` es el número de página (empieza en 1).

Headers: `apikey`, `session-tracker`.

Body (todos opcionales salvo `pageSize`):

| Campo | Tipo | Descripción |
|---|---|---|
| `pageSize` | int | Envíos por página |
| `mpCode` | number | Filtrar por código mipaquete |
| `deliveryCompany` | string[] | Filtrar por ids de transportadora |
| `confirmationDate` | `{ init: "YYYY-MM-DD", end: "YYYY-MM-DD" }` | Rango de fechas |

Ejemplo:
```json
{
  "deliveryCompany": ["5ca22d9587981510092322f6"],
  "confirmationDate": { "init": "2021-07-08", "end": "2022-02-17" },
  "pageSize": 25
}
```

Respuesta 200:
```json
{
  "totalItems": 48,
  "sendings": [
    {
      "_id": "60e5ee284a5e1e6c9326d843",
      "deliveryCompany": "5ca22d9587981510092322f6",
      "tracking": [ { "updateState": "Envío pendiente por pago", "date": "2021-07-07T18:10:48.123Z" } ],
      "pdfGuide": [
        "https://s3.amazonaws.com/docs.mipaquete.com/sendings/guide/tcc-relation-602132067.pdf",
        "https://s3.amazonaws.com/docs.mipaquete.com/sendings/guide/tcc-guide-602132067.pdf"
      ],
      "Id del usuario": "5d3088e34dabd25ee4e3e664",
      "Producto o Referencia": "Test desc",
      "Código mipaquete": 250592,
      "Número de Guía": "602132067",
      "Número de Recolección": 402679577,
      "Canal": "pagina transaccional",
      "Tipo de servicio": "Mensajería",
      "Fecha de Solicitud": "2021-07-07",
      "Hora de Solicitud": "13:10:48",
      "Fecha de Recogida": "Recolección pendiente",
      "Origen": "MEDELLÍN-ANTIOQUIA",
      "Nombre del remitente": "…",
      "Tipo de Identificación Remitente": "CC",
      "Identificación del remitente": "1000284657",
      "Celular del Remitente": 3006571422,
      "Dirección Remitente": "CARRERA 43 #21-B33",
      "Destino": "BOGOTÁ D.C.-BOGOTÁ D.C.",
      "Destinatario": "…",
      "Celular del destinatario": 3000000000,
      "Dirección Destinatario": "Dir 777777",
      "Tipo de identificación destinatario": "CC",
      "Cantidad": 1,
      "Dimensiones(cm)": "10x10x10",
      "Peso Volumen (kg)": 5,
      "Peso (kg)": 5,
      "Peso Facturado (kg)": 5,
      "Servicio Adicional": "NO",
      "Valor a recaudar": 0,
      "Banco": "No disponible",
      "Nombre del Beneficiario": "No disponible",
      "Número de cuenta": "No disponible",
      "Número de identificación del beneficiario": "No disponible",
      "Tipo de identificación": "No disponible",
      "Tipo de cuenta": "No disponible",
      "Valor declarado": 15000,
      "Transportadora": "TCC",
      "Valor de la Venta": 0,
      "Valor del flete": 20610,
      "Valor de la comisión de recaudo": 0,
      "Valor total del servicio": 20610,
      "Valor a Transferir": 0,
      "Forma de pago": "Pago con saldo disponible",
      "Estado actual del envío": "Envío cancelado",
      "Fecha última actualización": "2021-07-13",
      "Hora última actualización": "15:12:39",
      "Tiempo promesa de entrega en días hábiles": 3,
      "Observaciones del envío": "test recommendations",
      "Reintegro comisión del recaudo (por devolución)": 0,
      "Cobro flete devolución": 0,
      "Costo total del envío (ida y regreso)": 0,
      "Costo pendiente por cobrar": 0,
      "Email del remitente": "test@gmail.com",
      "height": 10, "large": 10, "width": 10
    }
  ]
}
```

Significado de campos clave:
- `pdfGuide`: URLs del PDF de la guía y de la relación de despacho (si la transportadora la usa).
- `Número de Recolección`: código de recogida propio de la transportadora.
- `Peso Volumen (kg)`: fórmula de la transportadora según dimensiones y peso real. `Peso Facturado (kg)`: el que cobra la transportadora.
- `Servicio Adicional`: `"SI"`/`"NO"` = tiene pago contra entrega.
- `Valor a recaudar`: lo que cobra el mensajero al entregar (contra entrega).
- Datos bancarios: para consignar lo recaudado (contra entrega). Pueden venir como `"No disponible"`; tipos mixtos (string/number).
- `Valor del flete`: costo del envío. `Valor de la comisión de recaudo`: comisión de la transportadora por recaudar. `Valor total del servicio` = flete + comisión.
- `Valor a Transferir`: lo que se transfiere al comercio si el recaudo fue exitoso.
- `Forma de pago`: "Pago con saldo disponible" o descontando del recaudo.
- `Reintegro comisión del recaudo (por devolución)`, `Cobro flete devolución`, `Costo total del envío (ida y regreso)`, `Costo pendiente por cobrar`: costos en caso de devolución.
- Tipos inconsistentes: celulares y números de cuenta pueden venir como number o string → normalizar a string.

---

### 5.8 GET `/getSendingTracking`

Tracking de un envío por código MP (la doc dice también "o número de guía", pero el parámetro documentado es `mpCode`).

Headers: `apikey`, `session-tracker`.
Query: `mpCode` (ej. `451399`).

Respuesta 200:
```json
{
  "deliveryCompanyName": "SERVIENTREGA",
  "deliveryCompany": "5fceb46c8229797cb139a7aa",
  "tracking": [
    { "updateState": "Envío pendiente por pago", "date": "2021-07-14T14:33:11.504Z" },
    { "updateState": "Procesando tu envío", "date": "2021-07-14T14:33:11.539Z" },
    { "updateState": "Envío con novedad", "date": "2021-07-14T14:33:11.539Z", "description": "Dirección errada" }
  ],
  "mpCode": 254346,
  "origin": "BOGOTÁ D.C.",
  "destiny": "SAN PEDRO"
}
```
`description` aparece en eventos de novedad.

---

### 5.9 PUT `/cancelSending`

Cancela un envío. Solo se puede cancelar en estos estados:
- `Procesando tu envío`
- `Envío programado`
- `Recolección programada`

Headers: `apikey`, `session-tracker`.

Body:
```json
{ "mpCode": 1000903 }
```

Respuesta:
```json
{
  "message": "the shipment has beed updated",
  "cashMovement": {
    "userInfo": {
      "userId": "60b185aafd5be5861db4851d",
      "cash": 92231514,
      "cashComission": "shipment does not have collection service",
      "cashSending": 92250414,
      "newCash": 92250414,
      "message": "user cash was updated"
    },
    "transactions": {
      "productCode": 1000904,
      "paymentType": 101,
      "user": "60b185aafd5be5861db4851d",
      "paymentPrice": 18900,
      "cash": 92231514,
      "newCash": 92250414,
      "transactionType": "income",
      "description": "MP1000904-Reintegro costo del envío por cancelación",
      "createdAt": "2021-11-08T14:32:29.774Z",
      "updatedAt": "2021-11-08T14:32:29.774Z",
      "_id": "618934fddf054c8030b4378f"
    },
    "message": "the transaction has been done succesfully"
  }
}
```
Al cancelar se reintegra el costo al saldo del usuario.

---

### 5.10 POST `/createUser`

Crea un usuario. Headers: `session-tracker` (sin apikey), `Content-Type: application/json`.

Reglas:
- Al crear por API se aceptan por defecto T&C y política de privacidad.
- `password`: mínimo 8 caracteres, 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial.
- El email debe ser real: llega un link de confirmación para activar la cuenta (`accountEnabled` queda en `false` hasta confirmar).

Body (todos requeridos):

| Campo | Ejemplo | Notas |
|---|---|---|
| `name` | `"Julian"` | |
| `surname` | `"Perez"` | |
| `businessName` | `"Mi Tienda"` | |
| `documentType` | `"CC"` | |
| `documentNumber` | `"10000001010"` | |
| `salesChannel` | `"facebook"` | Ver lista de canales |
| `productType` | `"otros"` | Ver lista de tipos |
| `personType` | `"Natural"` | Natural / Jurídica |
| `cellPhone` | `"3007782877"` | |
| `address` | `"carrera 15 #6-19"` | |
| `locationCode` | `"05001000"` | DANE (u equivalente en MX/AR, ej. `"C1001"`) |
| `email` | | |
| `password` | | Ver reglas |
| `averageShipments` | `"30 a 200"` | Ver valores |
| `prefix` | `"57"` | `"57"` CO, `"52"` MX, `"54"` AR |
| `tyc` | `true` | |
| `countryCode` | `"170"` | `"170"` CO, `"484"` MX, `"032"` AR |
| `accountBank.bank` | `"bancolombia"` | |
| `accountBank.beneficiaryName` | | |
| `accountBank.accountType` | `"ahorros"` | |
| `accountBank.accountNumber` | `20102112001` | |
| `accountBank.typeId` | `"NIT"` | |
| `accountBank.numberId` | `"1037663886"` | |

Tipos de producto (`productType`), según la doc: Moda, ropa y textiles · Tecnología y electrónicos · Belleza y cuidado personal · Juguetería · Papelería, arte y cultura · Artículos deportivos · Alimentos no perecederos · Artículos para vehículos · Artículos para mascotas · Artículos de hogar · Accesorios y bisutería · Otros.
> Los ejemplos envían `"otros"` en minúscula; el formato exacto de los demás valores no está documentado → confirmar con soporte.

Canales de venta (`salesChannel`): Redes sociales · WhatsApp · Tienda Online Woocommerce · Tienda Online Shopify · Tienda online Magento · Tienda online Komercia · Tienda online Jumpseller · Otros · Ninguno. (Los ejemplos usan `"facebook"`.)

Promedio de envíos mensuales (`averageShipments`): `"1 a 30"`, `"30 a 200"`, `"200 a 500"`, `"500 a 5.000"`, `"Más de 5.000"`.

Respuesta 200 (array con el usuario creado; `password` viene `null`):
```json
[
  {
    "name": "…", "surname": "…", "businessName": "…", "documentType": "CC",
    "documentNumber": "10000001010", "salesChannel": "facebook", "productType": "otros",
    "personType": "Natural", "cellPhone": "3007782877", "address": "…", "locationCode": "…",
    "email": "…", "password": null,
    "accountBank": { "bank": "bancolombia", "beneficiaryName": "…", "accountType": "ahorros",
                     "accountNumber": 20102112001, "typeId": "NIT", "numberId": "1037663886" },
    "tyc": true, "prefix": "+57", "accountEnabled": false, "cash": 0,
    "createdAt": "2021-10-12T20:44:59.409Z", "updatedAt": "2021-10-12T20:44:59.409Z",
    "_id": "6165f3cb9416fde61a3415f6"
  }
]
```

---

### 5.11 POST `/updateUser`

Actualiza el usuario autenticado. Headers: `apikey`, `session-tracker`. Mismas reglas de password/listas que `createUser`.

Body (mismos campos que createUser, enviar los que se quieran actualizar):
```json
{
  "name": "prueba", "surname": "vargas", "businessName": "tienda jesus",
  "documentType": "CC", "documentNumber": "10000001010", "salesChannel": "facebook",
  "productType": "otros", "cellPhone": "3007782877", "address": "carrera 18 #10-104",
  "locationCode": "05001000", "email": "correo@dominio.com",
  "accountBank": { "bank": "bancolombia", "beneficiaryName": "…", "accountType": "ahorros",
                   "accountNumber": 20102112001, "typeId": "NIT", "numberId": "1037663886" }
}
```
Respuesta: igual que createUser (array con el usuario).

---

### 5.12 GET `/myDirections`

Lista direcciones alternativas (de recogida) creadas por el usuario. Headers: `apikey`, `session-tracker`.

Respuesta:
```json
[
  {
    "_id": "63cd9a0b1c703cb76023ff15",
    "locationCode": "05001000",
    "locationName": "MEDELLÍN",
    "departmentOrStateCode": "5",
    "departmentOrStateName": "ANTIOQUIA",
    "name": "Bodega principal",
    "address": "Carrera # 12",
    "countryCode": "170",
    "user": "5e8cbd8508d7ea3dee8b14f6",
    "createdAt": "2023-01-22T20:18:19.111Z",
    "updatedAt": "2023-01-24T14:49:22.372Z"
  }
]
```
Algunos registros pueden no traer `locationName`/`departmentOrStateName`/`countryCode` → tratarlos como opcionales.

### 5.13 POST `/myDirections`

Crea una o varias direcciones. Body = **array**:
```json
[ { "locationCode": "70742000", "name": "Bodega 2", "address": "Carrera # 12", "countryCode": "170" } ]
```
Respuesta: el listado completo de direcciones del usuario.

### 5.14 PUT `/myDirections`

Actualiza direcciones (excepto la principal del perfil). Body = array con `_id` (obtenido del GET):
```json
[ { "_id": "63cd9a0b1c703cb76023ff15", "locationCode": "05001000", "name": "nuevo nombre", "address": "nueva dirección" } ]
```
Respuesta: el listado completo de direcciones.

### 5.15 DELETE `/myDirections`

Elimina direcciones (excepto las del perfil y las creadas en app.mipaquete.com). Body = array de `_id`:
```json
[ "63d2b016ee6fc4dd17d3b447" ]
```
Sin cuerpo de respuesta. En axios: `client.delete('/myDirections', { data: ids })`.

---

## 6. Webhooks

mipaquete envía **POST** a las URLs registradas en dos casos:
- `urlForGuides`: cuando se crea la guía de un envío.
- `urlForStates`: cuando cambia el estado de un envío.

### 6.1 POST `/createWebHook`

Headers: `apikey`, `session-tracker`.

Body — se puede enviar uno o ambos objetos; **en create, `urlClient` y `enabled` son obligatorios** dentro de cada objeto enviado:
```json
{
  "urlForGuides": { "urlClient": "https://mi-backend.com/webhooks/mipaquete/guides", "enabled": true },
  "urlForStates": { "urlClient": "https://mi-backend.com/webhooks/mipaquete/states", "enabled": true }
}
```

Respuesta:
```json
{
  "_id": "63ee00d89e1a106352e8345d",
  "user": "5f22d17cb98cb83f7e221ea9",
  "urlForGuides": { "updatedAt": "…", "enabled": true, "urlClient": "…", "createdAt": "…" },
  "urlForStates": { "updatedAt": "…", "enabled": true, "urlClient": "…", "createdAt": "…" }
}
```

### 6.2 PUT `/updateAndDisableWebhook`

Actualiza URLs o desactiva (`enabled: false`). `urlForGuides` y `urlForStates` son independientes, y dentro de cada uno `urlClient` y `enabled` también son opcionales. Permite además `headers` personalizados que mipaquete enviará al llamar tu webhook (útil para un secreto de verificación):

```json
{
  "urlForGuides": {
    "urlClient": "https://mi-backend.com/webhooks/mipaquete/guides",
    "enabled": true,
    "headers": [ { "name": "x-webhook-secret", "value": "mi-secreto" } ]
  },
  "urlForStates": {
    "enabled": false
  }
}
```
- `headers[].name` sin espacios (si no, puede fallar).
- Respuesta: mismo formato que createWebHook, con fechas de creación/actualización.

> Recomendación: registrar un header secreto (`x-webhook-secret`) y validarlo en el receptor, ya que la doc no describe firma de webhooks.

### 6.3 Payload webhook — creación de guía (`urlForGuides`)
```json
{
  "guideNumber": "25478965222",
  "pdfGuide": [ "uri", "uri" ],
  "pickupCode": "123212212",
  "tracking": [
    { "updateState": "Envío pendiente por pago", "date": "2021-04-09T14:38:52-05:00" },
    { "updateState": "Procesando tu envío", "date": "2021-04-09T14:38:52-05:00" },
    { "updateState": "Envío programado", "date": "2021-04-09T15:02:29-05:00" }
  ],
  "code": 895895
}
```
`code` = `mpCode` del envío.

### 6.4 Payload webhook — actualización de estado (`urlForStates`)
```json
{
  "state": "Distribución",
  "tracking": [ { "updateState": "…", "date": "…" } ],
  "code": 895895
}
```

El receptor debe responder `200` rápido y procesar de forma idempotente (el mismo estado puede llegar más de una vez).

---

## 7. Estados de envío observados en la doc

No hay un catálogo oficial; estos aparecen en los ejemplos (tratar el estado como string libre):

- `Envío pendiente por pago`
- `Procesando tu envío`
- `Envío programado`
- `Recolección programada`
- `Distribución`
- `Envío con novedad` (con `description`, ej. "Dirección errada")
- `Envío cancelado`

(Probablemente existan otros como entregado/devolución — manejar valores desconocidos sin romper.)

---

## 8. Flujo típico de integración (e-commerce)

1. **Setup (una vez)**: `POST /generateapikey` → guardar `APIKey` en `.env`. `GET /getUser` → guardar `_id`. `GET /getDeliveryCompanies` y `GET /getLocations` → cachear. `POST /createWebHook` con las URLs del backend.
2. **Checkout**: `POST /quoteShipping` con origen/destino/medidas → mostrar opciones (precio, `shippingTime/1440` días, `score`, logo) o elegir automáticamente.
3. **Orden pagada**: `POST /createSending` con `deliveryCompany` elegido (o `criteria`) → guardar `mpCode` en la orden.
4. **Webhook guía**: recibir `guideNumber`, `pdfGuide`, `pickupCode` → guardarlos en la orden.
5. **Webhook estados**: actualizar estado de la orden y mostrárselo al cliente.
6. **Fallback / conciliación**: `GET /getSendingTracking?mpCode=` o `POST /getSendings/{page}` con `mpCode`.
7. **Cancelación**: `PUT /cancelSending` (solo en estados permitidos).

---

## 9. Implementación sugerida (Node.js + axios)

Estructura:
```
src/mipaquete/
  client.js        # instancia axios + interceptores
  mipaquete.js     # funciones por endpoint
  webhooks.js      # router Express para recibir webhooks
  mappers.js       # mapear getSendings (claves en español) a DTO
```

### client.js
```js
const axios = require('axios');
const { randomUUID } = require('crypto');

const client = axios.create({
  baseURL: process.env.MIPAQUETE_BASE_URL || 'https://api-v2.dev.mpr.mipaquete.com',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  config.headers['session-tracker'] = config.headers['session-tracker'] || randomUUID();
  if (!config.skipAuth && process.env.MIPAQUETE_API_KEY) {
    config.headers.apikey = process.env.MIPAQUETE_API_KEY;
  }
  return config;
});

class MipaqueteError extends Error {
  constructor(err) {
    super(err.response?.data?.message || err.message);
    this.name = 'MipaqueteError';
    this.status = err.response?.status;
    this.data = err.response?.data;
    this.endpoint = `${err.config?.method?.toUpperCase()} ${err.config?.url}`;
  }
}

client.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(new MipaqueteError(err))
);

module.exports = { client, MipaqueteError };
```

### mipaquete.js
```js
const { client } = require('./client');

const generateApiKey = (email, password) =>
  client.post('/generateapikey', { email, password }, { skipAuth: true }).then(r => r.data.APIKey);

const getUser = () => client.get('/getUser').then(r => r.data);

const getLocations = (locationCode) =>
  client.get('/getLocations', { params: locationCode ? { locationCode } : {} }).then(r => r.data);

const getDeliveryCompanies = () => client.get('/getDeliveryCompanies').then(r => r.data);

const quoteShipping = (q) => client.post('/quoteShipping', q).then(r => r.data);

const createSending = (s) => client.post('/createSending', s).then(r => r.data);

const getSendings = (page = 1, filters = { pageSize: 25 }) =>
  client.post(`/getSendings/${page}`, filters).then(r => r.data);

const getSendingTracking = (mpCode) =>
  client.get('/getSendingTracking', { params: { mpCode } }).then(r => r.data);

const cancelSending = (mpCode) => client.put('/cancelSending', { mpCode }).then(r => r.data);

const createUser = (u) => client.post('/createUser', u, { skipAuth: true }).then(r => r.data);
const updateUser = (u) => client.post('/updateUser', u).then(r => r.data);

const getDirections = () => client.get('/myDirections').then(r => r.data);
const createDirections = (arr) => client.post('/myDirections', arr).then(r => r.data);
const updateDirections = (arr) => client.put('/myDirections', arr).then(r => r.data);
const deleteDirections = (ids) => client.delete('/myDirections', { data: ids }).then(r => r.data);

const createWebhook = (cfg) => client.post('/createWebHook', cfg).then(r => r.data);
const updateWebhook = (cfg) => client.put('/updateAndDisableWebhook', cfg).then(r => r.data);

module.exports = {
  generateApiKey, getUser, getLocations, getDeliveryCompanies, quoteShipping, createSending,
  getSendings, getSendingTracking, cancelSending, createUser, updateUser,
  getDirections, createDirections, updateDirections, deleteDirections,
  createWebhook, updateWebhook,
};
```

### mappers.js (getSendings → DTO)
```js
const toStr = (v) => (v === undefined || v === null ? null : String(v));

function mapSending(s) {
  return {
    id: s._id,
    mpCode: s['Código mipaquete'],
    guideNumber: toStr(s['Número de Guía']),
    pickupCode: toStr(s['Número de Recolección']),
    pdfGuide: s.pdfGuide || [],
    deliveryCompanyId: s.deliveryCompany,
    deliveryCompanyName: s['Transportadora'],
    status: s['Estado actual del envío'],
    tracking: s.tracking || [],
    origin: s['Origen'],
    destination: s['Destino'],
    receiverName: s['Destinatario'],
    receiverPhone: toStr(s['Celular del destinatario']),
    receiverAddress: s['Dirección Destinatario'],
    cashOnDelivery: s['Servicio Adicional'] === 'SI',
    collectValue: s['Valor a recaudar'],
    freight: s['Valor del flete'],
    collectionCommission: s['Valor de la comisión de recaudo'],
    totalServiceCost: s['Valor total del servicio'],
    transferValue: s['Valor a Transferir'],
    declaredValue: s['Valor declarado'],
    promisedBusinessDays: s['Tiempo promesa de entrega en días hábiles'],
    requestedAt: `${s['Fecha de Solicitud']} ${s['Hora de Solicitud']}`,
    lastUpdateAt: `${s['Fecha última actualización']} ${s['Hora última actualización']}`,
    raw: s,
  };
}

module.exports = { mapSending };
```

### webhooks.js (Express)
```js
const express = require('express');
const router = express.Router();

function verify(req, res, next) {
  if (process.env.MIPAQUETE_WEBHOOK_SECRET &&
      req.get('x-webhook-secret') !== process.env.MIPAQUETE_WEBHOOK_SECRET) {
    return res.sendStatus(401);
  }
  next();
}

// { guideNumber, pdfGuide[], pickupCode, tracking[], code }
router.post('/webhooks/mipaquete/guides', express.json(), verify, async (req, res) => {
  res.sendStatus(200);
  const { code, guideNumber, pdfGuide, pickupCode } = req.body;
  // TODO: buscar orden por mpCode = code y guardar guía/PDF/código de recogida (idempotente)
});

// { state, tracking[], code }
router.post('/webhooks/mipaquete/states', express.json(), verify, async (req, res) => {
  res.sendStatus(200);
  const { code, state, tracking } = req.body;
  // TODO: actualizar estado de la orden con mpCode = code (idempotente)
});

module.exports = router;
```

---

## 10. Tareas para Claude Code

1. Crear el módulo `src/mipaquete/` con los archivos de la sección 9 (adaptar a ESM/TypeScript si el proyecto lo usa).
2. Añadir las variables de entorno de la sección 3 a `.env.example`.
3. Validar inputs antes de llamar (enteros en dimensiones/peso, DANE como string de 8 dígitos en CO, `criteria` ∈ {price,time,score}, `paymentType` ∈ {101,102}).
4. Implementar reintentos con backoff solo para errores de red/5xx en GET (no reintentar `createSending` automáticamente para no duplicar envíos).
5. Cachear `getLocations` y `getDeliveryCompanies`.
6. Montar el router de webhooks y registrar las URLs con `createWebhook` (script de setup).
7. Escribir tests con `nock` o mocks de axios usando los ejemplos de respuesta de este documento.
8. Probar todo contra el entorno dev antes de cambiar `MIPAQUETE_BASE_URL` a producción.

## 11. Puntos a confirmar con soporte mipaquete

- URL base de producción.
- Formato de errores (la doc no documenta respuestas 4xx/5xx).
- Catálogo completo de estados de envío.
- Valores exactos aceptados en `productType` y `salesChannel`.
- Si `session-tracker` debe ser fijo por integración o puede ser aleatorio por petición.
- Si mipaquete reintenta los webhooks cuando el receptor falla.

Tags: #arquitectura #shipping #envios #integracion-futura
