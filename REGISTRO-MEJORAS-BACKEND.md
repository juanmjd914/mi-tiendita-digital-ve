# 🛠️ Registro Maestro — Mejoras Backend + Admin · Mi Tiendita Digital Ve

> Documento vivo. Cada tarea tiene su estado. Si se acaban los tokens, retomar desde la primera tarea con `⬜`.
> Iniciado: 2026-07-07 · Por: Llama (Claude) para Juan Carlos.
> **Proyecto:** `e:\techne creativ\Proyectos web Techne Creativ\web mi tiendita digital ve claude code`
> **Sitio en producción:** https://mitienditadigitalve.com (Hostinger, framework Express, auto-deploy desde GitHub)
> **Supabase de la tienda:** proyecto `hhhijebsmajvphazvxlm` (NO es el del CRM). Cuenta a confirmar con Juan antes de correr SQL.

---

## 🎯 Objetivo de la sesión
Dejar el backend de la tienda seguro, corregir el bug de que **el stock no se descuenta al comprar**, y llevar el panel administrativo (productos, imágenes, especificaciones, pedidos) al nivel de "la mejor tienda en línea".

---

## 🔍 DIAGNÓSTICO — causa raíz del bug de stock (CONFIRMADO)

El stock se descuenta en `server/index.js` con el helper `decrementStock()`, que **busca el producto PRIMERO por nombre** (`.ilike('name', ...).maybeSingle()`) y solo usa el `product_id` como respaldo. Esto es frágil por 3 razones:

1. **Acentos y mayúsculas:** `ilike` sin comodines hace match exacto case-insensitive, pero **NO** trata los acentos como iguales. Si el carrito manda `"Audifonos Gamer Ultra"` y en la base está `"Audífonos Gamer Ultra"` (con tilde), **no hay match** → no descuenta.
2. **Nombres duplicados:** si hay dos productos con nombre parecido (ej. `"...MX410-T"` y `"...MX410-T Pro"`) o repetido, `.maybeSingle()` devuelve error/null → no descuenta.
3. **Lista de fallback desincronizada:** `src/hooks/useProducts.ts` tiene `FALLBACK_PRODUCTS` con IDs 1-8 y nombres que **no coinciden** con la base real (ej. fallback id 7 = "Mouse HP Gamer RGB M160" vs base "Mouse Gamer RGB 6400 DPI"). Si el fetch a Supabase falla y se sirve el fallback, el carrito manda IDs/nombres que no existen en la tabla → imposible descontar.

**Además**, para pagos con tarjeta (Flow), el descuento solo ocurre si llega el **webhook** O si el cliente **vuelve a la página de resultado**. Si ambas fallan, el pago se acredita pero el stock nunca baja. No hay reconciliación ni bandera de idempotencia.

### ✅ Solución adoptada
- Reescribir `decrementStock` para que busque **por `product_id` primero** (los IDs del carrito SÍ son los reales de la base en operación normal), y descontar de forma **atómica** con una función RPC de Postgres (`decrement_stock`) que evita condiciones de carrera.
- Agregar bandera `orders.stock_decremented boolean` → idempotencia real: el stock se descuenta **una sola vez por orden**, sin importar cuántas veces llegue el webhook o se recargue la página de resultado.
- El código usa la RPC si existe y cae a un método seguro id-first si aún no se aplicó la migración (deploy sin romper).

---

## 📋 PLAN DE EJECUCIÓN (por fases)

### FASE 1 — Seguridad base
- ⬜ **1a.** `helmet` + `express-rate-limit`. Límite global (~300/15min) y límite estricto en login admin (~10/15min) para frenar fuerza bruta.
- ⬜ **1b.** Quitar la aceptación del PIN por query string (`req.query.pin`) — solo por header. (El frontend ya usa siempre el header `x-admin-*`, así que no rompe nada.)
- ⬜ **1c.** Migrar el admin de **PIN único** → **usuario+contraseña+token de sesión** (mismo patrón que la web oficial de Techne). Env var `ADMIN_USERS=user:pass|user:pass`. Backend: `POST /api/admin/login` devuelve token; middleware `requireAuth` valida `x-admin-token`. Frontend: pantalla de login con usuario+contraseña, guarda el token, header cambia de `x-admin-pin` a `x-admin-token`.

