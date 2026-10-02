/**
 * Mi Tiendita Digital Ve — Correos transaccionales con Resend (estilo Obsidian Jade).
 * Mismo diseño que la página de Gracias: estado, N° de pedido, etapas, productos con foto,
 * totales, entrega, medio de pago, ayuda y redes. HTML de email con estilos inline y tablas.
 * Todo dato que viene del cliente o de la base pasa por esc().
 */
import { Resend } from 'resend'
import { getSettings, getBankDetails } from './settings.js'
import { getCatalog } from './catalog-cache.js'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM ? `Mi Tiendita Digital Ve <${process.env.RESEND_FROM}>` : 'onboarding@resend.dev'
const SITE = 'https://mitienditadigitalve.com'
const LOGO = 'https://hhhijebsmajvphazvxlm.supabase.co/storage/v1/object/public/MI%20TIENDITA%20DIGITAL%20VE/logotipo_mi_tiendita_digital_ve-.png'
import { SOCIAL as STORE_SOCIAL, HOURS_TEXT, GOOGLE_REVIEW_URL } from './store-info.js'
const SOCIAL = STORE_SOCIAL.map(([, label, url]) => [label, url])

// Paleta Obsidian Jade
const C = {
  bg: '#090d16', card: '#0f172a', card2: '#131d2e', line: '#1f2a3d', text: '#ffffff', text2: '#dae2fd',
  muted: '#94a3b8', jade: '#10b981', jade2: '#4ade80', ink: '#03140c', warn: '#fbbf24', info: '#93c5fd',
}
const FONT = "'Manrope','Segoe UI',Helvetica,Arial,sans-serif"
const HEAD = "'Sora','Segoe UI',Helvetica,Arial,sans-serif"

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
const clp = (n) => `$${Math.round(Number(n) || 0).toLocaleString('es-CL')}`
// N° visible: AAAAMMDD-N (migración 008); respaldo con el inicio del UUID si aún no existe
const orderNo = (order) => order?.order_number || String(order?.id || '').slice(0, 8).toUpperCase()
const waNumber = (s) => String(s.contact_whatsapp || '').replace(/\D/g, '')
const firstName = (order) => String(order.customer_name || '').trim().split(/\s+/)[0]
const hello = (order) => `Hola${firstName(order) ? ` <strong style="color:${C.text};">${esc(firstName(order))}</strong>` : ''}`
const fmtDate = (d) => new Date(d || Date.now()).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Santiago' })
const PAY = { flow: 'Webpay (tarjeta de débito o crédito)', transfer: 'Transferencia bancaria', cod: 'Pago contra entrega' }

// Miniatura JPG del correo en Supabase Storage (scripts/catalog/email-thumbs.js).
// /img/productos/<slug>/<n>.webp → …/email/<slug>/<n>.jpg. Las fotos subidas desde el panel ya son URL completas.
const THUMBS = `${process.env.SUPABASE_URL}/storage/v1/object/public/MI%20TIENDITA%20DIGITAL%20VE/email`
function emailImage(src) {
  if (!src) return ''
  if (src.startsWith('http')) return src
  const m = src.match(/^\/img\/productos\/([^/]+)\/(\d+)\.webp$/)
  return m ? `${THUMBS}/${m[1]}/${m[2]}.jpg` : SITE + src
}

/** Foto y variante de cada ítem a partir del catálogo en caché. */
async function enrich(items) {
  let byId = new Map()
  try { byId = new Map((await getCatalog()).map((p) => [p.id, p])) } catch { /* sin catálogo: sin fotos */ }
  return (items || []).map((it) => {
    const p = byId.get(it.product_id)
    const v = p?.variants?.find((x) => x.id === it.variant_id)
    const src = v?.img_url || p?.img_url || ''
    const img = emailImage(src)
    return { name: it.name, variant: it.variant_label || v?.label || '', qty: it.quantity || 1, price: it.price || 0, img }
  })
}

