import { html, raw } from '../html.js'
import { icon } from '../icons.js'

const orbs = raw('<div class="orbs" aria-hidden="true"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>')

const pwField = (id, label, autocomplete, extra = '') => html`<div class="a-field">
  <label for="${id}">${label}</label>
  <div class="a-input">${icon('lock', { size: 18 })}<input id="${id}" name="${id}" type="password" autocomplete="${autocomplete}" required minlength="8"${raw(extra)}>
  <button type="button" class="a-eye" data-eye aria-label="Mostrar contraseña">${icon('eye', { size: 18 })}</button></div>
</div>`

const emailField = html`<div class="a-field">
  <label for="email">Correo electrónico</label>
  <div class="a-input">${icon('mail', { size: 18 })}<input id="email" name="email" type="email" autocomplete="email" required maxlength="120" placeholder="tucorreo@ejemplo.cl"></div>
</div>`

const turnstile = raw('<div class="a-captcha" data-captcha></div>')

export function authBody(kind) {
  const views = {
    login: html`<h1>Iniciar sesión</h1><p class="a-sub">¡Bienvenido de vuelta! Ingresa para continuar.</p>
      <form class="a-form" data-auth="login" novalidate>
        ${emailField}
        ${pwField('password', 'Contraseña', 'current-password')}
        <a class="a-link a-link--right" href="/cuenta/recuperar-password">¿Olvidaste tu contraseña?</a>
        ${turnstile}
        <p class="form-error" data-error role="alert" hidden></p>
        <button class="btn btn--primary btn--block" type="submit">${icon('arrow-right', { size: 18 })}Iniciar sesión</button>
      </form>
      <p class="a-alt">¿No tienes cuenta? <a class="a-link" href="/cuenta/registro" data-keep-next>Crear cuenta</a></p>`,
    registro: html`<h1>Crear cuenta</h1><p class="a-sub">Sigue tus pedidos, guarda direcciones y favoritos.</p>
      <form class="a-form" data-auth="registro" novalidate>
        <div class="a-row">
          <div class="a-field"><label for="firstName">Nombre</label><div class="a-input">${icon('user', { size: 18 })}<input id="firstName" name="firstName" autocomplete="given-name" required maxlength="60"></div></div>
          <div class="a-field"><label for="lastName">Apellido</label><div class="a-input">${icon('user', { size: 18 })}<input id="lastName" name="lastName" autocomplete="family-name" required maxlength="60"></div></div>
        </div>
        ${emailField}
        ${pwField('password', 'Contraseña', 'new-password', ' data-strength')}
        <div class="strength" data-strength-bar><span></span></div>
        <p class="a-hint" data-strength-text>Mínimo 8 caracteres. Mezcla letras, números y símbolos.</p>
        <label class="check"><input type="checkbox" name="terms" required><span>Acepto los <a href="/terminos-y-condiciones" target="_blank">Términos y Condiciones</a> y la <a href="/politica-de-privacidad" target="_blank">Política de Privacidad</a>.</span></label>
        <label class="check"><input type="checkbox" name="optin"><span>Quiero recibir ofertas y novedades por correo.</span></label>
        ${turnstile}
        <p class="form-error" data-error role="alert" hidden></p>
        <button class="btn btn--primary btn--block" type="submit">Crear cuenta</button>
      </form>
      <p class="a-alt">¿Ya tienes cuenta? <a class="a-link" href="/cuenta/login" data-keep-next>Iniciar sesión</a></p>`,
    recuperar: html`<h1>Recuperar contraseña</h1><p class="a-sub">Te enviaremos un enlace para crear una nueva contraseña.</p>
      <form class="a-form" data-auth="recuperar" novalidate>
        ${emailField}
        ${turnstile}
        <p class="form-error" data-error role="alert" hidden></p>
        <p class="form-ok" data-ok hidden></p>
        <button class="btn btn--primary btn--block" type="submit">Enviar enlace</button>
      </form>
      <p class="a-alt"><a class="a-link" href="/cuenta/login">Volver a iniciar sesión</a></p>`,
    nueva: html`<h1>Nueva contraseña</h1><p class="a-sub">Elige una contraseña segura para tu cuenta.</p>
      <form class="a-form" data-auth="nueva" novalidate>
        ${pwField('password', 'Nueva contraseña', 'new-password', ' data-strength')}
        <div class="strength" data-strength-bar><span></span></div>
        ${pwField('password2', 'Confirmar contraseña', 'new-password')}
        <p class="form-error" data-error role="alert" hidden></p>
        <button class="btn btn--primary btn--block" type="submit">Guardar contraseña</button>
      </form>`,
  }
  return html`<section class="auth">
  ${orbs}
  <div class="auth__card">
    <div class="auth__avatar">${icon('user', { size: 34 })}</div>
    ${views[kind]}
  </div>
</section>`
}

