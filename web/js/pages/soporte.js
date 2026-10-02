import { $ } from '../core/ui.js'

async function post(url, data) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'Ocurrió un error. Inténtalo de nuevo.')
  return json
}

const support = $('[data-support]')
support.addEventListener('submit', async (e) => {
  e.preventDefault()
  const err = support.querySelector('[data-error]')
  const ok = support.querySelector('[data-ok]')
  err.hidden = true
  const btn = support.querySelector('[type="submit"]')
  btn.disabled = true
  try {
    const data = Object.fromEntries(new FormData(support))
    const r = await post('/api/support', data)
    support.reset()
    ok.innerHTML = `<strong>¡Solicitud recibida!</strong> Registramos tu consulta con el código <strong>${r.ticket}</strong>. Te responderemos por correo a la brevedad.`
    ok.hidden = false
  } catch (ex) {
    err.textContent = ex.message
    err.hidden = false
  } finally {
    btn.disabled = false
  }
})

const track = $('[data-track]')
track.addEventListener('submit', async (e) => {
  e.preventDefault()
  const err = track.querySelector('[data-error]')
  err.hidden = true
  try {
    const r = await post('/api/support/track', { number: track.elements.number.value, email: track.elements.email.value })
    location.href = r.url
  } catch (ex) {
    err.textContent = ex.message
    err.hidden = false
  }
})
