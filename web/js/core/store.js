// Carrito y favoritos en localStorage. Solo guardan ids y cantidades:
// precios y stock siempre se piden al servidor.

const CART_KEY = 'mtd_cart_v1'
const WISH_KEY = 'mtd_wishlist_v1'

function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback } catch { return fallback }
}
function write(key, value, event) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* almacenamiento lleno o bloqueado */ }
  window.dispatchEvent(new CustomEvent(event, { detail: value }))
}

// Cada línea del carrito: { id, variantId|null, qty }
const same = (a, id, variantId) => a.id === id && (a.variantId ?? null) === (variantId ?? null)

export const cart = {
  items: () => read(CART_KEY, []).filter((i) => Number.isInteger(i.id) && i.qty > 0),
  count() { return this.items().reduce((n, i) => n + i.qty, 0) },
  add(id, qty = 1, variantId = null) {
    const items = this.items()
    const found = items.find((i) => same(i, id, variantId))
    if (found) found.qty = Math.min(99, found.qty + qty)
    else items.push({ id, variantId: variantId ?? null, qty: Math.min(99, qty) })
    write(CART_KEY, items, 'cart:change')
  },
  set(id, qty, variantId = null) {
    const items = this.items()
      .map((i) => (same(i, id, variantId) ? { ...i, qty: Math.max(0, Math.min(99, qty)) } : i))
      .filter((i) => i.qty > 0)
    write(CART_KEY, items, 'cart:change')
  },
  remove(id, variantId = null) { write(CART_KEY, this.items().filter((i) => !same(i, id, variantId)), 'cart:change') },
  clear() { write(CART_KEY, [], 'cart:change') },
}

export const wishlist = {
  items: () => read(WISH_KEY, []).filter((i) => Number.isInteger(i.id)),
  has(id) { return this.items().some((i) => i.id === id) },
  count() { return this.items().length },
  toggle(id) {
    const items = this.items()
    const exists = items.some((i) => i.id === id)
    const next = exists ? items.filter((i) => i.id !== id) : [...items, { id, addedAt: new Date().toISOString() }]
    write(WISH_KEY, next, 'wishlist:change')
    return !exists
  },
  remove(id) { write(WISH_KEY, this.items().filter((i) => i.id !== id), 'wishlist:change') },
  clear() { write(WISH_KEY, [], 'wishlist:change') },
}

// Sincroniza entre pestañas abiertas
window.addEventListener('storage', (e) => {
  if (e.key === CART_KEY) window.dispatchEvent(new CustomEvent('cart:change'))
  if (e.key === WISH_KEY) window.dispatchEvent(new CustomEvent('wishlist:change'))
})
