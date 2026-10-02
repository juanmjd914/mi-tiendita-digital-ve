import { html, raw } from '../html.js'
import { icon } from '../icons.js'
import { clp } from '../partials/product.js'

export function steps(current) {
  const S = [['1', 'Carrito', '/carrito'], ['2', 'Checkout', '/checkout'], ['3', 'Confirmación', null]]
  return html`<div class="steps-bar">
  <div class="wrap steps-bar__inner">
    <ol class="steps">
      ${S.map(([n, label, href], i) => {
        const state = i + 1 < current ? 'done' : i + 1 === current ? 'current' : ''
        const inner = html`<span class="steps__n">${i + 1 < current ? icon('check', { size: 14 }) : n}</span><span>${label}</span>`
        return html`<li class="steps__item${state ? ` is-${state}` : ''}"${i + 1 === current ? raw(' aria-current="step"') : ''}>${href && i + 1 < current ? html`<a href="${href}">${inner}</a>` : inner}</li>`
      })}
    </ol>
    <span class="steps-bar__secure">${icon('lock', { size: 16 })}Compra segura</span>
  </div>
</div>`
}

export function checkoutBody({ settings }) {
  const city = settings.local_city || 'Rancagua'
  return html`${steps(2)}
<form class="wrap checkout" data-checkout novalidate>
  <div class="checkout__main">
    <section class="co-card co-guest" data-guest-box>
      <div>
        <h2>Comprar como invitado</h2>
        <p>Inicia sesión para seguir tu pedido y autocompletar tus datos la próxima vez.</p>
      </div>
      <a class="btn btn--ghost btn--sm" href="/cuenta/login?next=/checkout">Iniciar sesión</a>
    </section>

    <section class="co-card">
      <h2>${icon('truck', { size: 20 })}Método de entrega</h2>
      <div class="options" role="radiogroup" aria-label="Método de entrega">
        ${settings.pickup_enabled !== false ? html`<label class="option">
          <input type="radio" name="deliveryMethod" value="pickup">
          <span class="option__body"><strong>Retiro en local</strong><small>${city} · Gratis · Te enviamos la dirección exacta al confirmar tu pedido</small></span>
        </label>` : ''}
        <label class="option">
          <input type="radio" name="deliveryMethod" value="local" checked>
          <span class="option__body"><strong>Delivery en ${city}</strong><small>24 a 48 horas hábiles · Gratis sobre ${clp(settings.free_shipping_min_rancagua || 80000)}</small></span>
        </label>
        <label class="option">
          <input type="radio" name="deliveryMethod" value="regions">
          <span class="option__body"><strong>Envío a regiones</strong><small>5 a 8 días hábiles · Tarifa plana</small></span>
        </label>
      </div>
    </section>

    <section class="co-card">
      <h2>${icon('user', { size: 20 })}Tus datos</h2>
      <div class="fields">
        <div class="field"><label for="firstName">Nombre *</label><input id="firstName" name="firstName" autocomplete="given-name" required maxlength="60"></div>
        <div class="field"><label for="lastName">Apellido *</label><input id="lastName" name="lastName" autocomplete="family-name" required maxlength="60"></div>
        <div class="field field--full"><label for="email">Correo electrónico *</label><input id="email" name="email" type="email" autocomplete="email" required maxlength="120" placeholder="tucorreo@ejemplo.cl"><small>Te enviaremos la confirmación y el seguimiento de tu pedido.</small></div>
        <div class="field"><label for="phone">Teléfono *</label><input id="phone" name="phone" type="tel" autocomplete="tel" required maxlength="20" placeholder="+56 9 1234 5678"></div>
        <div class="field"><label for="rut">RUT <span class="optional">(opcional)</span></label><input id="rut" name="rut" autocomplete="off" maxlength="12" placeholder="12.345.678-9"></div>
      </div>
    </section>

    <section class="co-card" data-address-box>
      <h2>${icon('pin', { size: 20 })}Dirección de despacho</h2>
      <div class="fields">
        <div class="field"><label for="region">Región *</label><select id="region" name="region" autocomplete="address-level1" required><option value="">Selecciona tu región</option></select></div>
        <div class="field"><label for="comuna">Comuna *</label><select id="comuna" name="comuna" autocomplete="address-level2" required disabled><option value="">Primero elige la región</option></select></div>
        <div class="field field--wide"><label for="street">Calle *</label><input id="street" name="street" autocomplete="address-line1" required maxlength="120" placeholder="Av. Libertador Bernardo O'Higgins"></div>
        <div class="field field--narrow"><label for="number">Número *</label><input id="number" name="number" required maxlength="20" placeholder="1234"></div>
        <div class="field"><label for="apartment">Depto / casa <span class="optional">(opcional)</span></label><input id="apartment" name="apartment" autocomplete="address-line2" maxlength="40" placeholder="Depto 501"></div>
        <div class="field"><label for="reference">Referencia <span class="optional">(opcional)</span></label><input id="reference" name="reference" maxlength="160" placeholder="Portón verde, al lado de…"></div>
      </div>
      <label class="check" data-save-address hidden><input type="checkbox" name="saveAddress" checked><span>Guardar esta dirección para la próxima vez</span></label>
    </section>

    <section class="co-card">
      <h2>${icon('card', { size: 20 })}Medio de pago</h2>
      <div class="options" role="radiogroup" aria-label="Medio de pago">
        <label class="option">
          <input type="radio" name="payment" value="flow" checked>
          <span class="option__body"><strong>Webpay · tarjetas de débito y crédito</strong><small>Pagas en el sitio seguro de Flow y vuelves a la tienda.</small></span>
          <img src="/img/webpay.webp" alt="Webpay" width="90" height="30" class="option__logo">
        </label>
        <label class="option">
          <input type="radio" name="payment" value="transfer">
          <span class="option__body"><strong>Transferencia bancaria</strong><small>Te mostramos los datos de la cuenta al confirmar el pedido y también te llegan por correo.</small></span>
        </label>
        ${settings.cod_enabled !== false ? html`<label class="option" data-cod-option>
          <input type="radio" name="payment" value="cod">
          <span class="option__body"><strong>Pago contra entrega</strong><small>Solo con delivery en ${city}. Pagas al recibir tu pedido.</small></span>
        </label>` : ''}
      </div>
    </section>

    <section class="co-card">
      <h2>${icon('zap', { size: 20 })}Código de descuento</h2>
      <div class="coupon">
        <label class="sr-only" for="coupon">Código de descuento</label>
        <input id="coupon" name="coupon" maxlength="40" placeholder="Ingresa tu código" autocomplete="off">
        <button class="btn btn--ghost btn--sm" type="button" data-apply-coupon>Aplicar</button>
      </div>
      <p class="coupon-msg" data-coupon-msg hidden></p>
    </section>
  </div>

  <aside class="checkout__side">
    <section class="co-card co-summary">
      <button class="co-summary__toggle" type="button" data-summary-toggle aria-expanded="true">
        <span>Resumen del pedido</span><strong data-sum-total-top></strong>${icon('chevron-down', { size: 18 })}
      </button>
      <div class="co-summary__items" data-sum-items><p class="muted">Cargando…</p></div>
    </section>
    <section class="co-card co-totals">
      <h2>Total del pedido</h2>
      <dl>
        <div><dt>Subtotal</dt><dd data-sum-subtotal>—</dd></div>
        <div data-sum-discount-row hidden><dt>Descuento <span data-sum-coupon></span></dt><dd data-sum-discount></dd></div>
        <div><dt>Envío</dt><dd data-sum-shipping>—</dd></div>
        <div class="co-totals__total"><dt>Total</dt><dd data-sum-total>—</dd></div>
      </dl>
      <p class="co-totals__iva">IVA incluido</p>
      <div class="free-ship" data-free-ship hidden><p data-free-ship-text></p><div class="free-ship__bar"><span data-free-ship-bar></span></div></div>
    </section>
    <section class="co-card co-place">
      <label class="check"><input type="checkbox" name="acceptTerms" required><span>Acepto los <a href="/terminos-y-condiciones" target="_blank">Términos y Condiciones</a> y la <a href="/politica-de-privacidad" target="_blank">Política de Privacidad</a>.</span></label>
      <p class="co-legal">Los productos no admiten derecho a retracto. Mantienes siempre la garantía legal de 6 meses por fallas de fabricación (<a href="/politica-de-cambios-y-devoluciones" target="_blank">ver política</a>).</p>
      <p class="form-error" data-form-error role="alert" hidden></p>
      <button class="btn btn--primary btn--block co-submit" type="submit" data-submit>${icon('lock', { size: 18 })}<span data-submit-label>Realizar pedido</span>${icon('arrow-right', { size: 18 })}</button>
      <a class="btn btn--ghost btn--block" href="/tienda">${icon('chevron-left', { size: 18 })}Seguir comprando</a>
      <ul class="seals">
        <li>${icon('shield', { size: 16 })}Pago seguro Webpay</li>
        <li>${icon('lock', { size: 16 })}Conexión cifrada SSL</li>
        <li>${icon('whatsapp', { size: 16 })}Soporte por WhatsApp</li>
      </ul>
    </section>
  </aside>
  <div class="co-mobile-bar">
    <div><small>Total</small><strong data-sum-total-mobile>—</strong></div>
    <button class="btn btn--primary" type="submit" data-submit>Realizar pedido</button>
  </div>
</form>`
}
