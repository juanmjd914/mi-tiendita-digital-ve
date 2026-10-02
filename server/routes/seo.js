// Archivos para buscadores: robots.txt, sitemap.xml, feed de Google Merchant Center y llms.txt.
import { Router } from 'express'
import { getCatalog } from '../catalog-cache.js'
import { getSettings } from '../settings.js'
import { escapeHtml as x } from '../views/html.js'
import { ORIGIN, SITE_NAME } from '../views/layout.js'
import { SOCIAL, HOURS, HOURS_CLOSED, hoursLine } from '../store-info.js'

const router = Router()
const abs = (u) => (!u ? '' : u.startsWith('http') ? u : ORIGIN + u)
const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10))
const cache = (res, type) => res.set({ 'Content-Type': type, 'Cache-Control': 'public, max-age=3600' })

const STATIC_PAGES = [
  ['/', 'daily', '1.0'],
  ['/tienda', 'daily', '0.9'],
  ['/nosotros', 'monthly', '0.5'],
  ['/soporte', 'monthly', '0.6'],
  ['/terminos-y-condiciones', 'yearly', '0.2'],
  ['/politica-de-privacidad', 'yearly', '0.2'],
  ['/politica-de-cambios-y-devoluciones', 'yearly', '0.3'],
]
const PRIVATE = ['/admin', '/api/', '/carrito', '/checkout', '/cuenta', '/favoritos', '/pago/']
// Buscadores e IA a los que se permite el acceso explícitamente (además de la regla general).
const BOTS = ['Googlebot', 'Google-Extended', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Applebot', 'Applebot-Extended', 'DuckDuckBot']

router.get('/robots.txt', (_req, res) => {
  const rules = (agent) => [`User-agent: ${agent}`, 'Allow: /', ...PRIVATE.map((p) => `Disallow: ${p}`), ''].join('\n')
  cache(res, 'text/plain; charset=utf-8').send([
    `# ${SITE_NAME} — ${ORIGIN}`,
    rules('*'),
    ...BOTS.map(rules),
    `Sitemap: ${ORIGIN}/sitemap.xml`,
    '',
  ].join('\n'))
})

router.get('/sitemap.xml', async (_req, res, next) => {
  try {
    const catalog = await getCatalog()
    const latest = catalog.reduce((m, p) => (p.updated_at > m ? p.updated_at : m), '')
    const categories = [...new Set(catalog.map((p) => p.category).filter(Boolean))]
    const url = (loc, { lastmod, freq, prio, images = [] }) => `<url><loc>${x(loc)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}${freq ? `<changefreq>${freq}</changefreq>` : ''}${prio ? `<priority>${prio}</priority>` : ''}${images.map((i) => `<image:image><image:loc>${x(abs(i))}</image:loc></image:image>`).join('')}</url>`
    const body = [
      ...STATIC_PAGES.map(([p, freq, prio]) => url(ORIGIN + p, { lastmod: p === '/' || p === '/tienda' ? day(latest) : undefined, freq, prio })),
      ...categories.map((c) => url(`${ORIGIN}/tienda?cat=${encodeURIComponent(c)}`, { lastmod: day(latest), freq: 'weekly', prio: '0.7' })),
      ...catalog.map((p) => url(`${ORIGIN}/producto/${p.slug}`, { lastmod: day(p.updated_at), freq: 'weekly', prio: '0.8', images: (p.gallery?.length ? p.gallery : [p.img_url]).filter(Boolean).slice(0, 5) })),
    ]
    cache(res, 'application/xml; charset=utf-8').send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${body.join('\n')}
</urlset>`)
  } catch (err) { next(err) }
})

// Feed RSS 2.0 para Google Merchant Center. Productos con variantes → un ítem por variante
// agrupados con item_group_id. Precio con IVA incluido en CLP.
router.get('/feed/google-merchant.xml', async (_req, res, next) => {
  try {
    const catalog = await getCatalog()
    const items = []
    for (const p of catalog) {
      const images = (p.gallery?.length ? p.gallery : [p.img_url]).filter(Boolean).map(abs)
      const rows = p.variants?.length
        ? p.variants.map((v) => ({ id: `${p.id}-${v.id}`, title: `${p.name} — ${v.label}`, price: v.price ?? p.price, original: v.original_price ?? p.original_price, stock: v.stock, image: abs(v.img_url) || images[0], extra: (v.gallery?.length ? v.gallery.map(abs) : images).filter((i) => i !== (abs(v.img_url) || images[0])), group: String(p.id), variant: v }))
        : [{ id: String(p.id), title: p.name, price: p.price, original: p.original_price, stock: p.stock, image: images[0], extra: images.slice(1) }]
      for (const r of rows) {
        const onSale = r.original && r.original > r.price
        const tags = [
          `<g:id>${x(r.id)}</g:id>`,
          `<g:title>${x(r.title.slice(0, 150))}</g:title>`,
          `<g:description>${x((p.description || p.short_description || p.name).slice(0, 5000))}</g:description>`,
          `<g:link>${x(`${ORIGIN}/producto/${p.slug}`)}</g:link>`,
          r.image ? `<g:image_link>${x(r.image)}</g:image_link>` : '',
          ...r.extra.slice(0, 10).map((i) => `<g:additional_image_link>${x(i)}</g:additional_image_link>`),
          `<g:availability>${(r.stock ?? 0) > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>`,
          `<g:price>${onSale ? r.original : r.price} CLP</g:price>`,
          onSale ? `<g:sale_price>${r.price} CLP</g:sale_price>` : '',
          '<g:condition>new</g:condition>',
          p.brand ? `<g:brand>${x(p.brand)}</g:brand>` : '',
          p.gtin ? `<g:gtin>${x(p.gtin)}</g:gtin>` : '',
          !p.gtin ? '<g:identifier_exists>no</g:identifier_exists>' : '',
          p.category ? `<g:product_type>${x(p.category)}</g:product_type>` : '',
          r.group ? `<g:item_group_id>${x(r.group)}</g:item_group_id>` : '',
          r.variant && /color/i.test(r.variant.kind || '') ? `<g:color>${x(r.variant.label)}</g:color>` : '',
          r.variant && !/color/i.test(r.variant.kind || '') ? `<g:size>${x(r.variant.label)}</g:size>` : '',
        ].filter(Boolean)
        items.push(`<item>\n${tags.join('\n')}\n</item>`)
      }
    }
    cache(res, 'application/xml; charset=utf-8').send(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>${x(SITE_NAME)}</title>
<link>${ORIGIN}</link>
<description>Catálogo de ${x(SITE_NAME)}, tienda de tecnología en Rancagua, Chile.</description>
${items.join('\n')}
</channel>
</rss>`)
  } catch (err) { next(err) }
})

// llms.txt: resumen en Markdown para asistentes y buscadores con IA.
router.get('/llms.txt', async (_req, res, next) => {
  try {
    const [catalog, s] = await Promise.all([getCatalog(), getSettings()])
    const clp = (n) => `$${Number(n).toLocaleString('es-CL')}`
    const byCat = new Map()
    for (const p of catalog) {
      if (!byCat.has(p.category)) byCat.set(p.category, [])
      byCat.get(p.category).push(p)
    }
    const cats = [...byCat.keys()].sort((a, b) => a.localeCompare(b, 'es'))
    const lines = [
      `# ${SITE_NAME}`,
      '',
      `> Tienda online de tecnología con base en ${s.local_city || 'Rancagua'}, Región de O'Higgins, Chile. Vende audífonos, parlantes, accesorios gamer, teclados y mouse, cables y adaptadores, cargadores, webcams, iluminación y accesorios para celular y notebook. Precios en pesos chilenos (CLP) con IVA incluido.`,
      '',
      '## Compra y despacho',
      '',
      `- Pagos: Webpay (tarjetas de débito y crédito, vía Flow), transferencia bancaria y pago contra entrega (solo delivery en ${s.local_city || 'Rancagua'}).`,
      `- Despacho: retiro gratis en tienda, delivery en ${s.local_city || 'Rancagua'} (24 a 48 horas hábiles) y envío a todas las regiones de Chile (5 a 8 días hábiles).`,
      Number(s.free_shipping_min_rancagua) > 0 ? `- Envío gratis en ${s.local_city || 'Rancagua'} en compras desde ${clp(s.free_shipping_min_rancagua)}.` : '',
      '- Garantía legal de 6 meses por fallas de fabricación (Ley 19.496). Los productos no admiten derecho a retracto.',
      `- Contacto: ${s.contact_email} · WhatsApp +${String(s.contact_whatsapp).replace(/\D/g, '')}`,
      `- Horario de atención: ${HOURS.map(hoursLine).join('; ')}. ${HOURS_CLOSED}.`,
      `- Redes: ${SOCIAL.map(([, n, u]) => `[${n}](${u})`).join(' · ')}`,
      '',
      '## Páginas principales',
      '',
      `- [Tienda](${ORIGIN}/tienda): catálogo completo con filtros por categoría.`,
      `- [Centro de soporte](${ORIGIN}/soporte): preguntas frecuentes, consulta de pedidos y contacto.`,
      `- [Nosotros](${ORIGIN}/nosotros)`,
      `- [Términos y Condiciones](${ORIGIN}/terminos-y-condiciones)`,
      `- [Cambios, devoluciones y garantía](${ORIGIN}/politica-de-cambios-y-devoluciones)`,
      `- [Política de Privacidad](${ORIGIN}/politica-de-privacidad)`,
      '',
      '## Catálogo',
      '',
      ...cats.flatMap((c) => [
        `### ${c}`,
        '',
        ...byCat.get(c).map((p) => `- [${p.name}](${ORIGIN}/producto/${p.slug}): ${clp(p.price)}${(p.stock ?? 0) > 0 ? '' : ' (sin stock por ahora)'}${p.short_description ? ` — ${p.short_description}` : ''}`),
        '',
      ]),
    ].filter((l) => l !== null)
    cache(res, 'text/plain; charset=utf-8').send(lines.join('\n'))
  } catch (err) { next(err) }
})

export default router
