import { cart } from '../core/store.js'
import { toast, clp, $, $$ } from '../core/ui.js'
import { readItem } from '../core/analytics.js'

const root = $('[data-product]')
const productId = Number(root?.dataset.product)
const basePrice = Number(root?.dataset.price)
const name = $('.pdp__title')?.textContent.trim() || 'Producto'

// ---------- Galería ----------
const gallery = $('[data-gallery]')
const main = $('[data-main]', gallery)
const thumbs = $$('[data-thumb]', gallery)
let current = 0
function show(i) {
  if (!thumbs.length) return
  current = (i + thumbs.length) % thumbs.length
  main.src = thumbs[current].dataset.src
  thumbs.forEach((t, n) => t.classList.toggle('is-on', n === current))
}
thumbs.forEach((t, i) => t.addEventListener('click', () => show(i)))
$('[data-prev]', gallery)?.addEventListener('click', () => show(current - 1))
$('[data-next]', gallery)?.addEventListener('click', () => show(current + 1))

// Zoom siguiendo el mouse
const zoom = $('[data-zoom]', gallery)
zoom?.addEventListener('mousemove', (e) => {
  const r = zoom.getBoundingClientRect()
  main.style.setProperty('--zx', `${((e.clientX - r.left) / r.width) * 100}%`)
  main.style.setProperty('--zy', `${((e.clientY - r.top) / r.height) * 100}%`)
})

// Swipe en móvil
let sx = null
zoom?.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX }, { passive: true })
zoom?.addEventListener('touchend', (e) => {
  if (sx === null) return
  const dx = e.changedTouches[0].clientX - sx
  sx = null
  if (Math.abs(dx) > 40) show(current + (dx < 0 ? 1 : -1))
})

// Lightbox (pantalla completa)
zoom?.addEventListener('click', () => {
  if (matchMedia('(hover: hover)').matches === false && thumbs.length) { /* en móvil también abre */ }
  const box = document.createElement('div')
  box.className = 'lightbox'
  box.setAttribute('role', 'dialog')
  box.setAttribute('aria-label', 'Imagen ampliada')
  box.innerHTML = `<img alt="" src="${main.src}"><button class="icon-btn" type="button" aria-label="Cerrar"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>`
  const close = () => { box.remove(); document.body.classList.remove('no-scroll') }
  box.addEventListener('click', (e) => { if (e.target === box || e.target.closest('button')) close() })
  document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc) } })
  document.body.append(box)
  document.body.classList.add('no-scroll')
  box.querySelector('button').focus()
})

// ---------- Cantidad ----------
const qty = $('#qty')
const clampQty = (n) => Math.max(1, Math.min(99, Number(n) || 1))
$('[data-qty-minus]')?.addEventListener('click', () => { qty.value = clampQty(qty.value - 1) })
$('[data-qty-plus]')?.addEventListener('click', () => { qty.value = clampQty(Number(qty.value) + 1) })
qty?.addEventListener('change', () => { qty.value = clampQty(qty.value) })

// ---------- Variantes ----------
const addBtns = $$('[data-pdp-add], [data-pdp-buy]')
function selectedVariant() { return $('input[name="variant"]:checked') }
function applyVariant() {
  const v = selectedVariant()
  if (!v) return
  $('[data-variant-label]').textContent = v.dataset.label
  const price = v.dataset.price ? Number(v.dataset.price) : basePrice
  $$('[data-price-now]').forEach((el) => { el.textContent = clp(price) })
  const out = Number(v.dataset.stock) <= 0
  addBtns.forEach((b) => { b.disabled = out })
  const badge = $('[data-stock-badge]')
  if (badge) {
    badge.className = `stock stock--${out ? 'out' : 'in'}`
    badge.lastChild.textContent = out ? 'Sin stock en este color' : 'En stock'
  }
  if (v.dataset.img) {
    const i = thumbs.findIndex((t) => t.dataset.src === v.dataset.img)
    if (i >= 0) show(i); else main.src = v.dataset.img
  }
}
$$('input[name="variant"]').forEach((r) => r.addEventListener('change', applyVariant))
applyVariant()

// ---------- Agregar / comprar ----------
function add(goCheckout) {
  const v = selectedVariant()
  const q = clampQty(qty?.value)
  cart.add(productId, q, v ? Number(v.value) : null)
  window.dispatchEvent(new CustomEvent('analytics:add_to_cart', { detail: { id: productId, qty: q, item: readItem(root), variant: v?.dataset.label } }))
  if (goCheckout) location.href = '/checkout'
  else toast(`${name}${v ? ` (${v.dataset.label})` : ''} agregado al carrito`)
}
$$('[data-pdp-add]').forEach((b) => b.addEventListener('click', () => add(false)))
$('[data-pdp-buy]')?.addEventListener('click', () => add(true))

// ---------- Barra fija móvil: aparece cuando el botón principal sale de pantalla ----------
const sticky = $('[data-sticky-buy]')
const mainAdd = $('.pdp__add')
if (sticky && mainAdd && 'IntersectionObserver' in window) {
  new IntersectionObserver(([e]) => {
    const on = !e.isIntersecting && e.boundingClientRect.top < 0
    sticky.classList.toggle('is-on', on)
    document.body.classList.toggle('has-sticky-bar', on)
  }).observe(mainAdd)
}