function deliveryInfo(order, s) {
  const city = s.local_city || 'Rancagua'
  if (order.delivery_method === 'pickup') {
    return { title: 'Retiro en tienda', lines: [s.store_address || city, 'Te avisaremos cuando esté listo para retirar.'], eta: 'Te avisaremos' }
  }
  const street = [order.customer_street && `${order.customer_street} ${order.customer_number || ''}`.trim(), order.customer_apartment].filter(Boolean).join(', ')
  const place = [order.customer_comuna, order.customer_region].filter(Boolean).join(', ')
  const isLocal = String(order.customer_comuna || '').toLowerCase().includes(city.toLowerCase())
  return {
    title: isLocal ? `Delivery en ${city}` : 'Envío a regiones',
    lines: [street || order.customer_address || '', place, order.customer_reference ? `Referencia: ${order.customer_reference}` : ''].filter(Boolean),
    eta: isLocal ? '24 a 48 h hábiles' : '5 a 8 días hábiles',
  }
}

// ---------- Bloques reutilizables ----------
const label = (t) => `<p style="margin:0 0 10px;color:${C.muted};font:700 11px/1.4 ${FONT};letter-spacing:.1em;text-transform:uppercase;">${t}</p>`
const box = (inner, { pad = '18px 20px', bg = C.card2, border = C.line } = {}) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${bg};border:1px solid ${border};border-radius:14px;"><tr><td style="padding:${pad};">${inner}</td></tr></table>`
const section = (inner) => `<tr><td style="padding:0 32px 22px;">${inner}</td></tr>`
const button = (href, text, { primary = true } = {}) =>
  `<a href="${esc(href)}" style="display:inline-block;margin:4px;padding:13px 24px;border-radius:12px;font:700 14px/1 ${FONT};text-decoration:none;${primary ? `background:${C.jade};color:${C.ink};` : `background:transparent;color:${C.jade2};border:1px solid ${C.jade};`}">${text}</a>`
const jadeBox = { bg: '#0d2a24', border: '#1f6b52' }

function steps(active, etaText) {
  const items = [['Pedido realizado', 'Recibido'], ['En preparación', 'Lo alistamos'], ['Entrega estimada', etaText]]
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${items.map(([t, d], i) => {
    const on = i <= active
    return `<td width="33%" valign="top" style="padding:0 4px;text-align:center;">
      <div style="height:4px;line-height:4px;font-size:0;border-radius:4px;background:${on ? C.jade : C.line};margin-bottom:10px;">&nbsp;</div>
      <p style="margin:0;color:${on ? C.jade2 : C.muted};font:700 12.5px/1.3 ${FONT};">${t}</p>
      <p style="margin:3px 0 0;color:${C.muted};font:500 12px/1.3 ${FONT};">${esc(d)}</p></td>`
  }).join('')}</tr></table>`
}

function itemsTable(items) {
  return items.map((it) => `<tr>
    <td width="64" style="padding:10px 0;border-bottom:1px solid ${C.line};">${it.img
      ? `<img src="${esc(it.img)}" width="56" height="56" alt="" style="display:block;width:56px;height:56px;border-radius:10px;background:#ffffff;">`
      : `<div style="width:56px;height:56px;border-radius:10px;background:${C.line};"></div>`}</td>
    <td style="padding:10px 12px;border-bottom:1px solid ${C.line};">
      <p style="margin:0;color:${C.text};font:700 14px/1.35 ${FONT};">${esc(it.name)}</p>
      <p style="margin:3px 0 0;color:${C.muted};font:500 12.5px/1.3 ${FONT};">${it.variant && !it.name.includes(it.variant) ? `${esc(it.variant)} · ` : ''}${it.qty} × ${clp(it.price)}</p></td>
    <td align="right" style="padding:10px 0;border-bottom:1px solid ${C.line};color:${C.text2};font:700 14px/1 ${FONT};white-space:nowrap;">${clp(it.price * it.qty)}</td>
  </tr>`).join('')
}

function totals(order, items) {
  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0)
  const row = (k, v, strong) => `<tr><td style="padding:4px 0;color:${strong ? C.text : C.muted};font:${strong ? 800 : 500} ${strong ? 16 : 14}px/1.4 ${strong ? HEAD : FONT};">${k}</td><td align="right" style="padding:4px 0;color:${strong ? C.jade2 : C.text2};font:${strong ? 800 : 600} ${strong ? 18 : 14}px/1.4 ${strong ? HEAD : FONT};">${v}</td></tr>`
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
    ${row('Subtotal', clp(subtotal))}
    ${order.discount_amount ? row(`Descuento${order.coupon_code ? ` (${esc(order.coupon_code)})` : ''}`, `−${clp(order.discount_amount)}`) : ''}
    ${row('Envío', order.shipping_cost ? clp(order.shipping_cost) : order.delivery_method === 'pickup' ? 'Retiro gratis' : 'Gratis')}
    ${row('Total', clp(order.total), true)}
    <tr><td colspan="2" align="right" style="color:${C.muted};font:500 12px/1.4 ${FONT};">IVA incluido</td></tr>
  </table>`
}