### FASE 2 — Bug de stock + cupones + validación
- ⬜ **2a.** Reescribir `decrementStock`/`restoreStock`: id-first, atómico (RPC `decrement_stock` con fallback), idempotente (flag `stock_decremented`). Aplica a webhook, página de resultado y transferencia.
- ⬜ **2b.** Cupones: mover el incremento de `uses` al momento del **pago confirmado** (no al crear la orden), de forma atómica (RPC `increment_coupon_use`). Guardar `coupon_code` en la orden y aplicar el uso solo cuando `status → paid`.
- ⬜ **2c.** Validación/whitelist de campos en `POST/PUT /api/admin/products` y `/coupons` (nada de `req.body` directo al insert; validar tipos de price/stock).

### FASE 3 — Migración SQL (Juan la corre con la cuenta correcta)
- ⬜ **3.** Archivo `supabase/migrations/002_sync_and_harden.sql` con TODO lo que hoy existe a mano en prod + lo nuevo:
  - Tabla `coupons` (documentada por primera vez).
  - Columnas faltantes en `orders`: `customer_phone`, `customer_address`, `coupon_code`, `discount_amount`, `stock_decremented`, `tracking_code`, `fulfillment_status`.
  - Estado `pending_transfer` documentado.
  - RPC `decrement_stock(p_id int, p_qty int)` y `restore_stock(...)` atómicas.
  - RPC `increment_coupon_use(p_id)` atómica con chequeo de `max_uses`.
  - Columnas ricas de producto: `brand`, `sku`, `warranty`, `specs jsonb`, `gallery jsonb` (múltiples imágenes), `weight_grams`, `low_stock_threshold`.
  - `newsletter_subscribers.unsubscribe_token` + columna `active`.
  - Todo con `IF NOT EXISTS` para que sea seguro correr sobre la base actual.

### FASE 4 — Panel admin "premium" (frontend + backend)
- ⬜ **4a.** Formulario de producto enriquecido: marca, SKU, garantía, **especificaciones** (lista clave-valor → `specs jsonb`), **galería de imágenes** (varias fotos por producto), peso para envío, umbral de stock bajo.
- ⬜ **4b.** Backend: endpoints que acepten y validen esos campos; ProductModal/Tienda del frontend que muestren specs y galería.
- ⬜ **4c.** Dashboard admin: tarjetas de stats (ventas, ingresos, ticket promedio), **alerta de stock bajo** (productos bajo su umbral), export CSV de pedidos, badge de pedidos pendientes de transferencia.
- ⬜ **4d.** Gestión de pedidos: estados de fulfillment (Pagado → Preparando → Enviado → Entregado) con `tracking_code`, y email al cliente cuando se marca "Enviado".

---

## 🔴 LO QUE NECESITA LAS MANOS DE JUAN (no lo puede hacer Claude solo)
1. **Confirmar con qué cuenta** está el Supabase de la tienda (`hhhijebsmajvphazvxlm`) — regla obligatoria antes de correr SQL.
2. **Correr la migración** `002_sync_and_harden.sql` en el SQL Editor de ese proyecto.
3. **Agregar env vars nuevas** en Hostinger: `ADMIN_USERS` (reemplaza `ADMIN_PIN`). Sin caracteres shell-especiales (`$ * ! # @`) en las contraseñas.
4. **Aprobar el push y deploy** (regla: nunca se hace sin que Juan lo pida).

---

## ✅ ESTADO FINAL (2026-07-07) — TODO EL CÓDIGO HECHO Y COMPILANDO

