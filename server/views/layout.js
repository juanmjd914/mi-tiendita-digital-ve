import { html, raw, jsonLd } from './html.js'
import { icon } from './icons.js'
import { SOCIAL, HOURS, HOURS_CLOSED, hoursLine, openingHoursSchema } from '../store-info.js'

export const ORIGIN    = 'https://mitienditadigitalve.com'
export const SITE_NAME = 'Mi Tiendita Digital Ve'
const GA_ID  = process.env.GA_ID  || 'G-Z2JC4X40WV'
const GTM_ID = process.env.GTM_ID || ''
export const ASSET_V = process.env.ASSET_VERSION || String(Date.now())


const NAV = [
  ['inicio',   'Inicio',   '/'],
  ['tienda',   'Tienda',   '/tienda'],
  ['nosotros', 'Nosotros', '/nosotros'],
  ['soporte',  'Soporte',  '/soporte'],
]

export const waLink = (number, text = '') =>
  `https://wa.me/${String(number).replace(/\D/g, '')}${text ? `?text=${encodeURIComponent(text)}` : ''}`

function analytics() {
  if (GTM_ID) {
    return raw(`<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');</script>`)
  }
  return raw(`<script async src="https://www.googletagmanager.com/gtag/js?id=${GA_ID}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');</script>`)
}

function head({ title, description, path, image, noindex, schema, css = [] }) {
  const url = ORIGIN + (path || '/')
  const img = image ? (image.startsWith('http') ? image : ORIGIN + image) : `${ORIGIN}/img/hero.webp`
  return html`<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${description}">
${noindex ? raw('<meta name="robots" content="noindex, nofollow">') : raw('<meta name="robots" content="index, follow, max-image-preview:large">')}
<link rel="canonical" href="${url}">
${process.env.GOOGLE_SITE_VERIFICATION ? html`<meta name="google-site-verification" content="${process.env.GOOGLE_SITE_VERIFICATION}">` : ''}
<meta name="theme-color" content="#0b1326">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:locale" content="es_CL">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${img}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${img}">
<meta name="supabase-url" content="${process.env.SUPABASE_URL || ''}">
<meta name="supabase-anon-key" content="${process.env.SUPABASE_ANON_KEY || ''}">
${process.env.TURNSTILE_SITE_KEY ? html`<meta name="turnstile-site-key" content="${process.env.TURNSTILE_SITE_KEY}">` : ''}
<link rel="icon" type="image/png" href="/img/logo.png">
<link rel="apple-touch-icon" href="/img/logo.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@500;600;700;800&display=swap">
<link rel="stylesheet" href="/css/base.css?v=${ASSET_V}">
${css.map((c) => raw(`<link rel="stylesheet" href="/css/${c}.css?v=${ASSET_V}">`))}
${(schema || []).map((s) => jsonLd(s))}
${analytics()}
</head>`
}

