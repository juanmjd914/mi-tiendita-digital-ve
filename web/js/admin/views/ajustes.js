import { api, run, esc, formData, $ } from '../lib.js'

export async function render(view) {
  const s = await api('/api/admin/settings')
  const v = (k) => esc(s[k] ?? '')
  view.innerHTML = `<div class="adm-top"><div><h1>Ajustes</h1><p>Envíos, pagos, datos bancarios y contacto.</p></div></div>
  <form data-form>
    <section class="card"><h2>Envíos</h2><div class="form-grid form-grid--3">
      <label class="fld"><span>Delivery en ${v('local_city') || 'Rancagua'} (CLP)</span><input class="inp" type="number" min="0" name="delivery_cost_rancagua" value="${v('delivery_cost_rancagua')}"></label>
      <label class="fld"><span>Envío gratis en ${v('local_city') || 'Rancagua'} desde (CLP)</span><input class="inp" type="number" min="0" name="free_shipping_min_rancagua" value="${v('free_shipping_min_rancagua')}"><small>Pon 0 para desactivar el envío gratis.</small></label>
      <label class="fld"><span>Tarifa plana a regiones (CLP)</span><input class="inp" type="number" min="0" name="shipping_flat_regions" value="${v('shipping_flat_regions')}"></label>
      <label class="chk"><input type="checkbox" name="pickup_enabled"${s.pickup_enabled !== false ? ' checked' : ''}> Retiro en tienda disponible</label>
      <label class="chk"><input type="checkbox" name="cod_enabled"${s.cod_enabled !== false ? ' checked' : ''}> Pago contra entrega disponible</label>
    </div></section>
    <section class="card"><h2>Tienda y contacto</h2><div class="form-grid form-grid--2">
      <label class="fld"><span>Ciudad del local</span><input class="inp" name="local_city" value="${v('local_city')}"></label>
      <label class="fld"><span>Dirección de retiro</span><input class="inp" name="store_address" value="${v('store_address')}"></label>
      <label class="fld"><span>Correo de contacto</span><input class="inp" type="email" name="contact_email" value="${v('contact_email')}"><small>Aquí llegan las consultas del formulario de soporte.</small></label>
      <label class="fld"><span>WhatsApp (con código de país, sin +)</span><input class="inp" name="contact_whatsapp" value="${v('contact_whatsapp')}" placeholder="569XXXXXXXX"></label>
    </div></section>
    <section class="card"><h2>Datos bancarios para transferencia</h2><p class="muted small">Solo se muestran al cliente después de crear un pedido por transferencia, y en el correo de instrucciones.</p><div class="form-grid form-grid--2">
      <label class="fld"><span>Banco</span><input class="inp" name="bank_name" value="${v('bank_name')}"></label>
      <label class="fld"><span>Tipo de cuenta</span><input class="inp" name="bank_account_type" value="${v('bank_account_type')}"></label>
      <label class="fld"><span>N° de cuenta</span><input class="inp" name="bank_account_number" value="${v('bank_account_number')}"></label>
      <label class="fld"><span>Titular</span><input class="inp" name="bank_holder" value="${v('bank_holder')}"></label>
      <label class="fld"><span>RUT del titular</span><input class="inp" name="bank_rut" value="${v('bank_rut')}"></label>
    </div></section>
    <div class="savebar"><span>Los cambios se aplican de inmediato en la tienda.</span><button class="btn btn--primary btn--sm" type="submit">Guardar ajustes</button></div>
  </form>`
  $('[data-form]', view).addEventListener('submit', async (e) => {
    e.preventDefault()
    const btn = e.target.querySelector('[type="submit"]')
    btn.disabled = true
    await run(() => api('/api/admin/settings', { method: 'PUT', body: formData(e.target) }), 'Ajustes guardados')
    btn.disabled = false
  })
}
