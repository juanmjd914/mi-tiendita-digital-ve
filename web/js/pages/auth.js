import { sb, getSession, authErrorEs } from '../core/auth.js'
import { syncWishlist } from '../core/wishlist-sync.js'
import { $, $$ } from '../core/ui.js'
import { mountCaptcha } from '../core/captcha.js'

const form = $('[data-auth]')
const kind = form?.dataset.auth
const params = new URLSearchParams(location.search)
const safeNext = (n) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/cuenta')
const next = safeNext(params.get('next'))

// Mantener ?next= al cambiar entre login y registro
$$('[data-keep-next]').forEach((a) => { if (params.get('next')) a.href += `?next=${encodeURIComponent(next)}` })

// Mostrar / ocultar contraseña
$$('[data-eye]').forEach((b) => b.addEventListener('click', () => {
  const input = b.parentElement.querySelector('input')
  const show = input.type === 'password'
  input.type = show ? 'text' : 'password'
  b.setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña')
  b.classList.toggle('is-on', show)
}))

// Medidor de seguridad
function strength(pw) {
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return Math.min(4, s)
}
const LABELS = ['Muy débil', 'Débil', 'Aceptable', 'Buena', 'Excelente']
$$('[data-strength]').forEach((input) => input.addEventListener('input', () => {
  const s = strength(input.value)
  const bar = $('[data-strength-bar]')
  bar.dataset.level = String(s)
  bar.querySelector('span').style.width = `${(s / 4) * 100}%`
  const txt = $('[data-strength-text]')
  if (txt) txt.textContent = input.value ? `Seguridad: ${LABELS[s]}` : 'Mínimo 8 caracteres. Mezcla letras, números y símbolos.'
}))

const err = (m) => { const e = $('[data-error]'); e.textContent = m; e.hidden = !m }
const ok = (m) => { const e = $('[data-ok]'); if (e) { e.textContent = m; e.hidden = !m } }
const busy = (on) => { const b = form.querySelector('[type="submit"]'); b.disabled = on; b.classList.toggle('is-loading', on) }
const val = (n) => form.elements[n]?.value.trim() || ''
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)

if (kind === 'registro' && params.get('email')) form.elements.email.value = params.get('email')

// Anti-bots (Cloudflare Turnstile) en login, registro y recuperar contraseña
const captcha = await mountCaptcha(form?.querySelector('[data-captcha]'))

// Si ya hay sesión, login y registro no tienen sentido
if (kind === 'login' || kind === 'registro') {
  getSession().then((s) => { if (s) location.replace(next) })
}

form?.addEventListener('submit', async (e) => {
  e.preventDefault()
  err('')
  try {
    busy(true)
    if (kind === 'login') {
      if (!validEmail(val('email'))) throw new Error('Ingresa un correo válido.')
      const { data, error } = await sb.auth.signInWithPassword({ email: val('email'), password: form.elements.password.value, options: { captchaToken: await captcha.token() } })
      if (error) throw new Error(authErrorEs(error))
      await syncWishlist(data.user.id).catch(() => {})
      location.replace(next)
    }
    if (kind === 'registro') {
      if (!val('firstName') || !val('lastName')) throw new Error('Ingresa tu nombre y apellido.')
      if (!validEmail(val('email'))) throw new Error('Ingresa un correo válido.')
      if (form.elements.password.value.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.')
      if (!form.elements.terms.checked) throw new Error('Debes aceptar los Términos y Condiciones y la Política de Privacidad.')
      const { data, error } = await sb.auth.signUp({
        email: val('email'),
        password: form.elements.password.value,
        options: {
          emailRedirectTo: `${location.origin}/cuenta`,
          captchaToken: await captcha.token(),
          data: { first_name: val('firstName'), last_name: val('lastName'), marketing_opt_in: form.elements.optin.checked },
        },
      })
      if (error) throw new Error(authErrorEs(error))
      if (form.elements.optin.checked) fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: val('email') }) }).catch(() => {})
      if (data.session) { await syncWishlist(data.user.id).catch(() => {}); location.replace(next); return }
      form.innerHTML = `<div class="form-ok">Te enviamos un correo a <strong>${val('email').replace(/</g, '&lt;')}</strong>. Confirma tu cuenta con el enlace y luego inicia sesión.</div>`
    }
    if (kind === 'recuperar') {
      if (!validEmail(val('email'))) throw new Error('Ingresa un correo válido.')
      const { error } = await sb.auth.resetPasswordForEmail(val('email'), { redirectTo: `${location.origin}/cuenta/nueva-password`, captchaToken: await captcha.token() })
      if (error) throw new Error(authErrorEs(error))
      ok('Si el correo está registrado, te llegará un enlace para crear una nueva contraseña. Revisa también la carpeta de spam.')
    }
    if (kind === 'nueva') {
      const p1 = form.elements.password.value
      if (p1.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.')
      if (p1 !== form.elements.password2.value) throw new Error('Las contraseñas no coinciden.')
      const s = await getSession()
      if (!s) throw new Error('El enlace expiró o ya fue usado. Solicita uno nuevo desde "¿Olvidaste tu contraseña?".')
      const { error } = await sb.auth.updateUser({ password: p1 })
      if (error) throw new Error(authErrorEs(error))
      location.replace('/cuenta?clave=actualizada')
    }
  } catch (ex) {
    err(ex.message)
  } finally {
    busy(false)
    captcha.reset() // cada token sirve una sola vez
  }
})
