/**
 * Autenticación del panel admin — usuario + contraseña + token de sesión.
 * Reemplaza el PIN único estático. Mismo patrón que la web oficial de Techne.
 *
 * Env var:  ADMIN_USERS="usuario1:clave1|usuario2:clave2"
 * (Sin caracteres shell-especiales $ * ! # @ en las claves si se guarda en Hostinger.)
 *
 * Las sesiones viven en memoria (se pierden al reiniciar el proceso, lo cual es
 * aceptable: el admin simplemente vuelve a iniciar sesión). Cada token expira a las 12h.
 */
import crypto from 'crypto'

const SESSION_TTL_MS = 12 * 60 * 60 * 1000 // 12 horas
const sessions = new Map() // token -> { user, expiresAt }

// Parsea ADMIN_USERS una sola vez al cargar el módulo.
function loadUsers() {
  const raw = process.env.ADMIN_USERS || ''
  const map = new Map()
  for (const pair of raw.split('|')) {
    const idx = pair.indexOf(':')
    if (idx === -1) continue
    const user = pair.slice(0, idx).trim()
    const pass = pair.slice(idx + 1) // la clave puede contener ':'
    if (user) map.set(user, pass)
  }
  return map
}
const USERS = loadUsers()

// Compat: si aún existe ADMIN_PIN (mientras se migra), se acepta como usuario "admin".
if (USERS.size === 0 && process.env.ADMIN_PIN) {
  USERS.set('admin', process.env.ADMIN_PIN)
}

// Comparación en tiempo constante para no filtrar la clave por timing.
function safeEqual(a, b) {
  const ba = Buffer.from(String(a))
  const bb = Buffer.from(String(b))
  if (ba.length !== bb.length) return false
  return crypto.timingSafeEqual(ba, bb)
}

/** Verifica credenciales y devuelve un token de sesión, o null si son inválidas. */
export function login(username, password) {
  const stored = USERS.get(String(username || '').trim())
  if (stored === undefined) return null
  if (!safeEqual(stored, password || '')) return null

  const token = crypto.randomBytes(32).toString('hex')
  sessions.set(token, { user: username, expiresAt: Date.now() + SESSION_TTL_MS })
  return token
}

/** Middleware Express: exige un token de sesión válido en x-admin-token. */
export function requireAuth(req, res, next) {
  const token = req.headers['x-admin-token']
  if (!token) return res.status(401).json({ error: 'No autenticado' })

  const s = sessions.get(token)
  if (!s || s.expiresAt < Date.now()) {
    sessions.delete(token)
    return res.status(401).json({ error: 'Sesión expirada' })
  }
  req.adminUser = s.user
  next()
}

/** Cierra la sesión de un token (logout). */
export function logout(token) {
  sessions.delete(token)
}

/** Cantidad de usuarios configurados (para el health check / diagnóstico). */
export function adminUserCount() {
  return USERS.size
}

// Limpieza periódica de sesiones expiradas (evita fuga de memoria).
setInterval(() => {
  const now = Date.now()
  for (const [token, s] of sessions) if (s.expiresAt < now) sessions.delete(token)
}, 60 * 60 * 1000).unref()