Todas las fases se implementaron. Frontend compila (`tsc` + `vite build` ✓), backend sin errores de sintaxis (`node --check` ✓). **Nada se ha pusheado ni desplegado** — espera la aprobación de Juan.

**Archivos nuevos:** `server/adminAuth.js`, `server/stock.js`, `server/coupons.js`, `supabase/migrations/002_sync_and_harden.sql`.
**Archivos modificados:** `server/index.js`, `server/email.js`, `src/pages/Admin.tsx`, `src/lib/supabase.ts`, `src/components/ProductModal.tsx`, `.env.example`, `package.json` (helmet + express-rate-limit).

### Lo hecho por fase
- **FASE 1** ✅ helmet + 3 rate limiters (global 300/15min, login 10/15min, pedidos 40/15min); PIN de query eliminado; admin migrado a **usuario+contraseña+token** (`/api/admin/login`, `/logout`, `/me`; middleware `requireAuth`; header `x-admin-token`). Login del frontend reescrito a usuario+contraseña. Compat: si aún hay `ADMIN_PIN`, funciona como usuario `admin`.
- **FASE 2** ✅ Stock reescrito **id-first + atómico (RPC `adjust_stock`) + idempotente** (bandera `stock_decremented`) → **corrige el bug del inventario**. Cupones: se consumen **al pagar**, no al crear, de forma atómica; se devuelven al cancelar. **Anti price-tampering**: el total se recalcula desde la base, ya no se confía en el precio del navegador. Validación/whitelist en productos.
- **FASE 3** ✅ Migración `002_sync_and_harden.sql` lista (segura con IF NOT EXISTS).
- **FASE 4** ✅ Form de producto enriquecido (marca, SKU, garantía, peso, umbral de stock, **especificaciones clave-valor**, **galería de imágenes**); specs+marca+garantía visibles en el ProductModal del cliente; **alerta de stock bajo** en el admin; endpoints `/api/admin/low-stock`, `/api/admin/orders/:id/fulfillment` (con email "pedido enviado" + tracking), `/api/newsletter/unsubscribe`.

### 🔴 SECUENCIA DE DEPLOY (ORDEN OBLIGATORIO — Juan)
1. **Confirmar cuenta** del Supabase de la tienda (`hhhijebsmajvphazvxlm` → está en la cuenta de **Mi Tiendita Digital VE**, misma que el CRM).
2. **Correr `supabase/migrations/002_sync_and_harden.sql`** en el SQL Editor de ese proyecto. (Debe ir ANTES del deploy: el nuevo form manda `specs`/`gallery` y esas columnas deben existir.)
3. **Env vars en Hostinger:** agregar `ADMIN_USERS=usuario:clave|usuario:clave` (claves sin `$ * ! # @`). Se puede dejar `ADMIN_PIN` un tiempo como respaldo, pero lo ideal es quitarlo.
4. **Aprobar push + deploy.** (Recordar: al pushear a la cuenta de este repo puede requerir `cmdkey /delete:git:https://github.com` si Windows tiene credenciales de otra cuenta cacheadas.)
5. Tras el deploy: probar login admin con usuario+contraseña, y hacer una compra de prueba para confirmar que el stock baja.

### 🟡 FASE 4 — UI opcional que quedó pendiente (mejoras, no bloquean nada)
- Controles de fulfillment (Preparando/Enviado/Entregado + tracking) en la tarjeta de pedido del admin (PedidosTab) — el endpoint ya existe, falta el botón/selector en la UI.
- Mostrar la galería de fotos en la tarjeta/modal del cliente (hoy se muestra specs+marca+garantía; la galería se guarda pero aún no se pinta en la tienda).
- Botón "Exportar pedidos a CSV" en el admin.
- Link de "darse de baja" en el pie de los emails (el endpoint `/api/newsletter/unsubscribe` ya existe).

## 🚀 FASE 5 — PANEL ADMIN ROBUSTO (PLAN PARA MAÑANA, 2026-07-08)

