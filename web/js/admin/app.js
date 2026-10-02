// Panel admin: login, estructura y navegación por hash (#/seccion).
import { api, session, esc, $, toast } from './lib.js'

const SECTIONS = [
  ['resumen', 'Resumen', '<path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z"/>'],
  ['pedidos', 'Pedidos', '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0"/>'],
  ['productos', 'Productos', '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.3 7 12 12l8.7-5M12 22V12"/>'],
  ['stock', 'Stock', '<path d="M4 20h16M6 16V9M10 16V5M14 16v-6M18 16V8"/>'],
  ['resenas', 'Reseñas', '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>'],
  ['cupones', 'Cupones', '<path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8zM7 7h.01"/>'],
  ['clientes', 'Clientes', '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>'],
  ['reportes', 'Reportes', '<path d="M3 3v18h18M7 14l4-4 4 4 5-6"/>'],
  ['ajustes', 'Ajustes', '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'],
]
const svg = (p) => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`
const app = $('#app')
const views = {}

function renderLogin() {
  app.className = ''
  app.innerHTML = `<main class="adm-login">
  <form class="adm-login__card" data-login>
    <div class="adm-login__brand"><img src="/img/logo.webp" alt=""><div><strong>Mi Tiendita Digital Ve</strong><span>Panel de administración</span></div></div>
    <h1>Iniciar sesión</h1>
    <div class="form-grid">
      <label class="fld"><span>Usuario</span><input class="inp" name="username" autocomplete="username" required></label>
      <label class="fld"><span>Contraseña</span><input class="inp" name="password" type="password" autocomplete="current-password" required></label>
      <p class="err" data-err hidden></p>
      <button class="btn btn--primary btn--block" type="submit">Entrar</button>
    </div>
  </form></main>`
  const form = $('[data-login]')
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const err = $('[data-err]', form)
    err.hidden = true
    const btn = $('button', form)
    btn.disabled = true
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username.value, password: form.password.value }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'No se pudo iniciar sesión')
      session.set(json.token, json.user)
      if (location.hash === '#/resumen') route()
      else location.hash = '#/resumen'
    } catch (ex) {
      err.textContent = ex.message
      err.hidden = false
    } finally {
      btn.disabled = false
    }
  })
  form.username.focus()
}

function renderShell() {
  app.className = 'adm-shell'
  app.innerHTML = `<aside class="adm-side">
    <a class="adm-side__brand" href="#/resumen"><img src="/img/logo.webp" alt=""><div><strong>Mi Tiendita</strong><span>Panel de administración</span></div></a>
    <nav class="adm-nav" aria-label="Secciones">${SECTIONS.map(([id, label, icon]) =>
      `<a href="#/${id}" data-nav="${id}">${svg(icon)}<span>${label}</span>${id === 'resenas' || id === 'pedidos' ? `<b class="count" data-count="${id}" hidden></b>` : ''}</a>`).join('')}
      <a href="#/salir" class="adm-nav__out" data-logout>${svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>')}<span>Salir</span></a>
    </nav>
    <div class="adm-side__foot"><span>Sesión: <strong>${esc(session.user)}</strong></span><a href="/" target="_blank" rel="noopener">Ver tienda ↗</a></div>
  </aside>
  <main class="adm-main" id="view" tabindex="-1"></main>`
  $('[data-logout]').addEventListener('click', async (e) => {
    e.preventDefault()
    await fetch('/api/admin/logout', { method: 'POST', headers: { 'x-admin-token': session.token || '' } }).catch(() => {})
    session.clear()
    location.hash = '#/login'
  })
}

export function setCount(id, n) {
  const el = document.querySelector(`[data-count="${id}"]`)
  if (!el) return
  el.textContent = n
  el.hidden = !n
}

async function refreshCounts() {
  try {
    const o = await api('/api/admin/overview')
    setCount('pedidos', o.needsAction)
    setCount('resenas', o.pendingReviews)
    return o
  } catch { return null }
}

let current = null
async function route() {
  const name = (location.hash.replace(/^#\/?/, '').split('?')[0]) || 'resumen'
  if (!session.token || name === 'login') return renderLogin()
  if (!app.classList.contains('adm-shell')) {
    // Valida que la sesión siga viva antes de pintar el panel
    try { await api('/api/admin/me') } catch { return renderLogin() }
    renderShell()
    refreshCounts()
  }
  const id = SECTIONS.some(([s]) => s === name) ? name : 'resumen'
  for (const a of document.querySelectorAll('[data-nav]')) {
    if (a.dataset.nav === id) a.setAttribute('aria-current', 'page')
    else a.removeAttribute('aria-current')
  }
  const view = $('#view')
  // Cada navegación pinta en un contenedor nuevo: si el usuario cambia de sección
  // antes de que termine la carga, la vista anterior queda en un nodo desconectado.
  const box = document.createElement('div')
  box.innerHTML = '<p class="empty">Cargando…</p>'
  view.replaceChildren(box)
  current = id
  try {
    if (!views[id]) views[id] = await import(`./views/${id}.js`)
    if (current !== id) return
    await views[id].render(box, { refreshCounts })
    view.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  } catch (err) {
    box.innerHTML = `<p class="err">${esc(err.message)}</p>`
    if (!/sesión/i.test(err.message)) toast(err.message, { type: 'error' })
  }
}

window.addEventListener('hashchange', route)
route()
