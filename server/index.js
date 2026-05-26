import 'dotenv/config'
import express    from 'express'
import cors       from 'cors'
import path       from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import supabase   from './supabase.js'
import { createPayment, getPaymentStatus, verifySignature } from './flow.js'
import { sendOrderConfirmation } from './email.js'

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
app.use(express.json())
app.use(express.urlencoded({ extended: true })) // requerido para webhooks de Flow

if (isProd) {
  app.use(express.static(path.join(__dirname, '..', 'dist')))
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
  if (!orderItems?.length) return
  for (const item of orderItems) {
    if (!item.product_id) continue
    const { data: product } = await supabase
      .from('products')
      .select('stock')
      .eq('id', item.product_id)
      .single()
    if (product != null) {
      const newStock = Math.max(0, (product.stock || 0) - (item.quantity || 1))
      await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', item.product_id)
    }
  }
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
    const { items, email, customerName } = req.body

    if (!items?.length) return res.status(400).json({ error: 'Carrito vacío' })
    if (!email)         return res.status(400).json({ error: 'Email requerido' })

    // Verificar stock disponible para cada ítem
    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('stock, active')
        .eq('id', item.id)
        .single()
      if (product && product.active && product.stock < (item.quantity || 1)) {
        return res.status(400).json({
          error: `Sin stock suficiente para "${item.name}". Stock disponible: ${product.stock}`
        })
      }
    }

    const total   = items.reduce((s, i) => s + i.price * i.quantity, 0)
    const subject = items.length === 1
      ? items[0].name.slice(0, 80)
      : `Mi Tiendita Digital Ve — ${items.length} productos`

    // 1. Crear orden en Supabase con status pending
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        status:         'pending',
        total,
        customer_email: email,
        customer_name:  customerName || null,
      })
      .select()
      .single()

    if (orderErr) throw orderErr

    // 2. Insertar items de la orden
    const orderItems = items.map(i => ({
      order_id:   order.id,
      product_id: i.id,
      name:       i.name,
      price:      i.price,
      quantity:   i.quantity,
    }))
    await supabase.from('order_items').insert(orderItems)

    // 3. Crear pago en Flow
    const payment = await createPayment({
      orderId: order.id,
      subject,
      amount:  total,
      email,
    })

    // 4. Guardar flow_token en la orden
    await supabase
      .from('orders')
      .update({ flow_token: payment.token })
      .eq('id', order.id)

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

    // Verificar firma
    if (!verifySignature(params)) {
      console.warn('⚠️  Firma inválida en webhook Flow')
      return res.status(400).send('Firma inválida')
    }

    const token = params.token
    if (!token) return res.status(400).send('token requerido')

    // Consultar estado real del pago
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

// ── Health ────────────────────────────────────────────────────────
app.get('/api/salud', (_req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV, ts: new Date().toISOString() })
})

// ── SPA fallback (Express 5) ─────────────────────────────────────
if (isProd) {
  app.get('/{*path}', (_req, res) => {
    res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'))
  })
}

// ── Arranque ──────────────────────────────────────────────────────
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Mi Tiendita Digital Ve — Puerto ${PORT}`)
  console.log(`   Flow: ${process.env.FLOW_BASE_URL}`)
  console.log(`   Supabase: ${process.env.SUPABASE_URL}`)
})
server.on('error', (err) => { console.error('❌', err.message); process.exit(1) })
