import { html, raw } from '../html.js'
import { icon } from '../icons.js'
import { waLink } from '../layout.js'
import { coverCard, productUrl, thumb } from '../partials/product.js'
import { TESTIMONIALS, GOOGLE_RATING, GOOGLE_REVIEW_URL } from '../../store-info.js'

// Reparte productos por categoría en ronda para que el carrusel quede equilibrado y sin repetir.
function balancedByCategory(products, max) {
  const groups = new Map()
  for (const p of products) {
    const k = p.category || 'Otros'
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k).push(p)
  }
  const queues = [...groups.values()]
  const out = []
  while (out.length < max && queues.some((q) => q.length)) {
    for (const q of queues) {
      if (q.length && out.length < max) out.push(q.shift())
    }
  }
  return out
}

function categoriesFrom(products) {
  const map = new Map()
  for (const p of products) {
    if (!p.category) continue
    const c = map.get(p.category) || { name: p.category, count: 0, img: p.img_url }
    c.count++
    map.set(p.category, c)
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
}

const TRUST = [
  ['shield', 'Compra segura', 'Pago protegido'],
  ['truck', 'Envíos a todo Chile', 'Desde Rancagua'],
  ['card', 'Múltiples pagos', 'Webpay y transferencia'],
  ['headset', 'Soporte', 'Por WhatsApp'],
]

function hero() {
  return html`<section class="hero">
  <div class="hero__glow" aria-hidden="true"></div>
  <div class="wrap hero__grid">
    <div class="hero__copy">
      <span class="chip">${icon('zap', { size: 14 })}Tienda de tecnología en Rancagua</span>
      <h1 class="hero__title">Todo lo que necesitas, <span class="text-jade">en un solo lugar</span></h1>
      <p class="hero__lead">Audífonos, accesorios gamer, cables, iluminación y tecnología para tu día a día, con garantía y despacho a todo Chile.</p>
      <div class="hero__ctas">
        <a class="btn btn--primary" href="/tienda">${icon('cart', { size: 18 })}Explora nuestro catálogo${icon('arrow-right', { size: 18 })}</a>
        <a class="btn btn--ghost" href="/tienda?badge=OFERTA">${icon('zap', { size: 18 })}Ver ofertas</a>
      </div>
      <ul class="hero__trust">
        ${TRUST.map(([ic, t, s]) => html`<li>${icon(ic, { size: 20 })}<span><strong>${t}</strong>${s}</span></li>`)}
      </ul>
    </div>
    <div class="hero__media">
      <img src="/img/hero.webp" alt="Mi Tiendita Digital Ve: tecnología, celulares y accesorios al alcance de un clic" width="1672" height="941" fetchpriority="high" decoding="async">
    </div>
  </div>
</section>`
}

// Barra blanca flotante con carrusel infinito de productos (lista duplicada para el loop).
function productStrip(items) {
  if (!items.length) return ''
  const cell = (p, hidden) => html`<li class="strip__item"${hidden ? raw(' aria-hidden="true"') : ''}>
      <a href="${productUrl(p)}"${hidden ? raw(' tabindex="-1"') : ''}>
        <span class="strip__circle"><img src="${thumb(p.img_url)}" alt="" width="96" height="96" loading="lazy" decoding="async"></span>
        <span class="strip__label">${p.name}</span>
      </a>
    </li>`
  return html`<section class="strip-wrap" aria-label="Productos destacados">
  <div class="wrap">
    <div class="strip" data-marquee>
      <ul class="strip__track">
        ${items.map((p) => cell(p, false))}
        ${items.map((p) => cell(p, true))}
      </ul>
    </div>
  </div>
</section>`
}

function categories(cats) {
  if (!cats.length) return ''
  return html`<section class="section">
  <div class="wrap">
    <div class="section-head">
      <div><p class="eyebrow">Explora por categoría</p><h2>Categorías destacadas</h2></div>
      <p>Encuentra rápido lo que buscas para tu setup, tu hogar o tu día a día.</p>
    </div>
    <div class="cat-grid">
      ${cats.slice(0, 8).map((c) => html`<a class="cat-card" href="/tienda?cat=${encodeURIComponent(c.name)}">
        <span class="cat-card__img"><img src="${thumb(c.img)}" alt="" width="120" height="120" loading="lazy"></span>
        <span class="cat-card__name">${c.name}</span>
        <span class="cat-card__count">${c.count} ${c.count === 1 ? 'producto' : 'productos'}</span>
        <span class="cat-card__go">Ver todo ${icon('chevron-right', { size: 16 })}</span>
      </a>`)}
    </div>
  </div>
</section>`
}

function offersBanner(count) {
  if (!count) return ''
  return html`<section class="wrap">
  <div class="offer-banner">
    <div>
      <span class="chip chip--hot">${icon('zap', { size: 14 })}Ofertas</span>
      <h2>Precios rebajados en <span class="text-jade">${count} ${count === 1 ? 'producto' : 'productos'}</span></h2>
      <p>Aprovecha los descuentos mientras haya stock disponible.</p>
    </div>
    <a class="btn btn--primary" href="/tienda?badge=OFERTA">Ver ofertas ${icon('arrow-right', { size: 18 })}</a>
  </div>
</section>`
}

function favorites(items) {
  if (!items.length) return ''
  return html`<section class="section">
  <div class="wrap">
    <div class="section-head section-head--center">
      <div><p class="eyebrow">Nuestra selección</p><h2>Favoritos de nuestros clientes</h2></div>
      <p>Los productos más elegidos por quienes ya compraron en Mi Tiendita.</p>
    </div>
    <div class="coverflow" data-coverflow>
      <button class="icon-btn coverflow__nav coverflow__nav--prev" type="button" aria-label="Anterior" data-cf-prev>${icon('chevron-left')}</button>
      <div class="coverflow__viewport">
        <div class="coverflow__track" data-cf-track>${items.map(coverCard)}</div>
      </div>
      <button class="icon-btn coverflow__nav coverflow__nav--next" type="button" aria-label="Siguiente" data-cf-next>${icon('chevron-right')}</button>
      <div class="coverflow__dots" data-cf-dots></div>
    </div>
  </div>
</section>`
}

function whatsappCta(settings) {
  return html`<section class="wrap section">
  <div class="wa-cta">
    <div>
      <p class="eyebrow">¿Dudas con tu compra?</p>
      <h2>Asesoría directa por WhatsApp</h2>
      <p>Te ayudamos a elegir el producto correcto, revisar compatibilidad y hacer seguimiento a tu pedido.</p>
    </div>
    <a class="btn btn--primary" href="${waLink(settings.contact_whatsapp, 'Hola, quiero asesoría para una compra')}" target="_blank" rel="noopener">${icon('whatsapp', { size: 20 })}Hablar por WhatsApp</a>
  </div>
</section>`
}

const AVATAR_COLORS = ['#0f766e', '#7c3aed', '#b45309', '#be123c', '#1d4ed8', '#047857']
const fmtMonth = (d) => new Date(`${d}T12:00:00`).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })

