import 'dotenv/config'
import express    from 'express'
import cors       from 'cors'
import helmet     from 'helmet'
import rateLimit  from 'express-rate-limit'
import path       from 'path'
import fs         from 'fs'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'
import supabase   from './supabase.js'
import { createPayment, getPaymentStatus, verifySignature, sign } from './flow.js'
import { sendOrderConfirmation, sendTransferInstructions } from './email.js'
import { login, requireAuth, logout, adminUserCount } from './adminAuth.js'
import { decrementStock, restoreStock } from './stock.js'
import { computeCouponDiscount, redeemCoupon, refundCoupon, getValidCoupon, computeDiscount } from './coupons.js'
import { getSettings, updateSettings, getBankDetails } from './settings.js'

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

// Passenger/Hostinger corre detrás de un proxy → necesario para que el rate limit
// lea la IP real del cliente (X-Forwarded-For) en vez de la del proxy.
app.set('trust proxy', 1)

// Cabeceras de seguridad. crossOriginResourcePolicy relajado para permitir que las
// imágenes de Supabase Storage se sirvan en la tienda.
app.use(helmet({
  contentSecurityPolicy: false, // el SPA carga assets propios; evitamos romper Vite
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))

app.use(cors({
  origin: isProd
    ? ['https://mitienditadigitalve.com', 'https://www.mitienditadigitalve.com']
    : ['http://localhost:5174', 'http://localhost:5175'],
}))
app.use(express.json({ limit: '10mb' }))        // 10mb para imágenes en base64
app.use(express.urlencoded({ extended: true })) // requerido para webhooks de Flow

// ── Rate limiting ─────────────────────────────────────────────────
// Límite general para toda la API (evita abuso/spam).
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 300,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta de nuevo en unos minutos.' },
})
// Límite estricto para el login admin (frena fuerza bruta de contraseñas).
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Espera 15 minutos.' },
})
// Límite para crear pedidos/pagos (evita spam de órdenes).
const orderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 40,
  standardHeaders: true, legacyHeaders: false,
  message: { error: 'Demasiados intentos. Espera unos minutos.' },
})
// El webhook de Flow NO se limita (es servidor-a-servidor); todo lo demás bajo /api sí.
app.use('/api/payment/confirm', (req, _res, next) => next())
app.use('/api', apiLimiter)

if (isProd) {
  // index:false → el catch-all sirve index.html con meta tags inyectados por ruta
  app.use(express.static(path.join(__dirname, '..', 'dist'), { index: false }))
}

// ── Admin auth ────────────────────────────────────────────────────
// POST /api/admin/login — usuario+contraseña → token de sesión
app.post('/api/admin/login', loginLimiter, (req, res) => {
  const { username, password } = req.body || {}
  const token = login(username, password)
  if (!token) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
  res.json({ token, user: String(username).trim() })
})

// POST /api/admin/logout — invalida el token de sesión
app.post('/api/admin/logout', (req, res) => {
  const token = req.headers['x-admin-token']
  if (token) logout(token)
  res.json({ ok: true })
})

// GET /api/admin/me — valida que el token siga vivo (para el frontend al recargar)
app.get('/api/admin/me', requireAuth, (req, res) => {
  res.json({ ok: true, user: req.adminUser })
})

// ── Idempotencia de inventario ────────────────────────────────────
// Descuenta stock y canjea el cupón UNA SOLA VEZ por orden, sin importar
// cuántas veces llegue el webhook o se recargue la página de resultado.
// Usa la bandera orders.stock_decremented (si la columna existe tras la migración).
async function confirmOrderInventory(order, { wasPending } = {}) {
  const alreadyDone = order?.stock_decremented === true
  // Antes de aplicar la migración, la columna no existe (undefined) → usamos
  // wasPending como respaldo para no descontar dos veces.
  if (alreadyDone) return
  if (order?.stock_decremented === undefined && wasPending === false) return

  await decrementStock(order.order_items || [])
  if (order.coupon_code) await redeemCoupon(order.coupon_code)

  // Marca la orden como procesada (si la columna existe). Si no existe, el update
  // ignora el campo desconocido y quedamos protegidos por wasPending hasta la migración.
  await supabase.from('orders').update({ stock_decremented: true }).eq('id', order.id)
}