Juan revisó el panel `/admin` ya en producción y pidió convertirlo en un back office robusto de tienda. **Todo lo de abajo se construye mañana.** El panel hoy tiene 4 pestañas: Pedidos · Productos · Newsletter · Cupones. Orden de construcción recomendado: **1 → 2 → 3 → 6 → 4 → 5 → extras.**

### 🔴 Alto impacto (operación diaria)
- **5.1 — Gestión de envíos (fulfillment) en la UI.** Flujo Pagado → Preparando → Enviado → Entregado, con código de seguimiento y aviso automático al cliente al despachar. **El backend YA existe** (`POST /api/admin/orders/:id/fulfillment` + email `sendShippedNotification` + columnas `fulfillment_status`/`tracking_code`/`shipped_at`). Falta SOLO la interfaz (selector de estado + input de tracking en la tarjeta/ficha de pedido). Es la de menor esfuerzo y más impacto → empezar por aquí.
- **5.2 — Ficha de pedido completa.** Hoy la lista de pedidos no abre detalle. Crear ficha con: datos del cliente, dirección de envío, ítems, historial/timeline del pedido, **notas internas** (columna nueva `orders.admin_notes`) y botón "reenviar email". Integra el control de fulfillment de 5.1.
- **5.3 — Vista de Inventario / stock bajo.** Pestaña nueva que lista todos los productos con su stock de un vistazo, **alertas de stock bajo** (backend `GET /api/admin/low-stock` YA existe) y ajuste rápido de cantidades inline (sin entrar a cada producto). Idealmente con historial de ajustes.

### 🟡 Impacto medio (para crecer)
- **5.4 — Pestaña Clientes.** Derivada de `orders`: lista de quién compró, total gastado, cantidad de pedidos, contacto e historial por cliente. Búsqueda por email/nombre.
- **5.5 — Reportes / Dashboard real.** Reemplazar los 3 KPIs estáticos por: ventas por periodo (gráfico), productos más vendidos, ticket promedio, ventas hoy/semana/mes, filtro de fechas. (Mismo espíritu que el módulo Reportes del CRM.)
- **5.6 — Pestaña Configuración / Ajustes (editables sin tocar código).** Sacar del código todo lo hardcodeado: **datos bancarios de transferencia** (hoy en `server/email.js`: Banco Falabella, cuenta, RUT), costo/zonas de envío, info de contacto de la tienda, y gestión de usuarios admin. Guardar en una tabla nueva `store_settings` (o similar) leída por el backend.

### 💳 Métodos de pago y envío (pedido por Juan 2026-07-07)
- **5.10 — Pago contra entrega (COD) — delivery en Rancagua.** Método de pago NUEVO además de Transferencia y Flow. El cliente elige "Pago contra entrega" → se crea el pedido sin pago online (estado tipo `pending_cod`), el admin lo prepara y cobra al entregar. **Solo disponible para la zona Rancagua** (validar por ciudad/zona en el checkout). Se conecta con la config de envíos (5.6). Los otros dos ya existen: Transferencia (`pending_transfer`) y Flow (pago al instante).
  - **⚠️ Costo de delivery (pedido por Juan):** al elegir COD en Rancagua, hay que **sumar el costo del delivery al total**, aparte del precio del/los artículo(s). O sea: total COD = productos + costo de delivery Rancagua. Ese costo de delivery debe ser **configurable desde la pestaña Ajustes (5.6)** — no hardcodeado. Mostrarlo desglosado en el checkout y en el resumen del pedido ("Productos: $X · Delivery Rancagua: $Y · Total: $Z"), y guardarlo en la orden (columna tipo `shipping_cost`). Aplica también al cálculo de envíos general (5.11).
