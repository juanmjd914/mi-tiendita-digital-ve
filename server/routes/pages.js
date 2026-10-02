import { Router } from 'express'
import { layout, organizationSchema, SITE_NAME } from '../views/layout.js'
import { getSettings } from '../settings.js'
import { notFoundBody, notFoundCss } from '../views/pages/notfound.js'
import { inicioBody } from '../views/pages/inicio.js'
import { getCatalog } from '../catalog-cache.js'
import { tiendaBody } from '../views/pages/tienda.js'
import { productoBody, productSchema } from '../views/pages/producto.js'
import { carritoBody } from '../views/pages/carrito.js'
import { checkoutBody } from '../views/pages/checkout.js'
import { graciasBody } from '../views/pages/gracias.js'
import { authBody, accountShell, datosInner, pedidosInner, direccionesInner, pagosInner, passwordInner, salirInner, favoritosInner } from '../views/pages/cuenta.js'
import { html } from '../views/html.js'
import { nosotrosBody } from '../views/pages/nosotros.js'
import { soporteBody, soporteFaq } from '../views/pages/soporte.js'
import { terminosBody, privacidadBody, devolucionesBody } from '../views/pages/legal.js'
import { adminPage } from '../views/pages/admin.js'

const router = Router()

const send = (res, page, status = 200) =>
  res.status(status).set('Content-Type', 'text/html; charset=utf-8').send(page)

router.get('/', async (_req, res, next) => {
  try {
    const [settings, catalog] = await Promise.all([getSettings(), getCatalog()])
    send(res, layout({
      active: 'inicio',
      settings,
      meta: {
        title: `${SITE_NAME} — Tecnología, audio y gaming en Rancagua`,
        description: 'Tienda de tecnología en Rancagua, Chile: audífonos, accesorios gamer, cables, iluminación y más. Pago seguro con Webpay y despacho a todo Chile.',
        path: '/',
        css: ['pages/inicio'],
        schema: [organizationSchema(settings), {
          '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: 'https://mitienditadigitalve.com',
          potentialAction: { '@type': 'SearchAction', target: 'https://mitienditadigitalve.com/tienda?search={q}', 'query-input': 'required name=q' },
        }],
      },
      body: inicioBody({ settings, catalog }),
      scripts: ['inicio'],
    }))
  } catch (err) { next(err) }
})

function categoriesOf(catalog) {
  const map = new Map()
  for (const p of catalog) if (p.category) map.set(p.category, (map.get(p.category) || 0) + 1)
  return [...map].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name, 'es'))
}

const one = (v) => (Array.isArray(v) ? v[0] : v) ? String(Array.isArray(v) ? v[0] : v).slice(0, 80) : ''

router.get('/tienda', async (req, res, next) => {
  try {
    const [settings, catalog] = await Promise.all([getSettings(), getCatalog()])
    const params = { cat: one(req.query.cat), search: one(req.query.search), badge: one(req.query.badge).toUpperCase(), orden: one(req.query.orden), pagina: one(req.query.pagina) }
    const filtered = Boolean(params.search || params.orden || params.pagina || params.badge)
    const title = params.cat ? `${params.cat} — ${SITE_NAME}` : `Tienda — ${SITE_NAME}`
    send(res, layout({
      active: 'tienda',
      settings,
      meta: {
        title,
        description: params.cat
          ? `Compra ${params.cat.toLowerCase()} en Mi Tiendita Digital Ve. Despacho a todo Chile desde Rancagua y pago seguro con Webpay.`
          : 'Catálogo de Mi Tiendita Digital Ve: audífonos, accesorios gamer, cables, cargadores y más. Despacho a todo Chile desde Rancagua.',
        path: params.cat ? `/tienda?cat=${encodeURIComponent(params.cat)}` : '/tienda',
        noindex: filtered,
        css: ['pages/tienda'],
      },
      body: tiendaBody({ catalog, params, categories: categoriesOf(catalog) }),
      scripts: ['tienda'],
    }))
  } catch (err) { next(err) }
})