// ═══════════════════════════════════════════════════════════════
//  CUPONES
// ═══════════════════════════════════════════════════════════════

// POST /api/coupons/validate — valida un cupón (público)
app.post('/api/coupons/validate', async (req, res) => {
  const { code, total } = req.body
  if (!code) return res.status(400).json({ error: 'Código requerido' })

  const { coupon, error } = await getValidCoupon(code, total)
  if (error) return res.status(400).json({ error })

  const val = Number(coupon.discount_value)
  const { discountAmount, finalTotal } = computeDiscount(coupon, Number(total) || 0)

  res.json({
    valid: true, code: coupon.code.toUpperCase(),
    description: coupon.description,
    discountType: coupon.discount_type, discountValue: val,
    discountAmount, newTotal: finalTotal,
  })
})

// GET /api/admin/coupons
app.get('/api/admin/coupons', requireAuth, async (req, res) => {
  const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

// POST /api/admin/coupons — crear cupón
app.post('/api/admin/coupons', requireAuth, async (req, res) => {
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
app.put('/api/admin/coupons/:id', requireAuth, async (req, res) => {
  const { data, error } = await supabase
    .from('coupons').update(req.body).eq('id', req.params.id).select().single()
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

// ═══════════════════════════════════════════════════════════════
//  CONFIGURACIÓN DE LA TIENDA
// ═══════════════════════════════════════════════════════════════

// GET /api/store-config — SOLO datos NO sensibles para el checkout del cliente.
// ⚠️ Nunca incluye datos bancarios (esos van solo tras crear el pedido).
app.get('/api/store-config', async (_req, res) => {
  try {
    const s = await getSettings()
    res.json({
      deliveryCostRancagua: s.delivery_cost_rancagua ?? 0,
      shippingFlatRegions:  s.shipping_flat_regions ?? 0,
      pickupEnabled:        s.pickup_enabled !== false,
      codEnabled:           s.cod_enabled !== false,
      localCity:            s.local_city || 'Rancagua',
      storeAddress:         s.store_address || '',
      contactWhatsapp:      s.contact_whatsapp || '',
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/settings — configuración completa (incluye bancarios) — solo admin
app.get('/api/admin/settings', requireAuth, async (_req, res) => {
  try { res.json(await getSettings()) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

// PUT /api/admin/settings — actualizar configuración — solo admin
app.put('/api/admin/settings', requireAuth, async (req, res) => {
  try { res.json(await updateSettings(req.body || {})) }
  catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/order/:id/bank-details — datos bancarios SOLO para un pedido de
// transferencia real ya creado (para la pantalla de éxito). No se listan públicamente.
app.get('/api/order/:id/bank-details', async (req, res) => {
  try {
    const { data: order } = await supabase
      .from('orders').select('id, status, total').eq('id', req.params.id).maybeSingle()
    if (!order || order.status !== 'pending_transfer') {
      return res.status(404).json({ error: 'Pedido no encontrado' })
    }
    const bank = await getBankDetails()
    res.json({ bank, total: order.total, orderId: order.id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

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

/**
 * Valida el carrito contra la BASE DE DATOS (no confía en el precio/nombre que
 * manda el navegador). Devuelve los ítems con precio y nombre reales, o lanza un
 * Error legible si algo no cuadra (producto inexistente, inactivo o sin stock).
 * Esto evita manipulación de precios desde el frontend.
 */
async function buildValidatedItems(items) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('Carrito vacío')

  const validated = []
  for (const item of items) {
    const qty = Math.max(1, Math.floor(Number(item.quantity) || 1))
    const { data: product } = await supabase
      .from('products').select('id, name, price, stock, active').eq('id', item.id).maybeSingle()

    if (!product || product.active === false) {
      throw new Error(`El producto "${item.name || item.id}" ya no está disponible`)
    }
    if ((product.stock ?? 999) < qty) {
      throw new Error(`Sin stock suficiente para "${product.name}". Disponible: ${product.stock ?? 0}`)
    }
    validated.push({ product_id: product.id, name: product.name, price: product.price, quantity: qty })
  }
  const subtotal = validated.reduce((s, i) => s + i.price * i.quantity, 0)
  return { validated, subtotal }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''))
}

/**
 * Calcula el costo de envío según método de entrega y ciudad, usando la config.
 * - Retiro en local (pickup): $0.
 * - Delivery en la ciudad local (Rancagua): delivery_cost_rancagua.
 * - Delivery a regiones: shipping_flat_regions.
 * Devuelve { shippingCost, deliveryMethod, isLocal }.
 */
async function computeShipping(deliveryMethod, city) {
  const s = await getSettings()
  const method = deliveryMethod === 'pickup' ? 'pickup' : 'delivery'
  const localCity = String(s.local_city || 'Rancagua').trim().toLowerCase()
  const isLocal = String(city || '').trim().toLowerCase().includes(localCity)

  let shippingCost = 0
  if (method === 'delivery') {
    shippingCost = isLocal ? (s.delivery_cost_rancagua ?? 0) : (s.shipping_flat_regions ?? 0)
  }
  return { shippingCost: Math.max(0, Number(shippingCost) || 0), deliveryMethod: method, isLocal }
}

// POST /api/payment/create — inicia el pago con Flow
app.post('/api/payment/create', orderLimiter, async (req, res) => {
  try {
    const { items, email, customerName, customerPhone, customerAddress, couponCode, deliveryMethod, customerCity } = req.body
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Email inválido' })

    // Precios y stock validados contra la base (no se confía en el frontend)
    const { validated, subtotal } = await buildValidatedItems(items)
    const { discountAmount, finalTotal: afterCoupon, couponCode: appliedCoupon } = await computeCouponDiscount(couponCode, subtotal)
    const { shippingCost, deliveryMethod: method } = await computeShipping(deliveryMethod, customerCity)
    const finalTotal = afterCoupon + shippingCost
    const subject = validated.length === 1 ? validated[0].name.slice(0, 80) : `Mi Tiendita Digital Ve — ${validated.length} productos`

    // Crear orden
    const { data: order, error: orderErr } = await supabase
      .from('orders').insert({
        status:           'pending',
        payment_method:   'flow',
        delivery_method:  method,
        shipping_cost:    shippingCost,
        total:            finalTotal,
        customer_email:   String(email).trim(),
        customer_name:    customerName    || null,
        customer_phone:   customerPhone   || null,
        customer_address: customerAddress || null,
        coupon_code:      appliedCoupon,
        discount_amount:  discountAmount,
      }).select().single()

    if (orderErr) throw orderErr

    const orderItems = validated.map(i => ({ order_id: order.id, ...i }))
    await supabase.from('order_items').insert(orderItems)

    const payment = await createPayment({ orderId: order.id, subject, amount: finalTotal, email: String(email).trim() })
    await supabase.from('orders').update({ flow_token: payment.token }).eq('id', order.id)

    res.json({ redirectUrl: payment.redirectUrl, orderId: order.id })
  } catch (err) {
    console.error('/api/payment/create error:', err.message)
    // Errores de validación (stock/producto) son 400; el resto 500
    const isValidation = /stock|disponible|Carrito|Email/i.test(err.message)
    res.status(isValidation ? 400 : 500).json({ error: err.message })
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

    // Estado previo (respaldo de idempotencia si la columna stock_decremented no existe aún)
    const { data: existingOrder } = await supabase
      .from('orders').select('status').eq('flow_token', token).single()
    const wasPending = existingOrder?.status === 'pending'

    // Actualizar orden
    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update({ status: statusLabel, flow_order: status.flowOrder || null })
      .eq('flow_token', token)
      .select('*, order_items(*)')
      .single()

    if (error) console.error('Supabase update error:', error.message)

    // Solo si el pago fue exitoso: confirmar inventario (idempotente) + email
    if (statusLabel === 'paid' && updatedOrder) {
      await confirmOrderInventory(updatedOrder, { wasPending })
      sendOrderConfirmation({ order: updatedOrder, items: updatedOrder.order_items || [] })
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
      .select('id, status, total, customer_email, customer_name, coupon_code, stock_decremented, created_at, order_items(*)')
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
          await supabase
            .from('orders')
            .update({ status: newStatus, flow_order: flowStatus.flowOrder || null })
            .eq('flow_token', req.params.token)

          const wasPending = data.status === 'pending'
          data.status = newStatus

          // Confirmar inventario (idempotente) + email si el pago se acreditó
          if (newStatus === 'paid') {
            await confirmOrderInventory(data, { wasPending })
            sendOrderConfirmation({ order: data, items: data.order_items || [] })
          }
        }
      } catch (flowErr) {
        console.warn('⚠️  Flow status check failed:', flowErr.message)
      }
    }

    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/payment/transfer — crea pedido pendiente de transferencia bancaria
app.post('/api/payment/transfer', orderLimiter, async (req, res) => {
  try {
    const { items, email, customerName, customerPhone, customerAddress, couponCode, deliveryMethod, customerCity } = req.body
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Email inválido' })

    // Precios y stock validados contra la base (no se confía en el frontend)
    const { validated, subtotal } = await buildValidatedItems(items)
    const { discountAmount, finalTotal: afterCoupon, couponCode: appliedCoupon } = await computeCouponDiscount(couponCode, subtotal)
    const { shippingCost, deliveryMethod: method } = await computeShipping(deliveryMethod, customerCity)
    const finalTotal = afterCoupon + shippingCost

    const { data: order, error: orderErr } = await supabase
      .from('orders').insert({
        status:           'pending_transfer',
        payment_method:   'transfer',
        delivery_method:  method,
        shipping_cost:    shippingCost,
        total:            finalTotal,
        customer_email:   String(email).trim(),
        customer_name:    customerName    || null,
        customer_phone:   customerPhone   || null,
        customer_address: customerAddress || null,
        coupon_code:      appliedCoupon,
        discount_amount:  discountAmount,
      }).select().single()

    if (orderErr) throw orderErr

    const orderItems = validated.map(i => ({ order_id: order.id, ...i }))
    await supabase.from('order_items').insert(orderItems)

    // La transferencia RESERVA el stock al crear el pedido (idempotente).
    await confirmOrderInventory({ ...order, order_items: orderItems }, { wasPending: true })

    try { await sendTransferInstructions({ order, items: orderItems }) } catch (_) { /* ignore */ }

    res.json({ orderId: order.id, total: finalTotal })
  } catch (err) {
    console.error('/api/payment/transfer error:', err.message)
    const isValidation = /stock|disponible|Carrito|Email/i.test(err.message)
    res.status(isValidation ? 400 : 500).json({ error: err.message })
  }
})

// POST /api/payment/cod — Pago contra entrega (solo zona local / Rancagua).
// No hay pago online: se crea el pedido, se reserva el stock y se cobra al entregar.
app.post('/api/payment/cod', orderLimiter, async (req, res) => {
  try {
    const { items, email, customerName, customerPhone, customerAddress, couponCode, deliveryMethod, customerCity } = req.body
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Email inválido' })

    const settings = await getSettings()
    if (settings.cod_enabled === false) return res.status(400).json({ error: 'El pago contra entrega no está disponible' })

    // COD solo aplica en la ciudad local (Rancagua)
    const localCity = String(settings.local_city || 'Rancagua').trim().toLowerCase()
    if (!String(customerCity || '').trim().toLowerCase().includes(localCity)) {
      return res.status(400).json({ error: `El pago contra entrega solo está disponible en ${settings.local_city || 'Rancagua'}` })
    }

    const { validated, subtotal } = await buildValidatedItems(items)
    const { discountAmount, finalTotal: afterCoupon, couponCode: appliedCoupon } = await computeCouponDiscount(couponCode, subtotal)
    const { shippingCost, deliveryMethod: method } = await computeShipping(deliveryMethod, customerCity)
    const finalTotal = afterCoupon + shippingCost

    const { data: order, error: orderErr } = await supabase
      .from('orders').insert({
        status:           'pending_cod',
        payment_method:   'cod',
        delivery_method:  method,
        shipping_cost:    shippingCost,
        total:            finalTotal,
        customer_email:   String(email).trim(),
        customer_name:    customerName    || null,
        customer_phone:   customerPhone   || null,
        customer_address: customerAddress || null,
        coupon_code:      appliedCoupon,
        discount_amount:  discountAmount,
      }).select().single()

    if (orderErr) throw orderErr

    const orderItems = validated.map(i => ({ order_id: order.id, ...i }))
    await supabase.from('order_items').insert(orderItems)

    // Reserva el stock al crear el pedido (idempotente), igual que la transferencia.
    await confirmOrderInventory({ ...order, order_items: orderItems }, { wasPending: true })

    res.json({ orderId: order.id, total: finalTotal, shippingCost })
  } catch (err) {
    console.error('/api/payment/cod error:', err.message)
    const isValidation = /stock|disponible|Carrito|Email|Rancagua|entrega/i.test(err.message)
    res.status(isValidation ? 400 : 500).json({ error: err.message })
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

// GET /api/newsletter/unsubscribe?token=... — baja pública (link en los emails)
app.get('/api/newsletter/unsubscribe', async (req, res) => {
  const token = req.query.token
  if (!token) return res.status(400).send('Token requerido')
  try {
    await supabase.from('newsletter_subscribers').update({ active: false }).eq('unsubscribe_token', token)
    res.set('Content-Type', 'text/html; charset=utf-8').send(
      '<div style="font-family:system-ui;text-align:center;padding:60px 20px;background:#0a0a0f;color:#fff;min-height:100vh">' +
      '<h1 style="color:#81d742">Listo ✅</h1><p>Te diste de baja del boletín de Mi Tiendita Digital Ve.</p>' +
      '<a href="https://mitienditadigitalve.com" style="color:#06b6d4">Volver a la tienda</a></div>'
    )
  } catch (err) {
    res.status(500).send('Error al procesar la baja')
  }
})

// ═══════════════════════════════════════════════════════════════
//  ADMIN
// ═══════════════════════════════════════════════════════════════

// GET /api/admin/newsletter — lista de suscriptores
app.get('/api/admin/newsletter', requireAuth, async (_req, res) => {
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

app.get('/api/admin/stats', requireAuth, async (_req, res) => {
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

app.get('/api/admin/orders', requireAuth, async (req, res) => {
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
app.get('/api/admin/products', requireAuth, async (req, res) => {
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

// Whitelist + saneo de campos de producto (nunca se confía en req.body crudo).
// Incluye los campos ricos nuevos (brand, sku, warranty, specs, gallery, etc.).
function sanitizeProduct(body, { partial = false } = {}) {
  const out = {}
  const str  = (v) => (v == null ? null : String(v).trim() || null)
  const int  = (v) => (v === '' || v == null ? null : Math.trunc(Number(v)))
  const num  = (v) => (v === '' || v == null ? null : Number(v))

  if ('name'          in body) out.name          = str(body.name)
  if ('price'         in body) out.price         = int(body.price)
  if ('original_price'in body) out.original_price= int(body.original_price)
  if ('category'      in body) out.category      = str(body.category)
  if ('description'   in body) out.description   = str(body.description)
  if ('badge'         in body) out.badge         = str(body.badge)
  if ('img_url'       in body) out.img_url       = str(body.img_url)
  if ('rating'        in body) out.rating        = num(body.rating)
  if ('stock'         in body) out.stock         = Math.max(0, int(body.stock) ?? 0)
  if ('active'        in body) out.active        = Boolean(body.active)
  // Campos ricos (existen tras la migración 002; si no, Supabase los ignora en error → validamos abajo)
  if ('brand'         in body) out.brand         = str(body.brand)
  if ('sku'           in body) out.sku           = str(body.sku)
  if ('warranty'      in body) out.warranty      = str(body.warranty)
  if ('weight_grams'  in body) out.weight_grams  = int(body.weight_grams)
  if ('low_stock_threshold' in body) out.low_stock_threshold = int(body.low_stock_threshold)
  // specs: array de { label, value }  ·  gallery: array de URLs
  if ('specs'   in body) out.specs   = Array.isArray(body.specs)   ? body.specs.slice(0, 40)   : null
  if ('gallery' in body) out.gallery = Array.isArray(body.gallery) ? body.gallery.slice(0, 12) : null

  if (!partial) {
    if (!out.name)  throw new Error('El nombre es requerido')
    if (out.price == null || out.price < 0) throw new Error('El precio es inválido')
    if (!out.category) throw new Error('La categoría es requerida')
  }
  return out
}

// POST /api/admin/products — crear producto
app.post('/api/admin/products', requireAuth, async (req, res) => {
  try {
    const payload = sanitizeProduct(req.body || {})
    const { data, error } = await supabase
      .from('products').insert(payload).select().single()
    if (error) throw error
    res.json(data)
  } catch (err) {
    const isValidation = /requerid|inválido/i.test(err.message)
    res.status(isValidation ? 400 : 500).json({ error: err.message })
  }
})

// PUT /api/admin/products/:id — actualizar producto
app.put('/api/admin/products/:id', requireAuth, async (req, res) => {
  try {
    const payload = sanitizeProduct(req.body || {}, { partial: true })
    const { data, error } = await supabase
      .from('products').update(payload).eq('id', req.params.id).select().single()
    if (error) throw error
    res.json(data)
  } catch (err) {
    const isValidation = /requerid|inválido/i.test(err.message)
    res.status(isValidation ? 400 : 500).json({ error: err.message })
  }
})

// DELETE /api/admin/products/:id — desactivar (soft delete)
app.delete('/api/admin/products/:id', requireAuth, async (req, res) => {
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
app.post('/api/admin/orders/:id/confirm-transfer', requireAuth, async (req, res) => {
  try {
    const orderId = req.params.id

    // Obtener orden con items
    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single()

    if (fetchErr || !order) return res.status(404).json({ error: 'Orden no encontrada' })
    if (!['pending_transfer', 'pending_cod'].includes(order.status)) {
      return res.status(400).json({ error: 'La orden no está pendiente de pago' })
    }

    // Marcar como pagada
    const { data: updated, error: updateErr } = await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('id', orderId)
      .select('*, order_items(*)')
      .single()

    if (updateErr) throw updateErr

    // Nota: el stock ya fue reservado al crear la orden (transferencia o contra entrega)
    // Solo enviamos el email de confirmación de pago recibido
    sendOrderConfirmation({ order: updated, items: updated.order_items || [] })

    res.json({ ok: true, order: updated })
  } catch (err) {
    console.error('/api/admin/orders/:id/confirm-transfer error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/upload-image — sube imagen a Supabase Storage y devuelve URL pública
app.post('/api/admin/upload-image', requireAuth, async (req, res) => {
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
app.post('/api/admin/orders/:id/cancel', requireAuth, async (req, res) => {
  try {
    const orderId = req.params.id

    const { data: order, error: fetchErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single()

    if (fetchErr || !order) return res.status(404).json({ error: 'Orden no encontrada' })
    if (!['pending_transfer', 'pending_cod', 'pending'].includes(order.status)) {
      return res.status(400).json({ error: 'Solo se pueden cancelar pedidos pendientes' })
    }

    const { error: updateErr } = await supabase
      .from('orders').update({ status: 'cancelled' }).eq('id', orderId)
    if (updateErr) throw updateErr

    // Restaura inventario solo si ya se había descontado. Usa la bandera si existe;
    // si no (pre-migración), cae al criterio anterior (las transferencias reservan stock).
    const wasDecremented = order.stock_decremented === true ||
      (order.stock_decremented === undefined && order.status === 'pending_transfer')
    if (wasDecremented) {
      await restoreStock(order.order_items || [])
      if (order.coupon_code) await refundCoupon(order.coupon_code)
      await supabase.from('orders').update({ stock_decremented: false }).eq('id', orderId)
    }

    res.json({ ok: true })
  } catch (err) {
    console.error('/api/admin/orders/:id/cancel error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/orders/:id — detalle completo de un pedido
app.get('/api/admin/orders/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders').select('*, order_items(*)').eq('id', req.params.id).single()
    if (error || !data) return res.status(404).json({ error: 'Orden no encontrada' })
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/admin/orders/:id/notes — guardar notas internas del admin
app.put('/api/admin/orders/:id/notes', requireAuth, async (req, res) => {
  try {
    const admin_notes = req.body?.admin_notes != null ? String(req.body.admin_notes) : null
    const { data, error } = await supabase
      .from('orders').update({ admin_notes }).eq('id', req.params.id).select().single()
    if (error) throw error
    res.json({ ok: true, order: data })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/orders/:id/resend-email — reenvía el email al cliente
app.post('/api/admin/orders/:id/resend-email', requireAuth, async (req, res) => {
  try {
    const { data: order, error } = await supabase
      .from('orders').select('*, order_items(*)').eq('id', req.params.id).single()
    if (error || !order) return res.status(404).json({ error: 'Orden no encontrada' })

    const items = order.order_items || []
    if (order.status === 'pending_transfer')      await sendTransferInstructions({ order, items })
    else if (order.status === 'paid')             sendOrderConfirmation({ order, items })
    else return res.status(400).json({ error: 'Este pedido no tiene un email para reenviar' })

    res.json({ ok: true })
  } catch (err) {
    console.error('/api/admin/orders/:id/resend-email error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/products/:id/adjust-stock — ajuste manual de stock (con historial)
app.post('/api/admin/products/:id/adjust-stock', requireAuth, async (req, res) => {
  try {
    const productId = Number(req.params.id)
    const mode  = req.body?.mode === 'set' ? 'set' : 'delta' // 'set' = fijar valor; 'delta' = sumar/restar
    const value = Math.trunc(Number(req.body?.value) || 0)
    const reason = String(req.body?.reason || 'ajuste manual').slice(0, 120)

    const { data: prod, error: readErr } = await supabase
      .from('products').select('stock').eq('id', productId).maybeSingle()
    if (readErr || !prod) return res.status(404).json({ error: 'Producto no encontrado' })

    const current = prod.stock ?? 0
    const newStock = mode === 'set' ? Math.max(0, value) : Math.max(0, current + value)
    const delta = newStock - current

    const { error: upErr } = await supabase.from('products').update({ stock: newStock }).eq('id', productId)
    if (upErr) throw upErr

    // Registrar en el historial (si la tabla existe tras la migración 003)
    supabase.from('stock_adjustments').insert({
      product_id: productId, delta, new_stock: newStock, reason, admin_user: req.adminUser,
    }).then(() => {}, () => {})

    res.json({ ok: true, stock: newStock, delta })
  } catch (err) {
    console.error('/api/admin/products/:id/adjust-stock error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/low-stock — productos activos en o bajo su umbral de alerta
app.get('/api/admin/low-stock', requireAuth, async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('products').select('id, name, stock, low_stock_threshold, img_url')
      .eq('active', true).order('stock', { ascending: true })
    if (error) throw error
    const low = (data || []).filter(p => (p.stock ?? 0) <= (p.low_stock_threshold ?? 3))
    res.json(low)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/orders/:id/fulfillment — actualiza estado de preparación/envío
app.post('/api/admin/orders/:id/fulfillment', requireAuth, async (req, res) => {
  try {
    const VALID = ['pending', 'preparing', 'shipped', 'delivered']
    const status = String(req.body?.fulfillment_status || '')
    if (!VALID.includes(status)) return res.status(400).json({ error: 'Estado de envío inválido' })

    const updates = { fulfillment_status: status }
    if ('tracking_code' in req.body) updates.tracking_code = String(req.body.tracking_code || '').trim() || null
    if (status === 'shipped') updates.shipped_at = new Date().toISOString()

    const { data: order, error } = await supabase
      .from('orders').update(updates).eq('id', req.params.id)
      .select('*, order_items(*)').single()
    if (error) throw error

    // Avisar al cliente cuando el pedido se marca como enviado
    if (status === 'shipped' && order?.customer_email) {
      import('./email.js').then(m => m.sendShippedNotification?.({ order, items: order.order_items || [] })).catch(() => {})
    }

    res.json({ ok: true, order })
  } catch (err) {
    console.error('/api/admin/orders/:id/fulfillment error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// ═══════════════════════════════════════════════════════════════
//  CLIENTES (derivados de los pedidos)
// ═══════════════════════════════════════════════════════════════

// GET /api/admin/customers — lista de clientes con su historial agregado
app.get('/api/admin/customers', requireAuth, async (_req, res) => {
  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('customer_email, customer_name, customer_phone, customer_address, total, status, created_at')
      .order('created_at', { ascending: false })
    if (error) throw error

    const map = new Map()
    for (const o of orders || []) {
      const key = (o.customer_email || '').toLowerCase()
      if (!key) continue
      if (!map.has(key)) {
        map.set(key, {
          email: o.customer_email, name: o.customer_name, phone: o.customer_phone,
          address: o.customer_address, orders: 0, paidOrders: 0, totalSpent: 0,
          lastOrderAt: o.created_at,
        })
      }
      const c = map.get(key)
      c.orders += 1
      if (o.status === 'paid') { c.paidOrders += 1; c.totalSpent += o.total || 0 }
      if (!c.name && o.customer_name) c.name = o.customer_name
      if (!c.phone && o.customer_phone) c.phone = o.customer_phone
    }
    const customers = [...map.values()].sort((a, b) => b.totalSpent - a.totalSpent)
    res.json(customers)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ═══════════════════════════════════════════════════════════════
//  REPORTES
// ═══════════════════════════════════════════════════════════════

// GET /api/admin/reports?from=YYYY-MM-DD&to=YYYY-MM-DD — métricas de ventas
app.get('/api/admin/reports', requireAuth, async (req, res) => {
  try {
    const { from, to } = req.query
    let q = supabase.from('orders').select('total, status, created_at, order_items(name, quantity, price)')
    if (from) q = q.gte('created_at', `${from}T00:00:00`)
    if (to)   q = q.lte('created_at', `${to}T23:59:59`)
    const { data: orders, error } = await q
    if (error) throw error

    const paid = (orders || []).filter(o => o.status === 'paid')
    const totalRevenue = paid.reduce((s, o) => s + (o.total || 0), 0)
    const paidCount = paid.length
    const avgTicket = paidCount ? Math.round(totalRevenue / paidCount) : 0

    // Ventas por día
    const byDay = {}
    for (const o of paid) {
      const day = String(o.created_at).slice(0, 10)
      byDay[day] = (byDay[day] || 0) + (o.total || 0)
    }
    const salesByDay = Object.entries(byDay).map(([day, total]) => ({ day, total })).sort((a, b) => a.day.localeCompare(b.day))

    // Productos más vendidos (por unidades, solo pedidos pagados)
    const prodMap = {}
    for (const o of paid) {
      for (const it of o.order_items || []) {
        if (!prodMap[it.name]) prodMap[it.name] = { name: it.name, units: 0, revenue: 0 }
        prodMap[it.name].units   += it.quantity || 0
        prodMap[it.name].revenue += (it.price || 0) * (it.quantity || 0)
      }
    }
    const topProducts = Object.values(prodMap).sort((a, b) => b.units - a.units).slice(0, 10)

    res.json({ totalRevenue, paidCount, avgTicket, salesByDay, topProducts })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ── Health ────────────────────────────────────────────────────────
app.get('/api/salud', (_req, res) => {
  res.json({ ok: true, env: process.env.NODE_ENV, adminUsers: adminUserCount(), ts: new Date().toISOString() })
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