- **5.12 — Retiro en el local (store pickup).** Método de ENTREGA (no de pago) además del delivery. El cliente elige "Retiro en el local" → **sin costo de envío ($0)**, pasa a buscar el pedido a la tienda. **Solo disponible en Rancagua.** En el checkout, elegir "Retiro en local" pone el costo de envío en 0 (no se suma delivery); elegir "Delivery" suma el costo correspondiente (ver 5.10/5.11). Ojo: método de ENTREGA (retiro vs delivery) es independiente del método de PAGO (transferencia / Flow / contra entrega) — el cliente elige ambas cosas.
- **5.11 — Calculadora de envíos.** Que el cliente vea el costo de envío según su destino antes de pagar. Enfoque en dos niveles:
  - **Nivel 1 (inmediato, sin API):** tarifas configurables desde la pestaña Ajustes (5.6) — ej. envío gratis/retiro en Rancagua, tarifa plana por zona/región. Funciona ya, sin depender de nadie.
  - **Nivel 2 (Blue Express, si hay credenciales):** cotización en tiempo real vía la **API de Blue Express** (Juan tiene contrato con ellos). **ACLARACIÓN CLAVE:** el que la usen con WordPress/WooCommerce es solo porque Blue Express tiene un *plugin* pre-hecho para WordPress — pero la API por debajo es HTTP/REST y **se puede llamar desde nuestro backend Express igual**, no está atada a WordPress. El plugin es solo un "cliente" de esa API. **DEPENDENCIA a verificar con Juan:** conseguir de su contrato Blue Express las **credenciales de API** (API key / usuario) y la **documentación del API** (endpoints de cotización y de generación de órdenes de transporte). Riesgo real: que en su plan solo le den el plugin y NO acceso al API abierto → hay que confirmarlo con Blue Express antes de prometer la integración. Si no hay API, se queda en el Nivel 1 (tarifas configurables).

### 🟢 Extras (pulido)
- **5.7 — Categorías gestionables** (hoy son texto libre; que se creen/editen/ordenen desde el panel y alimenten la navegación de la tienda).
- **5.8 — Banners / Home editable** desde el panel (hero, destacados).
- **5.9 — Reseñas de productos** (gestionar valoraciones).

### 🔐 5.6-bis — REQUISITO ESPECÍFICO de los datos bancarios (dicho por Juan, importante)
Los datos bancarios de la transferencia **NO deben mostrarse en el frontend público** — nadie que solo entre a navegar la web debe poder verlos (no es seguro exponerlos a todo el mundo). El flujo correcto:
1. Se guardan en el **backend** (pestaña Ajustes de 5.6, editables sin tocar código).
2. **Solo DESPUÉS de que el cliente crea el pedido por transferencia**, en la pantalla de éxito (`CartDrawer` paso `transfer-success`) aparecen en un **desplegable con botón de copiar**, para que el cliente los copie fácil.
3. **Además llegan por email** (esto ya pasa hoy vía `sendTransferInstructions`).
4. Clave: los datos se entregan **atados a un pedido real recién creado** (los devuelve la respuesta del endpoint de transferencia, o un endpoint que valide el order id) — nunca listados en el bundle público ni accesibles sin haber ordenado.

## 📝 BITÁCORA DE EJECUCIÓN

