// API de Mi Cuenta: pedidos del cliente y reseñas (verificadas contra sus compras).
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { createClient } from '@supabase/supabase-js'
import supabase from '../supabase.js'
import { getCatalog } from '../catalog-cache.js'
import { orderNumber } from './api-orders.js'

const router = Router()
const authClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
const reviewLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false })
const PAID = ['paid', 'pending_cod']

async function userFrom(req, res) {
  const token = req.headers.authorization?.replace('Bearer ', '').trim()
  if (!token) { res.status(401).json({ error: 'Debes iniciar sesión' }); return null }
  const { data: { user } = {}, error } = await authClient.auth.getUser(token)
  if (error || !user) { res.status(401).json({ error: 'Tu sesión expiró. Inicia sesión de nuevo.' }); return null }
  return user
}

// Filtro por usuario o por correo (escapando comodines de ILIKE y separadores de PostgREST).
const ownerFilter = (user) => {
  const email = user.email.replace(/[,()]/g, '').replace(/[%_\\]/g, (c) => '\\' + c)
  return `user_id.eq.${user.id},customer_email.ilike.${email}`
}

const thumbOf = (p, v) => (v?.img_url || p?.img_url || '/img/logo.webp').replace(/(\/img\/productos\/.+)\.webp$/, '$1-400.webp')

router.get('/api/account/orders', async (req, res) => {
  try {
    const user = await userFrom(req, res)
    if (!user) return
    const { data, error } = await supabase
      .from('orders')
      .select('id, order_number, status, payment_method, delivery_method, total, shipping_cost, discount_amount, coupon_code, customer_address, created_at, paid_at, preparing_at, shipped_at, delivered_at, fulfillment_status, tracking_code, order_items(product_id, variant_id, name, price, quantity)')
      .or(ownerFilter(user))
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) throw error
    const catalog = await getCatalog()
    const byId = new Map(catalog.map((p) => [p.id, p]))
    const { data: mine } = await supabase.from('product_reviews').select('product_id, status, rating').eq('user_id', user.id)
    const reviewed = new Map((mine || []).map((r) => [r.product_id, r]))
    res.json((data || []).filter((o) => o.status !== 'cancelled' || o.paid_at).map((o) => ({
      id: o.id,
      number: orderNumber(o),
      status: o.status,
      paymentMethod: o.payment_method,
      deliveryMethod: o.delivery_method,
      total: o.total, shipping: o.shipping_cost || 0, discount: o.discount_amount || 0, coupon: o.coupon_code,
      address: o.customer_address,
      tracking: o.tracking_code,
      fulfillment: o.fulfillment_status,
      dates: { created: o.created_at, paid: o.paid_at, preparing: o.preparing_at, shipped: o.shipped_at, delivered: o.delivered_at },
      items: (o.order_items || []).map((i) => {
        const p = byId.get(i.product_id)
        const v = p?.variants?.find((x) => x.id === i.variant_id)
        return {
          productId: i.product_id, name: i.name, qty: i.quantity, price: i.price, slug: p?.slug || null, img: thumbOf(p, v),
          canReview: Boolean(p) && PAID.includes(o.status) && !reviewed.has(i.product_id),
          review: reviewed.get(i.product_id) || null,
        }
      }),
    })))
  } catch (err) {
    console.error('/api/account/orders:', err.message)
    res.status(500).json({ error: 'No pudimos cargar tus pedidos' })
  }
})

router.post('/api/reviews', reviewLimiter, async (req, res) => {
  try {
    const user = await userFrom(req, res)
    if (!user) return
    const productId = Number(req.body?.productId)
    const rating = Math.trunc(Number(req.body?.rating))
    const comment = String(req.body?.comment || '').trim().slice(0, 2000)
    if (!productId || rating < 1 || rating > 5) return res.status(400).json({ error: 'Elige una calificación de 1 a 5 estrellas' })

    // Debe existir un pedido pagado (o contra entrega) del cliente que incluya el producto.
    const { data: orders } = await supabase
      .from('orders')
      .select('id, status, order_items!inner(product_id)')
      .or(ownerFilter(user))
      .in('status', PAID)
      .eq('order_items.product_id', productId)
      .limit(1)
    if (!orders?.length) return res.status(403).json({ error: 'Solo puedes opinar sobre productos que compraste' })

    const { data: profile } = await supabase.from('customer_profiles').select('first_name, last_name').eq('user_id', user.id).maybeSingle()
    const author = profile?.first_name ? `${profile.first_name} ${(profile.last_name || '').charAt(0)}${profile.last_name ? '.' : ''}`.trim() : 'Cliente verificado'
    const { error } = await supabase.from('product_reviews').insert({
      product_id: productId, user_id: user.id, order_id: orders[0].id, rating, comment: comment || null, author_display: author, status: 'pending',
    })
    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Ya dejaste una opinión para este producto' })
      throw error
    }
    res.json({ ok: true, message: '¡Gracias! Tu opinión se publicará una vez revisada.' })
  } catch (err) {
    console.error('/api/reviews:', err.message)
    res.status(500).json({ error: 'No pudimos guardar tu opinión' })
  }
})

export default router
