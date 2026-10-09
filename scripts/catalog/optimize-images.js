// Optimiza las fotos de los productos aprobados (catalog/products/*.json):
// web/img/productos/<slug>/<n>.webp (máx 1200px) + <n>-400.webp (miniatura).
// Uso: node scripts/catalog/optimize-images.js [slug ...]
import fs from 'fs'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
// Fotos originales de los productos: carpeta `material/productos` dentro del proyecto (no se sube a git)
const SRC = process.env.PHOTOS_DIR || path.join(ROOT, 'material/productos')
const DIR = path.join(ROOT, 'catalog/products')
const only = new Set(process.argv.slice(2))

async function out(src, dest, size, quality) {
  await sharp(src)
    .rotate()
    .resize(size, size, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 }, withoutEnlargement: false })
    .flatten({ background: '#ffffff' })
    .webp({ quality, effort: 5 })
    .toFile(dest)
}

let count = 0
for (const file of fs.readdirSync(DIR).filter((f) => f.endsWith('.json'))) {
  const p = JSON.parse(fs.readFileSync(path.join(DIR, file), 'utf8'))
  if (only.size && !only.has(p.slug)) continue
  const dest = path.join(ROOT, 'web/img/productos', p.slug)
  fs.mkdirSync(dest, { recursive: true })
  const groups = [{ files: p.photos }, ...(p.variants || []).map((v) => ({ files: v.photos }))]
  const all = [...new Set(groups.flatMap((g) => g.files))]
  for (let i = 0; i < all.length; i++) {
    const src = path.join(SRC, all[i])
    const n = i + 1
    await out(src, path.join(dest, `${n}.webp`), 1200, 82)
    await out(src, path.join(dest, `${n}-400.webp`), 400, 78)
    count++
  }
  // Mapa nombre original → número, para que upsert.js arme las URLs
  fs.writeFileSync(path.join(dest, 'map.json'), JSON.stringify(Object.fromEntries(all.map((f, i) => [f, i + 1])), null, 2))
}
console.log(`Imágenes optimizadas: ${count}`)
