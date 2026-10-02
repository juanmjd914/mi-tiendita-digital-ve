import { html } from '../html.js'
import { icon } from '../icons.js'
import { waLink } from '../layout.js'
import { clp } from '../partials/product.js'

export function soporteFaq(settings) {
  const city = settings.local_city || 'Rancagua'
  return [
    ['¿Cómo hago seguimiento de mi pedido?', 'Si tienes cuenta, entra a Mi cuenta → Mis pedidos y verás cada etapa con su fecha y el código de seguimiento cuando el pedido sea despachado. Si compraste como invitado, usa el formulario "Consulta tu pedido" de esta página con tu número de pedido y tu correo.'],
    ['¿Cuánto demora el despacho?', `En ${city} entregamos en 24 a 48 horas hábiles. A regiones el despacho demora entre 5 y 8 días hábiles. También puedes retirar gratis en nuestro local.`],
    ['¿Cuánto cuesta el envío?', `El delivery en ${city} es gratis en compras sobre ${clp(settings.free_shipping_min_rancagua || 80000)}; bajo ese monto tiene un costo fijo que ves en el checkout. A regiones se cobra una tarifa plana que también se muestra antes de pagar.`],
    ['¿Qué garantía tienen los productos?', 'Todos los productos tienen garantía legal de 6 meses ante fallas de fabricación (Ley 19.496). Si el producto falla, puedes elegir cambio, reparación o devolución del dinero. Escríbenos con tu número de pedido y una foto o video de la falla.'],
    ['¿Puedo devolver un producto si me arrepiento?', 'Nuestros productos no admiten derecho a retracto, lo que se informa antes de cada compra. Siempre aplica la garantía legal por fallas de fabricación.'],
    ['¿Cómo pago de forma segura?', 'Puedes pagar con tarjetas de débito o crédito vía Webpay a través de Flow (no guardamos los datos de tu tarjeta), por transferencia bancaria o contra entrega en ' + city + '.'],
    ['¿Emiten boleta o factura?', 'Por ahora no emitimos factura desde el sitio. Si necesitas un comprobante específico, escríbenos por WhatsApp antes de comprar.'],
  ]
}

export function soporteBody({ settings }) {
  const faq = soporteFaq(settings)
  return html`<section class="sp-hero">
  <div class="wrap sp-hero__grid">
    <div>
      <span class="chip">${icon('headset', { size: 14 })}Centro de soporte</span>
      <h1>Estamos aquí para <span class="text-jade">ayudarte</span></h1>
      <p class="ab-lead">Resuelve tus dudas sobre pedidos, despachos, garantías y pagos. Escríbenos por WhatsApp o déjanos tu consulta y te respondemos por correo.</p>
      <div class="hero__ctas">
        <a class="btn btn--primary" href="${waLink(settings.contact_whatsapp, 'Hola, necesito ayuda con mi compra')}" target="_blank" rel="noopener">${icon('whatsapp', { size: 18 })}Hablar por WhatsApp</a>
        <a class="btn btn--ghost" href="mailto:${settings.contact_email}">${icon('mail', { size: 18 })}${settings.contact_email}</a>
      </div>
    </div>
    <img class="sp-hero__img" src="/img/soporte.webp" alt="Atención al cliente de Mi Tiendita Digital Ve" width="1671" height="941">
  </div>
</section>

<section class="wrap section sp-grid">
  <form class="co-card sp-form" data-support novalidate>
    <h2>${icon('mail', { size: 20 })}Envíanos tu consulta</h2>
    <div class="fields">
      <div class="field"><label for="s-name">Nombre *</label><input id="s-name" name="name" required maxlength="80" autocomplete="name"></div>
      <div class="field"><label for="s-email">Correo *</label><input id="s-email" name="email" type="email" required maxlength="120" autocomplete="email"></div>
      <div class="field"><label for="s-topic">Tema *</label><select id="s-topic" name="topic" required>
        <option value="">Selecciona un tema</option>
        <option>Estado y despacho de mi pedido</option>
        <option>Garantía o falla de un producto</option>
        <option>Pagos y transferencias</option>
        <option>Compatibilidad antes de comprar</option>
        <option>Otra consulta</option>
      </select></div>
      <div class="field"><label for="s-order">N° de pedido <span class="optional">(opcional)</span></label><input id="s-order" name="order" maxlength="16" placeholder="Ej. 20261001-1"></div>
      <div class="field field--full"><label for="s-msg">Mensaje *</label><textarea id="s-msg" name="message" rows="5" required maxlength="2000"></textarea></div>
    </div>
    <input type="text" name="website" class="hp" tabindex="-1" autocomplete="off" aria-hidden="true">
    <p class="form-error" data-error hidden></p>
    <button class="btn btn--primary" type="submit">${icon('arrow-right', { size: 18 })}Enviar consulta</button>
    <div class="form-ok" data-ok hidden></div>
  </form>

  <div class="sp-side">
    <form class="co-card" data-track novalidate>
      <h2>${icon('package', { size: 20 })}Consulta tu pedido</h2>
      <p class="muted small">Ingresa el número de pedido que aparece en tu correo de confirmación.</p>
      <div class="field"><label for="t-number">N° de pedido</label><input id="t-number" name="number" required maxlength="16" placeholder="Ej. 20261001-1"></div>
      <div class="field"><label for="t-email">Correo de la compra</label><input id="t-email" name="email" type="email" required maxlength="120"></div>
      <p class="form-error" data-error hidden></p>
      <button class="btn btn--ghost btn--block" type="submit">Consultar</button>
    </form>
    <div class="co-card sp-wa">
      <h2>${icon('whatsapp', { size: 20 })}Atención directa</h2>
      <p class="muted small">¿Duda antes de comprar? Conversa con nosotros por WhatsApp.</p>
      <a class="btn btn--primary btn--block" href="${waLink(settings.contact_whatsapp, 'Hola, tengo una consulta')}" target="_blank" rel="noopener">Abrir WhatsApp</a>
    </div>
  </div>
</section>

<section class="wrap section" id="preguntas">
  <div class="section-head"><div><p class="eyebrow">Resolución inmediata</p><h2>Preguntas frecuentes</h2></div><p>Respuestas sobre compras, despachos, garantías y pagos.</p></div>
  <div class="faq">${faq.map(([q, a]) => html`<details class="faq__item"><summary>${q}${icon('chevron-down', { size: 18 })}</summary><p>${a}</p></details>`)}</div>
</section>`
}
