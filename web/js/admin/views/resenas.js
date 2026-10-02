import { api, run, esc, fmtDate, $ } from '../lib.js'

const TABS = [['pending', 'Por revisar'], ['approved', 'Aprobadas'], ['rejected', 'Rechazadas']]
const stars = (n) => '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n)

export async function render(view, ctx) {
  let status = 'pending'
  view.innerHTML = `<div class="adm-top"><div><h1>Reseñas</h1><p>Solo clientes que compraron pueden opinar. Tú decides qué se publica.</p></div></div>
  <div class="toolbar"><div class="tabs" role="group" aria-label="Filtrar reseñas">${TABS.map(([v, l]) => `<button type="button" data-st="${v}" aria-pressed="${v === status}">${l}</button>`).join('')}</div></div>
  <div class="reviews" data-list></div>`
  const list = $('[data-list]', view)

  const load = async () => {
    list.innerHTML = '<p class="empty">Cargando…</p>'
    const rows = await api(`/api/admin/reviews?status=${status}`)
    list.innerHTML = rows.length ? rows.map((r) => `<article class="review" data-id="${esc(r.id)}">
      <div class="review__head"><img src="${esc(r.products?.img_url || '/img/logo.webp')}" alt=""><div><strong>${esc(r.products?.name || 'Producto eliminado')}</strong><br><span class="stars" aria-label="${r.rating} de 5">${stars(r.rating)}</span> <small class="muted">${esc(r.author_display || 'Cliente')} · ${fmtDate(r.created_at, false)}</small></div></div>
      ${r.comment ? `<p>${esc(r.comment)}</p>` : '<p class="muted">Sin comentario, solo calificación.</p>'}
      <div class="adm-actions">
        ${status !== 'approved' ? '<button class="btn btn--primary btn--sm" type="button" data-set="approved">Aprobar y publicar</button>' : ''}
        ${status !== 'rejected' ? '<button class="btn btn--danger btn--sm" type="button" data-set="rejected">Rechazar</button>' : ''}
        ${r.products?.slug && status === 'approved' ? `<a class="btn btn--ghost btn--sm" href="/producto/${esc(r.products.slug)}#opiniones" target="_blank" rel="noopener">Ver en la tienda ↗</a>` : ''}
      </div></article>`).join('') : `<p class="empty">${status === 'pending' ? 'No hay reseñas por revisar.' : 'No hay reseñas en esta lista.'}</p>`
  }
  view.querySelector('.tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-st]')
    if (!b) return
    status = b.dataset.st
    for (const x of view.querySelectorAll('[data-st]')) x.setAttribute('aria-pressed', String(x === b))
    load()
  })
  list.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-set]')
    if (!b) return
    const id = b.closest('[data-id]').dataset.id
    b.disabled = true
    const ok = await run(() => api(`/api/admin/reviews/${id}`, { method: 'PUT', body: { status: b.dataset.set } }), b.dataset.set === 'approved' ? 'Reseña publicada' : 'Reseña rechazada')
    if (ok) { await load(); ctx.refreshCounts() } else b.disabled = false
  })
  await load()
}
