# Lista de lanzamiento — sitio HTML (rama `rediseno-html`)

Pendientes para publicar el sitio nuevo en mitienditadigitalve.com. Registrado el 2026-10-01.
Nada de esto se hace sin el visto bueno explícito de Juan (push, merge y deploy incluidos).

## 0. Para continuar (sesión del 2026-10-02)

Estado al cierre del 2026-10-01: sitio completo en local, migraciones 004–008 aplicadas (008 = número de pedido `AAAAMMDD-N`), 187 productos + 1 de prueba, panel admin, correos nuevos con miniaturas JPG en Supabase, WhatsApp nuevo +56 9 5748 0911, mascota 404, Google técnico listo. **La rama `rediseno-html` no tiene ningún commit todavía** → hacer un commit local apenas Juan lo autorice (sin push).

- [ ] **Juan termina de revisar la compra de prueba**: registro/login, carrito, checkout por transferencia o contra entrega, Gracias, correos, Mi Cuenta → pedidos, panel (confirmar pago, despacho con seguimiento), Soporte → consulta tu pedido, reseña. Webpay NO se prueba en local.
- [ ] **Limpieza después de la revisión** (cuando Juan lo pida): borrar el producto de prueba `producto-de-prueba` (id 408), los pedidos de prueba y sus ítems, reseñas de prueba, registros de `stock_adjustments` de prueba, y reiniciar `order_counters` del día. Preguntar si conserva la cuenta de cliente que creó para probar.
- [ ] Revisar lo que Juan encuentre. Ya corregido el 2026-10-01: carrusel del inicio (pool con stock), carrito vacío centrado, botón "Vaciar favoritos" y botones de Mis direcciones (estilo `.link-btn` movido a base.css), regreso a Mi cuenta desde Favoritos.
- [x] **Turnstile** integrado (ver abajo); falta activarlo en Supabase al lanzar.
- [x] Commits locales `1c66bc5` y `772efe4` (2026-10-02, con permiso de Juan, sin push).
- [x] Revisión final técnica (2026-10-02): 493 páginas y 872 recursos sin errores; escritorio y celular OK; panel OK.

## 1. Antes del lanzamiento

- [ ] **Cargar el stock** de los 187 productos desde el panel → Stock. Sin stock, la tienda y Merchant Center los muestran "agotados".
- [x] Rediseño de correos Obsidian Jade + datos escapados + correo de contra entrega + aviso de pedido nuevo a la tienda (2026-10-01). Al lanzar: confirmar que las fotos de productos se vean en Gmail (dependen del dominio real).
- [x] Mascota del 404: opción A aprobada por Juan (2026-10-01), `web/img/mascota-404.webp`; original en `mi tiendita digital ve e-commerce/assets/mascota-404.png`.
- [x] Cloudflare Turnstile integrado (2026-10-02) en login, registro, recuperar y cambiar contraseña. Claves en `.env` local (`TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`).
- [x] Supabase Auth (2026-10-02): Redirect URLs, plantillas en español (`supabase/auth-templates/`) y SMTP con Resend.
- [ ] Datos reales que faltan: imagen del hero limpia, enlaces de Instagram / Facebook / TikTok (`SOCIAL_INSTAGRAM`, `SOCIAL_FACEBOOK`, `SOCIAL_TIKTOK`), horarios, testimonios/cifras reales (si se quieren mostrar).
- [ ] Revisión de un abogado de las páginas legales (recomendado).
- [ ] Rotar la API key de Stitch (quedó expuesta en un chat).

## 2. Hostinger (día del lanzamiento)

- [ ] Comando de build: dejar `npm run build` (ahora es un `echo`, ya no compila Vite). Si queda el build viejo de Vite, el deploy falla.
- [ ] Variables de entorno:
  - Quitar todas las `VITE_*` y la vieja `ADMIN_PIN`.
  - Confirmar `ADMIN_USERS` (ya existe desde 2026-07-07 con el usuario `jmejiasdaza`).
  - Agregar si corresponde: `GOOGLE_SITE_VERIFICATION` (solo si Search Console pide meta tag), `SOCIAL_*`, claves de Turnstile, `ASSET_VERSION`.
  - **No** agregar `GTM_ID`: se mide con GA4 directo (`G-Z2JC4X40WV`). Tag Manager existe en la cuenta pero no se usa para no duplicar la medición.
- [ ] Merge de `rediseno-html` → `main` (dispara el auto-deploy). Solo con permiso de Juan.
- [ ] Activar CAPTCHA (Turnstile) en Supabase → Authentication recién después del deploy.

## 3. Google (después del deploy) — cuenta `mitienditadigitalve@gmail.com`

Search Console, Merchant Center y Tag Manager **ya existen** en esa cuenta. El DNS del dominio está en Hostinger.

**Google Analytics** (Administrar)
- [ ] Vinculaciones de productos → Search Console: vincular la propiedad mitienditadigitalve.com con el flujo web.
- [ ] Vinculaciones de productos → Merchant Center: vincular la cuenta.
- [ ] Eventos clave: confirmar que `purchase` esté marcado.
- [ ] DebugView / Tiempo real: comprobar `view_item`, `add_to_cart`, `begin_checkout` y `purchase` con una compra real.

**Search Console** — la propiedad `https://mitienditadigitalve.com/` ya existe y tiene datos desde junio 2026 (39 clics al 2026-10-01). El sitio antiguo no tiene meta de verificación → probablemente verificada vía Google Analytics; el sitio nuevo mantiene el mismo gtag (`G-Z2JC4X40WV`), así que la verificación sigue válida. No crear una propiedad nueva.
- [ ] Revisar en Configuración → Verificación de propiedad que siga verificada después del deploy.
- [ ] En Sitemaps, quitar sitemaps antiguos si los hay y enviar `https://mitienditadigitalve.com/sitemap.xml`.
- [ ] Inspeccionar y pedir indexación de `/`, `/tienda` y algunos productos.
- [ ] Prueba de resultados enriquecidos en 2–3 fichas (precio, stock, estrellas).

**Merchant Center** (Configuración)
- [ ] Información de la empresa: sitio `https://mitienditadigitalve.com` (se verifica por Search Console en la misma cuenta).
- [ ] Envíos: política Chile, CLP, tarifa fija **$10.000** (tarifa a regiones), preparación 0–1 día, tránsito **5–8 días hábiles**. Google no permite una tarifa solo para Rancagua; mostrar de más está permitido.
- [ ] Devoluciones: "No se aceptan devoluciones" + enlace a `/politica-de-cambios-y-devoluciones` (explica la garantía legal de 6 meses).
- [ ] Productos → agregar fuente como archivo programado desde `https://mitienditadigitalve.com/feed/google-merchant.xml`, actualización diaria.

## 4. Verificación final en producción

- [ ] Pago real de bajo monto con Flow (Webpay): webhook en 200, pedido pasa a "Pagado", correo llega, stock se descuenta, evento `purchase` una sola vez.
- [ ] Pedido por transferencia y contra entrega de punta a punta; confirmar y cancelar desde el panel.
- [ ] Recorrido en el celular de Juan (inicio, tienda, ficha, carrito, checkout, cuenta, panel).
- [ ] `robots.txt`, `sitemap.xml`, `llms.txt` y el feed responden 200 en el dominio real.
