import { html, raw } from '../html.js'
import { icon } from '../icons.js'

export const clp = (n) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(n) || 0)

export const productUrl = (p) => `/producto/${p.slug}`

// Miniatura de 400px si existe la convención /img/productos/<slug>/n.webp
export function thumb(src) {
  if (!src) return '/img/logo.webp'
  return src.startsWith('/img/productos/') ? src.replace(/\.webp$/, '-400.webp') : src
}

// Ítem GA4 (se lee en el navegador desde data-ga)
export const gaItem = (p) => JSON.stringify({ item_id: String(p.id), item_name: p.name, item_brand: p.brand || undefined, item_category: p.category || undefined, price: p.price })

export const BADGE_LABEL = { OFERTA: 'Oferta', NUEVO: 'Nuevo', HOT: 'Más vendido' }

export function savings(p) {
  return p.original_price && p.original_price > p.price ? p.original_price - p.price : 0
}

export function stockState(p) {
  if (!p.stock || p.stock <= 0) return 'out'
  if (p.stock <= (p.low_stock_threshold ?? 3)) return 'low'
  return 'in'
}

export function priceBlock(p) {
  return html`<div class="price">
    <span class="price__now">${clp(p.price)}</span>
    ${savings(p) ? html`<s class="price__was">${clp(p.original_price)}</s>` : ''}
  </div>`
}

// Tarjeta de coverflow (Inicio y Favoritos)
// Distancia circular de la tarjeta i a la central c en un carrusel de n tarjetas (−n/2 … n/2).
export function coverOffset(i, c, n) {
  let d = ((i - c) % n + n) % n
  if (d > n / 2) d -= n
  return d
}
export const coverState = (d) => (d === 0 ? ' is-active' : Math.abs(d) === 1 ? ' is-near' : Math.abs(d) >= 3 ? ' is-far' : '')

// Se usa con Array.map, que entrega (p, i, lista): así cada tarjeta nace ya en su lugar del carrusel.
export function coverCard(p, i = 0, list = [p]) {
  const out = stockState(p) === 'out'
  const d = coverOffset(i, 0, list.length)
  return html`<article class="cover-card${coverState(d)}" data-slide style="--d:${d};z-index:${10 - Math.abs(d)}">
  <div class="cover-card__top">
    ${p.badge ? html`<span class="chip${p.badge === 'HOT' ? ' chip--hot' : ''}">${BADGE_LABEL[p.badge] || p.badge}</span>` : html`<span></span>`}
    <button class="wish-btn" type="button" data-wish="${p.id}" aria-pressed="false" aria-label="Agregar a favoritos">${icon('heart', { size: 18 })}</button>
  </div>
  <a class="cover-card__media" href="${productUrl(p)}" tabindex="-1" aria-hidden="true">
    <img src="${thumb(p.img_url)}" alt="" width="400" height="400" loading="lazy" decoding="async">
  </a>
  <div class="cover-card__body">
    <h3 class="cover-card__title"><a href="${productUrl(p)}">${p.name}</a></h3>
    ${p.short_description ? html`<p class="cover-card__desc">${p.short_description}</p>` : ''}
    <div class="cover-card__foot">
      ${priceBlock(p)}
      <button class="btn btn--primary btn--sm" type="button" data-add-to-cart="${p.id}" data-name="${p.name}" data-ga="${gaItem(p)}"${out ? raw(' disabled') : ''} aria-label="Agregar ${p.name} al carrito">${icon('cart', { size: 16 })}<span>${out ? 'Agotado' : 'Agregar'}</span></button>
    </div>
  </div>
</article>`
}
