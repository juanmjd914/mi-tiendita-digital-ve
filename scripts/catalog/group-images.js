// Agrupa las fotos de la carpeta de productos en borradores de producto y los cruza
// con el catálogo anterior (catalog/legacy-products.json) para sugerir precio y datos.
// Uso: node scripts/catalog/group-images.js "<carpeta de fotos>"
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
// Fotos originales de los productos: carpeta `material/productos` dentro del proyecto (no se sube a git)
const SRC = process.argv[2] || path.join(ROOT, 'material/productos')
const LEGACY = JSON.parse(fs.readFileSync(path.join(ROOT, 'catalog/legacy-products.json'), 'utf8'))

const deaccent = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
export const slugify = (s) => deaccent(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)

// Nombre base: sin extensión, sin "(2)", sin ruido "720x720", espacios normalizados.
function baseName(file) {
  return path.parse(file).name
    .replace(/\s*\(\d+\)\s*$/, '')
    .replace(/\s*720\s*x\s*720\d*/i, '')
    .replace(/\s+/g, ' ')
    .trim()
}
const key = (s) => deaccent(s).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

// Un archivo es foto extra de un grupo si su nombre = base del grupo + sufijo numérico corto
// (1, 12, 123, 2, P, NUE…) o variantes "Ultra1 azul".
function belongsTo(fileKey, groupKey) {
  if (fileKey === groupKey) return true
  if (!fileKey.startsWith(groupKey)) return false
  const rest = fileKey.slice(groupKey.length).trim()
  return /^(\d{1,4}|p\d*|nue|\d+\s?\d*)$/.test(rest)
}

const files = fs.readdirSync(SRC)
  .filter((f) => /\.(webp|jpe?g|png)$/i.test(f))
  .filter((f, _, all) => !(/\.jpe?g$/i.test(f) && all.includes(f.replace(/\.jpe?g$/i, '.webp')))) // preferir webp
  .sort((a, b) => key(baseName(a)).localeCompare(key(baseName(b))) || a.length - b.length)

const groups = []
for (const f of files) {
  const k = key(baseName(f))
  const g = groups.find((gr) => belongsTo(k, gr.key))
  if (g) g.files.push(f)
  else groups.push({ key: k, name: baseName(f), files: [f] })
}

// Categoría sugerida por palabras clave
const CATS = [
  ['Audífonos', /audif|audifin|earbud|manos libres|headset/],
  ['Gaming', /gamer|gaming|joystick|control bluetooth ps4|fiddler|redragon|monster crew|kit monster/],
  ['Teclados y mouse', /teclado|mouse(?!pad)|combo/],
  ['Mousepads', /mousepad/],
  ['Parlantes', /parlante|speaker|bazooka/],
  ['Micrófonos y streaming', /microfono|micrófono|lavalier|stand para streaming|soporte para microfono|tarjeta de sonido/],
  ['Webcams', /webcam|camara/],
  ['Cables y adaptadores', /cable|adaptador|plug a plug|hdmi|vga|rca|componente|micro usb|dongle|minihub|receptor wifi|bluetooth 5|bt philips|conversor/],
  ['Cargadores y energía', /cargador|power ?bank|general power|pilas/],
  ['Enchufes y extensiones', /enchufe|enchufhe|extension multiple|smart plug/],
  ['Iluminación y fotografía', /aro de luz|lampara|tripode|trípode|selfie|monopode/],
  ['Accesorios para celular', /soporte (celular|magnetico|de rejilla|smartphone)|soporte celular|correa|smartband|reloj/],
  ['Accesorios notebook y PC', /bandeja|ventilador notebook|cofre|pendrive|kit limpieza|set limpieza|teclado numerico/],
  ['Gabinetes', /gabinete|mx350|mx410|cougar|crimson/],
  ['Hogar y oficina', /telefono|telef|control remoto|antena|balanza|detector de billetes|soporte de tv|reloj/],
  ['Ciclismo y outdoor', /bicicleta|ciclismo|body glove/],
]
function guessCategory(name) {
  const n = key(name)
  return (CATS.find(([, re]) => re.test(n)) || ['Otros'])[0]
}
const BRANDS = ['Philips', 'Philco', 'HP', 'Redragon', 'Monster', 'Motorola', 'Genius', 'Logitech', 'Kingston', 'Cougar', 'Fiddler', 'Ultra', 'Body Glove', 'Master G', 'Sony', 'Samsung', 'Magnavox', 'Kensington', 'Fortlink', 'Asus', 'Acer', 'Lenovo', 'Toshiba', 'Prosound']
function guessBrand(name) {
  const n = key(name)
  return BRANDS.find((b) => new RegExp(`\\b${key(b)}\\b`).test(n)) || null
}

// Coincidencia con el catálogo anterior por solapamiento de palabras significativas
const STOP = new Set(['de', 'para', 'con', 'y', 'a', 'el', 'la', 'tipo', 'usb', 'mts', 'the'])
const tokens = (s) => new Set(key(s).split(' ').filter((t) => t.length > 1 && !STOP.has(t)))
function bestLegacy(name) {
  const a = tokens(name)
  let best = null
  for (const p of LEGACY) {
    const b = tokens(p.name)
    const inter = [...a].filter((t) => b.has(t)).length
    const score = inter / Math.max(1, Math.min(a.size, b.size))
    if (!best || score > best.score) best = { score, p }
  }
  return best && best.score >= 0.6 ? best : null
}

const drafts = groups.map((g, i) => {
  const legacy = bestLegacy(g.name)
  return {
    n: i + 1,
    draft_name: g.name,
    slug: slugify(g.name),
    category: legacy?.p.category && legacy.score >= 0.8 ? legacy.p.category : guessCategory(g.name),
    category_guess: guessCategory(g.name),
    brand: legacy?.p.brand || guessBrand(g.name),
    files: g.files,
    legacy_match: legacy ? {
      score: Number(legacy.score.toFixed(2)), id: legacy.p.id, name: legacy.p.name,
      price: legacy.p.price, original_price: legacy.p.original_price, stock: legacy.p.stock,
    } : null,
  }
})

fs.mkdirSync(path.join(ROOT, 'catalog'), { recursive: true })
fs.writeFileSync(path.join(ROOT, 'catalog/drafts.json'), JSON.stringify(drafts, null, 2))

const withPrice = drafts.filter((d) => d.legacy_match).length
console.log(`Fotos: ${files.length} · Productos (borrador): ${drafts.length} · Con precio de referencia: ${withPrice} · Sin referencia: ${drafts.length - withPrice}`)
const byCat = {}
for (const d of drafts) byCat[d.category_guess] = (byCat[d.category_guess] || 0) + 1
console.log(byCat)
