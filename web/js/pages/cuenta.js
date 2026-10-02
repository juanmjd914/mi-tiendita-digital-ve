import { sb, requireSession, authFetch, authErrorEs } from '../core/auth.js'
import { syncWishlist } from '../core/wishlist-sync.js'
import { clp, esc, toast, $, $$ } from '../core/ui.js'
import { validRut, formatRut } from '../core/rut.js'

const section = $('[data-account]')?.dataset.account
const session = await requireSession()
const user = session.user
$('[data-guard-loading]').hidden = true
$('[data-guard]').hidden = false

const showErr = (form, m) => { const e = form.querySelector('[data-error]'); e.textContent = m; e.hidden = !m }
const busy = (form, on) => { const b = form.querySelector('[type="submit"]'); if (b) { b.disabled = on; b.classList.toggle('is-loading', on) } }

// Mostrar / ocultar contraseña
$$('[data-eye]').forEach((b) => b.addEventListener('click', () => {
  const input = b.parentElement.querySelector('input')
  input.type = input.type === 'password' ? 'text' : 'password'
  b.classList.toggle('is-on', input.type === 'text')
}))

// ================= DATOS PERSONALES =================
async function datos() {
  const form = $('[data-profile]')
  if (new URLSearchParams(location.search).get('clave') === 'actualizada') toast('Tu contraseña fue actualizada')
  const { data: p } = await sb.from('customer_profiles').select('*').eq('user_id', user.id).maybeSingle()
  const f = form.elements
  f.first_name.value = p?.first_name || user.user_metadata?.first_name || ''
  f.last_name.value = p?.last_name || user.user_metadata?.last_name || ''
  f.rut.value = p?.rut || ''
  f.phone.value = p?.phone || ''
  f.marketing_opt_in.checked = Boolean(p?.marketing_opt_in)
  $('#p-email').value = user.email
  $('[data-email-label]').textContent = user.email
  $('[data-hello]').textContent = `Hola, ${f.first_name.value || 'bienvenido'}`
  if (p?.avatar_url) $('[data-avatar]').innerHTML = `<img src="${esc(p.avatar_url)}" alt="Foto de perfil">`

  f.rut.addEventListener('blur', () => { if (f.rut.value) f.rut.value = formatRut(f.rut.value) })
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    showErr(form, '')
    if (!f.first_name.value.trim() || !f.last_name.value.trim()) return showErr(form, 'Ingresa tu nombre y apellido.')
    if (f.rut.value.trim() && !validRut(f.rut.value)) return showErr(form, 'El RUT ingresado no es válido.')
    busy(form, true)
    const row = {
      user_id: user.id, first_name: f.first_name.value.trim(), last_name: f.last_name.value.trim(),
      rut: f.rut.value.trim() ? formatRut(f.rut.value) : null, phone: f.phone.value.trim() || null,
      marketing_opt_in: f.marketing_opt_in.checked,
    }
    const { error } = await sb.from('customer_profiles').upsert(row, { onConflict: 'user_id' })
    busy(form, false)
    if (error) return showErr(form, 'No pudimos guardar tus datos. Inténtalo de nuevo.')
    $('[data-hello]').textContent = `Hola, ${row.first_name}`
    toast('Datos guardados')
  })

  $('[data-avatar-input]').addEventListener('change', async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return toast('Usa una imagen JPG, PNG o WEBP', { type: 'error' })
    if (file.size > 2 * 1024 * 1024) return toast('La imagen debe pesar menos de 2 MB', { type: 'error' })
    const path = `${user.id}/avatar-${Date.now()}.${file.type.split('/')[1]}`
    const { error } = await sb.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type })
    if (error) return toast('No pudimos subir la imagen', { type: 'error' })
    const url = sb.storage.from('avatars').getPublicUrl(path).data.publicUrl
    await sb.from('customer_profiles').upsert({ user_id: user.id, avatar_url: url }, { onConflict: 'user_id' })
    $('[data-avatar]').innerHTML = `<img src="${esc(url)}" alt="Foto de perfil">`
    toast('Foto actualizada')
  })
}