export const ACCOUNT_NAV = [
  ['datos', 'Datos personales', '/cuenta', 'user'],
  ['pedidos', 'Mis pedidos', '/cuenta/pedidos', 'package'],
  ['direcciones', 'Mis direcciones', '/cuenta/direcciones', 'pin'],
  ['favoritos', 'Favoritos', '/favoritos', 'heart'],
  ['pagos', 'Medios de pago', '/cuenta/medios-de-pago', 'card'],
  ['password', 'Contraseña', '/cuenta/contrasena', 'lock'],
  ['salir', 'Cerrar sesión', '/cuenta/salir', 'logout'],
]

export function accountShell(section, title, inner) {
  return html`<section class="page-hero">
  <div class="wrap">
    <nav aria-label="Miga de pan"><ol class="breadcrumb"><li><a href="/">Inicio</a></li><li><a href="/cuenta">Mi cuenta</a></li>${section !== 'datos' ? html`<li>${title}</li>` : ''}</ol></nav>
    <h1>${section === 'datos' ? 'Mi cuenta' : title}</h1>
  </div>
</section>
<section class="wrap account" data-account="${section}">
  <nav class="account__nav" aria-label="Mi cuenta">
    ${ACCOUNT_NAV.map(([key, label, href, ic]) => html`<a href="${href}" class="account__link${key === section ? ' is-on' : ''}"${key === section ? raw(' aria-current="page"') : ''}>${icon(ic, { size: 18 })}<span>${label}</span></a>`)}
  </nav>
  <div class="account__body" data-guard hidden>${inner}</div>
  <div class="account__loading" data-guard-loading>${icon('clock', { size: 22 })}Cargando…</div>
</section>`
}

// ---------- Secciones ----------
export const datosInner = html`<form class="acc-card" data-profile novalidate>
  <div class="avatar-edit">
    <div class="avatar-edit__img" data-avatar>${icon('user', { size: 40 })}</div>
    <label class="avatar-edit__btn" title="Cambiar foto">${icon('edit', { size: 16 })}<input type="file" accept="image/jpeg,image/png,image/webp" data-avatar-input hidden><span class="sr-only">Cambiar foto de perfil</span></label>
    <div><strong data-hello>Hola</strong><p class="muted" data-email-label></p></div>
  </div>
  <div class="fields">
    <div class="field"><label for="p-first">Nombre *</label><input id="p-first" name="first_name" required maxlength="60" autocomplete="given-name"></div>
    <div class="field"><label for="p-last">Apellido *</label><input id="p-last" name="last_name" required maxlength="60" autocomplete="family-name"></div>
    <div class="field"><label for="p-rut">RUT</label><input id="p-rut" name="rut" maxlength="12" placeholder="12.345.678-9"></div>
    <div class="field"><label for="p-phone">Teléfono</label><input id="p-phone" name="phone" type="tel" maxlength="20" placeholder="+56 9 1234 5678" autocomplete="tel"></div>
    <div class="field field--full"><label for="p-email">Correo electrónico</label><input id="p-email" type="email" disabled><small>Para cambiar tu correo escríbenos por WhatsApp.</small></div>
  </div>
  <label class="check"><input type="checkbox" name="marketing_opt_in"><span>Quiero recibir ofertas y novedades por correo.</span></label>
  <p class="form-error" data-error hidden></p>
  <button class="btn btn--primary" type="submit">Guardar cambios</button>
</form>`

export const pedidosInner = html`<div data-orders><p class="muted">Cargando tus pedidos…</p></div>`

