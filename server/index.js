import 'dotenv/config'
import express    from 'express'
import cors       from 'cors'
import path       from 'path'
import fs         from 'fs'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import supabase   from './supabase.js'
import { createPayment, getPaymentStatus, verifySignature, sign } from './flow.js'
import { sendOrderConfirmation, sendTransferInstructions } from './email.js'

// Cliente anon — solo para verificar JWTs de usuarios
const authClient = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

process.on('uncaughtException',  (err) => { console.error('❌ UNCAUGHT:', err.message); process.exit(1) })
process.on('unhandledRejection', (r)   => { console.error('❌ REJECTION:', r) })

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const isProd    = process.env.NODE_ENV === 'production'
const PORT      = Number(process.env.PORT) || 3001

const app = express()

app.use(cors({
  origin: isProd
    ? ['https://mitienditadigitalve.com', 'https://www.mitienditadigitalve.com']
    : ['http://localhost:5174', 'http://localhost:5175'],
}))
app.use(express.json({ limit: '10mb' }))        // 10mb para imágenes en base64
app.use(express.urlencoded({ extended: true })) // requerido para webhooks de Flow

if (isProd) {
  // index:false → el catch-all sirve index.html con meta tags inyectados por ruta
  app.use(express.static(path.join(__dirname, '..', 'dist'), { index: false }))
}

// ── Admin PIN middleware ──────────────────────────────────────────
function requirePin(req, res, next) {
  const auth = req.headers['x-admin-pin'] || req.query.pin
  if (!auth || auth !== process.env.ADMIN_PIN) {
    return res.status(401).json({ error: 'PIN incorrecto' })
  }
  next()
}

// ── Helper: descuenta stock tras pago confirmado ──────────────────
async function decrementStock(orderItems) {
  if (!orderItems?.length) {
    console.warn('⚠️  decrementStock: orderItems vacío o nulo')
    return
  }
  console.log(`📦 decrementStock: procesando ${orderItems.length} ítem(s)`)

  for (const item of orderItems) {
    let product   = null
    let productId = null

    // 1. Buscar por nombre PRIMERO (más confiable — IDs del home pueden no coincidir)
    if (item.name) {
      const { data, error } = await supabase
        .from('products')
        .select('id, stock')
        .ilike('name', item.name.trim())
        .maybeSingle()
      if (error) console.warn(`⚠️  Búsqueda por nombre falló: ${error.message}`)
      if (data)  { product = data; productId = data.id }
    }

    // 2. Fallback: buscar por product_id si no encontró por nombre
    if (!product && item.product_id) {
      const { data, error } = await supabase
        .from('products')
        .select('id, stock')
        .eq('id', item.product_id)
        .maybeSingle()
      if (error) console.warn(`⚠️  Búsqueda por id falló: ${error.message}`)
      if (data)  { product = data; productId = data.id }
    }

    if (!product) {
      console.warn(`⚠️  decrementStock: producto no encontrado — id=${item.product_id} name="${item.name}"`)
      continue
    }

    const newStock = Math.max(0, (product.stock ?? 0) - (item.quantity || 1))
    const { error: updateErr } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId)

    if (updateErr) {
      console.error(`❌ No se pudo actualizar stock de "${item.name}": ${updateErr.message}`)
    } else {
      console.log(`📦 Stock OK: "${item.name}" ${product.stock} → ${newStock}`)
    }
  }
}

// ── Helper: restaura stock al cancelar un pedido ─────────────────
async function restoreStock(orderItems) {
  if (!orderItems?.length) return
  for (const item of orderItems) {
    let product   = null
    let productId = null

    if (item.name) {
      const { data } = await supabase
        .from('products').select('id, stock')
        .ilike('name', item.name.trim()).maybeSingle()
      if (data) { product = data; productId = data.id }
    }
    if (!product && item.product_id) {
      const { data } = await supabase
        .from('products').select('id, stock')
        .eq('id', item.product_id).maybeSingle()
      if (data) { product = data; productId = data.id }
    }
    if (!product) continue

    const newStock = (product.stock ?? 0) + (item.quantity || 1)
    const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', productId)
    if (!error) console.log(`📦 Stock restaurado: "${item.name}" ${product.stock} → ${newStock}`)
  }
}

// ═══════════════════════════════════════════════════════════════
//  CUPONES
// ═══════════════════════════════════════════════════════════════

