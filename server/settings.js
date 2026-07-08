/**
 * Configuración de la tienda (tabla store_settings, fila única id=1).
 * Saca del código los datos bancarios, costos de envío y contacto.
 *
 * getSettings() cachea la fila unos segundos para no golpear la base en cada
 * request. Si la tabla aún no existe (migración 003 no aplicada), devuelve los
 * DEFAULTS — así el sitio no se rompe durante el deploy.
 */
import supabase from './supabase.js'

// Valores por defecto = los que estaban hardcodeados antes (fallback pre-migración).
export const DEFAULTS = {
  bank_name:             'Banco Falabella',
  bank_account_type:     'Cuenta Corriente',
  bank_account_number:   '1-982-273710-0',
  bank_holder:           'Juan Carlos Mejias',
  bank_rut:              '27.012.143-8',
  delivery_cost_rancagua: 0,
  shipping_flat_regions:  0,
  pickup_enabled:         true,
  cod_enabled:            true,
  local_city:            'Rancagua',
  store_address:         'Rancagua, Región de O\'Higgins',
  contact_email:         'soporte@mitienditadigitalve.com',
  contact_whatsapp:      '56946216579',
}

let cache = null
let cacheAt = 0
const TTL_MS = 15 * 1000

/** Lee la configuración (cacheada). Nunca lanza: cae a DEFAULTS si algo falla. */
export async function getSettings() {
  if (cache && Date.now() - cacheAt < TTL_MS) return cache
  try {
    const { data, error } = await supabase.from('store_settings').select('*').eq('id', 1).maybeSingle()
    if (error || !data) { cache = { ...DEFAULTS }; cacheAt = Date.now(); return cache }
    cache = { ...DEFAULTS, ...data }
    cacheAt = Date.now()
    return cache
  } catch {
    return { ...DEFAULTS }
  }
}

// Solo estos campos se pueden actualizar desde el panel (whitelist).
const EDITABLE = [
  'bank_name', 'bank_account_type', 'bank_account_number', 'bank_holder', 'bank_rut',
  'delivery_cost_rancagua', 'shipping_flat_regions', 'pickup_enabled', 'cod_enabled',
  'local_city', 'store_address', 'contact_email', 'contact_whatsapp',
]
const INT_FIELDS  = ['delivery_cost_rancagua', 'shipping_flat_regions']
const BOOL_FIELDS = ['pickup_enabled', 'cod_enabled']

/** Actualiza la configuración (whitelist + saneo). Invalida la caché. */
export async function updateSettings(patch) {
  const clean = {}
  for (const k of EDITABLE) {
    if (!(k in patch)) continue
    if (INT_FIELDS.includes(k))       clean[k] = Math.max(0, Math.trunc(Number(patch[k]) || 0))
    else if (BOOL_FIELDS.includes(k)) clean[k] = Boolean(patch[k])
    else                              clean[k] = patch[k] == null ? null : String(patch[k]).trim()
  }
  clean.updated_at = new Date().toISOString()
  const { data, error } = await supabase
    .from('store_settings').update(clean).eq('id', 1).select().single()
  if (error) throw error
  cache = { ...DEFAULTS, ...data }
  cacheAt = Date.now()
  return cache
}

/** Devuelve solo los datos bancarios (para el email y la pantalla de éxito). */
export async function getBankDetails() {
  const s = await getSettings()
  return {
    bank_name:           s.bank_name,
    bank_account_type:   s.bank_account_type,
    bank_account_number: s.bank_account_number,
    bank_holder:         s.bank_holder,
    bank_rut:            s.bank_rut,
    contact_whatsapp:    s.contact_whatsapp,
  }
}
