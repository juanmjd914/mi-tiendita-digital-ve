// Utilidades compartidas del panel admin.
import { toast, clp, esc, $, $$ } from '../core/ui.js'

export { toast, clp, esc, $, $$ }

const TOKEN_KEY = 'mtd_admin_token'
export const session = {
  get token() { try { return sessionStorage.getItem(TOKEN_KEY) } catch { return null } },
  set(token, user) { try { sessionStorage.setItem(TOKEN_KEY, token); sessionStorage.setItem('mtd_admin_user', user) } catch { /* sin storage */ } },
  get user() { try { return sessionStorage.getItem('mtd_admin_user') || '' } catch { return '' } },
  clear() { try { sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem('mtd_admin_user') } catch { /* sin storage */ } },
}

/** Llamada a la API del admin. Si la sesión expiró, vuelve al login. */
export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json', 'x-admin-token': session.token || '' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (res.status === 401) {
    session.clear()
    location.hash = '#/login'
    throw new Error('Tu sesión expiró. Vuelve a iniciar sesión.')
  }
  if (!res.ok) throw new Error(json.error || `Error ${res.status}`)
  return json
}

/** Ejecuta una acción mostrando un toast de éxito o error. */
export async function run(fn, okMsg) {
  try {
    const r = await fn()
    if (okMsg) toast(okMsg)
    return r
  } catch (err) {
    toast(err.message || 'Ocurrió un error', { type: 'error', ms: 4500 })
    return undefined
  }
}

export const fmtDate = (d, withTime = true) => {
  if (!d) return '—'
  const opts = { day: '2-digit', month: 'short', year: 'numeric' }
  if (withTime) Object.assign(opts, { hour: '2-digit', minute: '2-digit' })
  return new Date(d).toLocaleString('es-CL', opts)
}
export const orderNo = (o) => `#${o?.order_number || String(o?.id || o || '').slice(0, 8).toUpperCase()}`

export const STATUS = {
  pending: ['Pago pendiente', 'warn'],
  pending_transfer: ['Esperando transferencia', 'warn'],
  pending_cod: ['Contra entrega', 'info'],
  paid: ['Pagado', 'ok'],
  rejected: ['Rechazado', 'bad'],
  cancelled: ['Cancelado', 'bad'],
}
export const FULFILL = {
  pending: ['Por preparar', 'warn'],
  preparing: ['En preparación', 'info'],
  shipped: ['En camino', 'info'],
  delivered: ['Entregado', 'ok'],
}
export const PAY = { flow: 'Webpay (Flow)', transfer: 'Transferencia', cod: 'Contra entrega' }
export const pill = ([label, kind] = ['—', '']) => `<span class="pill${kind ? ` pill--${kind}` : ''}">${esc(label)}</span>`
export const statusPill = (s) => pill(STATUS[s] || [s || '—', ''])
// Retiro en local: mismas etapas internas con nombres propios
export const FULFILL_PICKUP = {
  pending: ['Por preparar', 'warn'],
  preparing: ['En preparación', 'info'],
  shipped: ['Listo para retirar', 'info'],
  delivered: ['Retirado', 'ok'],
}
export const fulfillMap = (o) => (o?.delivery_method === 'pickup' ? FULFILL_PICKUP : FULFILL)
export const fulfillPill = (s, o) => pill(fulfillMap(o)[s || 'pending'] || [s, ''])

export const ICONS = {
  close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  trash: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>',
}

/** Panel lateral. Devuelve { el, body, foot, close }. */
export function drawer(title, { onClose } = {}) {
  const el = document.createElement('div')
  el.className = 'drawer'
  el.innerHTML = `<div class="drawer__bg" data-close></div>
  <section class="drawer__panel" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <header class="drawer__head"><h2>${esc(title)}</h2><button class="icon-btn" type="button" data-close aria-label="Cerrar">${ICONS.close}</button></header>
    <div class="drawer__body"></div>
    <footer class="drawer__foot" hidden></footer>
  </section>`
  document.body.append(el)
  document.body.style.overflow = 'hidden'
  const close = () => {
    el.remove()
    document.body.style.overflow = ''
    document.removeEventListener('keydown', onKey)
    onClose?.()
  }
  const onKey = (e) => { if (e.key === 'Escape') close() }
  document.addEventListener('keydown', onKey)
  el.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close() })
  const foot = $('.drawer__foot', el)
  return { el, body: $('.drawer__body', el), foot, close, setFoot(htmlStr) { foot.innerHTML = htmlStr; foot.hidden = !htmlStr } }
}

/** Lee los campos de un formulario como objeto (checkbox → boolean). */
export function formData(form) {
  const out = {}
  for (const el of form.elements) {
    if (!el.name || el.disabled) continue
    if (el.type === 'checkbox') out[el.name] = el.checked
    else out[el.name] = el.value
  }
  return out
}

export const debounce = (fn, ms = 250) => {
  let t
  return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) }
}

/** Convierte un File en base64 (sin el prefijo data:). */
export const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const r = new FileReader()
  r.onload = () => resolve(String(r.result).split(',')[1])
  r.onerror = reject
  r.readAsDataURL(file)
})
