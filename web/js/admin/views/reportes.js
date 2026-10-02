import { api, clp, esc, $ } from '../lib.js'

const iso = (d) => d.toISOString().slice(0, 10)

export async function render(view) {
  const today = new Date()
  const from = new Date(today.getFullYear(), today.getMonth(), 1)
  view.innerHTML = `<div class="adm-top"><div><h1>Reportes</h1><p>Ventas pagadas en el período.</p></div></div>
  <form class="toolbar" data-range>
    <label class="fld"><span>Desde</span><input class="inp" type="date" name="from" value="${iso(from)}"></label>
    <label class="fld"><span>Hasta</span><input class="inp" type="date" name="to" value="${iso(today)}"></label>
    <div class="tabs" style="align-self:flex-end"><button type="button" data-preset="7">7 días</button><button type="button" data-preset="30">30 días</button><button type="button" data-preset="month">Este mes</button><button type="button" data-preset="year">Este año</button></div>
  </form>
  <div data-out><p class="empty">Cargando…</p></div>`
  const form = $('[data-range]', view)
  const out = $('[data-out]', view)

  const load = async () => {
    out.innerHTML = '<p class="empty">Cargando…</p>'
    const r = await api(`/api/admin/reports?from=${form.from.value}&to=${form.to.value}`)
    const max = Math.max(1, ...r.salesByDay.map((d) => d.total))
    out.innerHTML = `<div class="kpis">
      <div class="kpi kpi--jade"><span>Ventas</span><strong>${clp(r.totalRevenue)}</strong></div>
      <div class="kpi"><span>Pedidos pagados</span><strong>${r.paidCount}</strong></div>
      <div class="kpi"><span>Ticket promedio</span><strong>${clp(r.avgTicket)}</strong></div>
    </div>
    <section class="card"><h2>Ventas por día</h2>${r.salesByDay.length
      ? `<div class="bars">${r.salesByDay.map((d) => `<div style="height:${Math.max(2, (d.total / max) * 100)}%" data-tip="${esc(d.day)} · ${clp(d.total)}"></div>`).join('')}</div>`
      : '<p class="empty">Sin ventas en este período.</p>'}</section>
    <section class="card"><h2>Productos más vendidos</h2>${r.topProducts.length
      ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Producto</th><th class="num">Unidades</th><th class="num">Ventas</th></tr></thead><tbody>${r.topProducts.map((p) => `<tr><td>${esc(p.name)}</td><td class="num">${p.units}</td><td class="num">${clp(p.revenue)}</td></tr>`).join('')}</tbody></table></div>`
      : '<p class="empty">Sin ventas en este período.</p>'}</section>`
  }
  form.addEventListener('change', load)
  form.addEventListener('click', (e) => {
    const b = e.target.closest('[data-preset]')
    if (!b) return
    const t = new Date()
    let f
    if (b.dataset.preset === 'month') f = new Date(t.getFullYear(), t.getMonth(), 1)
    else if (b.dataset.preset === 'year') f = new Date(t.getFullYear(), 0, 1)
    else f = new Date(Date.now() - (Number(b.dataset.preset) - 1) * 864e5)
    form.from.value = iso(f)
    form.to.value = iso(t)
    load()
  })
  await load()
}
