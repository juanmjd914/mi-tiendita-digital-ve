import { html, raw } from '../html.js'
import { icon } from '../icons.js'
import { ORIGIN, waLink } from '../layout.js'
import { clp, productUrl, savings, stockState, BADGE_LABEL, gaItem } from '../partials/product.js'
import { productCard } from './tienda.js'

// Estrellas (relleno según calificación, redondeado al entero más cercano)
const starsHtml = (n) => raw(`<span class="stars" aria-label="${n} de 5 estrellas">${'★'.repeat(Math.round(n))}<span class="stars__off">${'★'.repeat(5 - Math.round(n))}</span></span>`)

const thumbOf = (src) => (src.startsWith('/img/productos/') ? src.replace(/\.webp$/, '-400.webp') : src)

// Preguntas frecuentes generales (sin datos técnicos inventados por producto).
export function productFaq(p, settings) {
  const min = clp(settings.free_shipping_min_rancagua || 80000)
  return [
    ['¿Cuánto demora el despacho?', `En ${settings.local_city || 'Rancagua'} entregamos en 24 a 48 horas hábiles y a regiones en 5 a 8 días hábiles. También puedes retirar gratis en nuestro local.`],
    ['¿Tiene costo el envío?', `El delivery en ${settings.local_city || 'Rancagua'} es gratis en compras sobre ${min}. Para regiones se aplica una tarifa plana que verás en el checkout antes de pagar.`],
    ['¿Qué garantía tiene?', `Todos los productos tienen la garantía legal de 6 meses ante fallas de fabricación${p.warranty ? `, además de la garantía indicada: ${p.warranty}` : ''}. Si el producto falla, puedes elegir cambio, reparación o devolución del dinero.`],
    ['¿Puedo devolverlo si me arrepiento?', 'Este producto no admite derecho a retracto. Sí aplica siempre la garantía legal por fallas.'],
    ['¿Cómo puedo pagar?', 'Con tarjetas de débito o crédito vía Webpay, por transferencia bancaria o pago contra entrega en Rancagua.'],
    ['¿Tienes dudas de compatibilidad?', 'Escríbenos por WhatsApp antes de comprar y te ayudamos a confirmar que es el producto correcto para tu equipo.'],
  ]
}

function gallery(p, images) {
  return html`<div class="gallery" data-gallery>
  <div class="gallery__main">
    <button class="gallery__zoom" type="button" data-zoom aria-label="Ampliar imagen">
      <img src="${images[0]}" alt="${p.name}" width="1200" height="1200" fetchpriority="high" data-main>
    </button>
    ${images.length > 1 ? html`<button class="icon-btn gallery__nav gallery__nav--prev" type="button" data-prev aria-label="Foto anterior">${icon('chevron-left')}</button>
    <button class="icon-btn gallery__nav gallery__nav--next" type="button" data-next aria-label="Foto siguiente">${icon('chevron-right')}</button>` : ''}
  </div>
  ${images.length > 1 ? html`<div class="gallery__thumbs" role="list">
    ${images.map((src, i) => html`<button role="listitem" type="button" class="gallery__thumb${i === 0 ? ' is-on' : ''}" data-thumb="${i}" data-src="${src}" aria-label="Ver foto ${i + 1}"><img src="${thumbOf(src)}" alt="" width="96" height="96" loading="lazy"></button>`)}
  </div>` : ''}
</div>`
}

function variantPicker(p) {
  if (!p.variants?.length) return ''
  const kind = p.variants[0].kind || 'Opción'
  return html`<fieldset class="variants">
  <legend>${kind}: <strong data-variant-label>${p.variants[0].label}</strong></legend>
  <div class="variants__list">
    ${p.variants.map((v, i) => html`<label class="variant${v.stock <= 0 ? ' is-out' : ''}">
      <input type="radio" name="variant" value="${v.id}" data-label="${v.label}" data-stock="${v.stock}" data-img="${v.img_url || ''}" data-price="${v.price ?? ''}"${i === 0 ? raw(' checked') : ''}>
      ${v.img_url ? html`<img src="${thumbOf(v.img_url)}" alt="" width="44" height="44" loading="lazy">` : ''}
      <span>${v.label}</span>
    </label>`)}
  </div>
</fieldset>`
}