function header(active) {
  return html`<a class="skip-link" href="#contenido">Saltar al contenido</a>
<header class="site-header" data-header>
  <div class="site-header__inner wrap">
    <div class="site-header__left">
      <button class="icon-btn site-header__burger" type="button" aria-label="Abrir menú" aria-expanded="false" data-menu-open>${icon('menu')}</button>
      <a class="brand" href="/" aria-label="${SITE_NAME} — Inicio">
        <img src="/img/logo.webp" alt="" width="36" height="36">
        <span class="brand__name">Mi tiendita digital ve</span>
      </a>
      <nav class="site-nav" aria-label="Principal">
        ${NAV.map(([key, label, href]) => html`<a href="${href}" class="site-nav__link${key === active ? ' is-active' : ''}"${key === active ? raw(' aria-current="page"') : ''}>${label}</a>`)}
      </nav>
    </div>
    <form class="site-search" action="/tienda" method="get" role="search" data-search>
      ${icon('search', { size: 18, cls: 'site-search__icon' })}
      <label class="sr-only" for="q">Buscar productos</label>
      <input id="q" name="search" type="search" placeholder="Buscar audífonos, cables, accesorios gamer…" autocomplete="off" data-suggest>
    </form>
    <div class="site-header__actions">
      <button class="icon-btn site-header__search-toggle" type="button" aria-label="Buscar" data-search-toggle>${icon('search')}</button>
      <a class="icon-btn" href="/favoritos" aria-label="Favoritos">${icon('heart')}<span class="count-pill" data-wishlist-count hidden>0</span></a>
      <a class="icon-btn" href="/carrito" aria-label="Carrito">${icon('bag')}<span class="count-pill" data-cart-count hidden>0</span></a>
      <a class="avatar-btn" href="/cuenta" aria-label="Mi cuenta" data-account-link>${icon('user', { size: 18 })}</a>
    </div>
  </div>
</header>
<div class="mobile-nav" data-menu hidden>
  <div class="mobile-nav__panel" role="dialog" aria-modal="true" aria-label="Menú">
    <div class="mobile-nav__top">
      <a class="brand" href="/"><img src="/img/logo.webp" alt="" width="32" height="32"><span class="brand__name">Mi tiendita digital ve</span></a>
      <button class="icon-btn" type="button" aria-label="Cerrar menú" data-menu-close>${icon('x')}</button>
    </div>
    <nav aria-label="Menú móvil">
      ${NAV.map(([key, label, href]) => html`<a href="${href}" class="mobile-nav__link${key === active ? ' is-active' : ''}">${label}${icon('chevron-right', { size: 18 })}</a>`)}
      <a href="/cuenta" class="mobile-nav__link">Mi cuenta${icon('chevron-right', { size: 18 })}</a>
      <a href="/favoritos" class="mobile-nav__link">Favoritos${icon('chevron-right', { size: 18 })}</a>
    </nav>
  </div>
</div>`
}

export function benefits(settings) {
  const min = Number(settings?.free_shipping_min_rancagua || 80000)
  const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(min)
  return html`<section class="benefits" aria-label="Beneficios">
  <div class="wrap benefits__grid">
    <div class="benefit">${icon('truck', { size: 28 })}<div><strong>Envío gratis en Rancagua</strong><span>En compras sobre ${clp}</span></div></div>
    <div class="benefit">${icon('shield', { size: 28 })}<div><strong>Pagos seguros</strong><span>Webpay, transferencia o contra entrega</span></div></div>
    <div class="benefit">${icon('headset', { size: 28 })}<div><strong>Soporte por WhatsApp</strong><span>Te asesoramos antes y después de tu compra</span></div></div>
  </div>
</section>`
}

// Horario: en escritorio va bajo las redes (columna de la marca); en móvil, al final de "Atención y envíos".
const hoursBlock = (where) => html`<div class="site-footer__hours-wrap site-footer__hours-wrap--${where}">
  <h2 class="site-footer__title site-footer__title--sub">Horario de atención</h2>
  <ul class="site-footer__hours">
    ${HOURS.map((h) => html`<li>${icon('clock', { size: 16 })}<span>${hoursLine(h)}</span></li>`)}
    <li class="muted">${HOURS_CLOSED}</li>
  </ul>
</div>`

