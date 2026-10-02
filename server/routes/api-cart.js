// Cotización del carrito: precios, variantes, stock, cupón y envío calculados en el servidor.
import { Router } from 'express'
import { getCatalog } from '../catalog-cache.js'
import { computeShipping } from '../shipping.js'
import { getValidCoupon, computeDiscount } from '../coupons.js'

const router = Router()

export async function quoteCart({ items, couponCode, deliveryMethod, comuna }) {
  const catalog = await getCatalog()
  const byId = new Map(catalog.map((p) => [p.id, p]))
  const lines = []
  for (const raw of Array.isArray(items) ? items.slice(0, 60) : []) {
    const id = Number(raw?.id)
    const variantId = raw?.variantId == null ? null : Number(raw.variantId)
    const qty = Math.max(1, Math.min(99, Math.trunc(Number(raw?.qty) || 1)))
    const p = byId.get(id)
    if (!p) { lines.push({ id, variantId, qty, missing: true }); continue }
    const v = variantId ? p.variants.find((x) => x.id === variantId) : null
    if (p.has_variants && !v) { lines.push({ id, variantId, qty, missing: true, name: p.name }); continue }
    const price = v?.price ?? p.price
    const original = v?.original_price ?? p.original_price
    const stock = v ? v.stock : p.stock
    lines.push({
      id, variantId, qty, slug: p.slug, name: p.name, brand: p.brand, category: p.category,
      variantLabel: v ? v.label : null, variantKind: v ? v.kind : null,
      img: (v?.img_url || p.img_url || '').replace(/\.webp$/, '-400.webp'),
      price, originalPrice: original && original > price ? original : null,
      stock, outOfStock: stock <= 0, notEnough: stock > 0 && stock < qty,
      lineTotal: price * qty,
    })
  }
  const valid = lines.filter((l) => !l.missing)
  const subtotal = valid.reduce((n, l) => n + l.lineTotal, 0)
  const count = valid.reduce((n, l) => n + l.qty, 0)

  let discount = 0
  let coupon = null
  let couponError = null
  if (couponCode) {
    const r = await getValidCoupon(String(couponCode).slice(0, 40), subtotal)
    if (r.coupon) {
      discount = computeDiscount(r.coupon, subtotal).discountAmount
      coupon = r.coupon.code
    } else couponError = r.error
  }
  const afterCoupon = Math.max(0, subtotal - discount)
  const ship = await computeShipping(deliveryMethod || 'local', comuna || 'Rancagua', afterCoupon)
  return {
    lines, count, subtotal, discount, coupon, couponError,
    shipping: ship,
    total: afterCoupon + ship.shippingCost,
    canCheckout: valid.length > 0 && valid.every((l) => !l.outOfStock && !l.notEnough),
  }
}

router.post('/api/cart/quote', async (req, res) => {
  try {
    res.json(await quoteCart(req.body || {}))
  } catch (err) {
    console.error('/api/cart/quote:', err.message)
    res.status(500).json({ error: 'No pudimos calcular tu carrito' })
  }
})

// Productos por id (favoritos): solo campos públicos del catálogo activo.
router.get('/api/catalog/by-ids', async (req, res) => {
  const ids = String(req.query.ids || '').split(',').map(Number).filter(Boolean).slice(0, 100)
  const catalog = await getCatalog()
  const want = new Set(ids)
  res.json(catalog.filter((p) => want.has(p.id)).map((p) => ({
    id: p.id, slug: p.slug, name: p.name, brand: p.brand, badge: p.badge, short_description: p.short_description,
    price: p.price, original_price: p.original_price, stock: p.stock, has_variants: p.has_variants,
    img: (p.img_url || '').replace(/\.webp$/, '-400.webp'),
  })))
})

export default router
