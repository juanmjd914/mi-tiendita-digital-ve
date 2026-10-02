import { api, clp, esc, fmtDate, orderNo, statusPill, fulfillPill, PAY } from '../lib.js'
import { openOrder } from './pedidos.js'

export async function render(view, ctx) {
  const o = await api('/api/admin/overview')
  view.innerHTML = `<div class="adm-top"><div><h1>Resumen</h1><p>Lo más importante de la tienda hoy.</p></div>
    <div class="adm-actions"><a class="btn btn--ghost btn--sm" href="#/stock">Cargar stock</a><a class="btn btn--primary btn--sm" href="#/productos?nuevo">Nuevo producto</a></div></div>
  <div class="kpis">
    <div class="kpi kpi--jade"><span>Ventas de hoy</span><strong>${clp(o.salesToday)}</strong></div>
    <div class="kpi"><span>Ventas del mes</span><strong>${clp(o.salesMonth)}</strong></div>
    <a class="kpi${o.pendingPayment ? ' kpi--alert' : ''}" href="#/pedidos"><span>Pagos pendientes</span><strong>${o.pendingPayment}</strong></a>
    <a class="kpi${o.toFulfill ? ' kpi--alert' : ''}" href="#/pedidos"><span>Por despachar</span><strong>${o.toFulfill}</strong></a>
    <a class="kpi" href="#/productos"><span>Productos activos</span><strong>${o.activeProducts}</strong></a>
    <a class="kpi${o.outOfStock ? ' kpi--alert' : ''}" href="#/stock"><span>Sin stock</span><strong>${o.outOfStock}</strong></a>
    <a class="kpi${o.lowStock ? ' kpi--alert' : ''}" href="#/stock"><span>Stock bajo</span><strong>${o.lowStock}</strong></a>
    <a class="kpi${o.pendingReviews ? ' kpi--alert' : ''}" href="#/resenas"><span>Reseñas por revisar</span><strong>${o.pendingReviews}</strong></a>
  </div>
  <section class="card"><h2>Últimos pedidos</h2>
    ${o.recentOrders.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Pedido</th><th>Fecha</th><th>Cliente</th><th>Pago</th><th>Estado</th><th>Despacho</th><th class="num">Total</th></tr></thead><tbody>
      ${o.recentOrders.map((r) => `<tr class="is-click" data-order="${esc(r.id)}"><td class="nowrap"><strong>${esc(orderNo(r))}</strong></td><td class="nowrap">${fmtDate(r.created_at)}</td><td>${esc(r.customer_name || '—')}</td><td>${esc(PAY[r.payment_method] || r.payment_method || '—')}</td><td>${statusPill(r.status)}</td><td>${fulfillPill(r.fulfillment_status)}</td><td class="num">${clp(r.total)}</td></tr>`).join('')}
    </tbody></table></div>` : '<p class="empty">Todavía no hay pedidos.</p>'}
  </section>`
  view.querySelector('tbody')?.addEventListener('click', (e) => {
    const tr = e.target.closest('[data-order]')
    if (tr) openOrder(tr.dataset.order, () => render(view, ctx).then(ctx.refreshCounts))
  })
}