function footer(settings) {
  const wa = waLink(settings.contact_whatsapp, 'Hola, tengo una consulta sobre Mi Tiendita Digital Ve')
  const social = SOCIAL.filter(([, , url]) => url)
  return html`<footer class="site-footer">
  <div class="wrap site-footer__grid">
    <div class="site-footer__brand">
      <a class="brand" href="/"><img src="/img/logo.webp" alt="Logo Mi Tiendita Digital Ve" width="56" height="56" loading="lazy"><span class="brand__name">Mi tiendita digital ve</span></a>
      <p>Tecnología, audio, accesorios y gaming con garantía y despacho a todo Chile desde ${settings.local_city || 'Rancagua'}.</p>
      <div class="site-footer__social">
        <a class="icon-btn icon-btn--accent" href="${wa}" target="_blank" rel="noopener" aria-label="WhatsApp">${icon('whatsapp')}</a>
        ${social.map(([name, label, url]) => html`<a class="icon-btn" href="${url}" target="_blank" rel="noopener" aria-label="${label}">${icon(name)}</a>`)}
      </div>
      ${hoursBlock('desk')}
    </div>
    <div>
      <h2 class="site-footer__title">Tienda</h2>
      <ul>
        <li><a href="/tienda">Todo el catálogo</a></li>
        <li><a href="/tienda?badge=OFERTA">Ofertas</a></li>
        <li><a href="/tienda?badge=NUEVO">Novedades</a></li>
        <li><a href="/favoritos">Favoritos</a></li>
      </ul>
    </div>
    <div>
      <h2 class="site-footer__title">Atención y envíos</h2>
      <ul>
        <li><a href="/soporte">Centro de soporte</a></li>
        <li><a href="/cuenta/pedidos">Seguimiento de pedido</a></li>
        <li><a href="/politica-de-cambios-y-devoluciones">Cambios, devoluciones y garantía</a></li>
        <li><a href="/terminos-y-condiciones">Términos y condiciones</a></li>
        <li><a href="/politica-de-privacidad">Política de privacidad</a></li>
      </ul>
      ${hoursBlock('mob')}
    </div>
    <div>
      <h2 class="site-footer__title">Pagos protegidos</h2>
      <p>Transacciones cifradas y procesadas por plataformas certificadas.</p>
      <div class="pay-badge">
        <span class="pay-badge__label">Pasarela segura</span>
        <img src="/img/webpay.webp" alt="Webpay" width="120" height="40" loading="lazy">
      </div>
    </div>
  </div>
  <div class="wrap site-footer__bottom">
    <p>© ${new Date().getFullYear()} Mi Tiendita Digital Ve · ${settings.local_city || 'Rancagua'}, Región de O'Higgins, Chile</p>
    <p><a href="${wa}" target="_blank" rel="noopener">Contacto por WhatsApp</a> · <a href="mailto:${settings.contact_email}">${settings.contact_email}</a></p>
  </div>
</footer>
<a class="wa-float" href="${wa}" target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp">${icon('whatsapp', { size: 28 })}</a>
<div class="toast-region" aria-live="polite" data-toasts></div>`
}

export function layout({ meta, body, active = '', settings, scripts = [], showBenefits = true }) {
  return html`<!DOCTYPE html>
<html lang="es-CL">
${head(meta)}
<body>
${header(active)}
<main id="contenido">
${body}
</main>
${showBenefits ? benefits(settings) : ''}
${footer(settings)}
<script type="module" src="/js/core/site.js?v=${ASSET_V}"></script>
${scripts.map((s) => raw(`<script type="module" src="/js/pages/${s}.js?v=${ASSET_V}"></script>`))}
</body>
</html>`.toString()
}

export function organizationSchema(settings) {
  return {
    '@context': 'https://schema.org',
    '@type': 'OnlineStore',
    name: SITE_NAME,
    url: ORIGIN,
    logo: `${ORIGIN}/img/logo.png`,
    image: `${ORIGIN}/img/hero.webp`,
    email: settings.contact_email,
    telephone: `+${String(settings.contact_whatsapp).replace(/\D/g, '')}`,
    address: { '@type': 'PostalAddress', addressLocality: settings.local_city || 'Rancagua', addressRegion: "O'Higgins", addressCountry: 'CL' },
    areaServed: 'CL',
    currenciesAccepted: 'CLP',
    paymentAccepted: 'Webpay, tarjeta de débito, tarjeta de crédito, transferencia bancaria, pago contra entrega',
    openingHoursSpecification: openingHoursSchema(),
    sameAs: SOCIAL.map(([, , url]) => url).filter(Boolean),
  }
}