router.get('/producto/:slug', async (req, res, next) => {
  try {
    const [settings, catalog] = await Promise.all([getSettings(), getCatalog()])
    const p = catalog.find((x) => x.slug === req.params.slug)
    if (!p) return renderNotFound(req, res)
    const related = catalog.filter((x) => x.id !== p.id && x.category === p.category).slice(0, 8)
    send(res, layout({
      active: 'tienda',
      settings,
      meta: {
        title: `${p.name} — ${SITE_NAME}`,
        description: (p.short_description || `Compra ${p.name} en Mi Tiendita Digital Ve.`) + ' Despacho a todo Chile y pago seguro con Webpay.',
        path: `/producto/${p.slug}`,
        image: p.img_url,
        css: ['pages/tienda', 'pages/producto'],
        schema: productSchema(p, settings),
      },
      body: productoBody({ p, related, settings }),
      scripts: ['producto'],
    }))
  } catch (err) { next(err) }
})

router.get('/carrito', async (_req, res, next) => {
  try {
    const settings = await getSettings()
    send(res, layout({
      settings,
      meta: { title: `Carrito — ${SITE_NAME}`, description: 'Revisa los productos de tu carrito.', path: '/carrito', noindex: true, css: ['pages/carrito'] },
      body: carritoBody(),
      scripts: ['carrito'],
    }))
  } catch (err) { next(err) }
})

router.get('/checkout', async (_req, res, next) => {
  try {
    const settings = await getSettings()
    send(res, layout({
      settings,
      showBenefits: false,
      meta: { title: `Checkout — ${SITE_NAME}`, description: 'Completa tu compra de forma segura.', path: '/checkout', noindex: true, css: ['pages/checkout'] },
      body: checkoutBody({ settings }),
      scripts: ['checkout'],
    }))
  } catch (err) { next(err) }
})

// Retorno de Flow (GET con ?token) y confirmación de transferencia / contra entrega (?pedido).
router.get('/pago/resultado', async (_req, res, next) => {
  try {
    const settings = await getSettings()
    send(res, layout({
      settings,
      meta: { title: `Confirmación de pedido — ${SITE_NAME}`, description: 'Estado de tu pedido.', path: '/pago/resultado', noindex: true, css: ['pages/checkout', 'pages/gracias'] },
      body: graciasBody({ settings }),
      scripts: ['gracias'],
    }))
  } catch (err) { next(err) }
})

router.get('/nosotros', async (_req, res, next) => {
  try {
    const [settings, catalog] = await Promise.all([getSettings(), getCatalog()])
    const counts = new Map()
    for (const p of catalog) if (p.brand) counts.set(p.brand, (counts.get(p.brand) || 0) + 1)
    const brands = [...counts].sort((a, b) => b[1] - a[1]).map(([b]) => b).slice(0, 10)
    send(res, layout({
      active: 'nosotros', settings,
      meta: { title: `Nosotros — ${SITE_NAME}`, description: 'Conoce Mi Tiendita Digital Ve, tienda de tecnología en Rancagua con despacho a todo Chile, garantía y atención por WhatsApp.', path: '/nosotros', css: ['pages/inicio', 'pages/nosotros'], schema: [organizationSchema(settings)] },
      body: nosotrosBody({ settings, brands }),
    }))
  } catch (err) { next(err) }
})

router.get('/soporte', async (_req, res, next) => {
  try {
    const settings = await getSettings()
    send(res, layout({
      active: 'soporte', settings,
      meta: {
        title: `Centro de soporte — ${SITE_NAME}`,
        description: 'Ayuda con pedidos, despachos, garantías y pagos en Mi Tiendita Digital Ve. Consulta tu pedido o escríbenos por WhatsApp.',
        path: '/soporte', css: ['pages/inicio', 'pages/checkout', 'pages/producto', 'pages/nosotros'],
        schema: [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: soporteFaq(settings).map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }],
      },
      body: soporteBody({ settings }),
      scripts: ['soporte'],
    }))
  } catch (err) { next(err) }
})

// ---------- Legales ----------
const LEGAL_PAGES = {
  '/terminos-y-condiciones': ['Términos y Condiciones', terminosBody, 'Términos y condiciones de compra en Mi Tiendita Digital Ve: pagos, despacho, garantía legal y atención al cliente.'],
  '/politica-de-privacidad': ['Política de Privacidad', privacidadBody, 'Cómo Mi Tiendita Digital Ve trata tus datos personales conforme a la Ley 19.628 y la Ley 21.719.'],
  '/politica-de-cambios-y-devoluciones': ['Cambios, devoluciones y garantía', devolucionesBody, 'Garantía legal de 6 meses, cambios y devoluciones en Mi Tiendita Digital Ve.'],
}
for (const [path, [title, body, description]] of Object.entries(LEGAL_PAGES)) {
  router.get(path, async (_req, res, next) => {
    try {
      const settings = await getSettings()
      send(res, layout({
        settings,
        meta: { title: `${title} — ${SITE_NAME}`, description, path, css: ['pages/legal'] },
        body: body(settings),
      }))
    } catch (err) { next(err) }
  })
}

