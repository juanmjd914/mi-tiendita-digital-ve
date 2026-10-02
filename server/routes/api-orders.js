// Resumen de un pedido para la página de Gracias (sirve también a compradores invitados).
// La llave es el UUID del pedido (no adivinable); solo pedidos de los últimos 30 días.
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import supabase from '../supabase.js'
import { getCatalog } from '../catalog-cache.js'
import { getSettings } from '../settings.js'

const router = Router()
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false })
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// N° visible del pedido: AAAAMMDD-N (migración 008); respaldo con el inicio del UUID
export const orderNumber = (o) => o?.order_number || String(o?.id || '').slice(0, 8).toUpperCase()

router.get('/api/order/:id/summary', limiter, async (req, res) => {
  try {
    if (!UUID.test(req.params.id)) return res.status(404).json({ error: 'Pedido no encontrado' })
    const { data: o, error } = await supabase
      .from('orders')
      .select('id, order_number, status, payment_method, delivery_method, shipping_cost, discount_amount, coupon_code, total, customer_name, customer_email, customer_phone, customer_address, customer_comuna, created_at, paid_at, fulfillment_status, tracking_code, order_items(product_id, variant_id, name, price, quantity)')
      .eq('id', req.params.id)
      .maybeSingle()
    if (error || !o) return res.status(404).json({ error: 'Pedido no encontrado' })
    if (Date.now() - new Date(o.created_at).getTime() > 30 * 24 * 3600 * 1000) return res.status(404).json({ error: 'Pedido no encontrado' })

    const catalog = await getCatalog()
    const byId = new Map(catalog.map((p) => [p.id, p]))
    const settings = await getSettings()
    const items = (o.order_items || []).map((i) => {
      const p = byId.get(i.product_id)
      const v = p?.variants?.find((x) => x.id === i.variant_id)
      return { id: i.product_id, category: p?.category || null, brand: p?.brand || null, variant: v?.label || null, name: i.name, qty: i.quantity, price: i.price, lineTotal: i.price * i.quantity, slug: p?.slug || null, img: (v?.img_url || p?.img_url || '/img/logo.webp').replace(/(\/img\/productos\/.+)\.webp$/, '$1-400.webp') }
    })
    const subtotal = items.reduce((n, i) => n + i.lineTotal, 0)
    res.json({
      id: o.id,
      number: orderNumber(o),
      status: o.status,
      paymentMethod: o.payment_method,
      deliveryMethod: o.delivery_method,
      isLocal: (o.customer_comuna || '').toLowerCase().includes(String(settings.local_city || 'rancagua').toLowerCase()),
      createdAt: o.created_at,
      paidAt: o.paid_at,
      fulfillment: o.fulfillment_status,
      tracking: o.tracking_code,
      customer: { name: o.customer_name, email: o.customer_email, phone: o.customer_phone, address: o.customer_address },
      items, subtotal,
      discount: o.discount_amount || 0, coupon: o.coupon_code,
      shipping: o.shipping_cost || 0,
      total: o.total,
      store: { address: settings.store_address, city: settings.local_city, whatsapp: settings.contact_whatsapp, email: settings.contact_email },
    })
  } catch (err) {
    console.error('/api/order/summary:', err.message)
    res.status(500).json({ error: 'No pudimos cargar el pedido' })
  }
})

export default router
