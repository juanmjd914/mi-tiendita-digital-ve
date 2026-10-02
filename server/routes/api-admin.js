// Endpoints del panel admin HTML que no existían en el backend anterior:
// catálogo con variantes, carga masiva de stock, variantes, reseñas y resumen.
import { Router } from 'express'
import supabase from '../supabase.js'
import { requireAuth } from '../adminAuth.js'
import { invalidateCatalog } from '../catalog-cache.js'

const router = Router()
const int = (v) => (v === '' || v == null ? null : Math.trunc(Number(v)))
const str = (v, n = 200) => (v == null ? null : String(v).trim().slice(0, n) || null)

// GET /api/admin/catalog — todos los productos (activos e inactivos) con sus variantes
router.get('/api/admin/catalog', requireAuth, async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*, product_variants(*)')
      .order('category', { ascending: true })
      .order('name', { ascending: true })
    if (error) throw error
    for (const p of data || []) p.product_variants?.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/stock/bulk — fija el stock de varios productos/variantes de una vez
// body: { items: [{ kind: 'product' | 'variant', id, stock }] }
router.post('/api/admin/stock/bulk', requireAuth, async (req, res) => {
  try {
    const items = Array.isArray(req.body?.items) ? req.body.items.slice(0, 500) : []
    if (!items.length) return res.status(400).json({ error: 'No hay cambios para guardar' })
    let updated = 0
    const errors = []
    for (const it of items) {
      const stock = Math.max(0, int(it.stock) ?? 0)
      const table = it.kind === 'variant' ? 'product_variants' : 'products'
      const id = it.kind === 'variant' ? String(it.id) : Number(it.id)
      const { data: before } = await supabase.from(table).select('stock').eq('id', id).maybeSingle()
      if (!before) { errors.push(`${table} ${id}: no existe`); continue }
      const { error } = await supabase.from(table).update({ stock }).eq('id', id)
      if (error) { errors.push(`${table} ${id}: ${error.message}`); continue }
      updated++
      if (table === 'products' && stock !== before.stock) {
        supabase.from('stock_adjustments').insert({
          product_id: id, delta: stock - (before.stock ?? 0), new_stock: stock, reason: 'carga de stock (panel)', admin_user: req.adminUser,
        }).then(() => {}, () => {})
      }
    }
    invalidateCatalog()
    res.json({ ok: errors.length === 0, updated, errors })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Whitelist de campos de variante
function sanitizeVariant(b) {
  const out = {}
  if ('label' in b) out.label = str(b.label, 60)
  if ('kind' in b) out.kind = str(b.kind, 30) || 'Color'
  if ('sku' in b) out.sku = str(b.sku, 60)
  if ('price' in b) out.price = int(b.price)
  if ('original_price' in b) out.original_price = int(b.original_price)
  if ('stock' in b) out.stock = Math.max(0, int(b.stock) ?? 0)
  if ('active' in b) out.active = Boolean(b.active)
  if ('sort_order' in b) out.sort_order = int(b.sort_order) ?? 0
  if ('img_url' in b) out.img_url = str(b.img_url, 500)
  if ('gallery' in b) out.gallery = Array.isArray(b.gallery) ? b.gallery.slice(0, 12).map(String) : []
  return out
}

// POST /api/admin/products/:id/variants — crear variante
router.post('/api/admin/products/:id/variants', requireAuth, async (req, res) => {
  try {
    const row = sanitizeVariant(req.body || {})
    if (!row.label) return res.status(400).json({ error: 'El nombre de la variante es requerido' })
    const { data, error } = await supabase
      .from('product_variants').insert({ ...row, product_id: Number(req.params.id) }).select().single()
    if (error) throw error
    invalidateCatalog()
    res.json(data)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// PUT /api/admin/variants/:id — editar variante
router.put('/api/admin/variants/:id', requireAuth, async (req, res) => {
  try {
    const row = sanitizeVariant(req.body || {})
    if ('label' in row && !row.label) return res.status(400).json({ error: 'El nombre de la variante es requerido' })
    const { data, error } = await supabase
      .from('product_variants').update(row).eq('id', req.params.id).select().single()
    if (error) throw error
    invalidateCatalog()
    res.json(data)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// GET /api/admin/reviews?status=pending|approved|rejected
router.get('/api/admin/reviews', requireAuth, async (req, res) => {
  try {
    let q = supabase
      .from('product_reviews')
      .select('*, products(name, slug, img_url)')
      .order('created_at', { ascending: false })
      .limit(200)
    if (['pending', 'approved', 'rejected'].includes(req.query.status)) q = q.eq('status', req.query.status)
    const { data, error } = await q
    if (error) throw error
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/admin/reviews/:id — aprobar / rechazar
router.put('/api/admin/reviews/:id', requireAuth, async (req, res) => {
  try {
    const status = String(req.body?.status || '')
    if (!['pending', 'approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Estado inválido' })
    const { data, error } = await supabase
      .from('product_reviews').update({ status, moderated_at: new Date().toISOString() }).eq('id', req.params.id).select().single()
    if (error) throw error
    invalidateCatalog()
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/overview — números del resumen
router.get('/api/admin/overview', requireAuth, async (_req, res) => {
  try {
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const startOfMonth = new Date(startOfDay.getFullYear(), startOfDay.getMonth(), 1)
    const [orders, products, variants, reviews] = await Promise.all([
      supabase.from('orders').select('id, order_number, total, status, fulfillment_status, created_at, paid_at, customer_name, payment_method').gte('created_at', new Date(Date.now() - 90 * 864e5).toISOString()).order('created_at', { ascending: false }),
      supabase.from('products').select('id, stock, low_stock_threshold, active'),
      supabase.from('product_variants').select('product_id, stock, active'),
      supabase.from('product_reviews').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ])
    const list = orders.data || []
    const isPaid = (o) => o.status === 'paid'
    const sum = (arr) => arr.reduce((n, o) => n + (o.total || 0), 0)
    const vStock = new Map()
    for (const v of variants.data || []) if (v.active) vStock.set(v.product_id, (vStock.get(v.product_id) || 0) + (v.stock || 0))
    const active = (products.data || []).filter((p) => p.active)
    const stockOf = (p) => (vStock.has(p.id) ? vStock.get(p.id) : p.stock || 0)
    res.json({
      salesToday: sum(list.filter((o) => isPaid(o) && new Date(o.paid_at || o.created_at) >= startOfDay)),
      salesMonth: sum(list.filter((o) => isPaid(o) && new Date(o.paid_at || o.created_at) >= startOfMonth)),
      pendingPayment: list.filter((o) => ['pending_transfer', 'pending_cod', 'pending'].includes(o.status)).length,
      toFulfill: list.filter((o) => (isPaid(o) || o.status === 'pending_cod') && !['shipped', 'delivered'].includes(o.fulfillment_status)).length,
      activeProducts: active.length,
      outOfStock: active.filter((p) => stockOf(p) <= 0).length,
      lowStock: active.filter((p) => { const s = stockOf(p); return s > 0 && s <= (p.low_stock_threshold ?? 3) }).length,
      pendingReviews: reviews.count || 0,
      needsAction: list.filter((o) => ['pending_transfer', 'pending_cod'].includes(o.status) || (isPaid(o) && !['shipped', 'delivered'].includes(o.fulfillment_status))).length,
      recentOrders: list.slice(0, 8),
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
