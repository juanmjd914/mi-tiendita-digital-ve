import { html, raw } from '../html.js'
import { ASSET_V } from '../layout.js'

// Panel de administración: documento propio (sin cabecera de la tienda), noindex.
// Todo el contenido se arma en el navegador con /js/admin/app.js tras iniciar sesión.
export function adminPage() {
  return html`<!doctype html>
<html lang="es-CL">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Panel — Mi Tiendita Digital Ve</title>
<link rel="icon" href="/img/logo.webp">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@500;600;700;800&display=swap">
<link rel="stylesheet" href="/css/base.css?v=${ASSET_V}">
<link rel="stylesheet" href="/css/admin.css?v=${ASSET_V}">
</head>
<body class="adm">
<div id="app" class="adm-boot"><p>Cargando panel…</p></div>
<div class="toast-region" data-toasts aria-live="polite"></div>
${raw(`<script type="module" src="/js/admin/app.js?v=${ASSET_V}"></script>`)}
</body>
</html>`
}
