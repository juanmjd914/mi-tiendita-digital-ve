/**
 * migrate-images.js
 * Descarga las imágenes de productos desde el CDN de WordPress
 * y las sube al bucket "productos" de Supabase Storage.
 * Luego actualiza el campo img_url de cada producto.
 *
 * Uso:  node scripts/migrate-images.js
 *       node scripts/migrate-images.js --dry-run   (solo lista, no descarga)
 *
 * Requiere Node ≥ 18 (fetch nativo) y las variables de entorno del .env
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

// ── Config ────────────────────────────────────────────────────────────────
const BUCKET       = 'productos'          // nombre del bucket en Supabase Storage
const WP_HOSTNAME  = 'mitienditadigitalve.com'
const CONCURRENCY  = 3                   // cuántas descargas en paralelo
const DRY_RUN      = process.argv.includes('--dry-run')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ── Helpers ───────────────────────────────────────────────────────────────

/** Extrae la ruta relativa de una URL de WordPress para usarla como filename */
function buildStoragePath(wpUrl) {
  try {
    const u = new URL(wpUrl)
    // wp-content/uploads/YYYY/MM/filename.webp → uploads/YYYY/MM/filename.webp
    const parts = u.pathname.replace('/wp-content/', '')
    return parts  // ej: uploads/2021/12/Gabinete-MX410T-6.webp
  } catch {
    return null
  }
}

/** Descarga una URL y devuelve un ArrayBuffer */
async function downloadImage(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mi-Tiendita-Migrator/1.0' },
    signal:  AbortSignal.timeout(30_000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status} al descargar ${url}`)
  return Buffer.from(await res.arrayBuffer())
}

/** Deriva el contentType a partir de la extensión del archivo */
function getContentType(filename) {
  const ext = filename.split('.').pop()?.toLowerCase()
  const map  = { webp: 'image/webp', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif' }
  return map[ext] ?? 'image/webp'
}

/** Sube un buffer al Storage y devuelve la URL pública */
async function uploadToStorage(storagePath, buffer, contentType) {
  // Intentar subir; si el archivo ya existe, sobreescribir
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType,
      upsert: true,
    })

  if (error) throw new Error(`Storage upload error: ${error.message}`)

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

/** Procesa un lote de promesas con concurrencia limitada */
async function runWithConcurrency(tasks, concurrency) {
  const results = []
  let   idx     = 0

  async function worker() {
    while (idx < tasks.length) {
      const i    = idx++
      results[i] = await tasks[i]()
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, worker)
  await Promise.all(workers)
  return results
}

// ── Ensure bucket exists ───────────────────────────────────────────────────
async function ensureBucket() {
  const { data: buckets, error } = await supabase.storage.listBuckets()
  if (error) throw new Error(`No se pudo listar buckets: ${error.message}`)

  const exists = buckets?.some(b => b.name === BUCKET)
  if (!exists) {
    const { error: createErr } = await supabase.storage.createBucket(BUCKET, { public: true })
    if (createErr) throw new Error(`No se pudo crear bucket "${BUCKET}": ${createErr.message}`)
    console.log(`🪣  Bucket "${BUCKET}" creado (público)\n`)
  } else {
    console.log(`🪣  Bucket "${BUCKET}" encontrado\n`)
  }
}

// ── Main ──────────────────────────────────────────────────────────────────
async function run() {
  console.log('════════════════════════════════════════')
  console.log('  Mi Tiendita Digital Ve — Image Migrator')
  if (DRY_RUN) console.log('  🔍 MODO DRY RUN (sin cambios reales)')
  console.log('════════════════════════════════════════\n')

  // 1. Obtener todos los productos con imagen de WordPress
  console.log('📦 Obteniendo productos desde Supabase...')
  const { data: products, error: fetchErr } = await supabase
    .from('products')
    .select('id, name, img_url')
    .not('img_url', 'is', null)

  if (fetchErr) throw new Error(`Error al obtener productos: ${fetchErr.message}`)
  if (!products?.length) { console.log('No hay productos con img_url'); return }

  // Filtrar solo las que apuntan al CDN de WordPress
  const wpProducts = products.filter(p => {
    try { return new URL(p.img_url).hostname.includes(WP_HOSTNAME) }
    catch { return false }
  })

  const alreadyMigrated = products.filter(p => {
    try { return new URL(p.img_url).hostname.includes('supabase.co') }
    catch { return false }
  })

  console.log(`  Total productos: ${products.length}`)
  console.log(`  Con imagen WordPress (por migrar): ${wpProducts.length}`)
  console.log(`  Ya migradas a Supabase: ${alreadyMigrated.length}\n`)

  if (wpProducts.length === 0) {
    console.log('✨ Todas las imágenes ya están en Supabase Storage. ¡Nada que hacer!')
    return
  }

  if (DRY_RUN) {
    console.log('── Imágenes que se migrarían ──')
    wpProducts.forEach((p, i) => {
      const path = buildStoragePath(p.img_url)
      console.log(`  ${i + 1}. [${p.id}] ${p.name}`)
      console.log(`      Origen:  ${p.img_url}`)
      console.log(`      Destino: ${BUCKET}/${path}`)
    })
    console.log('\n🔍 Dry run completado. Ejecuta sin --dry-run para migrar.')
    return
  }

  // 2. Asegurar que el bucket existe
  await ensureBucket()

  // 3. Migrar imágenes con concurrencia limitada
  let ok  = 0
  let err = 0

  const tasks = wpProducts.map(product => async () => {
    const storagePath = buildStoragePath(product.img_url)
    if (!storagePath) {
      console.error(`  ⚠️  [${product.id}] URL inválida: ${product.img_url}`)
      err++
      return
    }

    const filename    = storagePath.split('/').pop()
    const contentType = getContentType(filename)

    try {
      process.stdout.write(`  ⬇️  [${product.id}] ${product.name} ...`)

      // Descargar
      const buffer   = await downloadImage(product.img_url)
      const sizeKB   = Math.round(buffer.length / 1024)
      process.stdout.write(` (${sizeKB} KB) `)

      // Subir a Storage
      const publicUrl = await uploadToStorage(storagePath, buffer, contentType)

      // Actualizar img_url en la tabla
      const { error: updateErr } = await supabase
        .from('products')
        .update({ img_url: publicUrl })
        .eq('id', product.id)

      if (updateErr) throw new Error(updateErr.message)

      console.log(`✅`)
      console.log(`      ${publicUrl}`)
      ok++
    } catch (e) {
      console.log(`❌`)
      console.error(`      Error: ${e.message}`)
      err++
    }
  })

  console.log(`🚀 Migrando ${wpProducts.length} imagen${wpProducts.length !== 1 ? 'es' : ''} (${CONCURRENCY} en paralelo)...\n`)
  await runWithConcurrency(tasks, CONCURRENCY)

  // 4. Resumen
  console.log('\n════════════════════════════════════════')
  console.log(`  ✅ Migradas con éxito: ${ok}`)
  if (err > 0) console.log(`  ❌ Con errores:        ${err}`)
  console.log('════════════════════════════════════════')

  if (ok > 0) {
    console.log('\n✨ Migración completada. Las URLs en la base de datos han sido actualizadas.')
    console.log(`   Bucket: ${process.env.SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`)
  }
  if (err > 0) {
    console.log('\n⚠️  Algunas imágenes fallaron. Vuelve a ejecutar el script para reintentar.')
  }
}

run().catch(e => {
  console.error('\n❌ Error fatal:', e.message)
  process.exit(1)
})
