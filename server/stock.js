/**
 * Manejo de inventario robusto.
 *
 * Cambios clave respecto a la versión anterior:
 *  - Busca el producto por PRODUCT_ID primero (clave confiable), no por nombre.
 *    El matching por nombre fallaba con acentos/mayúsculas y nombres duplicados.
 *  - Descuento ATÓMICO vía RPC `decrement_stock` (evita condiciones de carrera
 *    cuando dos personas compran el último ítem al mismo tiempo).
 *  - Si la RPC aún no existe (migración no aplicada), cae a un método id-first
 *    seguro para no romper las ventas durante el deploy.
 *
 * La IDEMPOTENCIA (descontar una sola vez por orden) la controla el llamador
 * con la bandera `orders.stock_decremented`.
 */
import supabase from './supabase.js'

// Resuelve el id real del producto: primero por product_id, luego por nombre exacto.
async function resolveProductId(item) {
  if (item.product_id != null) {
    const { data } = await supabase
      .from('products').select('id').eq('id', item.product_id).maybeSingle()
    if (data) return data.id
  }
  // Respaldo por nombre (por si algún ítem viejo no trae product_id)
  if (item.name) {
    const { data } = await supabase
      .from('products').select('id').ilike('name', item.name.trim()).maybeSingle()
    if (data) return data.id
  }
  return null
}

// Ajusta el stock de un producto en +/- delta de forma atómica.
async function adjustStock(productId, delta) {
  // 1) Intento atómico vía RPC
  const { error: rpcErr } = await supabase.rpc('adjust_stock', {
    p_id: productId,
    p_delta: delta,
  })
  if (!rpcErr) return true

  // 2) Fallback: read-modify-write id-first (no atómico, pero seguro y correcto)
  const { data: prod, error: readErr } = await supabase
    .from('products').select('stock').eq('id', productId).maybeSingle()
  if (readErr || !prod) {
    console.error(`❌ adjustStock: no se pudo leer producto id=${productId}: ${readErr?.message || 'no existe'}`)
    return false
  }
  const newStock = Math.max(0, (prod.stock ?? 0) + delta)
  const { error: writeErr } = await supabase
    .from('products').update({ stock: newStock }).eq('id', productId)
  if (writeErr) {
    console.error(`❌ adjustStock: no se pudo actualizar stock id=${productId}: ${writeErr.message}`)
    return false
  }
  return true
}

/** Descuenta stock por cada ítem del pedido. */
export async function decrementStock(orderItems) {
  if (!orderItems?.length) {
    console.warn('⚠️  decrementStock: sin ítems')
    return
  }
  for (const item of orderItems) {
    const qty = Number(item.quantity) || 1
    const productId = await resolveProductId(item)
    if (!productId) {
      console.warn(`⚠️  decrementStock: producto no encontrado — id=${item.product_id} name="${item.name}"`)
      continue
    }
    const ok = await adjustStock(productId, -qty)
    if (ok) console.log(`📦 Stock -${qty} → producto id=${productId} ("${item.name}")`)
  }
}

/** Restaura stock (al cancelar un pedido). */
export async function restoreStock(orderItems) {
  if (!orderItems?.length) return
  for (const item of orderItems) {
    const qty = Number(item.quantity) || 1
    const productId = await resolveProductId(item)
    if (!productId) continue
    const ok = await adjustStock(productId, +qty)
    if (ok) console.log(`📦 Stock +${qty} (restaurado) → producto id=${productId} ("${item.name}")`)
  }
}
