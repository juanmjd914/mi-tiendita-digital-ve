import { wishlist, cart } from '../core/store.js'
import { initCoverflow } from '../components/coverflow.js'
import { clp, esc, toast, $ } from '../core/ui.js'

const box = $('[data-favs]')
const BADGE = { OFERTA: 'Oferta', NUEVO: 'Nuevo', HOT: 'Más vendido' }
const fmt = (d) => (d ? new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d)) : '')

// Si hay sesión, primero trae los favoritos guardados en la cuenta (site.js refleja los cambios)
// y muestra el acceso de vuelta a Mi cuenta (esta página también la usan visitantes sin cuenta).
try {
  if (localStorage.getItem('mtd_auth')) {
    const { getSession } = await import('../core/auth.js')
    const s = await getSession()
    if (s) {
      for (const el of document.querySelectorAll('[data-account-back], [data-account-crumb]')) el.hidden = false
      const { syncWishlist } = await import('../core/wishlist-sync.js')
      await syncWishlist(s.user.id)
    }
  }
} catch { /* sin sesión */ }

async function render() {
  const items = wishlist.items()
  if (!items.length) {
    box.innerHTML = `<div class="empty-state"><h2>Aún no tienes favoritos</h2><p class="muted">Toca el corazón en cualquier producto para guardarlo aquí.</p><a class="btn btn--primary" href="/tienda">Explorar la tienda</a></div>`
    return
  }
  const products = await fetch(`/api/catalog/by-ids?ids=${items.map((i) => i.id).join(',')}`).then((r) => r.json())
  const byId = new Map(products.map((p) => [p.id, p]))
  const list = items.map((i) => ({ ...byId.get(i.id), addedAt: i.addedAt })).filter((p) => p.id)
  const card = (p) => {
    const out = !p.stock || p.stock <= 0
    const save = p.original_price && p.original_price > p.price
    return `<article class="cover-card" data-slide>
      <div class="cover-card__top">
        ${p.badge ? `<span class="chip">${esc(BADGE[p.badge] || p.badge)}</span>` : '<span></span>'}
        <button class="wish-btn is-on" type="button" data-unfav="${p.id}" aria-label="Quitar de favoritos"><svg class="icon" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.8"><path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z"/></svg></button>
      </div>
      <a class="cover-card__media" href="/producto/${esc(p.slug)}"><img src="${esc(p.img)}" alt="" width="400" height="400" loading="lazy"></a>
      <div class="cover-card__body">
        <h3 class="cover-card__title"><a href="/producto/${esc(p.slug)}">${esc(p.name)}</a></h3>
        ${p.short_description ? `<p class="cover-card__desc">${esc(p.short_description)}</p>` : ''}
        <p class="fav-meta"><span class="stock stock--${out ? 'out' : 'in'}">${out ? 'Sin stock' : 'En stock'}</span>${p.addedAt ? `<span>Agregado el ${esc(fmt(p.addedAt))}</span>` : ''}</p>
        <div class="cover-card__foot">
          <div class="price"><span class="price__now">${clp(p.price)}</span>${save ? `<s class="price__was">${clp(p.original_price)}</s>` : ''}</div>
          ${p.has_variants
            ? `<a class="btn btn--primary btn--sm" href="/producto/${esc(p.slug)}">Elegir opción</a>`
            : `<button class="btn btn--primary btn--sm" type="button" data-fav-add="${p.id}" data-name="${esc(p.name)}"${out ? ' disabled' : ''}>${out ? 'Agotado' : 'Agregar'}</button>`}
        </div>
      </div>
    </article>`
  }
  box.innerHTML = `<div class="coverflow" data-coverflow>
      <button class="icon-btn coverflow__nav coverflow__nav--prev" type="button" aria-label="Anterior" data-cf-prev><svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m15 18-6-6 6-6"/></svg></button>
      <div class="coverflow__viewport"><div class="coverflow__track" data-cf-track>${list.map(card).join('')}</div></div>
      <button class="icon-btn coverflow__nav coverflow__nav--next" type="button" aria-label="Siguiente" data-cf-next><svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m9 18 6-6-6-6"/></svg></button>
      <div class="coverflow__dots" data-cf-dots></div>
    </div>
    <div class="fav-actions">
      <button class="btn btn--primary" type="button" data-fav-all>Agregar todo al carrito</button>
      <button class="btn btn--ghost" type="button" data-fav-clear>Vaciar favoritos</button>
    </div>`
  initCoverflow($('[data-coverflow]', box), { autoplay: 0 })
  box.dataset.list = JSON.stringify(list.map((p) => ({ id: p.id, ok: p.stock > 0 && !p.has_variants })))
}

box.addEventListener('click', (e) => {
  const un = e.target.closest('[data-unfav]')
  const add = e.target.closest('[data-fav-add]')
  if (un) { wishlist.remove(Number(un.dataset.unfav)); toast('Quitado de favoritos') }
  if (add) { cart.add(Number(add.dataset.favAdd), 1); toast(`${add.dataset.name} agregado al carrito`) }
  if (e.target.closest('[data-fav-all]')) {
    const ok = JSON.parse(box.dataset.list || '[]').filter((p) => p.ok)
    ok.forEach((p) => cart.add(p.id, 1))
    toast(ok.length ? `${ok.length} producto(s) agregados al carrito` : 'No hay productos con stock para agregar', { type: ok.length ? 'ok' : 'error' })
  }
  if (e.target.closest('[data-fav-clear]') && confirm('¿Vaciar tu lista de favoritos?')) wishlist.clear()
})
window.addEventListener('wishlist:change', render)
render()
