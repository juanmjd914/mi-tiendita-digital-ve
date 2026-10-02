import { cart } from '../core/store.js'
import { savedCoupon } from '../core/quote.js'
import { clp, esc, toast, $ } from '../core/ui.js'
import { track } from '../core/analytics.js'

const params = new URLSearchParams(location.search)
const token = params.get('token')
let orderId = params.get('pedido')

const fmtDate = (d) => new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d))
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const short = (d) => new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short' }).format(d)
const PAY = { flow: 'Webpay (tarjeta)', transfer: 'Transferencia bancaria', cod: 'Pago contra entrega' }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function fail(msg) {
  $('[data-t-loading]').innerHTML = `<p>${esc(msg)}</p><a class="btn btn--primary" href="/">Volver al inicio</a>`
}

// Webpay: consulta el estado hasta que Flow responda (máx ~30 s).
async function resolveFlow() {
  for (let i = 0; i < 10; i++) {
    const r = await fetch(`/api/payment/status/${encodeURIComponent(token)}`)
    if (r.ok) {
      const d = await r.json()
      orderId = d.id
      if (d.status !== 'pending') return d.status
    }
    await sleep(3000)
  }
  return 'pending'
}

async function load() {
  let flowStatus = null
  if (token) flowStatus = await resolveFlow()
  if (!orderId) return fail('No encontramos tu pedido. Si pagaste, revisa tu correo o escríbenos por WhatsApp.')
  const res = await fetch(`/api/order/${encodeURIComponent(orderId)}/summary`)
  if (!res.ok) return fail('No encontramos tu pedido. Si pagaste, revisa tu correo o escríbenos por WhatsApp.')
  const o = await res.json()
  render(o, flowStatus || o.status)
}

function render(o, status) {
  // Pedir reseña solo si el pedido sigue en curso (no si el pago fue rechazado o anulado)
  const reviewBox = $('[data-t-review]')
  if (reviewBox) reviewBox.hidden = ['rejected', 'cancelled'].includes(status)
  const pickup = o.deliveryMethod === 'pickup'
  const title = $('[data-t-title]')
  const sub = $('[data-t-sub]')
  const notice = $('[data-t-notice]')
  let stage = 1

  if (o.paymentMethod === 'flow') {
    if (status === 'paid') {
      title.textContent = '¡Gracias por tu compra!'
      sub.textContent = 'Tu pago fue confirmado. Te enviamos el detalle a tu correo.'
      stage = 2
      // Solo al volver de Flow recién pagado (con ?token=); si el cliente abre el seguimiento
      // días después desde el correo, no se le vacía el carrito actual.
      if (token) { cart.clear(); savedCoupon.set('') }
      purchaseEvent(o)
    } else if (status === 'pending') {
      title.textContent = 'Estamos confirmando tu pago…'
      sub.textContent = 'Flow todavía no nos informa el resultado. Esta página se actualizará sola.'
      setTimeout(() => location.reload(), 8000)
    } else {
      title.textContent = 'Tu pago no se completó'
      sub.textContent = status === 'rejected' ? 'El pago fue rechazado por el banco o la tarjeta.' : 'El pago fue anulado.'
      notice.hidden = false
      notice.className = 'thanks__notice thanks__notice--error'
      notice.innerHTML = 'No se realizó ningún cobro. Tus productos siguen en el carrito para que lo intentes de nuevo. <a class="btn btn--primary btn--sm" href="/checkout">Intentar de nuevo</a>'
    }
  } else if (o.paymentMethod === 'transfer') {
    title.textContent = 'Pedido recibido: completa tu transferencia'
    sub.textContent = `Reservamos tus productos. Transfiere ${clp(o.total)} para confirmar tu pedido.`
    if (status === 'paid') { title.textContent = '¡Pago recibido!'; sub.textContent = 'Confirmamos tu transferencia.'; stage = 2 }
    else loadBank(o)
    purchaseEvent(o)
  } else {
    title.textContent = 'Pedido confirmado: pagas al recibir'
    sub.textContent = `Ten listo ${clp(o.total)} al momento de la entrega.`
    stage = 2
    purchaseEvent(o)
  }
  if (o.fulfillment === 'shipped') stage = 3
  if (o.fulfillment === 'delivered') stage = 4
  // Seguimiento: si el pedido ya avanzó, el título muestra el estado actual
  if (!['rejected', 'cancelled'].includes(status) && status !== 'pending') {
    if (o.fulfillment === 'shipped') {
      title.textContent = pickup ? '¡Tu pedido está listo para retirar!' : '¡Tu pedido va en camino!'
      sub.textContent = pickup ? 'Ya puedes pasar a buscarlo a nuestro local. Presenta tu N° de pedido.' : (o.tracking ? `Código de seguimiento: ${o.tracking}` : 'Te contactaremos si necesitamos coordinar la entrega.')
    } else if (o.fulfillment === 'delivered') {
      title.textContent = pickup ? 'Pedido retirado' : 'Pedido entregado'
      sub.textContent = '¡Gracias por comprar en Mi Tiendita Digital Ve! Esperamos que lo disfrutes.'
    } else if (o.fulfillment === 'preparing') {
      sub.textContent = `${sub.textContent} Ya estamos preparando tu pedido.`.trim()
    }
  }

  const created = new Date(o.createdAt)
  const eta = pickup ? 'Te avisaremos cuando esté listo'
    : o.isLocal ? `Entre el ${short(addDays(created, 1))} y el ${short(addDays(created, 2))}`
      : `Entre el ${short(addDays(created, 5))} y el ${short(addDays(created, 8))}`
  const steps = [
    ['Pedido realizado', fmtDate(o.createdAt)],
    [pickup ? 'Listo para retiro' : 'Listo para despacho', stage >= 3 ? (pickup ? 'Listo' : 'Despachado') : stage >= 2 ? 'En preparación' : 'Pendiente de pago'],
    [pickup ? 'Retiro en local' : 'Entrega estimada', stage >= 4 ? (pickup ? 'Retirado' : 'Entregado') : pickup && stage >= 3 ? 'Ya puedes retirarlo' : o.tracking ? `Seguimiento: ${o.tracking}` : eta],
  ]
  $('[data-t-track]').innerHTML = steps.map(([t, d], i) => `<li class="track__step${i < stage ? ' is-done' : ''}${i === stage ? ' is-current' : ''}"><span class="track__dot"></span><strong>${esc(t)}</strong><small>${esc(d)}</small></li>`).join('')

  $('[data-t-number]').textContent = `#${o.number}`
  $('[data-t-date]').textContent = fmtDate(o.createdAt)
  $('[data-t-pay]').textContent = PAY[o.paymentMethod] || o.paymentMethod
  $('[data-t-items]').innerHTML = o.items.map((i) => `<div class="t-item">
      <img src="${esc(i.img)}" alt="" width="64" height="64">
      <div><strong>${i.slug ? `<a href="/producto/${esc(i.slug)}">${esc(i.name)}</a>` : esc(i.name)}</strong><span>Cantidad: ${i.qty}</span></div>
      <span class="t-item__price">${clp(i.lineTotal)}</span>
    </div>`).join('')
  $('[data-t-subtotal]').textContent = clp(o.subtotal)
  $('[data-t-discount-row]').hidden = !o.discount
  $('[data-t-discount]').textContent = `−${clp(o.discount)}${o.coupon ? ` (${o.coupon})` : ''}`
  $('[data-t-shipping]').textContent = o.shipping ? clp(o.shipping) : 'Gratis'
  $('[data-t-total]').textContent = clp(o.total)
  $('[data-t-contact]').innerHTML = [o.customer.name, o.customer.email, o.customer.phone].filter(Boolean).map(esc).join('<br>')
  $('[data-t-addr-title]').textContent = pickup ? 'Retiro en local' : 'Dirección de despacho'
  $('[data-t-address]').innerHTML = pickup
    ? `${esc(o.store.address || o.store.city)}<br><small>Te avisaremos por correo o WhatsApp cuando tu pedido esté listo para retirar.</small>`
    : esc(o.customer.address)

  const logged = Boolean(window.mtdAuth?.accessToken?.())
  $('[data-t-register]').hidden = logged
  if (!logged) {
    $('[data-t-register]').href = `/cuenta/registro?email=${encodeURIComponent(o.customer.email || '')}&next=${encodeURIComponent('/cuenta/pedidos')}`
    $('[data-t-myorder]').href = '/cuenta/login?next=/cuenta/pedidos'
  }
  $('[data-t-loading]').hidden = true
  $('[data-t-content]').hidden = false
}