export const direccionesInner = html`<div data-addresses></div>
<form class="acc-card" data-address-form hidden novalidate>
  <h2 data-address-title>Nueva dirección</h2>
  <input type="hidden" name="id">
  <div class="fields">
    <div class="field field--full"><label for="a-label">Nombre de la dirección <span class="optional">(ej. Casa, Trabajo)</span></label><input id="a-label" name="label" maxlength="40"></div>
    <div class="field"><label for="a-region">Región *</label><select id="a-region" name="region" required><option value="">Selecciona tu región</option></select></div>
    <div class="field"><label for="a-comuna">Comuna *</label><select id="a-comuna" name="comuna" required disabled><option value="">Primero elige la región</option></select></div>
    <div class="field field--wide"><label for="a-street">Calle *</label><input id="a-street" name="street" required maxlength="120"></div>
    <div class="field field--narrow"><label for="a-number">Número *</label><input id="a-number" name="number" required maxlength="20"></div>
    <div class="field"><label for="a-apt">Depto / casa</label><input id="a-apt" name="apartment" maxlength="40"></div>
    <div class="field"><label for="a-ref">Referencia</label><input id="a-ref" name="reference" maxlength="160"></div>
  </div>
  <label class="check"><input type="checkbox" name="is_default"><span>Usar como dirección predeterminada</span></label>
  <p class="form-error" data-error hidden></p>
  <div class="acc-actions"><button class="btn btn--primary" type="submit">Guardar dirección</button><button class="btn btn--ghost" type="button" data-cancel>Cancelar</button></div>
</form>`

export function pagosInner(settings) {
  const city = settings.local_city || 'Rancagua'
  return html`<div class="pay-list">
  <div class="acc-card pay-item"><img src="/img/webpay.webp" alt="Webpay" width="110" height="36"><div><strong>Webpay · tarjetas de débito y crédito</strong><p class="muted">Pagas en el sitio seguro de Flow. No guardamos los datos de tu tarjeta.</p></div></div>
  <div class="acc-card pay-item">${icon('card', { size: 28 })}<div><strong>Transferencia bancaria</strong><p class="muted">Al confirmar el pedido te mostramos los datos de la cuenta y te los enviamos por correo.</p></div></div>
  ${settings.cod_enabled !== false ? html`<div class="acc-card pay-item">${icon('truck', { size: 28 })}<div><strong>Pago contra entrega</strong><p class="muted">Disponible solo con delivery en ${city}. Pagas al recibir tu pedido.</p></div></div>` : ''}
  <p class="muted small">Por seguridad, Mi Tiendita Digital Ve no almacena datos de tarjetas: el pago lo procesa Flow con estándares bancarios.</p>
</div>`
}

export const passwordInner = html`<form class="acc-card" data-password novalidate>
  <div class="field"><label for="pw-current">Contraseña actual *</label><div class="pw-wrap"><input id="pw-current" type="password" autocomplete="current-password" required><button type="button" class="a-eye" data-eye aria-label="Mostrar contraseña">${icon('eye', { size: 18 })}</button></div></div>
  <a class="a-link a-link--right" href="/cuenta/recuperar-password">¿Olvidaste tu contraseña?</a>
  <div class="field"><label for="pw-new">Nueva contraseña *</label><div class="pw-wrap"><input id="pw-new" type="password" autocomplete="new-password" required minlength="8" data-strength><button type="button" class="a-eye" data-eye aria-label="Mostrar contraseña">${icon('eye', { size: 18 })}</button></div></div>
  <div class="strength" data-strength-bar><span></span></div>
  <div class="field"><label for="pw-new2">Confirmar nueva contraseña *</label><div class="pw-wrap"><input id="pw-new2" type="password" autocomplete="new-password" required><button type="button" class="a-eye" data-eye aria-label="Mostrar contraseña">${icon('eye', { size: 18 })}</button></div></div>
  <p class="form-error" data-error hidden></p>
  <button class="btn btn--primary" type="submit">Actualizar contraseña</button>
</form>`

export const salirInner = html`<div class="acc-card">
  <h2>Cerrar sesión</h2>
  <p class="muted">¿Seguro que quieres cerrar sesión?</p>
  <button class="btn btn--primary" type="button" data-logout>${icon('logout', { size: 18 })}Sí, cerrar sesión</button>
</div>`

export const favoritosInner = html`<div data-favs><p class="muted">Cargando tus favoritos…</p></div>`
