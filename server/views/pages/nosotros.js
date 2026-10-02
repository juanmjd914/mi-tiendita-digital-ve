import { html } from '../html.js'
import { icon } from '../icons.js'
import { waLink } from '../layout.js'
import { clp } from '../partials/product.js'

export function nosotrosBody({ settings, brands }) {
  const city = settings.local_city || 'Rancagua'
  const pillars = [
    ['shield', 'Calidad garantizada', 'Productos de marcas reconocidas y garantía legal de 6 meses ante fallas de fabricación.', 'Garantía legal'],
    ['headset', 'Atención humana', 'Te asesoramos por WhatsApp antes y después de tu compra: compatibilidad, dudas y seguimiento.', 'WhatsApp directo'],
    ['truck', 'Envíos rápidos', `Delivery en ${city} en 24 a 48 horas hábiles y despacho a regiones en 5 a 8 días hábiles.`, 'Todo Chile'],
    ['lock', 'Pagos protegidos', 'Pagas con Webpay a través de Flow, por transferencia o contra entrega en ' + city + '.', 'Pago seguro'],
  ]
  return html`<section class="ab-hero">
  <div class="wrap ab-hero__grid">
    <div>
      <span class="chip">${icon('sparkles', { size: 14 })}Tecnología cerca de ti</span>
      <h1>Pasión por la <span class="text-jade">tecnología</span> y el servicio</h1>
      <p class="ab-lead">Somos Mi Tiendita Digital Ve, una tienda de tecnología en ${city}. Reunimos audífonos, accesorios gamer, cables, cargadores y tecnología para el día a día en un solo lugar, con atención cercana y despacho a todo Chile.</p>
      <div class="hero__ctas">
        <a class="btn btn--primary" href="/tienda">Explorar catálogo ${icon('arrow-right', { size: 18 })}</a>
        <a class="btn btn--ghost" href="${waLink(settings.contact_whatsapp, 'Hola, quiero hablar con un especialista')}" target="_blank" rel="noopener">${icon('whatsapp', { size: 18 })}Hablar con un especialista</a>
      </div>
    </div>
    <div class="ab-hero__art" aria-hidden="true"><div class="ab-ring"></div><img src="/img/logo.webp" alt="" width="360" height="360"></div>
  </div>
</section>

<section class="section">
  <div class="wrap">
    <div class="section-head">
      <div><p class="eyebrow">Quiénes somos</p><h2>Tecnología útil, al alcance de un clic</h2></div>
      <p>Conectamos a gamers, estudiantes, profesionales y familias con productos reales, garantía y una atención sin sorpresas.</p>
    </div>
    <div class="ab-two">
      <article class="ab-card">
        <span class="ab-card__ic">${icon('zap', { size: 22 })}</span>
        <h3>Lo que hacemos</h3>
        <p>Seleccionamos productos de tecnología que realmente usamos y recomendamos: audio, periféricos, accesorios para celular y computador, energía y conectividad. Publicamos precios claros con IVA incluido y te mostramos el stock disponible.</p>
        <p>Si tienes dudas antes de comprar, te respondemos por WhatsApp para que elijas el producto correcto.</p>
      </article>
      <article class="ab-card">
        <span class="ab-card__ic">${icon('sparkles', { size: 22 })}</span>
        <h3>Nuestra visión</h3>
        <p>Ser la tienda de tecnología de confianza en ${city} y en todo Chile: compras simples, despacho rápido y un equipo que responde cuando lo necesitas.</p>
        <div class="ab-note"><strong>Nuestro compromiso</strong><span>Envío gratis en ${city} en compras sobre ${clp(settings.free_shipping_min_rancagua || 80000)}.</span></div>
      </article>
    </div>
  </div>
</section>

<section class="section ab-pillars-sec">
  <div class="wrap">
    <div class="section-head section-head--center"><div><p class="eyebrow">Pilares</p><h2>Lo que nos define</h2></div><p>Compromisos que respaldan cada pedido.</p></div>
    <div class="ab-pillars">
      ${pillars.map(([ic, t, d, tag]) => html`<article class="ab-pillar"><span class="ab-card__ic">${icon(ic, { size: 22 })}</span><h3>${t}</h3><p>${d}</p><span class="ab-pillar__tag">${tag}</span></article>`)}
    </div>
  </div>
</section>

${brands.length ? html`<section class="wrap">
  <div class="ab-brands">
    <div class="ab-brands__title">${icon('shield', { size: 22 })}<div><strong>Marcas que encontrarás</strong><span>Productos originales de marcas reconocidas</span></div></div>
    <ul>${brands.map((b) => html`<li><a href="/tienda?search=${encodeURIComponent(b)}">${b}</a></li>`)}</ul>
  </div>
</section>` : ''}

<section class="wrap section">
  <div class="ab-cta">
    <div>
      <span class="chip">${icon('check', { size: 14 })}Estamos para ayudarte</span>
      <h2>¿Listo para mejorar tu setup?</h2>
      <p>Encuentra el accesorio que te falta o escríbenos y te ayudamos a elegir.</p>
      <div class="hero__ctas">
        <a class="btn btn--primary" href="/tienda">${icon('cart', { size: 18 })}Ir a la tienda</a>
        <a class="btn btn--ghost" href="${waLink(settings.contact_whatsapp, 'Hola, necesito ayuda para elegir un producto')}" target="_blank" rel="noopener">${icon('whatsapp', { size: 18 })}Contáctanos por WhatsApp</a>
      </div>
    </div>
    <ul class="ab-cta__list">
      <li>${icon('check', { size: 18 })}Garantía legal de 6 meses</li>
      <li>${icon('check', { size: 18 })}Seguimiento de tu pedido en línea</li>
      <li>${icon('check', { size: 18 })}Pago seguro con Webpay</li>
    </ul>
  </div>
</section>`
}