- 2026-07-07 — Diagnóstico completo del backend (4 archivos) + frontend admin (Admin.tsx, cartStore, useProducts, CartDrawer, PagoResultado). Causa raíz del bug de stock identificada. Registro creado.
- 2026-07-07 — Implementadas FASE 1-4 completas (código). Build verificado. `dist/` reconstruido con URL de producción correcta.
- 2026-07-07 — **DESPLEGADO A PRODUCCIÓN.** Migración 002 corrida ✓, `ADMIN_USERS=jmejiasdaza:...` en Hostinger ✓, GA4 corregido a `G-Z2JC4X40WV` ✓, push a `main` commit `3a96afa` ✓ (Hostinger auto-deploy). Login admin nuevo (usuario+contraseña) verificado funcionando en producción. Pedidos y newsletter de prueba limpiados vía SQL. Stock de prueba se deja como está (no son valores reales; Juan cargará productos reales). Pendiente menor: quitar `ADMIN_PIN` viejo de Hostinger.
- 2026-07-07 — Juan pidió convertir el panel admin en un back office robusto → **FASE 5 planificada para mañana (2026-07-08)**, ver arriba.
- 2026-07-08 — **FASE 5 CONSTRUIDA COMPLETA (código, compila: tsc + vite + node --check ✓). NO desplegada aún.**
  - **Migración 003** (`supabase/migrations/003_admin_robusto.sql`): tabla `store_settings` (fila única, datos bancarios+envío+contacto), columnas nuevas en `orders` (`admin_notes`, `shipping_cost`, `delivery_method`, `payment_method`), tabla `stock_adjustments`. Segura (IF NOT EXISTS).
  - **Backend nuevo:** `server/settings.js` (config con caché + fallback). `email.js` ya NO tiene datos bancarios hardcodeados (los lee de settings). Endpoints: `GET /api/store-config` (público, SIN bancarios), `GET/PUT /api/admin/settings`, `GET /api/order/:id/bank-details` (solo para pedido de transferencia real), `POST /api/payment/cod`, `GET /api/admin/orders/:id`, `PUT .../notes`, `POST .../resend-email`, `POST /api/admin/products/:id/adjust-stock`, `GET /api/admin/customers`, `GET /api/admin/reports`. Los endpoints de pago (flow/transfer/cod) ahora calculan envío (`computeShipping`) y guardan método de entrega/pago. `confirm-transfer` y `cancel` ahora aceptan `pending_cod`.
  - **Frontend admin (`Admin.tsx`):** 4 pestañas nuevas (📈 Resumen/Reportes, 📋 Inventario con ajuste rápido y alerta stock bajo, 👥 Clientes, ⚙️ Ajustes). La ficha de pedido (OrderRow) ahora tiene: método entrega/pago, desglose de envío, **control de fulfillment** (Preparando/Enviado/Entregado + tracking + email al enviar), **notas internas**, **reenviar email**, y botón "Confirmar Pago Recibido" para contra entrega. Badge y filtro nuevos para "Contra entrega".
  - **Checkout (`CartDrawer.tsx`):** datos bancarios hardcodeados ELIMINADOS del frontend (se cargan de `/api/order/:id/bank-details` solo tras crear el pedido). Campo Ciudad nuevo. Selector de **método de entrega** (Delivery / Retiro en local — retiro solo en ciudad local). Costo de envío calculado y mostrado en el resumen. Método de pago **contra entrega** (solo ciudad local). Pantalla de éxito nueva para contra entrega. La config pública (`/api/store-config`) nunca expone bancarios.

### 🔴 SECUENCIA DE DEPLOY FASE 5 (Juan)
1. **Correr `supabase/migrations/003_admin_robusto.sql`** en el SQL Editor del proyecto de la tienda (`hhhijebsmajvphazvxlm`, cuenta `mitienditadigitalve@gmail.com`) — ANTES del deploy.
2. **En Ajustes del panel:** revisar/ajustar el **costo de delivery en Rancagua** y confirmar los datos bancarios (se migraron los que estaban en el código como default).
3. **Aprobar push + deploy.** (Repo `juanmjd914/mi-tiendita-digital-ve`; recordar `cmdkey /delete:git:https://github.com` si hay 403.)
4. **Probar:** una compra con retiro en local (envío $0), una con delivery en Rancagua (suma el costo), una contra entrega, y una transferencia (que los datos bancarios aparezcan en la pantalla de éxito y por email). Revisar las pestañas nuevas.

### ⏳ Pendiente de Juan para completar 5.11 Nivel 2
- Conseguir credenciales + docs del API de Blue Express para la cotización en tiempo real (Nivel 2). Por ahora la calculadora funciona en Nivel 1 (tarifas configurables desde Ajustes).
