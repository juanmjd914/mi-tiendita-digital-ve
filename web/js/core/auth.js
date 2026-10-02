// Sesión del cliente con Supabase Auth (clave pública "anon"; los permisos los da RLS).
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.106.1/+esm'

const meta = (n) => document.querySelector(`meta[name="${n}"]`)?.content || ''
export const sb = createClient(meta('supabase-url'), meta('supabase-anon-key'), {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: 'mtd_auth' },
})

let session = null
const ready = sb.auth.getSession().then(({ data }) => { session = data.session; return session })
sb.auth.onAuthStateChange((_event, s) => {
  session = s
  window.dispatchEvent(new CustomEvent('auth:change', { detail: s }))
})

export const getSession = () => ready.then(() => session)
export const currentUser = () => session?.user || null

// Para módulos que no importan este archivo (checkout, gracias)
window.mtdAuth = { accessToken: () => session?.access_token || null, ready }

export async function authFetch(url, opts = {}) {
  await ready
  const headers = { ...(opts.headers || {}) }
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`
  return fetch(url, { ...opts, headers })
}

// Redirige al login si no hay sesión (para páginas de Mi Cuenta).
export async function requireSession() {
  const s = await getSession()
  if (!s) {
    location.replace(`/cuenta/login?next=${encodeURIComponent(location.pathname + location.search)}`)
    return new Promise(() => {})
  }
  return s
}

// Mensajes de error de Supabase Auth en español.
export function authErrorEs(err) {
  const m = String(err?.message || err || '')
  if (/Invalid login credentials/i.test(m)) return 'Correo o contraseña incorrectos.'
  if (/Email not confirmed/i.test(m)) return 'Debes confirmar tu correo. Revisa tu bandeja de entrada.'
  if (/already registered|already been registered/i.test(m)) return 'Ya existe una cuenta con este correo. Inicia sesión o recupera tu contraseña.'
  if (/Password should be at least/i.test(m)) return 'La contraseña debe tener al menos 8 caracteres.'
  if (/rate limit|too many/i.test(m)) return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
  if (/captcha/i.test(m)) return 'No pudimos verificar que no eres un robot. Inténtalo de nuevo.'
  if (/same password|different from the old/i.test(m)) return 'La nueva contraseña debe ser distinta a la actual.'
  return 'Ocurrió un error. Inténtalo de nuevo.'
}
