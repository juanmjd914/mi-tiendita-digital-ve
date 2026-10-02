import { api, run, clp, esc, fmtDate, drawer, formData, $ } from '../lib.js'

const value = (c) => (c.discount_type === 'percentage' ? `${Number(c.discount_value)}%` : clp(c.discount_value))
const isExpired = (c) => c.expires_at && new Date(c.expires_at) < new Date()

export async function render(view) {
  view.innerHTML = `<div class="adm-top"><div><h1>Cupones</h1><p>Códigos de descuento para el checkout.</p></div>
    <div class="adm-actions"><button class="btn btn--primary btn--sm" type="button" data-new>Nuevo cupón</button></div></div>
  <div data-list><p class="empty">Cargando…</p></div>`
  const list = $('[data-list]', view)
  let coupons = []

  const load = async () => {
    coupons = await api('/api/admin/coupons')
    list.innerHTML = coupons.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Código</th><th>Descuento</th><th class="num">Compra mínima</th><th class="num">Usos</th><th>Vence</th><th>Estado</th><th></th></tr></thead><tbody>
      ${coupons.map((c) => `<tr data-id="${esc(c.id)}"><td class="name"><strong>${esc(c.code)}</strong><span>${esc(c.description || '')}</span></td><td>${value(c)}</td>
        <td class="num">${Number(c.min_order) ? clp(c.min_order) : '—'}</td><td class="num">${c.uses || 0}${c.max_uses != null ? ` / ${c.max_uses}` : ''}</td>
        <td class="nowrap">${c.expires_at ? fmtDate(c.expires_at, false) : 'Sin vencimiento'}</td>
        <td>${isExpired(c) ? '<span class="pill pill--bad">Vencido</span>' : c.active ? '<span class="pill pill--ok">Activo</span>' : '<span class="pill">Pausado</span>'}</td>
        <td class="nowrap"><button class="btn btn--ghost btn--sm" type="button" data-toggle>${c.active ? 'Pausar' : 'Activar'}</button> <button class="btn btn--ghost btn--sm" type="button" data-edit>Editar</button></td></tr>`).join('')}
      </tbody></table></div>` : '<p class="empty">No hay cupones creados.</p>'
  }

  list.addEventListener('click', async (e) => {
    const tr = e.target.closest('[data-id]')
    if (!tr) return
    const c = coupons.find((x) => String(x.id) === tr.dataset.id)
    if (e.target.closest('[data-toggle]')) {
      if (await run(() => api(`/api/admin/coupons/${c.id}`, { method: 'PUT', body: { active: !c.active } }), c.active ? 'Cupón pausado' : 'Cupón activado')) load()
    }
    if (e.target.closest('[data-edit]')) editor(c, load)
  })
  $('[data-new]', view).addEventListener('click', () => editor(null, load))
  await load()
}

function editor(c, onSaved) {
  const isNew = !c
  c = c || { discount_type: 'percentage', active: true }
  const d = drawer(isNew ? 'Nuevo cupón' : `Editar ${c.code}`)
  d.body.innerHTML = `<form class="form-grid form-grid--2" data-form>
    <label class="fld"><span>Código *</span><input class="inp" name="code" required value="${esc(c.code || '')}" ${isNew ? '' : 'disabled'} style="text-transform:uppercase"></label>
    <label class="fld"><span>Descripción</span><input class="inp" name="description" value="${esc(c.description || '')}" placeholder="Ej. 10% Cyber"></label>
    <label class="fld"><span>Tipo *</span><select class="sel" name="discount_type"><option value="percentage"${c.discount_type === 'percentage' ? ' selected' : ''}>Porcentaje (%)</option><option value="fixed"${c.discount_type === 'fixed' ? ' selected' : ''}>Monto fijo ($)</option></select></label>
    <label class="fld"><span>Valor *</span><input class="inp" type="number" min="1" name="discount_value" required value="${c.discount_value ?? ''}"></label>
    <label class="fld"><span>Compra mínima (CLP)</span><input class="inp" type="number" min="0" name="min_order" value="${c.min_order ?? 0}"></label>
    <label class="fld"><span>Máximo de usos</span><input class="inp" type="number" min="1" name="max_uses" value="${c.max_uses ?? ''}" placeholder="Sin límite"></label>
    <label class="fld"><span>Vence el</span><input class="inp" type="date" name="expires_at" value="${c.expires_at ? String(c.expires_at).slice(0, 10) : ''}"></label>
    ${isNew ? '' : `<div class="fld" style="justify-content:flex-end"><label class="chk"><input type="checkbox" name="active"${c.active ? ' checked' : ''}> Activo</label></div>`}
    <p class="err fld--full" data-err hidden></p>
  </form>`
  d.setFoot(`<button class="btn btn--primary btn--sm" type="button" data-save>${isNew ? 'Crear cupón' : 'Guardar'}</button>`)
  $('[data-save]', d.foot).addEventListener('click', async () => {
    const err = $('[data-err]', d.body)
    err.hidden = true
    const body = formData($('[data-form]', d.body))
    if (body.expires_at) body.expires_at = `${body.expires_at}T23:59:59`
    if (body.discount_type === 'percentage' && Number(body.discount_value) > 100) { err.textContent = 'El porcentaje no puede superar 100.'; err.hidden = false; return }
    try {
      if (isNew) await api('/api/admin/coupons', { method: 'POST', body })
      else await api(`/api/admin/coupons/${c.id}`, { method: 'PUT', body })
      d.close()
      onSaved()
    } catch (ex) { err.textContent = ex.message; err.hidden = false }
  })
}