// ================= MIS PEDIDOS =================
const STATUS = {
  paid: ['Pagado', 'ok'], pending: ['Pago pendiente', 'warn'], pending_transfer: ['Esperando transferencia', 'warn'],
  pending_cod: ['Contra entrega', 'ok'], rejected: ['Pago rechazado', 'bad'], cancelled: ['Cancelado', 'bad'],
}
const fmt = (d) => (d ? new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d)) : '')
const fmtTime = (d) => (d ? new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(d)) : '')

function timeline(o) {
  const pickup = o.deliveryMethod === 'pickup'
  const steps = [
    ['Pedido realizado', o.dates.created],
    ['Pago confirmado', o.dates.paid || (o.status === 'pending_cod' ? o.dates.created : null)],
    ['En preparación', o.dates.preparing],
    [pickup ? 'Listo para retiro' : 'En camino', o.dates.shipped],
    [pickup ? 'Retirado' : 'Entregado', o.dates.delivered],
  ]
  const lastDone = steps.reduce((n, [, d], i) => (d ? i : n), 0)
  return `<ol class="otrack">${steps.map(([t, d], i) => `<li class="otrack__step${i <= lastDone ? ' is-done' : ''}">
      <span class="otrack__dot"></span><strong>${esc(t)}</strong><small>${d ? esc(fmtTime(d)) : 'Pendiente'}</small>
      ${i === 3 && o.tracking ? `<small class="otrack__code">Código: ${esc(o.tracking)}</small>` : ''}
    </li>`).join('')}</ol>`
}

function stars(name) {
  return `<div class="stars-input" role="radiogroup" aria-label="Calificación">${[5, 4, 3, 2, 1].map((n) => `<input type="radio" name="${name}" id="${name}-${n}" value="${n}"><label for="${name}-${n}" title="${n} estrella${n > 1 ? 's' : ''}">★</label>`).join('')}</div>`
}

async function pedidos() {
  const box = $('[data-orders]')
  const res = await authFetch('/api/account/orders')
  if (!res.ok) { box.innerHTML = '<p class="form-error">No pudimos cargar tus pedidos.</p>'; return }
  const orders = await res.json()
  if (!orders.length) {
    box.innerHTML = '<div class="acc-card empty-state"><h2>Aún no tienes pedidos</h2><p class="muted">Cuando compres, podrás seguir aquí el estado de cada pedido.</p><a class="btn btn--primary" href="/tienda">Ir a la tienda</a></div>'
    return
  }
  const open = new URLSearchParams(location.search).get('pedido')
  box.innerHTML = orders.map((o) => {
    const [label, tone] = STATUS[o.status] || [o.status, 'warn']
    return `<details class="order-card"${open === o.id || (!open && o === orders[0]) ? ' open' : ''}>
      <summary>
        <div><strong>Pedido #${esc(o.number)}</strong><small>${esc(fmt(o.dates.created))} · ${o.items.reduce((n, i) => n + i.qty, 0)} producto(s)</small></div>
        <span class="badge badge--${tone}">${esc(label)}</span>
        <strong class="order-card__total">${clp(o.total)}</strong>
      </summary>
      <div class="order-card__body">
        ${timeline(o)}
        <h3>Productos</h3>
        <div class="o-items">${o.items.map((i) => `<div class="o-item">
          <img src="${esc(i.img)}" alt="" width="56" height="56">
          <div class="o-item__info"><strong>${i.slug ? `<a href="/producto/${esc(i.slug)}">${esc(i.name)}</a>` : esc(i.name)}</strong><small>Cantidad: ${i.qty} · ${clp(i.price)}</small></div>
          ${i.canReview ? `<button class="btn btn--ghost btn--sm" type="button" data-review-open="${i.productId}" data-review-name="${esc(i.name)}">★ Opinar</button>`
            : i.review ? `<span class="badge badge--${i.review.status === 'approved' ? 'ok' : 'warn'}">${i.review.status === 'approved' ? 'Opinión publicada' : 'Opinión en revisión'}</span>` : ''}
        </div>`).join('')}</div>
        <dl class="o-totals">
          ${o.discount ? `<div><dt>Descuento${o.coupon ? ` (${esc(o.coupon)})` : ''}</dt><dd>−${clp(o.discount)}</dd></div>` : ''}
          <div><dt>Envío</dt><dd>${o.shipping ? clp(o.shipping) : 'Gratis'}</dd></div>
          <div><dt>Total</dt><dd><strong>${clp(o.total)}</strong></dd></div>
        </dl>
        <p class="muted small">${o.deliveryMethod === 'pickup' ? 'Retiro en local' : `Despacho a: ${esc(o.address || '')}`}</p>
        ${o.status === 'pending_transfer' ? `<a class="btn btn--primary btn--sm" href="/pago/resultado?pedido=${esc(o.id)}">Ver datos de transferencia</a>` : ''}
      </div>
    </details>`
  }).join('')

  box.addEventListener('click', (e) => {
    const b = e.target.closest('[data-review-open]')
    if (!b) return
    openReview(Number(b.dataset.reviewOpen), b.dataset.reviewName, b)
  })
}

