import { cart } from '../core/store.js'
import { getQuote, savedCoupon } from '../core/quote.js'
import { clp, esc, $, $$ } from '../core/ui.js'
import { trackItems, lineItem } from '../core/analytics.js'

let begun = false
const gaItems = () => (lastQuote?.lines || []).filter((l) => !l.missing).map(lineItem)
import { validRut, formatRut } from '../core/rut.js'

const form = $('[data-checkout]')
const LOCAL_REGION = "Libertador General Bernardo O'Higgins"
const LOCAL_COMUNA = 'Rancagua'
const regionSel = $('#region')
const comunaSel = $('#comuna')
let regions = []
let lastQuote = null

if (!cart.items().length) location.replace('/carrito')

// ---------- Regiones y comunas ----------
async function loadRegions() {
  regions = await fetch('/data/chile-regiones.json').then((r) => r.json())
  regionSel.insertAdjacentHTML('beforeend', regions.map((r) => `<option>${esc(r.region)}</option>`).join(''))
}
function fillComunas(region, selected = '') {
  const r = regions.find((x) => x.region === region)
  comunaSel.innerHTML = r
    ? `<option value="">Selecciona tu comuna</option>${r.comunas.map((c) => `<option${c === selected ? ' selected' : ''}>${esc(c)}</option>`).join('')}`
    : '<option value="">Primero elige la región</option>'
  comunaSel.disabled = !r
}
regionSel.addEventListener('change', () => { fillComunas(regionSel.value); requote() })
comunaSel.addEventListener('change', () => {
  // Si eligen Rancagua con "regiones", pasa a delivery local (más barato y rápido).
  if (method() === 'regions' && comunaSel.value === LOCAL_COMUNA) {
    $('input[name="deliveryMethod"][value="local"]').checked = true
    applyMethod()
  }
  requote()
})

// ---------- Método de entrega ----------
const method = () => $('input[name="deliveryMethod"]:checked')?.value || 'local'
const payment = () => $('input[name="payment"]:checked')?.value || 'flow'
function applyMethod() {
  const m = method()
  $('[data-address-box]').hidden = m === 'pickup'
  if (m === 'local') {
    regionSel.value = LOCAL_REGION
    fillComunas(LOCAL_REGION, LOCAL_COMUNA)
    regionSel.disabled = true
    comunaSel.disabled = true
  } else {
    regionSel.disabled = false
    if (regionSel.value === LOCAL_REGION && comunaSel.value === LOCAL_COMUNA && m === 'regions') fillComunas(LOCAL_REGION)
    comunaSel.disabled = !regionSel.value
  }
  const cod = $('[data-cod-option]')
  if (cod) {
    cod.hidden = m !== 'local'
    if (m !== 'local' && payment() === 'cod') $('input[name="payment"][value="flow"]').checked = true
  }
  applyPayment()
  requote()
}
$$('input[name="deliveryMethod"]').forEach((r) => r.addEventListener('change', applyMethod))

function applyPayment() {
  const label = { flow: 'Pagar con Webpay', transfer: 'Confirmar pedido', cod: 'Confirmar pedido' }[payment()]
  $('[data-submit-label]').textContent = label
}
$$('input[name="payment"]').forEach((r) => r.addEventListener('change', applyPayment))

