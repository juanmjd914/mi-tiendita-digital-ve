import { api, run, clp, esc, drawer, formData, debounce, fileToBase64, toast, ICONS, $, $$ } from '../lib.js'

const BADGES = [['', 'Sin etiqueta'], ['OFERTA', 'Oferta'], ['NUEVO', 'Nuevo'], ['HOT', 'Más vendido']]
const slugify = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 90)
export const stockOf = (p) => (p.product_variants?.length ? p.product_variants.filter((v) => v.active).reduce((n, v) => n + (v.stock || 0), 0) : p.stock || 0)
const stockPill = (p) => {
  const s = stockOf(p)
  if (s <= 0) return '<span class="pill pill--bad">Sin stock</span>'
  if (s <= (p.low_stock_threshold ?? 3)) return `<span class="pill pill--warn">${s} · bajo</span>`
  return `<span class="pill pill--ok">${s}</span>`
}

export async function render(view) {
  let all = []
  const f = { q: '', cat: '', state: 'active', stock: '' }
  view.innerHTML = `<div class="adm-top"><div><h1>Productos</h1><p data-sub></p></div>
    <div class="adm-actions"><a class="btn btn--ghost btn--sm" href="#/stock">Cargar stock</a><button class="btn btn--primary btn--sm" type="button" data-new>Nuevo producto</button></div></div>
  <div class="toolbar">
    <input class="inp grow" type="search" placeholder="Buscar por nombre, marca o SKU" data-f="q">
    <select class="sel" style="max-width:240px" data-f="cat"><option value="">Todas las categorías</option></select>
    <select class="sel" style="max-width:170px" data-f="state"><option value="active">Activos</option><option value="inactive">Inactivos</option><option value="">Todos</option></select>
    <select class="sel" style="max-width:170px" data-f="stock"><option value="">Todo el stock</option><option value="out">Sin stock</option><option value="low">Stock bajo</option><option value="in">Con stock</option></select>
  </div>
  <div data-list><p class="empty">Cargando…</p></div>`
  const list = $('[data-list]', view)

  const paint = () => {
    const term = f.q.trim().toLowerCase()
    const rows = all.filter((p) => {
      if (f.state === 'active' && !p.active) return false
      if (f.state === 'inactive' && p.active) return false
      if (f.cat && p.category !== f.cat) return false
      const s = stockOf(p)
      if (f.stock === 'out' && s > 0) return false
      if (f.stock === 'in' && s <= 0) return false
      if (f.stock === 'low' && !(s > 0 && s <= (p.low_stock_threshold ?? 3))) return false
      return !term || [p.name, p.brand, p.sku, p.slug].some((v) => String(v || '').toLowerCase().includes(term))
    })
    $('[data-sub]', view).textContent = `${rows.length} de ${all.length} productos`
    list.innerHTML = rows.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>Producto</th><th class="hide-sm">Categoría</th><th class="num">Precio</th><th>Stock</th><th>Estado</th></tr></thead><tbody>
      ${rows.map((p) => `<tr class="is-click" data-id="${p.id}"><td><img class="thumb" src="${esc(p.img_url || '/img/logo.webp')}" alt="" loading="lazy"></td>
        <td class="name"><strong>${esc(p.name)}</strong><span>${esc(p.brand || 'Sin marca')}${p.product_variants?.length ? ` · ${p.product_variants.length} variantes` : ''}${p.featured ? ' · ★ destacado' : ''}</span></td>
        <td class="hide-sm">${esc(p.category || '—')}</td>
        <td class="num">${clp(p.price)}${p.original_price > p.price ? `<br><small class="muted"><s>${clp(p.original_price)}</s></small>` : ''}</td>
        <td>${stockPill(p)}</td>
        <td>${p.active ? '<span class="pill pill--ok">Activo</span>' : '<span class="pill">Inactivo</span>'}</td></tr>`).join('')}
      </tbody></table></div>` : '<p class="empty">No hay productos con estos filtros.</p>'
  }
  const load = async () => {
    all = await api('/api/admin/catalog')
    const cats = [...new Set(all.map((p) => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'))
    const sel = $('[data-f="cat"]', view)
    const keep = sel.value
    sel.innerHTML = '<option value="">Todas las categorías</option>' + cats.map((c) => `<option${c === keep ? ' selected' : ''}>${esc(c)}</option>`).join('')
    paint()
    return cats
  }

  for (const el of $$('[data-f]', view)) {
    el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', debounce(() => { f[el.dataset.f] = el.value; paint() }, 120))
  }
  let cats = await load()
  const reload = async () => { cats = await load() }
  list.addEventListener('click', (e) => {
    const tr = e.target.closest('[data-id]')
    if (tr) openEditor(all.find((p) => p.id === Number(tr.dataset.id)), cats, reload)
  })
  $('[data-new]', view).addEventListener('click', () => openEditor(null, cats, reload))
  if (location.hash.includes('nuevo')) { history.replaceState(null, '', '#/productos'); openEditor(null, cats, reload) }
}

function galleryHtml(urls) {
  return urls.map((u, i) => `<div class="gal__item" data-i="${i}">${i === 0 ? '<span class="gal__main">Principal</span>' : ''}<img src="${esc(u)}" alt="">
    <div class="gal__tools"><button type="button" data-g="left" aria-label="Mover a la izquierda">◀</button><button type="button" data-g="main" aria-label="Usar como principal" title="Usar como principal">★</button><button type="button" data-g="del" aria-label="Quitar">✕</button><button type="button" data-g="right" aria-label="Mover a la derecha">▶</button></div></div>`).join('')
    + '<label class="gal__add">+ Subir fotos<br><small>JPG, PNG o WEBP</small><input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden data-upload></label>'
}
const specRow = (s = {}) => `<div class="row row--spec"><input class="inp inp--sm" placeholder="Característica (ej. Conexión)" value="${esc(s.label || '')}" data-k="label"><input class="inp inp--sm" placeholder="Valor (ej. Bluetooth 5.0)" value="${esc(s.value || '')}" data-k="value"><button class="icon-btn" type="button" data-del-row aria-label="Quitar">${ICONS.trash}</button></div>`
const varRow = (v = {}) => `<div class="row row--var" data-vid="${esc(v.id || '')}">
  <input class="inp inp--sm" placeholder="Nombre (ej. Negro)" value="${esc(v.label || '')}" data-k="label" aria-label="Nombre de la variante">
  <input class="inp inp--sm" type="number" min="0" placeholder="Precio" value="${v.price ?? ''}" data-k="price" aria-label="Precio de la variante">
  <input class="inp inp--sm" type="number" min="0" placeholder="Antes" value="${v.original_price ?? ''}" data-k="original_price" aria-label="Precio anterior">
  <input class="inp inp--sm" type="number" min="0" placeholder="Stock" value="${v.stock ?? 0}" data-k="stock" aria-label="Stock de la variante">
  <label class="chk"><input type="checkbox" data-k="active"${v.active === false ? '' : ' checked'}> Activa</label>
  ${v.id ? '<span></span>' : `<button class="icon-btn" type="button" data-del-row aria-label="Quitar">${ICONS.trash}</button>`}</div>`

function openEditor(p, cats, onSaved) {
  const isNew = !p
  p = p || { active: true, gallery: [], specs: [], product_variants: [], low_stock_threshold: 3 }
  let gallery = [...new Set([...(p.gallery || []), ...(p.img_url && !(p.gallery || []).includes(p.img_url) ? [p.img_url] : [])])]
  const variants = p.product_variants || []
  const d = drawer(isNew ? 'Nuevo producto' : 'Editar producto')
  d.body.innerHTML = `<form class="form-grid form-grid--2" data-form novalidate>
    <label class="fld fld--full"><span>Nombre *</span><input class="inp" name="name" required value="${esc(p.name || '')}"></label>
    <label class="fld"><span>URL del producto (slug)</span><input class="inp" name="slug" value="${esc(p.slug || '')}" placeholder="se genera del nombre"><small>/producto/<b data-slug-prev>${esc(p.slug || '')}</b></small></label>
    <label class="fld"><span>Categoría *</span><input class="inp" name="category" list="cats" required value="${esc(p.category || '')}"><datalist id="cats">${cats.map((c) => `<option value="${esc(c)}">`).join('')}</datalist></label>
    <label class="fld"><span>Marca</span><input class="inp" name="brand" value="${esc(p.brand || '')}"></label>
    <label class="fld"><span>Etiqueta</span><select class="sel" name="badge">${BADGES.map(([v, l]) => `<option value="${v}"${(p.badge || '') === v ? ' selected' : ''}>${l}</option>`).join('')}</select></label>
    <label class="fld"><span>Precio (CLP, IVA incluido) *</span><input class="inp" type="number" min="0" name="price" required value="${p.price ?? ''}"></label>
    <label class="fld"><span>Precio anterior (tachado)</span><input class="inp" type="number" min="0" name="original_price" value="${p.original_price ?? ''}"><small>Déjalo vacío si no está en oferta.</small></label>
    ${variants.length ? '<div class="fld"><span>Stock</span><small>Este producto tiene variantes: el stock se carga en cada variante (abajo).</small></div>'
      : `<label class="fld"><span>Stock</span><input class="inp" type="number" min="0" name="stock" value="${p.stock ?? 0}"></label>`}
    <label class="fld"><span>Avisar stock bajo desde</span><input class="inp" type="number" min="0" name="low_stock_threshold" value="${p.low_stock_threshold ?? 3}"></label>
    <label class="fld fld--full"><span>Descripción corta</span><input class="inp" name="short_description" maxlength="200" value="${esc(p.short_description || '')}"><small>Aparece en la tarjeta y bajo el título. Una frase.</small></label>
    <label class="fld fld--full"><span>Descripción</span><textarea class="txt" name="description" rows="5">${esc(p.description || '')}</textarea></label>
    <label class="fld"><span>Garantía</span><input class="inp" name="warranty" value="${esc(p.warranty || '')}" placeholder="Ej. 6 meses de garantía legal"></label>
    <label class="fld"><span>SKU</span><input class="inp" name="sku" value="${esc(p.sku || '')}"></label>
    <label class="fld"><span>Código de barras (GTIN/EAN)</span><input class="inp" name="gtin" value="${esc(p.gtin || '')}"><small>Ayuda en Google Merchant Center.</small></label>
    <label class="fld"><span>Orden (menor = primero)</span><input class="inp" type="number" name="sort_order" value="${p.sort_order ?? ''}"></label>
    <div class="fld fld--full" style="flex-direction:row;gap:1.5rem;flex-wrap:wrap">
      <label class="chk"><input type="checkbox" name="active"${p.active ? ' checked' : ''}> Activo (visible en la tienda)</label>
      <label class="chk"><input type="checkbox" name="featured"${p.featured ? ' checked' : ''}> Destacado en el inicio</label>
    </div>
  </form>
  <section class="form-sec"><h3>Fotos</h3><p class="muted small">La primera es la foto principal. Usa fotos cuadradas con fondo blanco.</p><div class="gal" data-gal>${galleryHtml(gallery)}</div></section>
  <section class="form-sec"><h3>Ficha técnica</h3><div class="rows" data-specs>${(p.specs || []).map(specRow).join('')}</div><button class="btn btn--ghost btn--sm" type="button" data-add-spec style="margin-top:.6rem">+ Agregar característica</button></section>
  <section class="form-sec"><h3>Variantes</h3><p class="muted small">Colores, largos o modelos de un mismo producto. Si una variante no tiene precio propio, usa el del producto. Para ocultarla, desmárcala.</p>
    <div class="rows" data-vars>${variants.map(varRow).join('')}</div>
    <div class="toolbar" style="margin-top:.6rem"><button class="btn btn--ghost btn--sm" type="button" data-add-var>+ Agregar variante</button>
    <label class="fld" style="max-width:200px"><span>Tipo de variante</span><input class="inp inp--sm" data-kind value="${esc(variants[0]?.kind || 'Color')}"></label></div></section>
  <p class="err" data-err hidden></p>`
  d.setFoot(`${!isNew && p.slug ? `<a class="btn btn--ghost btn--sm" href="/producto/${esc(p.slug)}" target="_blank" rel="noopener">Ver en la tienda ↗</a>` : ''}<button class="btn btn--primary btn--sm" type="button" data-save>${isNew ? 'Crear producto' : 'Guardar cambios'}</button>`)

  const form = $('[data-form]', d.body)
  const galEl = $('[data-gal]', d.body)
  const paintGal = () => { galEl.innerHTML = galleryHtml(gallery) }
  form.name.addEventListener('input', () => { if (isNew && !form.slug.dataset.touched) form.slug.value = slugify(form.name.value); $('[data-slug-prev]', d.body).textContent = form.slug.value })
  form.slug.addEventListener('input', () => { form.slug.dataset.touched = '1'; $('[data-slug-prev]', d.body).textContent = form.slug.value })

  galEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-g]')
    if (!b) return
    const i = Number(b.closest('[data-i]').dataset.i)
    const act = b.dataset.g
    if (act === 'del') gallery.splice(i, 1)
    if (act === 'main') gallery.unshift(...gallery.splice(i, 1))
    if (act === 'left' && i > 0) [gallery[i - 1], gallery[i]] = [gallery[i], gallery[i - 1]]
    if (act === 'right' && i < gallery.length - 1) [gallery[i + 1], gallery[i]] = [gallery[i], gallery[i + 1]]
    paintGal()
  })
  galEl.addEventListener('change', async (e) => {
    if (!e.target.matches('[data-upload]')) return
    const files = [...e.target.files]
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) { toast(`${file.name}: supera 5 MB`, { type: 'error' }); continue }
      toast(`Subiendo ${file.name}…`)
      const r = await run(async () => api('/api/admin/upload-image', { method: 'POST', body: { data: await fileToBase64(file), name: file.name, type: file.type } }))
      if (r?.url) { gallery.push(r.url); paintGal() }
    }
  })
  d.body.addEventListener('click', (e) => {
    if (e.target.closest('[data-add-spec]')) $('[data-specs]', d.body).insertAdjacentHTML('beforeend', specRow())
    if (e.target.closest('[data-add-var]')) $('[data-vars]', d.body).insertAdjacentHTML('beforeend', varRow())
    const del = e.target.closest('[data-del-row]')
    if (del) del.closest('.row').remove()
  })

  $('[data-save]', d.foot).addEventListener('click', async (e) => {
    const err = $('[data-err]', d.body)
    err.hidden = true
    const body = formData(form)
    body.slug = slugify(body.slug || body.name)
    if (!body.name.trim() || !body.category.trim() || body.price === '') {
      err.textContent = 'Completa nombre, categoría y precio.'
      err.hidden = false
      return
    }
    body.gallery = gallery
    body.img_url = gallery[0] || null
    body.specs = $$('[data-specs] .row', d.body).map((r) => ({ label: $('[data-k="label"]', r).value.trim(), value: $('[data-k="value"]', r).value.trim() })).filter((s) => s.label && s.value)
    const btn = e.currentTarget
    btn.disabled = true
    try {
      const saved = isNew
        ? await api('/api/admin/products', { method: 'POST', body })
        : await api(`/api/admin/products/${p.id}`, { method: 'PUT', body })
      // Variantes: crea las nuevas y actualiza las existentes
      const kind = $('[data-kind]', d.body).value.trim() || 'Color'
      const rows = $$('[data-vars] .row', d.body)
      for (const [i, r] of rows.entries()) {
        const v = { kind, sort_order: i }
        for (const k of ['label', 'price', 'original_price', 'stock']) v[k] = $(`[data-k="${k}"]`, r).value
        v.active = $('[data-k="active"]', r).checked
        if (!v.label.trim()) continue
        if (r.dataset.vid) await api(`/api/admin/variants/${r.dataset.vid}`, { method: 'PUT', body: v })
        else await api(`/api/admin/products/${saved.id}/variants`, { method: 'POST', body: v })
      }
      toast(isNew ? 'Producto creado' : 'Cambios guardados')
      d.close()
      await onSaved()
    } catch (ex) {
      err.textContent = ex.message
      err.hidden = false
      err.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } finally {
      btn.disabled = false
    }
  })
}