function openReview(productId, name, trigger) {
  const dlg = document.createElement('div')
  dlg.className = 'modal'
  dlg.innerHTML = `<form class="modal__card" role="dialog" aria-modal="true" aria-label="Opinar sobre ${esc(name)}">
    <h2>Tu opinión</h2><p class="muted">${esc(name)}</p>
    ${stars('rating')}
    <label class="field"><span class="sr-only">Comentario</span><textarea name="comment" rows="4" maxlength="2000" placeholder="¿Qué te pareció el producto? (opcional)"></textarea></label>
    <p class="form-error" data-error hidden></p>
    <div class="acc-actions"><button class="btn btn--primary" type="submit">Enviar opinión</button><button class="btn btn--ghost" type="button" data-close>Cancelar</button></div>
  </form>`
  const close = () => { dlg.remove(); trigger.focus() }
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-close]')) close() })
  const form = dlg.querySelector('form')
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const rating = form.elements.rating.value
    if (!rating) return showErr(form, 'Elige cuántas estrellas le das.')
    busy(form, true)
    const res = await authFetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId, rating: Number(rating), comment: form.elements.comment.value }) })
    const data = await res.json().catch(() => ({}))
    busy(form, false)
    if (!res.ok) return showErr(form, data.error || 'No pudimos guardar tu opinión.')
    close()
    toast(data.message || '¡Gracias por tu opinión!')
    trigger.outerHTML = '<span class="badge badge--warn">Opinión en revisión</span>'
  })
  document.body.append(dlg)
  dlg.querySelector('input').focus()
}