// POST /api/coupons/validate — valida un cupón (público)
app.post('/api/coupons/validate', async (req, res) => {
  const { code, total } = req.body
  if (!code) return res.status(400).json({ error: 'Código requerido' })

  const { data: coupon } = await supabase
    .from('coupons').select('*').ilike('code', code.trim()).eq('active', true).maybeSingle()

  if (!coupon) return res.status(404).json({ error: 'Cupón no válido o inactivo' })
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
    return res.status(400).json({ error: 'El cupón ha expirado' })
  if (coupon.max_uses !== null && coupon.uses >= coupon.max_uses)
    return res.status(400).json({ error: 'El cupón ha alcanzado su límite de usos' })
  if (total && Number(total) < Number(coupon.min_order))
    return res.status(400).json({ error: `Monto mínimo para este cupón: $${Number(coupon.min_order).toLocaleString('es-CL')}` })

  const base   = Number(total) || 0
  const val    = Number(coupon.discount_value)
  const discountAmount = coupon.discount_type === 'percentage'
    ? Math.round(base * val / 100)
    : Math.min(val, base)

  res.json({
    valid: true, code: coupon.code.toUpperCase(),
    description: coupon.description,
    discountType: coupon.discount_type, discountValue: val,
    discountAmount, newTotal: Math.max(0, base - discountAmount),
  })
})

