// Cloudflare Turnstile para los formularios de cuenta (login, registro, recuperar, cambiar contraseña).
// La clave pública llega en <meta name="turnstile-site-key">. Supabase Auth valida el token
// (captchaToken) cuando el CAPTCHA está activado en el panel de Supabase; mientras no lo esté,
// el token se envía igual y Supabase lo ignora.
const KEY = document.querySelector('meta[name="turnstile-site-key"]')?.content || ''
let loader = null

function loadScript() {
  loader ||= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.onload = () => resolve(window.turnstile)
    s.onerror = () => { loader = null; reject(new Error('No se pudo cargar la verificación anti-bots. Revisa tu conexión.')) }
    document.head.append(s)
  })
  return loader
}

/** Monta el recuadro en `container`. Devuelve { token(), reset() }; sin clave configurada no hace nada. */
export async function mountCaptcha(container) {
  const noop = { token: async () => undefined, reset() {} }
  if (!KEY || !container) return noop
  let ts
  try { ts = await loadScript() } catch { return noop }
  let current = null
  let waiting = []
  const id = ts.render(container, {
    sitekey: KEY,
    language: 'es',
    theme: 'dark',
    callback: (t) => { current = t; waiting.splice(0).forEach((w) => w.resolve(t)) },
    'expired-callback': () => { current = null },
    'error-callback': () => { current = null },
  })
  return {
    /** Espera el token (hasta 20 s). Cada token sirve una sola vez: llamar reset() después de usarlo. */
    token() {
      if (current) return Promise.resolve(current)
      return new Promise((resolve, reject) => {
        const w = { resolve }
        waiting.push(w)
        setTimeout(() => {
          waiting = waiting.filter((x) => x !== w)
          reject(new Error('Completa la verificación anti-bots y vuelve a intentarlo.'))
        }, 20000)
      })
    },
    reset() { current = null; try { ts.reset(id) } catch { /* widget ya removido */ } },
  }
}