// ---------- Resumen ----------
const ICON_X = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>'
async function requote() {
  const comuna = method() === 'local' ? LOCAL_COMUNA : method() === 'regions' ? comunaSel.value || '' : ''
  try {
    lastQuote = await getQuote({ deliveryMethod: method(), comuna })
  } catch {
    $('[data-sum-items]').innerHTML = '<p class="form-error">No pudimos calcular tu pedido. Recarga la página.</p>'
    return
  }
  const q = lastQuote
  if (!begun) { begun = true; trackItems('begin_checkout', gaItems(), q.coupon ? { coupon: q.coupon } : {}) }
  $('[data-sum-items]').innerHTML = q.lines.map((l) => l.missing
    ? `<div class="co-item is-out"><div class="co-item__info"><strong>${esc(l.name || 'Producto no disponible')}</strong><span class="tag-out">No disponible</span></div><button type="button" class="co-item__rm" data-rm="${l.id}:${l.variantId ?? ''}" aria-label="Eliminar">${ICON_X}</button></div>`
    : `<div class="co-item${l.outOfStock || l.notEnough ? ' is-out' : ''}">
        <img src="${esc(l.img)}" alt="" width="64" height="64">
        <div class="co-item__info">
          <strong>${esc(l.name)}</strong>
          ${l.variantLabel ? `<span>${esc(l.variantKind || 'Opción')}: ${esc(l.variantLabel)}</span>` : ''}
          <span>Cantidad: ${l.qty}</span>
          ${l.outOfStock ? '<span class="tag-out">Sin stock</span>' : l.notEnough ? `<span class="tag-out">Solo quedan ${l.stock}</span>` : ''}
        </div>
        <div class="co-item__price">${clp(l.lineTotal)}<button type="button" class="co-item__rm" data-rm="${l.id}:${l.variantId ?? ''}" aria-label="Eliminar ${esc(l.name)}">${ICON_X}</button></div>
      </div>`).join('')

  const s = q.shipping
  const shipKnown = method() !== 'regions' || comunaSel.value
  const total = q.subtotal - q.discount + (shipKnown ? s.shippingCost : 0)
  $('[data-sum-subtotal]').textContent = clp(q.subtotal)
  $('[data-sum-discount-row]').hidden = !q.discount
  $('[data-sum-discount]').textContent = `−${clp(q.discount)}`
  $('[data-sum-coupon]').textContent = q.coupon ? `(${q.coupon})` : ''
  $('[data-sum-shipping]').textContent = !shipKnown ? 'Elige tu comuna' : s.shippingCost === 0 ? 'Gratis' : clp(s.shippingCost)
  for (const sel of ['[data-sum-total]', '[data-sum-total-top]', '[data-sum-total-mobile]']) $(sel).textContent = clp(total)

  const fs = $('[data-free-ship]')
  fs.hidden = method() !== 'local'
  if (method() === 'local') {
    const after = q.subtotal - q.discount
    const missing = Math.max(0, s.freeShippingMin - after)
    $('[data-free-ship-text]').innerHTML = missing > 0 ? `Te faltan <strong>${clp(missing)}</strong> para envío gratis en Rancagua` : '¡Tienes <strong>envío gratis</strong>!'
    $('[data-free-ship-bar]').style.width = `${Math.min(100, (after / Math.max(1, s.freeShippingMin)) * 100)}%`
  }

  const msg = $('[data-coupon-msg]')
  if (q.coupon) { msg.hidden = false; msg.className = 'coupon-msg'; msg.textContent = `Cupón ${q.coupon} aplicado`; $('#coupon').value = q.coupon }
  else if (q.couponError && savedCoupon.get()) { msg.hidden = false; msg.className = 'coupon-msg coupon-msg--error'; msg.textContent = q.couponError }
  else msg.hidden = true

  $$('[data-submit]').forEach((b) => { b.disabled = !q.canCheckout })
  if (!q.canCheckout && q.lines.length) showError('Hay productos sin stock en tu pedido. Elimínalos para continuar.')
  else hideError()
}

$('[data-sum-items]').addEventListener('click', (e) => {
  const b = e.target.closest('[data-rm]')
  if (!b) return
  const [id, v] = b.dataset.rm.split(':')
  cart.remove(Number(id), v ? Number(v) : null)
  if (!cart.items().length) location.replace('/carrito')
  else requote()
})
$('[data-apply-coupon]').addEventListener('click', () => { savedCoupon.set($('#coupon').value.trim()); requote() })
$('[data-summary-toggle]').addEventListener('click', (e) => {
  const open = e.currentTarget.getAttribute('aria-expanded') !== 'true'
  e.currentTarget.setAttribute('aria-expanded', String(open))
  $('[data-sum-items]').hidden = !open
})
if (matchMedia('(max-width: 1023px)').matches) $('[data-summary-toggle]').click()

// ---------- RUT ----------
const rut = $('#rut')
rut.addEventListener('blur', () => { if (rut.value) rut.value = formatRut(rut.value) })

// ---------- Validación y envío ----------
function showError(msg) { const el = $('[data-form-error]'); el.textContent = msg; el.hidden = false }
function hideError() { $('[data-form-error]').hidden = true }
function fieldError(input, msg) {
  input.setAttribute('aria-invalid', 'true')
  let note = input.parentElement.querySelector('.field__error')
  if (!note) { note = document.createElement('small'); note.className = 'field__error'; input.parentElement.append(note) }
  note.textContent = msg
}
form.addEventListener('input', (e) => {
  if (e.target.matches('[aria-invalid]')) { e.target.removeAttribute('aria-invalid'); e.target.parentElement.querySelector('.field__error')?.remove() }
})

function validate() {
  let first = null
  const need = (sel, msg, ok = (v) => v.trim().length > 0) => {
    const el = $(sel)
    if (!ok(el.value)) { fieldError(el, msg); first ??= el }
  }
  need('#firstName', 'Ingresa tu nombre')
  need('#lastName', 'Ingresa tu apellido')
  need('#email', 'Ingresa un correo válido', (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()))
  need('#phone', 'Ingresa un teléfono válido', (v) => v.replace(/\D/g, '').length >= 8)
  if (rut.value.trim() && !validRut(rut.value)) { fieldError(rut, 'El RUT no es válido'); first ??= rut }
  if (method() !== 'pickup') {
    if (method() === 'regions') {
      need('#region', 'Elige tu región')
      need('#comuna', 'Elige tu comuna')
    }
    need('#street', 'Ingresa la calle')
    need('#number', 'Ingresa el número')
  }
  const terms = $('input[name="acceptTerms"]')
  if (!terms.checked) { first ??= terms; showError('Debes aceptar los Términos y Condiciones para continuar.') }
  if (first) { first.focus(); first.scrollIntoView({ block: 'center', behavior: 'smooth' }); return false }
  return true
}

