import { api, run, esc, debounce, $, $$ } from '../lib.js'

// Carga rápida de stock: una fila por producto (o por variante) con un campo numérico.
export async function render(view) {
  let all = await api('/api/admin/catalog')
  const dirty = new Map() // key "product:12" | "variant:uuid" → stock
  const f = { q: '', cat: '', only: '' }
  const cats = [...new Set(all.map((p) => p.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'))

  view.innerHTML = `<div class="adm-top"><div><h1>Stock</h1><p>Escribe la cantidad disponible y guarda todos los cambios juntos.</p></div></div>
  <div class="toolbar">
    <input class="inp grow" type="search" placeholder="Buscar producto" data-f="q">
    <select class="sel" style="max-width:240px" data-f="cat"><option value="">Todas las categorías</option>${cats.map((c) => `<option>${esc(c)}</option>`).join('')}</select>
    <select class="sel" style="max-width:190px" data-f="only"><option value="">Todos</option><option value="zero">Solo sin stock</option></select>
  </div>
  <div data-list></div>
  <div class="savebar" data-bar hidden><span><strong data-n>0</strong> cambios sin guardar</span><div class="adm-actions"><button class="btn btn--ghost btn--sm" type="button" data-undo>Descartar</button><button class="btn btn--primary btn--sm" type="button" data-save>Guardar stock</button></div></div>`
  const list = $('[data-list]', view)
  const bar = $('[data-bar]', view)

  const rowsFor = (p) => {
    const vs = (p.product_variants || []).filter((v) => v.active)
    if (!vs.length) return [{ key: `product:${p.id}`, kind: 'product', id: p.id, name: p.name, sub: p.category, img: p.img_url, stock: p.stock || 0, variant: false }]
    return [
      { header: true, name: p.name, sub: `${p.category} · ${vs.length} variantes`, img: p.img_url },
      ...vs.map((v) => ({ key: `variant:${v.id}`, kind: 'variant', id: v.id, name: v.label, sub: v.kind, img: v.img_url || p.img_url, stock: v.stock || 0, variant: true })),
    ]
  }
  const paint = () => {
    const term = f.q.trim().toLowerCase()
    const products = all.filter((p) => p.active && (!f.cat || p.category === f.cat) && (!term || p.name.toLowerCase().includes(term)))
    const isZero = (r) => (dirty.has(r.key) ? Number(dirty.get(r.key)) : r.stock) <= 0
    const rows = products.flatMap((p) => {
      const group = rowsFor(p)
      if (f.only !== 'zero') return group
      const items = group.filter((r) => !r.header && isZero(r))
      if (!items.length) return []
      return group[0].header ? [group[0], ...items] : items
    })
    list.innerHTML = rows.length ? `<div class="tbl-wrap"><table class="tbl"><thead><tr><th></th><th>Producto</th><th class="num">Stock</th></tr></thead><tbody>
      ${rows.map((r) => r.header
        ? `<tr><td><img class="thumb" src="${esc(r.img || '/img/logo.webp')}" alt="" loading="lazy"></td><td class="name" colspan="2"><strong>${esc(r.name)}</strong><span>${esc(r.sub)}</span></td></tr>`
        : `<tr class="${r.variant ? 'is-variant' : ''}${dirty.has(r.key) ? ' is-dirty' : ''}" data-row="${esc(r.key)}"><td>${r.variant ? '' : `<img class="thumb" src="${esc(r.img || '/img/logo.webp')}" alt="" loading="lazy">`}</td>
          <td class="name"><strong>${esc(r.name)}</strong><span>${esc(r.sub || '')}</span></td>
          <td class="num"><input class="inp inp--sm inp--num" type="number" min="0" inputmode="numeric" value="${dirty.has(r.key) ? esc(dirty.get(r.key)) : r.stock}" data-key="${esc(r.key)}" data-orig="${r.stock}" aria-label="Stock de ${esc(r.name)}"></td></tr>`).join('')}
      </tbody></table></div>` : '<p class="empty">No hay productos con estos filtros.</p>'
  }
  const sync = () => {
    $('[data-n]', view).textContent = dirty.size
    bar.hidden = dirty.size === 0
  }

  for (const el of $$('[data-f]', view)) el.addEventListener(el.tagName === 'INPUT' ? 'input' : 'change', debounce(() => { f[el.dataset.f] = el.value; paint() }, 120))
  list.addEventListener('input', (e) => {
    const inp = e.target.closest('[data-key]')
    if (!inp) return
    const v = inp.value === '' ? '' : String(Math.max(0, Math.trunc(Number(inp.value) || 0)))
    if (v === inp.dataset.orig || v === '') dirty.delete(inp.dataset.key)
    else dirty.set(inp.dataset.key, v)
    inp.closest('tr').classList.toggle('is-dirty', dirty.has(inp.dataset.key))
    sync()
  })
  // Enter baja al siguiente campo (carga rápida con teclado)
  list.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || !e.target.matches('[data-key]')) return
    e.preventDefault()
    const inputs = $$('[data-key]', list)
    inputs[inputs.indexOf(e.target) + 1]?.focus()
    inputs[inputs.indexOf(e.target) + 1]?.select()
  })
  $('[data-undo]', view).addEventListener('click', () => { dirty.clear(); paint(); sync() })
  $('[data-save]', view).addEventListener('click', async (e) => {
    const btn = e.currentTarget
    btn.disabled = true
    const items = [...dirty].map(([key, stock]) => { const [kind, id] = key.split(':'); return { kind, id, stock: Number(stock) } })
    const r = await run(() => api('/api/admin/stock/bulk', { method: 'POST', body: { items } }))
    btn.disabled = false
    if (!r) return
    if (r.errors?.length) run(() => { throw new Error(`Algunos cambios no se guardaron: ${r.errors.join('; ')}`) })
    else run(async () => {}, `Stock actualizado (${r.updated})`)
    dirty.clear()
    all = await api('/api/admin/catalog')
    paint()
    sync()
  })
  window.addEventListener('beforeunload', (e) => { if (dirty.size) e.preventDefault() })
  paint()
}
