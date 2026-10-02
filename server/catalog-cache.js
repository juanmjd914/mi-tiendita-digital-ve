// Caché en memoria del catálogo activo para las páginas renderizadas en el servidor.
// Se invalida cuando el admin crea/edita/borra productos.
import supabase from './supabase.js'

const TTL_MS = 60 * 1000
let cache = null
let cacheAt = 0
let inflight = null

const FIELDS = 'id, slug, name, short_description, description, price, original_price, category, brand, badge, img_url, gallery, specs, warranty, stock, low_stock_threshold, featured, sort_order, created_at, updated_at'

export async function getCatalog() {
  if (cache && Date.now() - cacheAt < TTL_MS) return cache
  if (inflight) return inflight
  inflight = (async () => {
    const { data, error } = await supabase
      .from('products')
      .select(FIELDS)
      .eq('active', true)
      .not('slug', 'is', null)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('id', { ascending: true })
    const { data: variants, error: vErr } = await supabase
      .from('product_variants')
      .select('id, product_id, kind, label, price, original_price, stock, img_url, gallery, sort_order')
      .eq('active', true)
      .order('sort_order', { ascending: true })
    const { data: reviews, error: rErr } = await supabase
      .from('product_reviews')
      .select('product_id, rating, comment, author_display, created_at')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
    inflight = null
    if (error) {
      console.error('Catálogo:', error.message)
      return cache || []
    }
    if (vErr) console.error('Variantes:', vErr.message)
    if (rErr) console.error('Reseñas:', rErr.message)
    const reviewsBy = new Map()
    for (const r of reviews || []) {
      if (!reviewsBy.has(r.product_id)) reviewsBy.set(r.product_id, [])
      reviewsBy.get(r.product_id).push(r)
    }
    const byProduct = new Map()
    for (const v of variants || []) {
      if (!byProduct.has(v.product_id)) byProduct.set(v.product_id, [])
      byProduct.get(v.product_id).push(v)
    }
    cache = (data || []).map((p) => {
      const vs = byProduct.get(p.id) || []
      const rs = reviewsBy.get(p.id) || []
      const review = { reviews: rs, review_count: rs.length, rating_avg: rs.length ? Math.round((rs.reduce((n, r) => n + r.rating, 0) / rs.length) * 10) / 10 : null }
      return vs.length
        ? { ...p, ...review, variants: vs, has_variants: true, stock: vs.reduce((n, v) => n + (v.stock || 0), 0) }
        : { ...p, ...review, variants: [], has_variants: false }
    })
    cacheAt = Date.now()
    return cache
  })()
  return inflight
}

export function invalidateCatalog() { cache = null; cacheAt = 0 }

export async function getProductBySlug(slug) {
  return (await getCatalog()).find((p) => p.slug === slug) || null
}