// ---------- Cuenta: acceso ----------
const AUTH_PAGES = {
  '/cuenta/login': ['login', 'Iniciar sesión'],
  '/cuenta/registro': ['registro', 'Crear cuenta'],
  '/cuenta/recuperar-password': ['recuperar', 'Recuperar contraseña'],
  '/cuenta/nueva-password': ['nueva', 'Nueva contraseña'],
}
for (const [path, [kind, title]] of Object.entries(AUTH_PAGES)) {
  router.get(path, async (_req, res, next) => {
    try {
      const settings = await getSettings()
      send(res, layout({
        settings, showBenefits: false,
        meta: { title: `${title} — ${SITE_NAME}`, description: 'Accede a tu cuenta de Mi Tiendita Digital Ve.', path, noindex: true, css: ['pages/checkout', 'pages/cuenta'] },
        body: authBody(kind),
        scripts: ['auth'],
      }))
    } catch (err) { next(err) }
  })
}

// ---------- Cuenta: secciones ----------
const ACCOUNT_PAGES = {
  '/cuenta': ['datos', 'Datos personales', () => datosInner],
  '/cuenta/pedidos': ['pedidos', 'Mis pedidos', () => pedidosInner],
  '/cuenta/direcciones': ['direcciones', 'Mis direcciones', () => direccionesInner],
  '/cuenta/medios-de-pago': ['pagos', 'Medios de pago', (s) => pagosInner(s)],
  '/cuenta/contrasena': ['password', 'Contraseña', () => passwordInner],
  '/cuenta/salir': ['salir', 'Cerrar sesión', () => salirInner],
}
for (const [path, [section, title, inner]] of Object.entries(ACCOUNT_PAGES)) {
  router.get(path, async (_req, res, next) => {
    try {
      const settings = await getSettings()
      send(res, layout({
        settings,
        meta: { title: `${title} — ${SITE_NAME}`, description: 'Tu cuenta en Mi Tiendita Digital Ve.', path, noindex: true, css: ['pages/checkout', 'pages/cuenta'] },
        body: accountShell(section, title, inner(settings)),
        scripts: ['cuenta'],
      }))
    } catch (err) { next(err) }
  })
}

router.get('/favoritos', async (_req, res, next) => {
  try {
    const settings = await getSettings()
    send(res, layout({
      settings,
      meta: { title: `Favoritos — ${SITE_NAME}`, description: 'Tus productos favoritos.', path: '/favoritos', noindex: true, css: ['pages/inicio', 'pages/tienda', 'pages/cuenta'] },
      body: html`<section class="page-hero"><div class="wrap"><nav aria-label="Miga de pan"><ol class="breadcrumb"><li><a href="/">Inicio</a></li><li data-account-crumb hidden><a href="/cuenta">Mi cuenta</a></li><li>Favoritos</li></ol></nav><h1>Mis favoritos</h1>
<a class="btn btn--ghost btn--sm back-account" href="/cuenta" data-account-back hidden>← Volver a Mi cuenta</a></div></section>
<section class="wrap section favs">${favoritosInner}</section>`,
      scripts: ['favoritos'],
    }))
  } catch (err) { next(err) }
})

// Panel de administración
router.get('/admin', (_req, res) => {
  res.set('X-Robots-Tag', 'noindex, nofollow')
  send(res, String(adminPage()))
})
// Compatibilidad con la ruta antigua del panel
router.get('/ADMIN', (_req, res) => res.redirect(301, '/admin'))

export async function renderNotFound(_req, res) {
  const settings = await getSettings()
  send(res, layout({
    settings,
    meta: { title: `Página no encontrada — ${SITE_NAME}`, description: 'La página que buscas no existe.', path: '/404', noindex: true, css: [notFoundCss] },
    body: notFoundBody(),
  }), 404)
}

export default router