let sending = false
form.addEventListener('submit', async (e) => {
  e.preventDefault()
  if (sending) return
  hideError()
  if (!validate()) return
  const m = method()
  const body = {
    items: cart.items(),
    firstName: $('#firstName').value, lastName: $('#lastName').value, email: $('#email').value,
    phone: $('#phone').value, rut: rut.value,
    deliveryMethod: m,
    region: m === 'pickup' ? null : regionSel.value, comuna: m === 'pickup' ? null : comunaSel.value,
    street: $('#street').value, number: $('#number').value, apartment: $('#apartment').value, reference: $('#reference').value,
    couponCode: savedCoupon.get(),
    acceptTerms: true,
  }
  const endpoint = { flow: '/api/payment/create', transfer: '/api/payment/transfer', cod: '/api/payment/cod' }[payment()]
  sending = true
  $$('[data-submit]').forEach((b) => { b.disabled = true; b.classList.add('is-loading') })
  try {
    const headers = { 'Content-Type': 'application/json' }
    const token = window.mtdAuth?.accessToken?.()
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(endpoint, { method: 'POST', headers, body: JSON.stringify(body) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'No pudimos crear tu pedido')
    trackItems('add_shipping_info', gaItems(), { shipping_tier: { pickup: 'Retiro en tienda', local: 'Delivery Rancagua', regions: 'Envío a regiones' }[m] || m })
    trackItems('add_payment_info', gaItems(), { payment_type: { flow: 'Webpay', transfer: 'Transferencia', cod: 'Contra entrega' }[payment()] })
    await saveAddressIfAsked().catch(() => {})
    // Con Webpay el carrito se vacía recién cuando el pago queda aprobado (página de Gracias),
    // así el cliente no lo pierde si cancela o el pago es rechazado.
    if (data.redirectUrl) { location.href = data.redirectUrl; return }
    cart.clear()
    savedCoupon.set('')
    location.href = `/pago/resultado?pedido=${encodeURIComponent(data.orderId)}`
  } catch (err) {
    showError(err.message)
    sending = false
    $$('[data-submit]').forEach((b) => { b.disabled = false; b.classList.remove('is-loading') })
  }
})

await loadRegions()
applyMethod()

// ---------- Cliente con sesión: autocompletar datos y dirección predeterminada ----------
let account = null
try {
  if (localStorage.getItem('mtd_auth')) {
    const { sb, getSession } = await import('../core/auth.js')
    const s = await getSession()
    if (s) {
      account = { sb, user: s.user }
      $('[data-guest-box]').hidden = true
      $('[data-save-address]').hidden = false
      const [{ data: p }, { data: addr }] = await Promise.all([
        sb.from('customer_profiles').select('*').eq('user_id', s.user.id).maybeSingle(),
        sb.from('customer_addresses').select('*').eq('user_id', s.user.id).order('is_default', { ascending: false }).limit(1),
      ])
      const set = (id, v) => { const el = $(id); if (el && !el.value && v) el.value = v }
      set('#firstName', p?.first_name || s.user.user_metadata?.first_name)
      set('#lastName', p?.last_name || s.user.user_metadata?.last_name)
      set('#email', s.user.email)
      set('#phone', p?.phone)
      set('#rut', p?.rut)
      const a = addr?.[0]
      if (a) {
        const isLocal = a.comuna === LOCAL_COMUNA
        $(`input[name="deliveryMethod"][value="${isLocal ? 'local' : 'regions'}"]`).checked = true
        applyMethod()
        if (!isLocal) { regionSel.value = a.region; fillComunas(a.region, a.comuna); comunaSel.disabled = false }
        $('#street').value = a.street; $('#number').value = a.number
        $('#apartment').value = a.apartment || ''; $('#reference').value = a.reference || ''
        $('input[name="saveAddress"]').checked = false
        requote()
      }
    }
  }
} catch { /* sin sesión: compra como invitado */ }

// Guarda la dirección usada si el cliente lo pidió (se llama antes de redirigir).
async function saveAddressIfAsked() {
  if (!account || method() === 'pickup' || !$('input[name="saveAddress"]').checked) return
  const { sb, user } = account
  const { count } = await sb.from('customer_addresses').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
  await sb.from('customer_addresses').insert({
    user_id: user.id, region: regionSel.value, comuna: comunaSel.value, street: $('#street').value.trim(),
    number: $('#number').value.trim(), apartment: $('#apartment').value.trim() || null,
    reference: $('#reference').value.trim() || null, is_default: !count,
  })
}