// ================= DIRECCIONES =================
let regions = []
async function direcciones() {
  const list = $('[data-addresses]')
  const form = $('[data-address-form]')
  const f = form.elements
  regions = await fetch('/data/chile-regiones.json').then((r) => r.json())
  f.region.insertAdjacentHTML('beforeend', regions.map((r) => `<option>${esc(r.region)}</option>`).join(''))
  const fillComunas = (region, sel = '') => {
    const r = regions.find((x) => x.region === region)
    f.comuna.innerHTML = r ? `<option value="">Selecciona tu comuna</option>${r.comunas.map((c) => `<option${c === sel ? ' selected' : ''}>${esc(c)}</option>`).join('')}` : '<option value="">Primero elige la región</option>'
    f.comuna.disabled = !r
  }
  f.region.addEventListener('change', () => fillComunas(f.region.value))

  async function load() {
    const { data } = await sb.from('customer_addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false }).order('created_at')
    list.innerHTML = `${(data || []).map((a) => `<div class="acc-card addr">
        <div>
          <strong>${esc(a.label || 'Dirección')}${a.is_default ? ' <span class="badge badge--ok">Predeterminada</span>' : ''}</strong>
          <p class="muted">${esc(`${a.street} ${a.number}${a.apartment ? `, ${a.apartment}` : ''}`)}<br>${esc(a.comuna)}, ${esc(a.region)}${a.reference ? `<br>Ref: ${esc(a.reference)}` : ''}</p>
        </div>
        <div class="addr__actions">
          ${a.is_default ? '' : `<button class="link-btn" type="button" data-default="${a.id}">Usar como predeterminada</button>`}
          <button class="link-btn" type="button" data-edit="${a.id}">Editar</button>
          <button class="link-btn link-btn--danger" type="button" data-del="${a.id}">Eliminar</button>
        </div>
      </div>`).join('')}
      <button class="btn btn--ghost" type="button" data-new>+ Agregar dirección</button>`
    list.dataset.rows = JSON.stringify(data || [])
  }

  function edit(a) {
    form.hidden = false
    $('[data-address-title]').textContent = a ? 'Editar dirección' : 'Nueva dirección'
    f.id.value = a?.id || ''
    f.label.value = a?.label || ''
    f.region.value = a?.region || ''
    fillComunas(f.region.value, a?.comuna || '')
    f.street.value = a?.street || ''
    f.number.value = a?.number || ''
    f.apartment.value = a?.apartment || ''
    f.reference.value = a?.reference || ''
    f.is_default.checked = a ? a.is_default : !JSON.parse(list.dataset.rows || '[]').length
    form.scrollIntoView({ behavior: 'smooth', block: 'start' })
    f.label.focus()
  }

  list.addEventListener('click', async (e) => {
    const rows = JSON.parse(list.dataset.rows || '[]')
    const id = e.target.closest('[data-edit],[data-del],[data-default]')
    if (e.target.closest('[data-new]')) return edit(null)
    if (!id) return
    const a = rows.find((r) => r.id === (id.dataset.edit || id.dataset.del || id.dataset.default))
    if (id.dataset.edit) edit(a)
    if (id.dataset.del && confirm('¿Eliminar esta dirección?')) { await sb.from('customer_addresses').delete().eq('id', a.id); load() }
    if (id.dataset.default) {
      await sb.from('customer_addresses').update({ is_default: false }).eq('user_id', user.id).eq('is_default', true)
      await sb.from('customer_addresses').update({ is_default: true }).eq('id', a.id)
      load()
    }
  })
  $('[data-cancel]').addEventListener('click', () => { form.hidden = true })
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    showErr(form, '')
    if (!f.region.value || !f.comuna.value || !f.street.value.trim() || !f.number.value.trim()) return showErr(form, 'Completa región, comuna, calle y número.')
    busy(form, true)
    const row = {
      user_id: user.id, label: f.label.value.trim() || null, region: f.region.value, comuna: f.comuna.value,
      street: f.street.value.trim(), number: f.number.value.trim(), apartment: f.apartment.value.trim() || null,
      reference: f.reference.value.trim() || null, is_default: f.is_default.checked,
    }
    if (row.is_default) await sb.from('customer_addresses').update({ is_default: false }).eq('user_id', user.id).eq('is_default', true)
    const { error } = f.id.value
      ? await sb.from('customer_addresses').update(row).eq('id', f.id.value)
      : await sb.from('customer_addresses').insert(row)
    busy(form, false)
    if (error) return showErr(form, 'No pudimos guardar la dirección.')
    form.hidden = true
    toast('Dirección guardada')
    load()
  })
  load()
}

// ================= CONTRASEÑA =================
function password() {
  const form = $('[data-password]')
  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    showErr(form, '')
    const cur = $('#pw-current').value
    const n1 = $('#pw-new').value
    if (n1.length < 8) return showErr(form, 'La nueva contraseña debe tener al menos 8 caracteres.')
    if (n1 !== $('#pw-new2').value) return showErr(form, 'Las contraseñas nuevas no coinciden.')
    busy(form, true)
    // Re-autenticación: confirma la contraseña actual antes de cambiarla
    const { error: e1 } = await sb.auth.signInWithPassword({ email: user.email, password: cur })
    if (e1) { busy(form, false); return showErr(form, 'La contraseña actual no es correcta.') }
    const { error } = await sb.auth.updateUser({ password: n1 })
    busy(form, false)
    if (error) return showErr(form, authErrorEs(error))
    form.reset()
    toast('Contraseña actualizada')
  })
}

// ================= CERRAR SESIÓN =================
function salir() {
  $('[data-logout]').addEventListener('click', async () => {
    await sb.auth.signOut()
    try { localStorage.removeItem('mtd_wishlist_v1') } catch { /* sin almacenamiento */ }
    location.replace('/')
  })
}

syncWishlist(user.id).catch(() => {})
;({ datos, pedidos, direcciones, password, salir }[section] || (() => {}))()
