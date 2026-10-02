import { api, clp, esc, fmtDate, debounce, $ } from '../lib.js'

export async function render(view) {
  const [customers, subs] = await Promise.all([api('/api/admin/customers'), api('/api/admin/newsletter').catch(() => [])])
  view.innerHTML = `<div class="adm-top"><div><h1>Clientes</h1><p>${customers.length} clientes con pedidos · ${subs.length} suscritos a ofertas.</p></div>
    <div class="adm-actions"><button class="btn btn--ghost btn--sm" type="button" data-csv>Descargar suscriptores (CSV)</button></div></div>
  <div class="toolbar"><input class="inp grow" type="search" placeholder="Buscar por nombre, correo o teléfono" data-q></div>
  <div data-list></div>`
  const list = $('[data-list]', view)
  const paint = (term = '') => {
    const t = term.trim().toLowerCase()
    const rows = customers.filter((c) => !t || [c.name, c.email, c.phone].some((v) => String(v || '').toLowerCase().includes(t)))
    list.innerHTML = rows.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Cliente</th><th>Teléfono</th><th class="num">Pedidos</th><th class="num">Pagados</th><th class="num">Total comprado</th><th>Último pedido</th></tr></thead><tbody>
      ${rows.map((c) => `<tr><td class="name"><strong>${esc(c.name || '—')}</strong><span><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></span></td>
        <td>${c.phone ? `<a href="https://wa.me/${esc(String(c.phone).replace(/\D/g, ''))}" target="_blank" rel="noopener">${esc(c.phone)}</a>` : '—'}</td>
        <td class="num">${c.orders}</td><td class="num">${c.paidOrders}</td><td class="num">${clp(c.totalSpent)}</td><td class="nowrap">${fmtDate(c.lastOrderAt, false)}</td></tr>`).join('')}
      </tbody></table></div>` : '<p class="empty">Todavía no hay clientes.</p>'
  }
  $('[data-q]', view).addEventListener('input', debounce((e) => paint(e.target.value), 150))
  $('[data-csv]', view).addEventListener('click', () => {
    const csv = 'correo,fecha\n' + subs.map((s) => `${String(s.email).replace(/[",\n]/g, '')},${String(s.created_at || '').slice(0, 10)}`).join('\n')
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'suscriptores.csv' })
    a.click()
    URL.revokeObjectURL(a.href)
  })
  paint()
}
