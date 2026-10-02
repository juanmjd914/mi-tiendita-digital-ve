// Eventos de e-commerce GA4. Funciona con gtag.js (GA_ID) o con Google Tag Manager (GTM_ID):
// con gtag se envía el evento directo; con GTM se publica en dataLayer en formato `ecommerce`.
const CURRENCY = 'CLP'

export function track(event, params = {}) {
  window.dataLayer = window.dataLayer || []
  if (typeof window.gtag === 'function') {
    window.gtag('event', event, params)
    return
  }
  window.dataLayer.push({ ecommerce: null })
  window.dataLayer.push({ event, ecommerce: params })
}

/** Ítem GA4 desde el JSON del atributo data-ga que pone el servidor. */
export function readItem(el) {
  try { return JSON.parse(el?.dataset.ga || 'null') } catch { return null }
}

/** Ítem GA4 desde una línea de /api/cart/quote. */
export const lineItem = (l, index) => ({
  item_id: String(l.id), item_name: l.name, item_brand: l.brand || undefined, item_category: l.category || undefined,
  item_variant: l.variantLabel || undefined, price: l.price, quantity: l.qty, index,
})

export const value = (items) => items.reduce((n, i) => n + (i.price || 0) * (i.quantity || 1), 0)

export function trackItems(event, items, extra = {}) {
  if (!items.length) return
  track(event, { currency: CURRENCY, value: value(items), items, ...extra })
}

// ---------- Eventos automáticos según la página ----------
function auto() {
  // Ficha de producto
  const pdp = document.querySelector('[data-product][data-ga]')
  if (pdp) {
    const item = readItem(pdp)
    if (item) trackItems('view_item', [item])
  }
  // Listados (tienda / categoría / búsqueda)
  const list = document.querySelector('[data-ga-list]')
  if (list) {
    const items = [...list.querySelectorAll('[data-add-to-cart][data-ga]')].slice(0, 24).map((el, index) => ({ ...readItem(el), index })).filter((i) => i.item_id)
    if (items.length) track('view_item_list', { item_list_id: list.dataset.gaList, item_list_name: list.dataset.gaListName || list.dataset.gaList, items })
    const q = new URLSearchParams(location.search).get('search')
    if (q) track('search', { search_term: q.slice(0, 100) })
  }
}

// Eventos que disparan los módulos de la tienda (site.js, producto.js…)
window.addEventListener('analytics:add_to_cart', (e) => {
  const { item, qty = 1, variant } = e.detail || {}
  if (item) trackItems('add_to_cart', [{ ...item, quantity: qty, ...(variant ? { item_variant: variant } : {}) }])
})
window.addEventListener('analytics:add_to_wishlist', (e) => {
  const { item } = e.detail || {}
  if (item) trackItems('add_to_wishlist', [item])
})

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', auto)
else auto()
