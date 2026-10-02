const ICON_OK = '<svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>'
const ICON_ERR = '<svg class="icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>'

export function toast(message, { type = 'ok', ms = 2800 } = {}) {
  const region = document.querySelector('[data-toasts]')
  if (!region) return
  const el = document.createElement('div')
  el.className = `toast${type === 'error' ? ' toast--error' : ''}`
  el.innerHTML = type === 'error' ? ICON_ERR : ICON_OK
  const span = document.createElement('span')
  span.textContent = message
  el.append(span)
  region.append(el)
  setTimeout(() => el.remove(), ms)
}

export const clp = (n) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(Number(n) || 0)

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

export const $ = (sel, root = document) => root.querySelector(sel)
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)]
