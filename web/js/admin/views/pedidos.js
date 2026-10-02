import { api, run, clp, esc, fmtDate, orderNo, statusPill, fulfillPill, fulfillMap, PAY, drawer, debounce, $ } from '../lib.js'

const FILTERS = [
  ['', 'Todos'],
  ['pending_transfer', 'Esperando transferencia'],
  ['pending_cod', 'Contra entrega'],
  ['paid', 'Pagados'],
  ['pending', 'Webpay pendiente'],
  ['cancelled', 'Cancelados'],
]

export async function render(view, ctx) {
  let status = ''
  let q = ''
  let orders = []
  view.innerHTML = `<div class="adm-top"><div><h1>Pedidos</h1><p>Confirma pagos, prepara y despacha.</p></div></div>
  <div class="toolbar"><div class="tabs" role="group" aria-label="Filtrar por estado">${FILTERS.map(([v, l]) => `<button type="button" data-status="${v}" aria-pressed="${v === ''}">${l}</button>`).join('')}</div>
  <input class="inp grow" type="search" placeholder="Buscar por N° de pedido, nombre o correo" data-q></div>
  <div data-list><p class="empty">Cargando…</p></div>`
  const list = $('[data-list]', view)

  const paint = () => {
    const term = q.trim().toLowerCase()
    const rows = orders.filter((o) => !term || [o.id, o.order_number, o.customer_name, o.customer_email, o.customer_phone].some((v) => String(v || '').toLowerCase().includes(term.replace(/^#/, ''))))
    list.innerHTML = rows.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Pedido</th><th>Fecha</th><th>Cliente</th><th>Entrega</th><th>Pago</th><th>Estado</th><th>Despacho</th><th class="num">Total</th></tr></thead><tbody>
      ${rows.map((o) => `<tr class="is-click" data-order="${esc(o.id)}"><td class="nowrap"><strong>${esc(orderNo(o))}</strong></td><td class="nowrap">${fmtDate(o.created_at)}</td>
        <td class="name"><strong>${esc(o.customer_name || '—')}</strong><span>${esc(o.customer_email || '')}</span></td>
        <td>${o.delivery_method === 'pickup' ? 'Retiro' : esc(o.customer_comuna || 'Despacho')}</td>
        <td>${esc(PAY[o.payment_method] || o.payment_method || '—')}</td><td>${statusPill(o.status)}</td><td>${fulfillPill(o.fulfillment_status, o)}</td><td class="num">${clp(o.total)}</td></tr>`).join('')}
      </tbody></table></div>` : '<p class="empty">No hay pedidos con este filtro.</p>'
  }
  const load = async () => {
    list.innerHTML = '<p class="empty">Cargando…</p>'
    orders = await api(`/api/admin/orders?limit=300${status ? `&status=${status}` : ''}`)
    paint()
  }

  view.querySelector('.tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-status]')
    if (!b) return
    status = b.dataset.status
    for (const x of view.querySelectorAll('[data-status]')) x.setAttribute('aria-pressed', String(x === b))
    load()
  })
  $('[data-q]', view).addEventListener('input', debounce((e) => { q = e.target.value; paint() }, 150))
  list.addEventListener('click', (e) => {
    const tr = e.target.closest('[data-order]')
    if (tr) openOrder(tr.dataset.order, async () => { await load(); ctx.refreshCounts() })
  })
  await load()
}

/** Detalle del pedido en un panel lateral, con todas las acciones. */
export async function openOrder(id, onChange) {
  const d = drawer('Pedido')
  d.body.innerHTML = '<p class="empty">Cargando…</p>'
  let o
  try { o = await api(`/api/admin/orders/${id}`) } catch (err) { d.body.innerHTML = `<p class="err">${esc(err.message)}</p>`; return }
  d.el.querySelector('.drawer__head h2').textContent = `Pedido ${orderNo(o)}`

  const items = o.order_items || []
  const pickup = o.delivery_method === 'pickup'
  const subtotal = items.reduce((n, it) => n + (it.price || 0) * (it.quantity || 0), 0)
  const address = o.delivery_method === 'pickup'
    ? 'Retiro en tienda'
    : [o.customer_street && `${o.customer_street} ${o.customer_number || ''}`.trim(), o.customer_apartment, o.customer_comuna, o.customer_region].filter(Boolean).join(', ') || o.customer_address || '—'
  const canConfirm = ['pending_transfer', 'pending_cod'].includes(o.status)
  const canCancel = ['pending_transfer', 'pending_cod', 'pending'].includes(o.status)
  const canResend = ['pending_transfer', 'pending_cod', 'paid'].includes(o.status)
  const canFulfill = o.status === 'paid' || o.status === 'pending_cod'

  d.body.innerHTML = `<div class="toolbar">${statusPill(o.status)} ${fulfillPill(o.fulfillment_status, o)} <span class="pill">${esc(PAY[o.payment_method] || o.payment_method || '—')}</span></div>
  <div class="grid-2">
    <section class="card"><h2>Cliente</h2><dl class="dl">
      <dt>Nombre</dt><dd>${esc(o.customer_name || '—')}</dd>
      <dt>RUT</dt><dd>${esc(o.customer_rut || '—')}</dd>
      <dt>Correo</dt><dd><a href="mailto:${esc(o.customer_email)}">${esc(o.customer_email || '—')}</a></dd>
      <dt>Teléfono</dt><dd>${o.customer_phone ? `<a href="https://wa.me/${esc(String(o.customer_phone).replace(/\D/g, ''))}" target="_blank" rel="noopener">${esc(o.customer_phone)}</a>` : '—'}</dd>
      <dt>Cuenta</dt><dd>${o.user_id ? 'Cliente registrado' : 'Invitado'}</dd>
    </dl></section>
    <section class="card"><h2>Entrega</h2><dl class="dl">
      <dt>Tipo</dt><dd>${o.delivery_method === 'pickup' ? 'Retiro en tienda' : 'Despacho'}</dd>
      <dt>Dirección</dt><dd>${esc(address)}</dd>
      ${o.customer_reference ? `<dt>Referencia</dt><dd>${esc(o.customer_reference)}</dd>` : ''}
      <dt>Creado</dt><dd>${fmtDate(o.created_at)}</dd>
      ${o.paid_at ? `<dt>Pagado</dt><dd>${fmtDate(o.paid_at)}</dd>` : ''}
      ${o.shipped_at ? `<dt>${pickup ? 'Listo para retirar' : 'Enviado'}</dt><dd>${fmtDate(o.shipped_at)}</dd>` : ''}
      ${o.delivered_at ? `<dt>${pickup ? 'Retirado' : 'Entregado'}</dt><dd>${fmtDate(o.delivered_at)}</dd>` : ''}
    </dl></section>
  </div>
  <section class="card"><h2>Productos</h2><ul class="items">${items.map((it) => `<li><img src="${esc(it.img_url || '/img/logo.webp')}" alt="" loading="lazy"><div><strong>${esc(it.name)}</strong><span>${it.variant_label ? `${esc(it.variant_label)} · ` : ''}${it.quantity} × ${clp(it.price)}</span></div><b>${clp((it.price || 0) * (it.quantity || 0))}</b></li>`).join('')}</ul>
    <div class="totals"><div><span>Subtotal</span><span>${clp(subtotal)}</span></div>
      ${o.discount_amount ? `<div><span>Descuento${o.coupon_code ? ` (${esc(o.coupon_code)})` : ''}</span><span>−${clp(o.discount_amount)}</span></div>` : ''}
      <div><span>Envío</span><span>${o.shipping_cost ? clp(o.shipping_cost) : 'Gratis'}</span></div>
      <div class="total"><span>Total</span><span>${clp(o.total)}</span></div></div>
  </section>
  ${canFulfill ? `<section class="card"><h2>${pickup ? 'Retiro en local' : 'Despacho'}</h2><form class="form-grid form-grid--2" data-fulfill>
    <label class="fld"><span>${pickup ? 'Estado del retiro' : 'Estado del despacho'}</span><select class="sel" name="fulfillment_status">${Object.entries(fulfillMap(o)).map(([v, [l]]) => `<option value="${v}"${(o.fulfillment_status || 'pending') === v ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
    ${pickup ? '<input type="hidden" name="tracking_code" value="">' : `<label class="fld"><span>Código de seguimiento</span><input class="inp" name="tracking_code" value="${esc(o.tracking_code || '')}" placeholder="Opcional"></label>`}
    <div class="fld--full"><button class="btn btn--primary btn--sm" type="submit">${pickup ? 'Guardar estado' : 'Guardar despacho'}</button> <small class="muted">${pickup ? 'Al marcar "Listo para retirar" se avisa al cliente por correo que puede pasar a buscarlo.' : 'Al marcar "En camino" se avisa al cliente por correo.'}</small></div>
  </form></section>` : ''}
  <section class="card"><h2>Notas internas</h2><form data-notes><textarea class="txt" name="admin_notes" placeholder="Solo las ves tú">${esc(o.admin_notes || '')}</textarea><button class="btn btn--ghost btn--sm" type="submit" style="margin-top:.6rem">Guardar nota</button></form></section>`

  d.setFoot([
    canCancel && '<button class="btn btn--danger btn--sm" type="button" data-act="cancel">Cancelar pedido</button>',
    canResend && '<button class="btn btn--ghost btn--sm" type="button" data-act="resend">Reenviar correo</button>',
    canConfirm && `<button class="btn btn--primary btn--sm" type="button" data-act="confirm">${o.status === 'pending_cod' ? 'Marcar como pagado' : 'Confirmar transferencia'}</button>`,
  ].filter(Boolean).join(''))

  const reopen = async () => { d.close(); await onChange?.(); openOrder(id, onChange) }

  d.foot.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-act]')
    if (!b) return
    const act = b.dataset.act
    if (act === 'cancel' && !confirm('¿Cancelar este pedido? Si tenía stock reservado, vuelve al inventario.')) return
    if (act === 'confirm' && !confirm(o.status === 'pending_cod' ? '¿Confirmas que el cliente pagó al recibir?' : '¿Confirmas que recibiste la transferencia por ' + clp(o.total) + '?')) return
    b.disabled = true
    const ok = await run(() => api(`/api/admin/orders/${id}/${act === 'confirm' ? 'confirm-transfer' : act === 'cancel' ? 'cancel' : 'resend-email'}`, { method: 'POST' }),
      act === 'confirm' ? 'Pago confirmado' : act === 'cancel' ? 'Pedido cancelado' : 'Correo reenviado')
    b.disabled = false
    if (ok && act !== 'resend') reopen()
  })
  $('[data-fulfill]', d.body)?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const f = e.target
    const ok = await run(() => api(`/api/admin/orders/${id}/fulfillment`, { method: 'POST', body: { fulfillment_status: f.fulfillment_status.value, tracking_code: f.tracking_code.value } }), pickup ? 'Estado del retiro actualizado' : 'Despacho actualizado')
    if (ok) reopen()
  })
  $('[data-notes]', d.body).addEventListener('submit', (e) => {
    e.preventDefault()
    run(() => api(`/api/admin/orders/${id}/notes`, { method: 'PUT', body: { admin_notes: e.target.admin_notes.value } }), 'Nota guardada')
  })
}