async function loadBank(o) {
  const r = await fetch(`/api/order/${encodeURIComponent(o.id)}/bank-details`)
  if (!r.ok) return
  const { bank } = await r.json()
  const rows = [
    ['Banco', bank.bank_name], ['Tipo de cuenta', bank.bank_account_type], ['N° de cuenta', bank.bank_account_number],
    ['Titular', bank.bank_holder], ['RUT', bank.bank_rut], ['Monto', clp(o.total)], ['Comentario', `Pedido #${o.number}`],
  ].filter(([, v]) => v)
  $('[data-t-bank-grid]').innerHTML = rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd><span>${esc(v)}</span><button type="button" class="copy-btn" data-copy="${esc(v)}">Copiar</button></dd></div>`).join('')
  $('[data-t-bank]').hidden = false
}
document.addEventListener('click', async (e) => {
  const b = e.target.closest('[data-copy]')
  if (!b) return
  try { await navigator.clipboard.writeText(b.dataset.copy); toast('Copiado') } catch { toast('No se pudo copiar', { type: 'error' }) }
})

// GA4: compra registrada una sola vez por pedido.
function purchaseEvent(o) {
  const key = `ga_purchase_${o.id}`
  try { if (localStorage.getItem(key)) return; localStorage.setItem(key, '1') } catch { /* sin almacenamiento */ }
  track('purchase', {
    transaction_id: o.number, value: o.total, currency: 'CLP', shipping: o.shipping, coupon: o.coupon || undefined,
    items: o.items.map((i, index) => ({ item_id: i.id ? String(i.id) : undefined, item_name: i.name, item_brand: i.brand || undefined, item_category: i.category || undefined, item_variant: i.variant || undefined, price: i.price, quantity: i.qty, index })),
  })
}

load()
