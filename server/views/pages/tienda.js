import { html, raw } from '../html.js'
import { icon } from '../icons.js'
import { productUrl, thumb, priceBlock, stockState, BADGE_LABEL, savings, gaItem } from '../partials/product.js'

export const PAGE_SIZE = 24

const SORTS = [
  ['relevancia', 'Destacados'],
  ['precio-asc', 'Menor precio'],
  ['precio-desc', 'Mayor precio'],
  ['nuevos', 'Novedades'],
  ['nombre', 'Nombre A-Z'],
]

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function filterCatalog(catalog, { cat, search, badge, orden }) {
  let list = catalog
  if (cat) list = list.filter((p) => norm(p.category) === norm(cat))
  if (badge === 'OFERTA') list = list.filter((p) => p.badge === 'OFERTA' || savings(p) > 0)
  else if (badge) list = list.filter((p) => p.badge === badge)
  if (search) {
    const terms = norm(search).split(/\s+/).filter(Boolean)
    list = list.filter((p) => {
      const hay = norm(`${p.name} ${p.brand || ''} ${p.category || ''} ${p.short_description || ''}`)
      return terms.every((t) => hay.includes(t))
    })
  }
  const sorted = [...list]
  if (orden === 'precio-asc') sorted.sort((a, b) => a.price - b.price)
  else if (orden === 'precio-desc') sorted.sort((a, b) => b.price - a.price)
  else if (orden === 'nuevos') sorted.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
  else if (orden === 'nombre') sorted.sort((a, b) => a.name.localeCompare(b.name, 'es'))
  else sorted.sort((a, b) => (stockState(a) === 'out') - (stockState(b) === 'out') || (b.featured - a.featured))
  return sorted
}

export function productCard(p) {
  const st = stockState(p)
  return html`<article class="p-card">
  <div class="p-card__top">
    ${p.badge ? html`<span class="chip${p.badge === 'HOT' ? ' chip--hot' : ''}">${BADGE_LABEL[p.badge] || p.badge}</span>` : html`<span></span>`}
    <button class="wish-btn" type="button" data-wish="${p.id}" aria-pressed="false" aria-label="Agregar a favoritos">${icon('heart', { size: 18 })}</button>
  </div>
  <a class="p-card__media" href="${productUrl(p)}" tabindex="-1" aria-hidden="true">
    <img src="${thumb(p.img_url)}" alt="" width="400" height="400" loading="lazy" decoding="async">
  </a>
  <div class="p-card__body">
    ${p.brand ? html`<span class="p-card__brand">${p.brand}</span>` : ''}
    <h2 class="p-card__title"><a href="${productUrl(p)}">${p.name}</a></h2>
    ${p.short_description ? html`<p class="p-card__desc">${p.short_description}</p>` : ''}
    <span class="stock stock--${st}">${icon(st === 'out' ? 'x' : 'check', { size: 14 })}${st === 'out' ? 'Agotado' : st === 'low' ? '¡Últimas unidades!' : 'En stock'}</span>
    <div class="p-card__foot">
      ${priceBlock(p)}
      <div class="p-card__actions">
        <a class="icon-btn" href="${productUrl(p)}" aria-label="Ver detalle de ${p.name}">${icon('search', { size: 18 })}</a>
        <button class="btn btn--primary btn--sm" type="button" data-add-to-cart="${p.id}" data-name="${p.name}" data-ga="${gaItem(p)}"${st === 'out' || p.has_variants ? raw(' disabled') : ''} aria-label="Agregar ${p.name} al carrito">${icon('cart', { size: 16 })}<span>Agregar</span></button>
      </div>
    </div>
  </div>
</article>`
}

function qs(params, patch) {
  const u = new URLSearchParams()
  const next = { ...params, ...patch }
  for (const [k, v] of Object.entries(next)) if (v) u.set(k, v)
  const s = u.toString()
  return `/tienda${s ? `?${s}` : ''}`
}

export function tiendaBody({ catalog, params, categories }) {
  const all = filterCatalog(catalog, params)
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE))
  const page = Math.min(pages, Math.max(1, Number(params.pagina) || 1))
  const items = all.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const title = params.search ? `Resultados para "${params.search}"` : params.cat || (params.badge === 'OFERTA' ? 'Ofertas' : 'Catálogo de productos')

  return html`<section class="page-hero">
  <div class="wrap">
    <nav aria-label="Miga de pan"><ol class="breadcrumb"><li><a href="/">Inicio</a></li><li><a href="/tienda">Tienda</a></li>${params.cat ? html`<li>${params.cat}</li>` : ''}</ol></nav>
    <h1>${title}</h1>
    <p class="page-hero__sub">Despacho a todo Chile · Precios con IVA incluido</p>
  </div>
</section>
<section class="wrap shop">
  <div class="shop__cats" role="list" aria-label="Categorías">
    <a role="listitem" class="cat-chip${!params.cat ? ' is-on' : ''}" href="${qs(params, { cat: '', pagina: '' })}">Todo <span>${catalog.length}</span></a>
    ${categories.map((c) => html`<a role="listitem" class="cat-chip${norm(params.cat) === norm(c.name) ? ' is-on' : ''}" href="${qs(params, { cat: c.name, pagina: '' })}">${c.name} <span>${c.count}</span></a>`)}
  </div>
  <form class="shop__bar" method="get" action="/tienda">
    ${params.cat ? html`<input type="hidden" name="cat" value="${params.cat}">` : ''}
    ${params.badge ? html`<input type="hidden" name="badge" value="${params.badge}">` : ''}
    <div class="shop__search">${icon('search', { size: 18 })}<label class="sr-only" for="shop-q">Buscar</label><input id="shop-q" name="search" type="search" value="${params.search || ''}" placeholder="Buscar en el catálogo…"></div>
    <label class="shop__sort"><span>Ordenar por</span>
      <select name="orden" data-autosubmit>${SORTS.map(([v, l]) => html`<option value="${v}"${(params.orden || 'relevancia') === v ? raw(' selected') : ''}>${l}</option>`)}</select>
    </label>
    <button class="btn btn--ghost btn--sm" type="submit">Aplicar</button>
  </form>
  <p class="shop__count">Mostrando ${items.length} de ${all.length} ${all.length === 1 ? 'producto' : 'productos'}</p>
  ${items.length
    ? html`<div class="p-grid" data-ga-list="${params.search ? 'busqueda' : params.cat ? 'categoria' : 'tienda'}" data-ga-list-name="${params.search ? `Búsqueda: ${params.search}` : params.cat || 'Tienda'}">${items.map(productCard)}</div>`
    : html`<div class="empty"><h2>No encontramos productos</h2><p>Prueba con otra búsqueda o revisa todas las categorías.</p><a class="btn btn--primary" href="/tienda">Ver todo el catálogo</a></div>`}
  ${pages > 1 ? html`<nav class="pager" aria-label="Paginación">
    ${page > 1 ? html`<a class="icon-btn" href="${qs(params, { pagina: String(page - 1) })}" aria-label="Página anterior">${icon('chevron-left')}</a>` : ''}
    ${Array.from({ length: pages }, (_, i) => i + 1).map((n) => html`<a class="pager__n${n === page ? ' is-on' : ''}" href="${qs(params, { pagina: n === 1 ? '' : String(n) })}"${n === page ? raw(' aria-current="page"') : ''}>${n}</a>`)}
    ${page < pages ? html`<a class="icon-btn" href="${qs(params, { pagina: String(page + 1) })}" aria-label="Página siguiente">${icon('chevron-right')}</a>` : ''}
  </nav>` : ''}
</section>`
}