export function productoBody({ p, related, settings }) {
  const images = (p.gallery?.length ? p.gallery : [p.img_url]).filter(Boolean)
  const st = stockState(p)
  const save = savings(p)
  const specs = Array.isArray(p.specs) ? p.specs.filter((s) => s?.label && s?.value) : []
  const faq = productFaq(p, settings)
  const disabled = st === 'out' ? raw(' disabled') : ''
  return html`<div class="wrap">
  <nav aria-label="Miga de pan" class="pdp-crumb"><ol class="breadcrumb breadcrumb--left">
    <li><a href="/">Inicio</a></li><li><a href="/tienda">Tienda</a></li>
    ${p.category ? html`<li><a href="/tienda?cat=${encodeURIComponent(p.category)}">${p.category}</a></li>` : ''}
    <li aria-current="page">${p.name}</li>
  </ol></nav>
</div>
<section class="wrap pdp" data-product="${p.id}" data-price="${p.price}" data-ga="${gaItem(p)}">
  ${gallery(p, images)}
  <div class="pdp__info">
    <div class="pdp__chips">
      ${p.brand ? html`<span class="chip">${p.brand}</span>` : ''}
      ${p.badge ? html`<span class="chip${p.badge === 'HOT' ? ' chip--hot' : ''}">${BADGE_LABEL[p.badge] || p.badge}</span>` : ''}
    </div>
    <h1 class="pdp__title">${p.name}</h1>
    <a class="pdp__rating" href="#opiniones">${p.review_count
      ? html`${starsHtml(p.rating_avg)}<span>${String(p.rating_avg).replace('.', ',')} · ${p.review_count} ${p.review_count === 1 ? 'opinión' : 'opiniones'}</span>`
      : html`${icon('star', { size: 16 })}<span>Sé el primero en opinar</span>`}</a>
    ${p.short_description ? html`<p class="pdp__lead">${p.short_description}</p>` : ''}
    <div class="pdp__price">
      <span class="pdp__now" data-price-now>${clp(p.price)}</span>
      ${save ? html`<s class="pdp__was">${clp(p.original_price)}</s><span class="chip">Ahorras ${clp(save)}</span>` : ''}
    </div>
    <p class="pdp__iva">Precio con IVA incluido</p>
    <span class="stock stock--${st}" data-stock-badge>${icon(st === 'out' ? 'x' : 'check', { size: 14 })}${st === 'out' ? 'Sin stock' : st === 'low' ? '¡Quedan pocas unidades!' : 'En stock'}</span>
    ${variantPicker(p)}
    <div class="pdp__buy">
      <div class="qty" data-qty>
        <button type="button" class="qty__btn" data-qty-minus aria-label="Restar">${icon('minus', { size: 16 })}</button>
        <label class="sr-only" for="qty">Cantidad</label>
        <input id="qty" type="number" inputmode="numeric" min="1" max="99" value="1">
        <button type="button" class="qty__btn" data-qty-plus aria-label="Sumar">${icon('plus', { size: 16 })}</button>
      </div>
      <button class="btn btn--primary pdp__add" type="button" data-pdp-add${disabled}>${icon('cart', { size: 18 })}Agregar al carrito</button>
      <button class="icon-btn wish-btn wish-btn--lg" type="button" data-wish="${p.id}" aria-pressed="false" aria-label="Agregar a favoritos">${icon('heart')}</button>
    </div>
    <button class="btn btn--ghost btn--block" type="button" data-pdp-buy${disabled}>Comprar ahora</button>
    <p class="pdp__ship">${icon('truck', { size: 18 })}<span>Envío gratis en ${settings.local_city || 'Rancagua'} sobre ${clp(settings.free_shipping_min_rancagua || 80000)} · Despacho 24–48 h en ${settings.local_city || 'Rancagua'} / 5–8 días a regiones</span></p>
    <ul class="pdp__trust">
      <li>${icon('lock', { size: 18 })}Compra segura con Webpay</li>
      <li>${icon('truck', { size: 18 })}Despacho a todo Chile</li>
      <li>${icon('shield', { size: 18 })}${p.warranty ? `Garantía: ${p.warranty}` : 'Garantía legal de 6 meses'}</li>
      <li><a href="${waLink(settings.contact_whatsapp, `Hola, tengo una consulta sobre: ${p.name}`)}" target="_blank" rel="noopener">${icon('whatsapp', { size: 18 })}Consultar por WhatsApp</a></li>
    </ul>
    <p class="pdp__legal">Este producto no admite derecho a retracto. Siempre cuentas con la garantía legal de 6 meses por fallas de fabricación. <a href="/politica-de-cambios-y-devoluciones">Ver política</a>.</p>
  </div>
</section>

${p.description && p.description !== p.short_description ? html`<section class="wrap pdp-block"><h2>Descripción</h2><div class="pdp-desc">${p.description}</div></section>` : ''}

${specs.length ? html`<section class="wrap pdp-block">
  <h2>Ficha técnica</h2>
  <table class="specs"><tbody>${specs.map((s) => html`<tr><th scope="row">${s.label}</th><td>${s.value}</td></tr>`)}</tbody></table>
</section>` : ''}

<section class="wrap pdp-block" id="opiniones">
  <h2>Opiniones de clientes</h2>
  ${p.review_count ? html`<div class="reviews-sum">${starsHtml(p.rating_avg)}<strong>${String(p.rating_avg).replace('.', ',')} de 5</strong><span>${p.review_count} ${p.review_count === 1 ? 'opinión verificada' : 'opiniones verificadas'} de clientes que compraron este producto</span></div>
  <ul class="reviews-list">${p.reviews.slice(0, 20).map((r) => html`<li class="review-item"><div class="review-item__head">${starsHtml(r.rating)}<strong>${r.author_display || 'Cliente'}</strong><time datetime="${String(r.created_at).slice(0, 10)}">${new Date(r.created_at).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}</time></div>${r.comment ? html`<p>${r.comment}</p>` : ''}</li>`)}</ul>
  <p class="reviews-note">¿Compraste este producto? Deja tu opinión desde <a href="/cuenta/pedidos">Mis pedidos</a>.</p>` : html`<div class="reviews-empty">${icon('star', { size: 22 })}<div><strong>Aún no hay opiniones</strong><p>Sé el primero en opinar: si compraste este producto, puedes dejar tu reseña desde <a href="/cuenta/pedidos">Mis pedidos</a>.</p></div></div>`}
</section>

<section class="wrap pdp-block">
  <h2>Preguntas frecuentes</h2>
  <div class="faq">${faq.map(([q, a]) => html`<details class="faq__item"><summary>${q}${icon('chevron-down', { size: 18 })}</summary><p>${a}</p></details>`)}</div>
</section>

${related.length ? html`<section class="wrap pdp-block">
  <div class="section-head"><div><p class="eyebrow">También te puede interesar</p><h2>Productos relacionados</h2></div></div>
  <div class="p-grid p-grid--row">${related.map(productCard)}</div>
</section>` : ''}

<div class="sticky-buy" data-sticky-buy>
  <div><span class="sticky-buy__name">${p.name}</span><strong data-price-now>${clp(p.price)}</strong></div>
  <button class="btn btn--primary btn--sm" type="button" data-pdp-add${disabled}>${icon('cart', { size: 16 })}Agregar</button>
</div>`
}

