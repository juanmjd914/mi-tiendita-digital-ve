// Resultados instantáneos bajo los buscadores (<input data-suggest>): mientras se escribe muestra
// hasta 6 productos con foto, marca y precio, y "Ver todos los resultados". Enter sin elegir
// envía el formulario normal (/tienda?search=…). Flechas, Enter y Esc funcionan con teclado.
import { clp, esc } from '../core/ui.js'

const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms) } }

function attach(input) {
  const form = input.form
  const host = input.parentElement
  host.classList.add('suggest-host')
  const box = document.createElement('div')
  box.className = 'suggest'
  box.id = `${input.id || 'q'}-suggest`
  box.setAttribute('role', 'listbox')
  box.hidden = true
  host.append(box)
  input.setAttribute('role', 'combobox')
  input.setAttribute('aria-autocomplete', 'list')
  input.setAttribute('aria-controls', box.id)
  input.setAttribute('aria-expanded', 'false')

  let active = -1
  let lastQ = ''
  let ctrl = null
  const options = () => [...box.querySelectorAll('[role="option"]')]
  const close = () => { box.hidden = true; active = -1; input.setAttribute('aria-expanded', 'false') }
  const open = () => { box.hidden = false; input.setAttribute('aria-expanded', 'true') }
  const highlight = (i) => {
    const opts = options()
    active = (i + opts.length) % opts.length
    opts.forEach((o, n) => o.classList.toggle('is-active', n === active))
    opts[active]?.scrollIntoView({ block: 'nearest' })
  }
  const allUrl = (q) => `/tienda?search=${encodeURIComponent(q)}`

  const search = debounce(async (q) => {
    if (q.length < 2) { close(); return }
    ctrl?.abort()
    ctrl = new AbortController()
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
      const { total, items } = await r.json()
      if (input.value.trim() !== q) return
      lastQ = q
      box.innerHTML = items.length
        ? items.map((p) => `<a class="suggest__item" role="option" href="${esc(p.url)}">
            <img src="${esc(p.img || '/img/logo.webp')}" alt="" width="48" height="48" loading="lazy">
            <span class="suggest__info"><small>${esc(p.brand || p.category || '')}</small><strong>${esc(p.name)}</strong></span>
            <span class="suggest__price">${p.original_price ? `<s>${clp(p.original_price)}</s>` : ''}<b>${clp(p.price)}</b>${p.out ? '<em>Agotado</em>' : ''}</span>
          </a>`).join('') + `<a class="suggest__all" role="option" href="${esc(allUrl(q))}">Ver todos los resultados (${total}) →</a>`
        : `<p class="suggest__empty">No encontramos productos para "<strong>${esc(q)}</strong>". Prueba con otra palabra o revisa la <a href="/tienda">tienda completa</a>.</p>`
      active = -1
      open()
    } catch (err) {
      if (err.name !== 'AbortError') close()
    }
  }, 180)

  input.addEventListener('input', () => search(input.value.trim()))
  input.addEventListener('focus', () => { if (input.value.trim().length >= 2 && box.innerHTML && input.value.trim() === lastQ) open() })
  input.addEventListener('keydown', (e) => {
    if (box.hidden) return
    if (e.key === 'ArrowDown') { e.preventDefault(); highlight(active + 1) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); highlight(active - 1) }
    else if (e.key === 'Escape') { close() }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); location.href = options()[active].href }
  })
  // Enter sin elegir: búsqueda completa (el formulario ya apunta a /tienda?search=)
  form?.addEventListener('submit', (e) => {
    const q = input.value.trim()
    if (!q && form.action.endsWith('/tienda') && !form.querySelector('[name="orden"]')) { e.preventDefault(); location.href = '/tienda' }
  })
  document.addEventListener('click', (e) => { if (!host.contains(e.target)) close() })
}

document.querySelectorAll('input[data-suggest]').forEach(attach)
