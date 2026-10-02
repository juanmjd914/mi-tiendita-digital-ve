// Miniaturas JPG para los correos (Gmail/Outlook no muestran bien WebP y el correo necesita
// imágenes en una URL pública siempre disponible). Toma web/img/productos/<slug>/<n>.webp,
// genera <n>.jpg de 160×160 con fondo blanco y lo sube a Supabase Storage en email/<slug>/<n>.jpg.
// Idempotente (upsert). Correr después de agregar productos con optimize-images.js.
// Uso: node scripts/catalog/email-thumbs.js [slug ...]
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const DIR = path.join(ROOT, 'web/img/productos')
const BUCKET = 'MI TIENDITA DIGITAL VE'
const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const only = new Set(process.argv.slice(2))

let done = 0
let failed = 0
for (const slug of fs.readdirSync(DIR)) {
  if (only.size && !only.has(slug)) continue
  const files = fs.readdirSync(path.join(DIR, slug)).filter((f) => /^\d+\.webp$/.test(f))
  for (const f of files) {
    const buf = await sharp(path.join(DIR, slug, f))
      .resize(160, 160, { fit: 'contain', background: '#ffffff' })
      .flatten({ background: '#ffffff' })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer()
    const { error } = await db.storage.from(BUCKET).upload(`email/${slug}/${f.replace('.webp', '.jpg')}`, buf, { contentType: 'image/jpeg', upsert: true, cacheControl: '31536000' })
    if (error) { failed++; console.error(`✗ ${slug}/${f}: ${error.message}`) } else done++
  }
}
console.log(`Miniaturas subidas: ${done}${failed ? ` · con error: ${failed}` : ''}`)