export function productSchema(p, settings) {
  const images = (p.gallery?.length ? p.gallery : [p.img_url]).filter(Boolean).map((u) => (u.startsWith('http') ? u : ORIGIN + u))
  const offers = (p.variants?.length ? p.variants : [p]).map((v) => ({
    '@type': 'Offer',
    url: ORIGIN + productUrl(p),
    priceCurrency: 'CLP',
    price: String(v.price ?? p.price),
    availability: (v.stock ?? 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    itemCondition: 'https://schema.org/NewCondition',
    seller: { '@type': 'Organization', name: 'Mi Tiendita Digital Ve' },
    // Datos que Google recomienda para fichas de comerciante (mismos de Merchant Center)
    shippingDetails: {
      '@type': 'OfferShippingDetails',
      shippingRate: { '@type': 'MonetaryAmount', value: String(settings.shipping_flat_regions ?? 10000), currency: 'CLP' },
      shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'CL' },
      deliveryTime: {
        '@type': 'ShippingDeliveryTime',
        handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
        transitTime: { '@type': 'QuantitativeValue', minValue: 5, maxValue: 8, unitCode: 'DAY' },
      },
    },
    hasMerchantReturnPolicy: {
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'CL',
      returnPolicyCategory: 'https://schema.org/MerchantReturnNotPermitted',
      url: ORIGIN + '/politica-de-cambios-y-devoluciones',
    },
    ...(p.variants?.length ? { name: `${p.name} — ${v.label}` } : {}),
  }))
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: p.name,
      description: p.short_description || p.description || p.name,
      image: images,
      sku: p.sku || p.slug,
      ...(p.brand ? { brand: { '@type': 'Brand', name: p.brand } } : {}),
      category: p.category,
      ...(p.review_count ? {
        aggregateRating: { '@type': 'AggregateRating', ratingValue: String(p.rating_avg), reviewCount: p.review_count, bestRating: '5', worstRating: '1' },
        review: p.reviews.slice(0, 10).map((r) => ({ '@type': 'Review', reviewRating: { '@type': 'Rating', ratingValue: String(r.rating), bestRating: '5' }, author: { '@type': 'Person', name: r.author_display || 'Cliente' }, datePublished: String(r.created_at).slice(0, 10), ...(r.comment ? { reviewBody: r.comment } : {}) })),
      } : {}),
      offers: offers.length === 1 ? offers[0] : { '@type': 'AggregateOffer', priceCurrency: 'CLP', lowPrice: String(Math.min(...offers.map((o) => Number(o.price)))), highPrice: String(Math.max(...offers.map((o) => Number(o.price)))), offerCount: offers.length, offers },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: ORIGIN + '/' },
        { '@type': 'ListItem', position: 2, name: 'Tienda', item: ORIGIN + '/tienda' },
        ...(p.category ? [{ '@type': 'ListItem', position: 3, name: p.category, item: `${ORIGIN}/tienda?cat=${encodeURIComponent(p.category)}` }] : []),
        { '@type': 'ListItem', position: p.category ? 4 : 3, name: p.name, item: ORIGIN + productUrl(p) },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: productFaq(p, settings).map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
  ]
}