// Opiniones reales de Google con inicial de color (sin fotos de perfil)
function testimonials() {
  const g = GOOGLE_RATING
  return html`<section class="wrap section testimonials" aria-labelledby="t-title">
  <div class="section-head">
    <div><p class="eyebrow">Opiniones reales en Google</p><h2 id="t-title">Lo que dicen nuestros clientes</h2></div>
    <a class="g-rating" href="${g.url}" target="_blank" rel="noopener">
      <strong>${String(g.score.toFixed(1)).replace('.', ',')}</strong>
      <span><span class="g-rating__stars" aria-hidden="true">★★★★★</span><small>${g.count} opiniones en Google</small></span>
    </a>
  </div>
  <div class="t-grid">${TESTIMONIALS.map((t, i) => html`<figure class="t-card">
    <div class="t-card__stars" aria-label="5 de 5 estrellas">★★★★★</div>
    <blockquote>${t.text}</blockquote>
    <figcaption>
      <span class="t-card__avatar" style="background:${AVATAR_COLORS[i % AVATAR_COLORS.length]}" aria-hidden="true">${t.name.charAt(0).toUpperCase()}</span>
      <span><strong>${t.name}</strong><small>Reseña de Google · ${fmtMonth(t.date)}</small></span>
    </figcaption>
  </figure>`)}</div>
  <div class="review-cta">
    <img class="review-cta__qr" src="/img/qr-resena-google.svg" alt="Código QR para dejar tu opinión en Google" width="96" height="96" loading="lazy">
    <div class="review-cta__text"><strong>¿Ya compraste con nosotros?</strong><span>Tu opinión ayuda a otros clientes. <span class="review-cta__scan">Escanea el código con tu celular o usa el botón.</span></span></div>
    <a class="btn btn--primary" href="${GOOGLE_REVIEW_URL}" target="_blank" rel="noopener">${icon('star', { size: 18 })}Déjanos tu opinión en Google</a>
  </div>
</section>`
}

export function inicioBody({ settings, catalog }) {
  // Se prefieren productos con stock solo cuando alcanzan para llenar la sección;
  // si no, se usa el catálogo completo (si no, con 1 producto en stock el carrusel queda vacío).
  const inStock = catalog.filter((p) => p.stock > 0)
  const pool = (n) => (inStock.length >= n ? inStock : catalog)
  const featured = catalog.filter((p) => p.featured)
  const favs = (featured.length >= 3 ? featured : balancedByCategory(pool(10), 10)).slice(0, 10)
  return html`${hero()}
${productStrip(balancedByCategory(pool(28), 28))}
${categories(categoriesFrom(catalog))}
${offersBanner(catalog.filter((p) => p.badge === 'OFERTA' || (p.original_price && p.original_price > p.price)).length)}
${favorites(favs)}
${testimonials()}
${whatsappCta(settings)}`
}
