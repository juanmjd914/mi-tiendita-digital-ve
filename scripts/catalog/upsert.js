// Carga/actualiza en Supabase los productos aprobados (catalog/products/*.json) por slug.
// No toca el stock de productos que ya existen (lo maneja Juan desde el admin).
// Uso: node scripts/catalog/upsert.js [slug ...]
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const DIR = path.join(ROOT, 'catalog/products')
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const only = new Set(process.argv.slice(2))

const url = (slug, n) => `/img/productos/${slug}/${n}.webp`

let created = 0, updated = 0
for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith('.json')).sort()) {
  const p = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'))
  if (only.size && !only.has(p.slug)) continue
  const map = JSON.parse(fs.readFileSync(path.join(ROOT, 'web/img/productos', p.slug, 'map.json'), 'utf8'))
  const gallery = p.photos.map((f) => url(p.slug, map[f]))

  const row = {
    slug: p.slug, name: p.name, brand: p.brand || null, category: p.category,
    price: p.price, original_price: p.original_price || null,
    short_description: p.short_description, description: p.description || p.short_description,
    badge: p.badge || null, img_url: gallery[0], gallery, specs: p.specs || [],
    warranty: p.warranty || null, sku: p.sku || null, featured: !!p.featured, active: true,
  }
  const { data: existing } = await db.from('products').select('id').eq('slug', p.slug).maybeSingle()
  let id
  if (existing) {
    const { error } = await db.from('products').update(row).eq('id', existing.id)
    if (error) throw new Error(`${p.slug}: ${error.message}`)
    id = existing.id; updated++
  } else {
    const { data, error } = await db.from('products').insert({ ...row, stock: p.stock ?? 0 }).select('id').single()
    if (error) throw new Error(`${p.slug}: ${error.message}`)
    id = data.id; created++
  }

  for (const [i, v] of (p.variants || []).entries()) {
    const vgallery = v.photos.map((f) => url(p.slug, map[f]))
    const vrow = { product_id: id, kind: p.variant_kind || 'Color', label: v.label, sort_order: i, img_url: vgallery[0], gallery: vgallery, price: v.price ?? null, original_price: v.original_price ?? null, active: true }
    const { data: ev } = await db.from('product_variants').select('id').eq('product_id', id).eq('label', v.label).maybeSingle()
    const { error } = ev
      ? await db.from('product_variants').update(vrow).eq('id', ev.id)
      : await db.from('product_variants').insert({ ...vrow, stock: v.stock ?? 0 })
    if (error) throw new Error(`${p.slug} / ${v.label}: ${error.message}`)
  }
  console.log(`✓ ${p.slug}`)
}
console.log(`Creados: ${created} · Actualizados: ${updated}`)
