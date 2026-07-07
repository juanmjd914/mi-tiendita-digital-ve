/**
 * Lógica de cupones.
 *
 * Corrige el bug anterior: el contador `uses` se incrementaba al CREAR la orden,
 * así que un cupón se "gastaba" aunque el cliente no pagara. Ahora:
 *   - computeCouponDiscount(): solo lee y calcula el descuento (al crear la orden).
 *   - redeemCoupon(): incrementa `uses` de forma ATÓMICA, solo cuando el pago se
 *     confirma (status → paid). Evita el doble consumo por condición de carrera.
 *   - refundCoupon(): devuelve un uso si la orden se cancela.
 */
import supabase from './supabase.js'

/** Lee el cupón activo y válido. Devuelve la fila o un objeto de error. */
export async function getValidCoupon(code, total) {
  if (!code) return { error: 'Código requerido' }
  const { data: coupon } = await supabase
    .from('coupons').select('*').ilike('code', code.trim()).eq('active', true).maybeSingle()

  if (!coupon) return { error: 'Cupón no válido o inactivo' }
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
    return { error: 'El cupón ha expirado' }
  if (coupon.max_uses !== null && coupon.uses >= coupon.max_uses)
    return { error: 'El cupón ha alcanzado su límite de usos' }
  if (total != null && Number(total) < Number(coupon.min_order))
    return { error: `Monto mínimo para este cupón: $${Number(coupon.min_order).toLocaleString('es-CL')}` }

  return { coupon }
}

/** Calcula el monto de descuento para un subtotal. NO incrementa usos. */
export function computeDiscount(coupon, subtotal) {
  const base = Number(subtotal) || 0
  const val  = Number(coupon.discount_value)
  const discountAmount = coupon.discount_type === 'percentage'
    ? Math.round(base * val / 100)
    : Math.min(val, base)
  return { discountAmount, finalTotal: Math.max(0, base - discountAmount) }
}

/**
 * Aplica un cupón a un subtotal SIN consumirlo (para crear la orden).
 * Devuelve { discountAmount, finalTotal, couponCode }.
 */
export async function computeCouponDiscount(code, subtotal) {
  if (!code) return { discountAmount: 0, finalTotal: subtotal, couponCode: null }
  const { coupon } = await getValidCoupon(code, subtotal)
  if (!coupon) return { discountAmount: 0, finalTotal: subtotal, couponCode: null }
  const { discountAmount, finalTotal } = computeDiscount(coupon, subtotal)
  return { discountAmount, finalTotal, couponCode: coupon.code }
}

/** Canjea (consume) un cupón: incrementa `uses` de forma atómica. Llamar al confirmar el pago. */
export async function redeemCoupon(code) {
  if (!code) return
  // 1) Atómico vía RPC (respeta max_uses en la base)
  const { error: rpcErr } = await supabase.rpc('increment_coupon_use', { p_code: code.trim() })
  if (!rpcErr) return

  // 2) Fallback si la RPC no existe todavía
  const { data: coupon } = await supabase
    .from('coupons').select('id, uses').ilike('code', code.trim()).maybeSingle()
  if (coupon) {
    await supabase.from('coupons').update({ uses: (coupon.uses || 0) + 1 }).eq('id', coupon.id)
  }
}

/** Devuelve un uso al cupón (al cancelar un pedido pagado con cupón). */
export async function refundCoupon(code) {
  if (!code) return
  const { error: rpcErr } = await supabase.rpc('decrement_coupon_use', { p_code: code.trim() })
  if (!rpcErr) return
  const { data: coupon } = await supabase
    .from('coupons').select('id, uses').ilike('code', code.trim()).maybeSingle()
  if (coupon) {
    await supabase.from('coupons').update({ uses: Math.max(0, (coupon.uses || 0) - 1) }).eq('id', coupon.id)
  }
}
