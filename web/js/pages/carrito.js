import { cart, wishlist } from '../core/store.js'
import { getQuote, savedCoupon } from '../core/quote.js'
import { clp, esc, toast, $ } from '../core/ui.js'
import { trackItems, lineItem } from '../core/analytics.js'

let viewedCart = false

const linesEl = $('[data-cart-lines]')
const tools = $('[data-cart-tools]')
const summary = $('[data-cart-summary]')
const couponMsg = $('[data-coupon-msg]')

const ico = {
  x: '<svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  minus: '<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14"/></svg>',
  plus: '<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
  heart: '<svg class="icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/></svg>',
}

function empty() {
  linesEl.innerHTML = `<div class="cart-empty">
    <h2>Tu carrito está vacío</h2>
    <p>Explora el catálogo y agrega los productos que te gusten.</p>
    <a class="btn btn--primary" href="/tienda">Ir a la tienda</a>
  </div>`
  tools.hidden = true
  summary.hidden = true
}

function row(l) {
  const key = `${l.id}:${l.variantId ?? ''}`
  if (l.missing) {
    return `<div class="cart-row cart-row--missing" data-key="${key}">
      <div class="cart-row__info"><strong>${esc(l.name || 'Producto no disponible')}</strong><span class="stock stock--out">Ya no está disponible</span></div>
      <button class="icon-btn" type="button" data-remove aria-label="Quitar">${ico.x}</button>
    </div>`
  }
  const warn = l.outOfStock ? '<span class="stock stock--out">Sin stock</span>'
    : l.notEnough ? `<span class="stock stock--low">Solo quedan ${l.stock}</span>` : ''
  return `<div class="cart-row" data-key="${key}">
    <button class="icon-btn cart-row__remove" type="button" data-remove aria-label="Quitar ${esc(l.name)}">${ico.x}</button>
    <a class="cart-row__img" href="/producto/${esc(l.slug)}"><img src="${esc(l.img)}" alt="" width="80" height="80" loading="lazy"></a>
    <div class="cart-row__info">
      <a href="/producto/${esc(l.slug)}"><strong>${esc(l.name)}</strong></a>
      ${l.variantLabel ? `<span class="cart-row__var">${esc(l.variantKind || 'Opción')}: ${esc(l.variantLabel)}</span>` : ''}
      ${warn}
      <button class="link-btn link-btn--sm" type="button" data-save>${ico.heart}Guardar en favoritos</button>
    </div>
    <div class="cart-row__price"><span class="cart-row__label">Precio</span>${clp(l.price)}${l.originalPrice ? `<s>${clp(l.originalPrice)}</s>` : ''}</div>
    <div class="qty qty--sm">
      <button type="button" class="qty__btn" data-dec aria-label="Restar">${ico.minus}</button>
      <input type="number" min="1" max="99" value="${l.qty}" aria-label="Cantidad" data-qty>
      <button type="button" class="qty__btn" data-inc aria-label="Sumar">${ico.plus}</button>
    </div>
    <div class="cart-row__total"><span class="cart-row__label">Subtotal</span>${clp(l.lineTotal)}</div>
  </div>`
}

async function render() {
  if (!cart.items().length) return empty()
  let q
  try { q = await getQuote() } catch (e) { linesEl.innerHTML = `<p class="cart-error">${esc(e.message)}</p>`; return }
  if (!viewedCart) { viewedCart = true; trackItems('view_cart', q.lines.filter((l) => !l.missing).map(lineItem)) }
  linesEl.innerHTML = `<div class="cart-head"><span>Producto</span><span>Precio</span><span>Cantidad</span><span>Subtotal</span></div>${q.lines.map(row).join('')}`
  tools.hidden = false
  summary.hidden = false
  $('[data-s-count]').textContent = q.count
  $('[data-s-subtotal]').textContent = clp(q.subtotal)
  $('[data-s-discount-row]').hidden = !q.discount
  $('[data-s-discount]').textContent = `−${clp(q.discount)}`
  $('[data-s-coupon]').textContent = q.coupon ? `(${q.coupon})` : ''
  $('[data-s-total]').textContent = clp(q.subtotal - q.discount)
  const s = q.shipping
  const missing = Math.max(0, s.freeShippingMin - (q.subtotal - q.discount))
  $('[data-free-ship-text]').innerHTML = missing > 0
    ? `Te faltan <strong>${clp(missing)}</strong> para envío gratis en Rancagua`
    : '¡Tienes <strong>envío gratis</strong> en Rancagua!'
  $('[data-free-ship-bar]').style.width = `${Math.min(100, ((q.subtotal - q.discount) / Math.max(1, s.freeShippingMin)) * 100)}%`
  const warn = $('[data-s-warn]')
  warn.hidden = q.canCheckout
  warn.textContent = 'Quita o ajusta los productos sin stock para continuar.'
  $('[data-go-checkout]').toggleAttribute('aria-disabled', !q.canCheckout)

  if (q.couponError && savedCoupon.get()) {
    couponMsg.hidden = false
    couponMsg.className = 'coupon-msg coupon-msg--error'
    couponMsg.textContent = q.couponError
  } else if (q.coupon) {
    couponMsg.hidden = false
    couponMsg.className = 'coupon-msg'
    couponMsg.textContent = `Cupón ${q.coupon} aplicado`
    $('#coupon').value = q.coupon
  }
}

linesEl.addEventListener('click', (e) => {
  const rowEl = e.target.closest('[data-key]')
  if (!rowEl) return
  const [id, v] = rowEl.dataset.key.split(':')
  const pid = Number(id)
  const vid = v ? Number(v) : null
  const current = cart.items().find((i) => i.id === pid && (i.variantId ?? null) === vid)
  if (e.target.closest('[data-remove]')) cart.remove(pid, vid)
  else if (e.target.closest('[data-inc]') && current) cart.set(pid, current.qty + 1, vid)
  else if (e.target.closest('[data-dec]') && current) cart.set(pid, Math.max(1, current.qty - 1), vid)
  else if (e.target.closest('[data-save]')) {
    if (!wishlist.has(pid)) wishlist.toggle(pid)
    cart.remove(pid, vid)
    toast('Movido a favoritos')
  }
})
linesEl.addEventListener('change', (e) => {
  const input = e.target.closest('[data-qty]')
  if (!input) return
  const [id, v] = input.closest('[data-key]').dataset.key.split(':')
  cart.set(Number(id), Math.max(1, Math.min(99, Number(input.value) || 1)), v ? Number(v) : null)
})

$('[data-coupon-form]').addEventListener('submit', (e) => {
  e.preventDefault()
  savedCoupon.set($('#coupon').value.trim())
  render()
})
$('[data-cart-clear]').addEventListener('click', () => {
  if (confirm('¿Vaciar el carrito?')) cart.clear()
})
$('[data-go-checkout]').addEventListener('click', (e) => {
  if (e.currentTarget.hasAttribute('aria-disabled')) e.preventDefault()
})

window.addEventListener('cart:change', render)
render()
