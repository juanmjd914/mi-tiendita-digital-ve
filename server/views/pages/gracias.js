import { html } from '../html.js'
import { icon } from '../icons.js'
import { waLink } from '../layout.js'
import { GOOGLE_REVIEW_URL } from '../../store-info.js'
import { steps } from './checkout.js'

// La página se completa en el navegador según el estado del pedido (Flow, transferencia o contra entrega).
export function graciasBody({ settings }) {
  return html`${steps(3)}
<section class="wrap thanks" data-thanks>
  <div class="thanks__loading" data-t-loading>${icon('clock', { size: 28 })}<p>Cargando tu pedido…</p></div>
  <div data-t-content hidden>
    <header class="thanks__head">
      <img src="/img/logo.webp" alt="" width="84" height="84">
      <h1 data-t-title>¡Gracias por tu compra!</h1>
      <p data-t-sub></p>
    </header>

    <div class="thanks__notice" data-t-notice hidden></div>

    <div class="bank" data-t-bank hidden>
      <h2>${icon('card', { size: 20 })}Datos para tu transferencia</h2>
      <dl class="bank__grid" data-t-bank-grid></dl>
      <p class="bank__note">Usa el <strong>N° de pedido</strong> como comentario de la transferencia. Te confirmaremos por correo cuando la recibamos. También te enviamos estos datos a tu correo.</p>
    </div>

    <ol class="track" data-t-track aria-label="Estado del pedido"></ol>

    <div class="thanks__order">
      <div><span>N° de pedido</span><strong data-t-number></strong></div>
      <div><span>Fecha</span><strong data-t-date></strong></div>
      <div><span>Medio de pago</span><strong data-t-pay></strong></div>
    </div>

    <section class="thanks__card">
      <h2>Productos</h2>
      <div class="t-items" data-t-items></div>
      <dl class="t-totals">
        <div><dt>Subtotal</dt><dd data-t-subtotal></dd></div>
        <div data-t-discount-row hidden><dt>Descuento</dt><dd data-t-discount></dd></div>
        <div><dt>Envío</dt><dd data-t-shipping></dd></div>
        <div class="t-totals__total"><dt>Total</dt><dd data-t-total></dd></div>
      </dl>
      <p class="t-iva">IVA incluido</p>
    </section>

    <section class="thanks__card thanks__info">
      <div><h2>Datos de contacto</h2><p data-t-contact></p></div>
      <div><h2 data-t-addr-title>Dirección de despacho</h2><p data-t-address></p></div>
    </section>

    <div class="thanks__cta">
      <a class="btn btn--primary" href="/cuenta/pedidos" data-t-myorder>${icon('package', { size: 18 })}Ver mi pedido</a>
      <a class="btn btn--ghost" href="/cuenta/registro" data-t-register hidden>Crea tu cuenta con este correo</a>
    </div>

    <section class="thanks__card review-ask" data-t-review hidden>
      <div class="review-ask__text">${icon('star', { size: 26 })}<div><h2>¿Cómo fue tu experiencia?</h2><p>Cuando recibas tu pedido, cuéntanos qué te pareció. Tu opinión en Google nos ayuda mucho a crecer.</p></div></div>
      <a class="btn btn--primary" href="${GOOGLE_REVIEW_URL}" target="_blank" rel="noopener">Déjanos tu opinión en Google</a>
    </section>

    <section class="thanks__help">
      <h2>¿Tienes dudas?</h2>
      <p>Estamos para ayudarte con tu compra.</p>
      <div class="help-grid">
        <a class="btn btn--ghost" href="/cuenta/pedidos">Mis pedidos</a>
        <a class="btn btn--ghost" href="/cuenta">Mi perfil</a>
        <a class="btn btn--ghost" href="/tienda?orden=nuevos">Ver novedades</a>
        <a class="btn btn--ghost" href="/soporte#preguntas">Preguntas frecuentes</a>
      </div>
      <a class="btn btn--primary" href="${waLink(settings.contact_whatsapp, 'Hola, tengo una consulta sobre mi pedido')}" target="_blank" rel="noopener">${icon('whatsapp', { size: 18 })}Escríbenos por WhatsApp</a>
    </section>
  </div>
</section>`
}