/** Plantilla común a todos los correos al cliente. */
function layout({ preheader, badge, badgeColor = C.jade2, title, intro, body, s }) {
  const wa = waNumber(s)
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="supported-color-schemes" content="dark">
<title>${esc(title)}</title>
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;700;800&family=Sora:wght@700;800&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${C.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.bg};padding:28px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:${C.card};border:1px solid ${C.line};border-radius:20px;">
  <tr><td style="padding:24px 32px 18px;border-bottom:1px solid ${C.line};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td><a href="${SITE}" style="text-decoration:none;"><img src="${LOGO}" width="40" height="40" alt="" style="display:inline-block;vertical-align:middle;border-radius:10px;"><span style="display:inline-block;vertical-align:middle;margin-left:10px;color:${C.text};font:800 17px/1 ${HEAD};">Mi Tiendita Digital Ve</span></a></td>
      <td align="right" style="color:${C.muted};font:600 12px/1.3 ${FONT};">🔒 Compra segura</td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:28px 32px 22px;">
    <span style="display:inline-block;padding:7px 14px;border-radius:999px;background:#0d2a24;border:1px solid #1f6b52;color:${badgeColor};font:800 11.5px/1 ${FONT};letter-spacing:.08em;text-transform:uppercase;">${badge}</span>
    <h1 style="margin:16px 0 8px;color:${C.text};font:800 26px/1.2 ${HEAD};letter-spacing:-.02em;">${title}</h1>
    <p style="margin:0;color:${C.text2};font:500 15px/1.6 ${FONT};">${intro}</p>
  </td></tr>
  ${body}
  <tr><td style="padding:4px 32px 26px;">
    ${box(`<p style="margin:0 0 6px;color:${C.text};font:800 15px/1.3 ${HEAD};">¿Tienes dudas?</p>
      <p style="margin:0 0 12px;color:${C.muted};font:500 13.5px/1.6 ${FONT};">Escríbenos por WhatsApp o a <a href="mailto:${esc(s.contact_email)}" style="color:${C.jade2};">${esc(s.contact_email)}</a>. También puedes revisar las <a href="${SITE}/soporte#preguntas" style="color:${C.jade2};">preguntas frecuentes</a>.<br>Atención: ${HOURS_TEXT}.</p>
      ${wa ? button(`https://wa.me/${wa}`, 'Escribir por WhatsApp', { primary: false }) : ''}`)}
  </td></tr>
  <tr><td style="padding:18px 32px 26px;border-top:1px solid ${C.line};text-align:center;">
    <p style="margin:0 0 8px;color:${C.muted};font:600 12.5px/1.6 ${FONT};">Envío gratis en ${esc(s.local_city || 'Rancagua')} sobre ${clp(s.free_shipping_min_rancagua || 80000)} · Pagos seguros · Soporte por WhatsApp</p>
    ${SOCIAL.length || wa ? `<p style="margin:0 0 10px;font:700 12.5px/1.6 ${FONT};">${[...SOCIAL.map(([n, u]) => `<a href="${esc(u)}" style="color:${C.jade2};text-decoration:none;margin:0 6px;">${n}</a>`), wa ? `<a href="https://wa.me/${wa}" style="color:${C.jade2};text-decoration:none;margin:0 6px;">WhatsApp</a>` : ''].join('')}</p>` : ''}
    <p style="margin:0;color:#64748b;font:500 11.5px/1.6 ${FONT};">© ${new Date().getFullYear()} Mi Tiendita Digital Ve · ${esc(s.local_city || 'Rancagua')}, Chile<br>
    <a href="${SITE}/terminos-y-condiciones" style="color:#64748b;">Términos</a> · <a href="${SITE}/politica-de-cambios-y-devoluciones" style="color:#64748b;">Garantía</a> · <a href="${SITE}/politica-de-privacidad" style="color:#64748b;">Privacidad</a></p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`
}

/** Cuerpo del pedido: N°, etapas, productos, totales, entrega y pago. */
function orderBody({ order, items, s, step, extra = '' }) {
  const d = deliveryInfo(order, s)
  return `
  ${section(box(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td><p style="margin:0;color:${C.muted};font:700 11px/1.4 ${FONT};letter-spacing:.1em;text-transform:uppercase;">N° de pedido</p><p style="margin:4px 0 0;color:${C.text};font:800 20px/1.2 ${HEAD};letter-spacing:.04em;">#${orderNo(order)}</p></td>
    <td align="right"><p style="margin:0;color:${C.muted};font:700 11px/1.4 ${FONT};letter-spacing:.1em;text-transform:uppercase;">Fecha</p><p style="margin:4px 0 0;color:${C.text2};font:700 15px/1.2 ${FONT};white-space:nowrap;">${fmtDate(order.created_at)}</p></td>
  </tr></table>`))}
  ${section(steps(step, d.eta))}
  ${extra}
  ${section(`${label('Tu pedido')}<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemsTable(items)}</table>${totals(order, items)}`)}
  ${section(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td width="50%" valign="top" style="padding-right:6px;">${box(`${label('Entrega')}<p style="margin:0;color:${C.text};font:700 14px/1.4 ${FONT};">${esc(d.title)}</p>${d.lines.map((l) => `<p style="margin:3px 0 0;color:${C.muted};font:500 13px/1.5 ${FONT};">${esc(l)}</p>`).join('')}`, { pad: '16px' })}</td>
    <td width="50%" valign="top" style="padding-left:6px;">${box(`${label('Pago')}<p style="margin:0;color:${C.text};font:700 14px/1.4 ${FONT};">${esc(PAY[order.payment_method] || 'Pago')}</p><p style="margin:3px 0 0;color:${C.muted};font:500 13px/1.5 ${FONT};">${esc(order.customer_name || '')}<br>${esc(order.customer_phone || '')}</p>`, { pad: '16px' })}</td>
  </tr></table>`)}
  ${section(`<div style="text-align:center;">${button(`${SITE}/pago/resultado?pedido=${encodeURIComponent(order.id)}`, 'Ver mi pedido')}${button(`${SITE}/tienda`, 'Seguir comprando', { primary: false })}</div>`)}`
}

// ---------- Constructores (devuelven { subject, html }) ----------

export async function buildConfirmation({ order, items }) {
  const [s, list] = await Promise.all([getSettings(), enrich(items)])
  return {
    subject: `Pedido #${orderNo(order)} confirmado — Mi Tiendita Digital Ve`,
    html: layout({
      s, preheader: `Recibimos el pago de tu pedido #${orderNo(order)}. Ya lo estamos preparando.`,
      badge: '✓ Pago confirmado', title: '¡Tu pedido está confirmado!',
      intro: `${hello(order)}, recibimos tu pago y ya estamos preparando tu pedido. Te avisaremos cuando vaya en camino.`,
      body: orderBody({ order, items: list, s, step: 1 }),
    }),
  }
}

export async function buildTransfer({ order, items }) {
  const [s, bank, list] = await Promise.all([getSettings(), getBankDetails(), enrich(items)])
  const no = orderNo(order)
  const wa = waNumber(s)
  const rows = [['Banco', bank.bank_name], ['Tipo de cuenta', bank.bank_account_type], ['N° de cuenta', bank.bank_account_number], ['Titular', bank.bank_holder], ['RUT', bank.bank_rut], ['Monto', clp(order.total)], ['Comentario', `Pedido #${no}`]]
    .filter(([, v]) => v)
  const bankBox = section(box(`${label('Datos para transferir')}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows.map(([k, v]) => `<tr><td style="padding:6px 0;color:${C.muted};font:500 13.5px/1.4 ${FONT};">${k}</td><td align="right" style="padding:6px 0;color:${k === 'Monto' ? C.jade2 : C.text};font:${k === 'Monto' ? 800 : 700} ${k === 'Monto' ? 16 : 14}px/1.4 ${FONT};">${esc(v)}</td></tr>`).join('')}</table>
    <p style="margin:14px 0 0;color:${C.text2};font:500 13.5px/1.6 ${FONT};"><strong style="color:${C.warn};">Importante:</strong> tus productos quedan reservados. Envíanos el comprobante por WhatsApp indicando el pedido <strong style="color:${C.text};">#${no}</strong>. Confirmamos tu pago y preparamos tu pedido.</p>
    ${wa ? `<div style="margin-top:12px;">${button(`https://wa.me/${wa}?text=${encodeURIComponent(`Hola, envío el comprobante de transferencia del pedido #${no}`)}`, 'Enviar comprobante por WhatsApp')}</div>` : ''}`, jadeBox))
  return {
    subject: `Instrucciones de pago — Pedido #${no} — Mi Tiendita Digital Ve`,
    html: layout({
      s, preheader: `Transfiere ${clp(order.total)} para confirmar tu pedido #${no}.`,
      badge: 'Pendiente de pago', badgeColor: C.warn, title: 'Completa tu transferencia',
      intro: `${hello(order)}, recibimos tu pedido. Para confirmarlo, transfiere <strong style="color:${C.jade2};">${clp(order.total)}</strong> a la cuenta de abajo.`,
      body: orderBody({ order, items: list, s, step: 0, extra: bankBox }),
    }),
  }
}

export async function buildCod({ order, items }) {
  const [s, list] = await Promise.all([getSettings(), enrich(items)])
  return {
    subject: `Pedido #${orderNo(order)} confirmado (contra entrega) — Mi Tiendita Digital Ve`,
    html: layout({
      s, preheader: `Tu pedido #${orderNo(order)} está confirmado. Pagas ${clp(order.total)} al recibirlo.`,
      badge: 'Contra entrega', badgeColor: C.info, title: 'Pedido confirmado — pagas al recibir',
      intro: `${hello(order)}, tu pedido quedó confirmado. Pagarás <strong style="color:${C.jade2};">${clp(order.total)}</strong> al momento de la entrega. Te contactaremos para coordinar.`,
      body: orderBody({ order, items: list, s, step: 0 }),
    }),
  }
}

export async function buildShipped({ order, items }) {
  const [s, list] = await Promise.all([getSettings(), enrich(items)])
  const tracking = order.tracking_code
    ? section(box(`${label('Código de seguimiento')}<p style="margin:0;color:${C.text};font:800 18px/1.3 ${HEAD};letter-spacing:.03em;">${esc(order.tracking_code)}</p>`, jadeBox))
    : ''
  return {
    subject: `Tu pedido #${orderNo(order)} va en camino — Mi Tiendita Digital Ve`,
    html: layout({
      s, preheader: `Tu pedido #${orderNo(order)} va en camino.`,
      badge: '🚚 En camino', title: '¡Tu pedido va en camino!',
      intro: `${hello(order)}, despachamos tu pedido.${order.tracking_code ? ' Usa el código de seguimiento para revisar su estado.' : ' Te contactaremos si necesitamos coordinar la entrega.'}`,
      body: orderBody({ order, items: list, s, step: 2, extra: tracking }) + section(box(`<p style="margin:0 0 6px;color:${C.text};font:800 15px/1.3 ${HEAD};">⭐ ¿Cómo fue tu experiencia?</p>
      <p style="margin:0 0 12px;color:${C.muted};font:500 13.5px/1.6 ${FONT};">Cuando recibas tu pedido, cuéntanos qué te pareció. Tu opinión en Google ayuda a otros clientes y a nuestra tienda.</p>
      ${button(GOOGLE_REVIEW_URL, 'Déjanos tu opinión en Google')}`, jadeBox)),
    }),
  }
}

export async function buildStoreNewOrder({ order, items, kind }) {
  const [s, list] = await Promise.all([getSettings(), enrich(items)])
  const no = orderNo(order)
  const d = deliveryInfo(order, s)
  return {
    to: s.contact_email,
    subject: `🛒 Pedido nuevo #${no} — ${kind} — ${clp(order.total)}`,
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#0f172a;max-width:560px">
      <h2 style="margin:0 0 6px">Pedido nuevo #${no} — ${esc(kind)}</h2>
      <p style="margin:0 0 12px;color:#475569">${esc(fmtDate(order.created_at))} · Total <strong>${clp(order.total)}</strong></p>
      <p style="margin:0 0 4px"><strong>${esc(order.customer_name || '')}</strong> · ${esc(order.customer_email || '')} · ${esc(order.customer_phone || '')}</p>
      <p style="margin:0 0 12px;color:#475569">${esc(d.title)} — ${esc(d.lines.join(' · '))}</p>
      <ul style="padding-left:18px;margin:0 0 12px">${list.map((i) => `<li>${esc(i.name)}${i.variant ? ` (${esc(i.variant)})` : ''} × ${i.qty} — ${clp(i.price * i.qty)}</li>`).join('')}</ul>
      <p><a href="${SITE}/admin#/pedidos" style="color:#047857">Abrir en el panel</a></p></div>`,
  }
}

// ---------- Envío ----------

async function send(build, args, tag, to) {
  try {
    const { subject, html, to: builtTo } = await build(args)
    const dest = to || builtTo
    if (!dest) return false
    const { data, error } = await resend.emails.send({ from: FROM, to: [dest], subject, html })
    if (error) { console.error(`❌ Resend (${tag}):`, error.message || error); return false }
    console.log(`📧 ${tag} → ${dest} (id: ${data?.id})`)
    return true
  } catch (err) {
    // Nunca se interrumpe el flujo de pago por un correo
    console.error(`❌ Email ${tag}:`, err.message)
    return false
  }
}

/** Pago confirmado (Webpay aprobado, transferencia confirmada o contra entrega pagado). */
export const sendOrderConfirmation = (args) => send(buildConfirmation, args, 'confirmación', args.order?.customer_email)
/** Pedido por transferencia: datos bancarios, monto y pasos. */
export const sendTransferInstructions = (args) => send(buildTransfer, args, 'transferencia', args.order?.customer_email)
/** Pedido contra entrega: confirmado, se paga al recibir. */
export const sendCodConfirmation = (args) => send(buildCod, args, 'contra entrega', args.order?.customer_email)
/** Pedido despachado, con código de seguimiento si existe. */
export const sendShippedNotification = (args) => send(buildShipped, args, 'despacho', args.order?.customer_email)
/** Aviso interno a la tienda de un pedido nuevo. */
export const sendStoreNewOrder = (args) => send(buildStoreNewOrder, args, 'aviso tienda')
