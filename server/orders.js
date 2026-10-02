// Creación de pedidos: valida carrito, precios, variantes y stock contra la base (nunca
// confía en el navegador), aplica cupón y envío, y guarda el pedido con sus ítems.
import supabase from './supabase.js'
import { computeShipping } from './shipping.js'
import { computeCouponDiscount } from './coupons.js'
import { getSettings } from './settings.js'

export class OrderError extends Error {}

const clean = (v, max = 160) => {
  const s = String(v ?? '').replace(/\s+/g, ' ').trim()
  return s ? s.slice(0, max) : null
}
export const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''))

// RUT chileno: módulo 11. Devuelve formato 12.345.678-5 o null si no es válido.
export function formatRut(raw) {
  const s = String(raw || '').replace(/[^0-9kK]/g, '').toUpperCase()
  if (s.length < 2) return null
  const body = s.slice(0, -1)
  const dv = s.slice(-1)
  let sum = 0
  let mul = 2
  for (let i = body.length - 1; i >= 0; i--) {
    sum += Number(body[i]) * mul
    mul = mul === 7 ? 2 : mul + 1
  }
  const res = 11 - (sum % 11)
  const expected = res === 11 ? '0' : res === 10 ? 'K' : String(res)
  if (dv !== expected) return null
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`
}

// Cantidad entera entre 1 y 99; cualquier otro valor (negativo, 0, decimal, texto) rechaza el pedido.
function validQty(raw) {
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 1 || n > 99) throw new OrderError('Cantidad inválida en el carrito. Actualiza la página e inténtalo de nuevo.')
  return n
}

/** items: [{ id, variantId?, qty }] (acepta también `quantity` del formato anterior). */
export async function buildValidatedItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw new OrderError('Tu carrito está vacío')
  if (items.length > 60) throw new OrderError('Demasiados productos en un solo pedido')

  const wanted = items.map((i) => ({
    id: Number(i.id),
    variantId: i.variantId == null ? null : Number(i.variantId),
    qty: validQty(i.qty ?? i.quantity),
  }))
  const ids = [...new Set(wanted.map((w) => w.id))]
  const vids = [...new Set(wanted.map((w) => w.variantId).filter(Boolean))]

  const { data: products, error } = await supabase.from('products').select('id, name, price, stock, active').in('id', ids)
  if (error) throw error
  const { data: variants, error: vErr } = vids.length
    ? await supabase.from('product_variants').select('id, product_id, label, price, stock, active').in('id', vids)
    : { data: [], error: null }
  if (vErr) throw vErr
  const { data: hasVariants } = await supabase.from('product_variants').select('product_id').in('product_id', ids).eq('active', true)
  const withVariants = new Set((hasVariants || []).map((v) => v.product_id))

  const pMap = new Map(products.map((p) => [p.id, p]))
  const vMap = new Map(variants.map((v) => [v.id, v]))
  const validated = []
  for (const w of wanted) {
    const p = pMap.get(w.id)
    if (!p || p.active === false) throw new OrderError('Uno de los productos ya no está disponible')
    let v = null
    if (w.variantId) {
      v = vMap.get(w.variantId)
      if (!v || v.product_id !== p.id || v.active === false) throw new OrderError(`La opción elegida de "${p.name}" ya no está disponible`)
    } else if (withVariants.has(p.id)) {
      throw new OrderError(`Elige una opción para "${p.name}"`)
    }
    const stock = v ? v.stock : p.stock
    if ((stock ?? 0) < w.qty) throw new OrderError(`Sin stock suficiente para "${p.name}${v ? ` (${v.label})` : ''}". Disponible: ${stock ?? 0}`)
    validated.push({
      product_id: p.id,
      variant_id: v ? v.id : null,
      variant_label: v ? v.label : null,
      name: v ? `${p.name} (${v.label})` : p.name,
      price: v?.price ?? p.price,
      quantity: w.qty,
    })
  }
  const subtotal = validated.reduce((s, i) => s + i.price * i.quantity, 0)
  return { validated, subtotal }
}

/**
 * Crea el pedido. paymentMethod: 'flow' | 'transfer' | 'cod'.
 * Devuelve { order, items, total, shipping }.
 */
export async function createOrder(body, { paymentMethod, userId = null }) {
  const email = clean(body.email, 120)
  if (!isValidEmail(email)) throw new OrderError('Ingresa un correo válido')
  if (!body.acceptTerms) throw new OrderError('Debes aceptar los Términos y Condiciones para comprar')

  const firstName = clean(body.firstName, 60)
  const lastName = clean(body.lastName, 60)
  const name = clean(body.customerName, 120) || [firstName, lastName].filter(Boolean).join(' ') || null
  if (!name) throw new OrderError('Ingresa tu nombre')
  const phone = clean(body.phone ?? body.customerPhone, 30)
  if (!phone || String(phone).replace(/\D/g, '').length < 8) throw new OrderError('Ingresa un teléfono válido')
  const rut = body.rut ? formatRut(body.rut) : null
  if (body.rut && !rut) throw new OrderError('El RUT ingresado no es válido')

  const method = ['pickup', 'local', 'regions'].includes(body.deliveryMethod) ? body.deliveryMethod : 'local'
  const settings = await getSettings()
  if (method === 'pickup' && settings.pickup_enabled === false) throw new OrderError('El retiro en local no está disponible')

  const addr = {
    region: clean(body.region, 80), comuna: clean(body.comuna, 80), street: clean(body.street, 120),
    number: clean(body.number, 20), apartment: clean(body.apartment, 40), reference: clean(body.reference, 160),
  }
  if (method === 'local') addr.comuna = addr.comuna || settings.local_city || 'Rancagua'
  if (method !== 'pickup' && (!addr.region || !addr.comuna || !addr.street || !addr.number)) {
    throw new OrderError('Completa la dirección de despacho (región, comuna, calle y número)')
  }

  if (paymentMethod === 'cod') {
    if (settings.cod_enabled === false) throw new OrderError('El pago contra entrega no está disponible')
    if (method !== 'local') throw new OrderError(`El pago contra entrega solo está disponible con delivery en ${settings.local_city || 'Rancagua'}`)
  }

  const { validated, subtotal } = await buildValidatedItems(body.items)
  const { discountAmount, finalTotal: afterCoupon, couponCode } = await computeCouponDiscount(clean(body.couponCode, 40), subtotal)
  const shipping = await computeShipping(method, addr.comuna, afterCoupon)
  if (method === 'local' && !shipping.isLocal) throw new OrderError(`El delivery local es solo para ${settings.local_city || 'Rancagua'}; elige envío a regiones`)
  const total = afterCoupon + shipping.shippingCost

  const fullAddress = method === 'pickup'
    ? `Retiro en local (${settings.store_address || settings.local_city})`
    : [`${addr.street} ${addr.number}`, addr.apartment, addr.comuna, addr.region, addr.reference && `Ref: ${addr.reference}`].filter(Boolean).join(', ')

  const status = paymentMethod === 'flow' ? 'pending' : paymentMethod === 'transfer' ? 'pending_transfer' : 'pending_cod'
  const { data: order, error: orderErr } = await supabase.from('orders').insert({
    status,
    payment_method: paymentMethod,
    delivery_method: shipping.deliveryMethod,
    shipping_cost: shipping.shippingCost,
    total,
    customer_email: email,
    customer_name: name,
    customer_phone: phone,
    customer_address: fullAddress,
    customer_rut: rut,
    customer_region: method === 'pickup' ? null : addr.region,
    customer_comuna: method === 'pickup' ? null : addr.comuna,
    customer_street: method === 'pickup' ? null : addr.street,
    customer_number: method === 'pickup' ? null : addr.number,
    customer_apartment: method === 'pickup' ? null : addr.apartment,
    customer_reference: method === 'pickup' ? null : addr.reference,
    terms_accepted_at: new Date().toISOString(),
    user_id: userId,
    coupon_code: couponCode,
    discount_amount: discountAmount,
  }).select().single()
  if (orderErr) throw orderErr

  const items = validated.map((i) => ({ order_id: order.id, ...i }))
  const { error: itemsErr } = await supabase.from('order_items').insert(items)
  if (itemsErr) {
    await supabase.from('orders').update({ status: 'cancelled', admin_notes: `Error al guardar ítems: ${itemsErr.message}` }).eq('id', order.id)
    throw itemsErr
  }
  return { order, items, total, shipping }
}
