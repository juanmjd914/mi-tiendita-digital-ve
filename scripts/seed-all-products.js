/**
 * seed-all-products.js
 * Importa TODOS los productos desde el sitio WooCommerce
 * y los carga en la tabla products de Supabase.
 *
 * Uso: node scripts/seed-all-products.js
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const WC_BASE = 'https://mitienditadigitalve.com/wp-json/wc/store/v1/products'

// ── Helpers ───────────────────────────────────────────────────────────────────

function parsePrice(str) {
  if (!str) return null
  // WooCommerce Store API devuelve precio como string entero (CLP sin decimales)
  const n = parseInt(str, 10)
  return isNaN(n) ? null : n
}

function normalizeCategory(cats) {
  if (!cats || cats.length === 0) return 'ACCESORIOS'
  const names = cats.map(c => c.name.toUpperCase()
    .replace('CIÓN', 'CION')
    .replace('COMPUTACIÓN', 'COMPUTACION')
    .replace('GABINETES GAMER', 'GABINETES GAMER')
    .replace('JUEGOS DIGITALES', 'JUEGOS DIGITALES')
    .replace('AUDIO Y VIDEO', 'AUDIO Y VIDEO')
    .trim()
  )
  return names.join(' / ')
}

function getBadge(product) {
  const cats = normalizeCategory(product.categories)
  if (cats.includes('JUEGOS')) return 'PS5'
  if (product.on_sale) return 'OFERTA'
  return null
}

function getImg(product) {
  if (product.images && product.images.length > 0) {
    // Usar imagen full (sin sufijo -300x300) para mejor calidad
    const src = product.images[0].src
    return src.replace(/-\d+x\d+(\.\w+)$/, '$1')
  }
  return null
}

function getRating(product) {
  const avg = product.review_count > 0 ? product.average_rating : null
  if (!avg) return 4
  const n = parseFloat(avg)
  return Math.round(Math.min(5, Math.max(1, n)))
}

// ── Fetch paginado ────────────────────────────────────────────────────────────

async function fetchAllProducts() {
  const all = []
  let page = 1
  const perPage = 100

  while (true) {
    const url = `${WC_BASE}?per_page=${perPage}&page=${page}&orderby=date&order=desc`
    console.log(`📦 Descargando página ${page}... (${url})`)

    const res = await fetch(url)
    if (!res.ok) {
      console.error(`❌ Error HTTP ${res.status} en página ${page}`)
      break
    }

    const products = await res.json()
    if (!Array.isArray(products) || products.length === 0) break

    all.push(...products)
    console.log(`   ↳ ${products.length} productos obtenidos (total acumulado: ${all.length})`)

    if (products.length < perPage) break
    page++
  }

  return all
}

// ── Transformar a schema Supabase ─────────────────────────────────────────────

function transformProduct(p) {
  const price     = parsePrice(p.prices?.price)
  const regular   = parsePrice(p.prices?.regular_price)
  const onSale    = p.on_sale && regular && price && regular > price

  return {
    name:           p.name?.trim(),
    price:          price ?? 0,
    original_price: onSale ? regular : null,
    category:       normalizeCategory(p.categories),
    description:    p.short_description
                      ? p.short_description.replace(/<[^>]+>/g, '').trim() || null
                      : null,
    badge:          getBadge(p),
    img_url:        getImg(p),
    rating:         getRating(p),
    stock:          p.stock_status === 'outofstock' ? 0 : 10,
    active:         p.stock_status !== 'outofstock',
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function run() {
  console.log('🚀 seed-all-products — Mi Tiendita Digital Ve\n')

  // 1. Descargar todos los productos del sitio WooCommerce
  const wcProducts = await fetchAllProducts()
  console.log(`\n✅ Total de productos descargados: ${wcProducts.length}\n`)

  if (wcProducts.length === 0) {
    console.error('⚠️  No se obtuvieron productos. Abortando.')
    process.exit(1)
  }

  // 2. Transformar
  const rows = wcProducts.map(transformProduct).filter(r => r.name)
  console.log(`🔄 Filas preparadas para insertar: ${rows.length}\n`)

  // 3. Limpiar tabla existente (mantiene estructura e IDs fresh)
  console.log('🗑️  Limpiando tabla products...')
  const { error: delError } = await supabase
    .from('products')
    .delete()
    .neq('id', 0)   // borra todo

  if (delError) {
    console.error('❌ Error al limpiar tabla:', delError.message)
    process.exit(1)
  }
  console.log('   ✓ Tabla limpia\n')

  // 4. Insertar en batches de 50
  const BATCH = 50
  let inserted = 0
  let errors   = 0

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH)
    const { error } = await supabase.from('products').insert(batch)

    if (error) {
      console.error(`❌ Error en batch ${Math.floor(i / BATCH) + 1}:`, error.message)
      errors++
    } else {
      inserted += batch.length
      console.log(`   ✓ Batch ${Math.floor(i / BATCH) + 1}: ${batch.length} productos insertados`)
    }
  }

  console.log(`\n─────────────────────────────────────────`)
  console.log(`✨ Completado: ${inserted} insertados, ${errors} errores`)
  console.log(`─────────────────────────────────────────\n`)

  // 5. Verificar
  const { count } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })
  console.log(`📊 Total en tabla Supabase ahora: ${count} productos\n`)
}

run().catch(err => {
  console.error('💥 Error fatal:', err)
  process.exit(1)
})
