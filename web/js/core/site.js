// Comportamiento global: menú móvil, buscador móvil, contadores, botones de carrito/favoritos.
import { cart, wishlist } from './store.js'
import { toast, $, $$ } from './ui.js'
import { readItem } from './analytics.js'
import '../components/search-suggest.js'

// ---------- Menú móvil ----------
const menu = $('[data-menu]')
const openBtn = $('[data-menu-open]')
function setMenu(open) {
  if (!menu) return
  menu.hidden = !open
  openBtn?.setAttribute('aria-expanded', String(open))
  document.body.classList.toggle('no-scroll', open)
  if (open) $('[data-menu-close]', menu)?.focus()
}
openBtn?.addEventListener('click', () => setMenu(true))
$('[data-menu-close]')?.addEventListener('click', () => setMenu(false))
menu?.addEventListener('click', (e) => { if (e.target === menu) setMenu(false) })
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu && !menu.hidden) setMenu(false) })

// ---------- Buscador móvil ----------
const header = $('[data-header]')
$('[data-search-toggle]')?.addEventListener('click', () => {
  const open = header.classList.toggle('search-open')
  if (open) $('#q')?.focus()
})

// ---------- Contadores ----------
function paintCounts() {
  for (const [sel, n] of [['[data-cart-count]', cart.count()], ['[data-wishlist-count]', wishlist.count()]]) {
    $$(sel).forEach((el) => { el.textContent = n > 99 ? '99+' : String(n); el.hidden = n === 0 })
  }
}
window.addEventListener('cart:change', paintCounts)
window.addEventListener('wishlist:change', paintCounts)
paintCounts()

// ---------- Botones declarativos (sirven en HTML renderizado por el servidor) ----------
// <button data-add-to-cart="12" data-name="Audífonos…">  /  <button data-wish="12">
document.addEventListener('click', (e) => {
  const add = e.target.closest('[data-add-to-cart]')
  if (add) {
    e.preventDefault()
    const id = Number(add.dataset.addToCart)
    const qtyInput = add.dataset.qtyFrom ? $(add.dataset.qtyFrom) : null
    const qty = Math.max(1, Number(qtyInput?.value) || 1)
    cart.add(id, qty)
    toast(`${add.dataset.name || 'Producto'} agregado al carrito`)
    window.dispatchEvent(new CustomEvent('analytics:add_to_cart', { detail: { id, qty, item: readItem(add) } }))
    if (add.dataset.goCheckout !== undefined) location.href = '/checkout'
    return
  }
  const wish = e.target.closest('[data-wish]')
  if (wish) {
    e.preventDefault()
    const on = wishlist.toggle(Number(wish.dataset.wish))
    paintWish()
    if (on) window.dispatchEvent(new CustomEvent('analytics:add_to_wishlist', { detail: { item: readItem(wish.closest('article, [data-product]')?.querySelector('[data-ga]') || wish.closest('[data-ga]')) } }))
    toast(on ? 'Agregado a favoritos' : 'Quitado de favoritos')
  }
})

function paintWish() {
  $$('[data-wish]').forEach((b) => {
    const on = wishlist.has(Number(b.dataset.wish))
    b.classList.toggle('is-on', on)
    b.setAttribute('aria-pressed', String(on))
    b.setAttribute('aria-label', on ? 'Quitar de favoritos' : 'Agregar a favoritos')
  })
}
window.addEventListener('wishlist:change', paintWish)
paintWish()

// ---------- Sesión: solo carga Supabase si el cliente ya inició sesión alguna vez ----------
let hasAuth = false
try { hasAuth = Boolean(localStorage.getItem('mtd_auth')) } catch { /* sin almacenamiento */ }
if (hasAuth) {
  import('./auth.js').then(async ({ getSession }) => {
    const s = await getSession()
    if (!s) return
    $('[data-account-link]')?.classList.add('is-logged')
    $('[data-account-link]')?.setAttribute('aria-label', 'Mi cuenta (sesión iniciada)')
    const { mirrorWishlist } = await import('./wishlist-sync.js')
    mirrorWishlist(s.user.id)
  }).catch(() => {})
}