// GET /api/admin/coupons
app.get('/api/admin/coupons', requirePin, async (req, res) => {
  const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// POST /api/admin/coupons — crear cupón
app.post('/api/admin/coupons', requirePin, async (req, res) => {
  const { code, description, discount_type, discount_value, min_order, max_uses, expires_at } = req.body
  if (!code?.trim() || !discount_type || !discount_value)
    return res.status(400).json({ error: 'Código, tipo y valor son requeridos' })
  const { data, error } = await supabase.from('coupons').insert({
    code:           code.trim().toUpperCase(),
    description:    description || null,
    discount_type,
    discount_value: Number(discount_value),
    min_order:      Number(min_order) || 0,
    max_uses:       max_uses ? Number(max_uses) : null,
    expires_at:     expires_at || null,
  }).select().single()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

// PUT /api/admin/coupons/:id — actualizar / toggle
app.put('/api/admin/coupons/:id', requirePin, async (req, res) => {
  const { data, error } = await supabase
    .from('coupons').update(req.body).eq('id', req.params.id).select().single()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

// ── Helper interno: aplica cupón y retorna descuento + total final ───────────
async function applyCoupon(code, subtotal) {
  if (!code) return { discountAmount: 0, finalTotal: subtotal, couponData: null }
  const { data: coupon } = await supabase
    .from('coupons').select('*').ilike('code', code.trim()).eq('active', true).maybeSingle()
  if (!coupon) return { discountAmount: 0, finalTotal: subtotal, couponData: null }

  const val    = Number(coupon.discount_value)
  const discount = coupon.discount_type === 'percentage'
    ? Math.round(subtotal * val / 100)
    : Math.min(val, subtotal)
  const finalTotal = Math.max(0, subtotal - discount)

  // Incrementar contador de usos
  await supabase.from('coupons').update({ uses: (coupon.uses || 0) + 1 }).eq('id', coupon.id)

  return { discountAmount: discount, finalTotal, couponData: coupon }
}

// ═══════════════════════════════════════════════════════════════
//  PRODUCTOS
// ═══════════════════════════════════════════════════════════════

// GET /api/products  — todos los productos activos
app.get('/api/products', async (req, res) => {
  try {
    const { category, search } = req.query
    let query = supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('id', { ascending: true })

    if (category) query = query.eq('category', category)
    if (search)   query = query.ilike('name', `%${search}%`)

    const { data, error } = await query
    if (error) throw error
    res.json(data)
  } catch (err) {
    console.error('/api/products error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/products/:id
app.get('/api/products/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', req.params.id)
      .eq('active', true)
      .single()

    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Producto no encontrado' })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ═══════════════════════════════════════════════════════════════
//  PAGOS — FLOW CHILE
// ═══════════════════════════════════════════════════════════════

// POST /api/payment/create — inicia el pago con Flow
app.post('/api/payment/create', async (req, res) => {
  try {
    const { items, email, customerName, customerPhone, customerAddress, couponCode } = req.body

    if (!items?.length) return res.status(400).json({ error: 'Carrito vacío' })
    if (!email)         return res.status(400).json({ error: 'Email requerido' })

    // Verificar stock disponible para cada ítem
    for (const item of items) {
      const { data: product } = await supabase
        .from('products').select('stock').eq('id', item.id).single()
      if (product && (product.stock ?? 999) < (item.quantity || 1)) {
        return res.status(400).json({
          error: `Sin stock suficiente para "${item.name}". Stock disponible: ${product.stock ?? 0}`
        })
      }
    }

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
    const { discountAmount, finalTotal } = await applyCoupon(couponCode, subtotal)
    const subject  = items.length === 1 ? items[0].name.slice(0, 80) : `Mi Tiendita Digital Ve — ${items.length} productos`

    // Crear orden
    const { data: order, error: orderErr } = await supabase
      .from('orders').insert({
        status:           'pending',
        total:            finalTotal,
        customer_email:   email,
        customer_name:    customerName    || null,
        customer_phone:   customerPhone   || null,
        customer_address: customerAddress || null,
        coupon_code:      couponCode      || null,
        discount_amount:  discountAmount,
      }).select().single()

    if (orderErr) throw orderErr

    const orderItems = items.map(i => ({
      order_id: order.id, product_id: i.id,
      name: i.name, price: i.price, quantity: i.quantity,
    }))
    await supabase.from('order_items').insert(orderItems)

    const payment = await createPayment({ orderId: order.id, subject, amount: finalTotal, email })
    await supabase.from('orders').update({ flow_token: payment.token }).eq('id', order.id)

    res.json({ redirectUrl: payment.redirectUrl, orderId: order.id })
  } catch (err) {
    console.error('/api/payment/create error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/payment/confirm — webhook que envía Flow tras el pago
// ⚠️  Flow envía los datos como application/x-www-form-urlencoded
app.post('/api/payment/confirm', async (req, res) => {
  try {
    const params = req.body
    const token  = params.token

    if (!token) {
      console.warn('⚠️  Flow webhook sin token — body:', JSON.stringify(params))
      return res.status(200).send('OK') // 200 para que Flow no siga reintentando
    }

    // Verificar firma — si falla, loguear el detalle pero NO retornar 400.
    // Retornar 400 hace que Flow marque la integración como "con problema" y envíe
    // correos de alerta. El procesamiento real se hace con getPaymentStatus (seguro:
    // nuestra petición a Flow va firmada con HMAC propio), así que la firma del
    // webhook entrante es una capa adicional, no la única.
    if (!verifySignature(params)) {
      const { s, ...rest } = params
      const computed = sign(rest)
      console.warn('⚠️  Firma inválida en webhook Flow', {
        received:  s,
        computed,
        token,
        paramKeys: Object.keys(params),
      })
      // Continúa el procesamiento — el estado se verifica en Flow directamente
    }

    // Consultar estado real del pago (independiente de la firma recibida)
    const status = await getPaymentStatus(token)
    const statusLabel = status.statusLabel  // 'paid' | 'rejected' | 'cancelled' | 'pending'

    // Verificar estado previo para evitar doble descuento de stock
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('status')
      .eq('flow_token', token)
      .single()
    const wasPending = existingOrder?.status === 'pending'

    // Actualizar orden
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({
        status:     statusLabel,
        flow_order: status.flowOrder || null,
      })
      .eq('flow_token', token)
      .select('*, order_items(*)')
      .single()

    if (error) console.error('Supabase update error:', error.message)

    // Enviar email y descontar stock solo si el pago fue exitoso y estaba pendiente
    if (statusLabel === 'paid' && updatedOrder) {
      sendOrderConfirmation({
        order: updatedOrder,
        items: updatedOrder.order_items || [],
      })
      if (wasPending) {
        await decrementStock(updatedOrder.order_items || [])
      }
    }

    res.status(200).send('OK')
  } catch (err) {
    console.error('/api/payment/confirm error:', err.message)
    res.status(500).send('Error interno')
  }
})

// GET /api/payment/status/:token — el frontend consulta el estado
app.get('/api/payment/status/:token', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id, status, total, customer_email, customer_name, created_at, order_items(*)')
      .eq('flow_token', req.params.token)
      .single()

    if (error || !data) return res.status(404).json({ error: 'Orden no encontrada' })

    // Si la orden sigue en 'pending', consultamos el estado real en Flow.
    // Esto es clave para entornos locales donde el webhook no llega.
    if (data.status === 'pending') {
      try {
        const flowStatus = await getPaymentStatus(req.params.token)
        const newStatus  = flowStatus.statusLabel // 'paid' | 'rejected' | 'cancelled' | 'pending'

        if (newStatus !== 'pending') {
          // Actualizar en Supabase
          await supabase
            .from('orders')
            .update({ status: newStatus, flow_order: flowStatus.flowOrder || null })
            .eq('flow_token', req.params.token)

          data.status = newStatus

          // Enviar email y descontar stock (orden estaba en pending, es la primera vez)
          if (newStatus === 'paid') {
            sendOrderConfirmation({ order: data, items: data.order_items || [] })
            await decrementStock(data.order_items || [])
          }
        }
      } catch (flowErr) {
        // No es fatal — devolvemos el status de Supabase
        console.warn('⚠️  Flow status check failed:', flowErr.message)
      }
    }

    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/payment/transfer — crea pedido pendiente de transferencia bancaria
app.post('/api/payment/transfer', async (req, res) => {
  try {
    const { items, email, customerName, customerPhone, customerAddress, couponCode } = req.body

    if (!items?.length) return res.status(400).json({ error: 'Carrito vacío' })
    if (!email)         return res.status(400).json({ error: 'Email requerido' })

    // Verificar stock
    for (const item of items) {
      const { data: product } = await supabase
        .from('products').select('stock').eq('id', item.id).single()
      if (product && (product.stock ?? 999) < (item.quantity || 1)) {
        return res.status(400).json({
          error: `Sin stock suficiente para "${item.name}". Stock disponible: ${product.stock ?? 0}`
        })
      }
    }

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
    const { discountAmount, finalTotal } = await applyCoupon(couponCode, subtotal)

    const { data: order, error: orderErr } = await supabase
      .from('orders').insert({
        status:           'pending_transfer',
        total:            finalTotal,
        customer_email:   email,
        customer_name:    customerName    || null,
        customer_phone:   customerPhone   || null,
        customer_address: customerAddress || null,
        coupon_code:      couponCode      || null,
        discount_amount:  discountAmount,
      }).select().single()

    if (orderErr) throw orderErr

    const orderItems = items.map(i => ({
      order_id: order.id, product_id: i.id,
      name: i.name, price: i.price, quantity: i.quantity,
    }))
    await supabase.from('order_items').insert(orderItems)

    await decrementStock(orderItems)

    try { await sendTransferInstructions({ order, items: orderItems }) } catch (_) { /* ignore */ }

    res.json({ orderId: order.id, total: finalTotal })
  } catch (err) {
    console.error('/api/payment/transfer error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ═══════════════════════════════════════════════════════════════
//  MI CUENTA — pedidos del usuario autenticado
// ═══════════════════════════════════════════════════════════════

// GET /api/my-orders  — requiere Authorization: Bearer <access_token>
app.get('/api/my-orders', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '').trim()
    if (!token) return res.status(401).json({ error: 'Token requerido' })

    // Verificar JWT con Supabase y obtener el email del usuario
    const { data: { user }, error: authErr } = await authClient.auth.getUser(token)
    if (authErr || !user) return res.status(401).json({ error: 'Token inválido o expirado' })

    // Obtener pedidos del usuario por email
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('customer_email', user.email)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json(data || [])
  } catch (err) {
    console.error('/api/my-orders error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ═══════════════════════════════════════════════════════════════
//  NEWSLETTER
// ═══════════════════════════════════════════════════════════════

app.post('/api/newsletter', async (req, res) => {
  try {
    const { email } = req.body
    if (!email?.includes('@')) return res.status(400).json({ error: 'Email inválido' })

    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: email.toLowerCase().trim() })

    // Si ya existe (unique constraint), no es un error grave
    if (error && error.code !== '23505') throw error

    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ═══════════════════════════════════════════════════════════════
//  ADMIN
// ═══════════════════════════════════════════════════════════════

// GET /api/admin/newsletter — lista de suscriptores
app.get('/api/admin/newsletter', requirePin, async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/admin/stats', requirePin, async (_req, res) => {
  try {
    const [{ count: totalOrders }, { data: revenue }, { count: subscribers }] =
      await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'paid'),
        supabase.from('orders').select('total').eq('status', 'paid'),
        supabase.from('newsletter_subscribers').select('*', { count: 'exact', head: true }),
      ])

    const totalRevenue = (revenue || []).reduce((s, o) => s + o.total, 0)
    res.json({ paidOrders: totalOrders, totalRevenue, subscribers })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/admin/orders', requirePin, async (req, res) => {
  try {
    const { status, limit = 50 } = req.query
    let query = supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .limit(Number(limit))

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Admin: Productos ─────────────────────────────────────────────

// GET /api/admin/products — listar todos (con filtros opcionales)
app.get('/api/admin/products', requirePin, async (req, res) => {
  try {
    const { search, category, active } = req.query
    let query = supabase.from('products').select('*').order('id', { ascending: true })
    if (search)            query = query.ilike('name', `%${search}%`)
    if (category)          query = query.eq('category', category)
    if (active !== undefined && active !== '') query = query.eq('active', active === 'true')
    const { data, error } = await query
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/products — crear producto
app.post('/api/admin/products', requirePin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products').insert(req.body).select().single()
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/admin/products/:id — actualizar producto
app.put('/api/admin/products/:id', requirePin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products').update(req.body).eq('id', req.params.id).select().single()
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/admin/products/:id — desactivar (soft delete)
app.delete('/api/admin/products/:id', requirePin, async (req, res) => {
  try {
    const { error } = await supabase
      .from('products').update({ active: false }).eq('id', req.params.id)
    if (error) throw error
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/orders/:id/confirm-transfer — confirma pago por transferencia
app.post('/api/admin/orders/:id/confirm-transfer', requirePin, async (req, res) => {
  try {
    const orderId = req.params.id

    // Obtener orden con items
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single()

    if (fetchErr || !order) return res.status(404).json({ error: 'Orden no encontrada' })
    if (order.status !== 'pending_transfer') {
      return res.status(400).json({ error: 'La orden no está pendiente de transferencia' })
    }

    // Marcar como pagada
    const { data: updated, error: updateErr } = await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', orderId)
      .select('*, order_items(*)')
      .single()

    if (updateErr) throw updateErr

    // Nota: el stock ya fue descontado al crear la orden de transferencia
    // Solo enviamos el email de confirmación de pago recibido
    sendOrderConfirmation({ order: updated, items: updated.order_items || [] })

    res.json({ ok: true, order: updated })
  } catch (err) {
    console.error('/api/admin/orders/:id/confirm-transfer error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/upload-image — sube imagen a Supabase Storage y devuelve URL pública
app.post('/api/admin/upload-image', requirePin, async (req, res) => {
  try {
    const { data: base64Data, name, type } = req.body
    if (!base64Data || !name) return res.status(400).json({ error: 'Datos requeridos' })

    // Validar que sea una imagen
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(type)) return res.status(400).json({ error: 'Solo se permiten imágenes (JPG, PNG, WEBP)' })

    const buffer   = Buffer.from(base64Data, 'base64')
    const ext      = name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('MI TIENDITA DIGITAL VE')
      .upload(filename, buffer, { contentType: type, upsert: false })

    if (uploadErr) throw uploadErr

    const { data: urlData } = supabase.storage
      .from('MI TIENDITA DIGITAL VE')
      .getPublicUrl(filename)

    res.json({ url: urlData.publicUrl })
  } catch (err) {
    console.error('/api/admin/upload-image error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/orders/:id/cancel — cancela un pedido pendiente y restaura stock
app.post('/api/admin/orders/:id/cancel', requirePin, async (req, res) => {
  try {
    const orderId = req.params.id

    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single()

    if (fetchErr || !order) return res.status(404).json({ error: 'Orden no encontrada' })
    if (!['pending_transfer', 'pending'].includes(order.status)) {
      return res.status(400).json({ error: 'Solo se pueden cancelar pedidos pendientes' })
    }

    const { error: updateErr } = await supabase
      .from('orders').update({ status: 'cancelled' }).eq('id', orderId)
    if (updateErr) throw updateErr

    // Solo restaura stock si ya se había descontado (transferencias)
    if (order.status === 'pending_transfer') {
      await restoreStock(order.order_items || [])
    }

    res.json({ ok: true })
  } catch (err) {
    console.error('/api/admin/orders/:id/cancel error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ── Health ────────────────────────────────────────────────────────
app.get('/api/salud', (_req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV, ts: new Date().toISOString() })
})

// POST /pago/resultado — Flow redirige al urlReturn via form POST en algunos flujos.
// Convierte el POST en un redirect GET para que React (useSearchParams) lea el token.
app.post('/pago/resultado', (req, res) => {
  const token = req.body?.token || req.query?.token
  if (token) {
    return res.redirect(302, `/pago/resultado?token=${encodeURIComponent(String(token))}`)
  }
  res.redirect(302, '/pago/resultado')
})

// ── SPA fallback + inyección de meta tags por ruta (Express 5) ───
// Los crawlers sociales (WhatsApp, Facebook, X, LinkedIn) NO ejecutan JS,
// así que aquí reescribimos title/description/Open Graph/canonical según la
// ruta solicitada, antes de servir el HTML. El cliente (useSEO) los mantiene.
const ORIGIN    = 'https://mitienditadigitalve.com'
const SITE_NAME = 'Mi Tiendita Digital Ve'
const INDEX_HTML = path.join(__dirname, '..', 'dist', 'index.html')

const ROUTE_META = {
  '/': {
    title: 'Mi Tiendita Digital Ve — Tecnología y Gaming en Rancagua',
    description: 'Tu tienda de tecnología y gaming en Rancagua, Chile. Gabinetes gamer, accesorios, computación, audio y video con garantía local y despacho a todo Chile.',
  },
  '/tienda': {
    title: `Tienda — ${SITE_NAME}`,
    description: 'Catálogo completo de Mi Tiendita Digital Ve — gabinetes gamer, accesorios, computación y más en Rancagua, Chile.',
  },
  '/nosotros': {
    title: `Nosotros — ${SITE_NAME}`,
    description: 'Conoce a Mi Tiendita Digital Ve, tu tienda de tecnología y gaming en Rancagua, Chile.',
  },
  '/soporte': {
    title: `Soporte — ${SITE_NAME}`,
    description: 'Centro de ayuda y soporte de Mi Tiendita Digital Ve. Resuelve tus dudas sobre productos, envíos y pagos.',
  },
  '/politica-de-privacidad': {
    title: `Política de Privacidad — ${SITE_NAME}`,
    description: 'Política de privacidad de Mi Tiendita Digital Ve: cómo tratamos tus datos personales.',
  },
}

// Plantilla cacheada (se relee al reiniciar el proceso, p.ej. tras un deploy)
let htmlTemplate = null
function getTemplate() {
  if (htmlTemplate === null) htmlTemplate = fs.readFileSync(INDEX_HTML, 'utf8')
  return htmlTemplate
}

// Escapa comillas dobles para no romper los atributos content="..."
const esc = (s) => String(s).replace(/"/g, '&quot;')

function renderWithMeta(reqPath) {
  const meta = ROUTE_META[reqPath] || ROUTE_META['/']
  const url  = ORIGIN + (reqPath === '/' ? '/' : reqPath)
  const t    = esc(meta.title)
  const d    = esc(meta.description)

  return getTemplate()
    .replace(/<title>[\s\S]*?<\/title>/i,                                   `<title>${t}</title>`)
    .replace(/(<meta\s+name="description"\s+content=")[^"]*(")/i,            `$1${d}$2`)
    .replace(/(<meta\s+property="og:title"\s+content=")[^"]*(")/i,          `$1${t}$2`)
    .replace(/(<meta\s+property="og:description"\s+content=")[^"]*(")/i,    `$1${d}$2`)
    .replace(/(<meta\s+property="og:url"\s+content=")[^"]*(")/i,            `$1${url}$2`)
    .replace(/(<meta\s+name="twitter:title"\s+content=")[^"]*(")/i,         `$1${t}$2`)
    .replace(/(<meta\s+name="twitter:description"\s+content=")[^"]*(")/i,   `$1${d}$2`)
    .replace(/(<link\s+rel="canonical"\s+href=")[^"]*(")/i,                 `$1${url}$2`)
}

if (isProd) {
  app.get('/{*path}', (req, res) => {
    try {
      res.set('Content-Type', 'text/html; charset=utf-8').send(renderWithMeta(req.path))
    } catch (err) {
      console.error('Render meta error:', err.message)
      res.sendFile(INDEX_HTML)
    }
  })
}

// ── Arranque ──────────────────────────────────────────────────────
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Mi Tiendita Digital Ve — Puerto ${PORT}`)
  console.log(`   Flow: ${process.env.FLOW_BASE_URL}`)
  console.log(`   Supabase: ${process.env.SUPABASE_URL}`)
})
server.on('error', (err) => { console.error('❌', err.message); process.exit(1) })
