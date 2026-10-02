// Soporte: formulario de consultas (correo a la tienda + acuse al cliente) y consulta de pedido.
import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import crypto from 'crypto'
import { Resend } from 'resend'
import supabase from '../supabase.js'
import { getSettings } from '../settings.js'
import { escapeHtml as esc } from '../views/html.js'

const router = Router()
const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM ? `Mi Tiendita Digital Ve <${process.env.RESEND_FROM}>` : 'onboarding@resend.dev'
const supportLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 6, standardHeaders: true, legacyHeaders: false, message: { error: 'Enviaste muchas consultas. Intenta más tarde o escríbenos por WhatsApp.' } })
const trackLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false, message: { error: 'Demasiados intentos. Espera unos minutos.' } })
const isEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || ''))
const clean = (v, n) => String(v ?? '').trim().slice(0, n)

router.post('/api/support', supportLimiter, async (req, res) => {
  try {
    const b = req.body || {}
    if (b.website) return res.json({ ok: true, ticket: 'TK-0000' }) // trampa anti-bots
    const name = clean(b.name, 80)
    const email = clean(b.email, 120)
    const topic = clean(b.topic, 80)
    const order = clean(b.order, 12).replace(/[^0-9a-zA-Z]/g, '').toUpperCase()
    const message = clean(b.message, 2000)
    if (!name || !isEmail(email) || !topic || message.length < 10) {
      return res.status(400).json({ error: 'Completa nombre, correo, tema y un mensaje de al menos 10 caracteres.' })
    }
    const ticket = `TK-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
    const settings = await getSettings()
    const body = `<h2 style="margin:0 0 12px">Nueva consulta ${ticket}</h2>
      <p><strong>Nombre:</strong> ${esc(name)}<br><strong>Correo:</strong> ${esc(email)}<br><strong>Tema:</strong> ${esc(topic)}${order ? `<br><strong>Pedido:</strong> #${esc(order)}` : ''}</p>
      <p style="white-space:pre-wrap;border-left:3px solid #10b981;padding-left:12px">${esc(message)}</p>`
    await resend.emails.send({ from: FROM, to: settings.contact_email, replyTo: email, subject: `[${ticket}] ${topic} — ${name}`, html: body })
    await resend.emails.send({
      from: FROM, to: email, subject: `Recibimos tu consulta ${ticket} — Mi Tiendita Digital Ve`,
      html: `<div style="font-family:Arial,sans-serif;background:#0b1326;color:#dae2fd;padding:24px;border-radius:12px">
        <h2 style="color:#4ade80;margin-top:0">¡Recibimos tu consulta!</h2>
        <p>Hola ${esc(name)}, registramos tu solicitud con el código <strong style="color:#fff">${ticket}</strong>. Te responderemos a este correo a la brevedad.</p>
        <p style="color:#94a3b8">Tema: ${esc(topic)}</p>
        <p style="color:#94a3b8">Si es urgente, escríbenos por WhatsApp: +${esc(String(settings.contact_whatsapp).replace(/\D/g, ''))}</p></div>`,
    }).catch(() => {})
    res.json({ ok: true, ticket })
  } catch (err) {
    console.error('/api/support:', err.message)
    res.status(500).json({ error: 'No pudimos enviar tu consulta. Escríbenos por WhatsApp.' })
  }
})

// Consulta de pedido para invitados: N° de pedido (AAAAMMDD-N) + correo de la compra.
// También acepta el formato antiguo (primeros 8 caracteres del identificador).
router.post('/api/support/track', trackLimiter, async (req, res) => {
  try {
    const raw = clean(req.body?.number, 20).replace(/^#/, '').trim()
    const email = clean(req.body?.email, 120).toLowerCase()
    if (!isEmail(email)) return res.status(400).json({ error: 'Revisa el correo de la compra.' })
    let query = supabase.from('orders').select('id, customer_email').limit(5)
    if (/^\d{8}-\d{1,5}$/.test(raw)) query = query.eq('order_number', raw)
    else if (/^[0-9a-f]{8}$/i.test(raw)) {
      const n = raw.toLowerCase()
      query = query.gte('id', `${n}-0000-0000-0000-000000000000`).lte('id', `${n}-ffff-ffff-ffff-ffffffffffff`)
    } else return res.status(400).json({ error: 'Revisa el número de pedido. Ejemplo: 20261001-1' })
    const { data } = await query
    const found = (data || []).find((o) => String(o.customer_email || '').toLowerCase() === email)
    if (!found) return res.status(404).json({ error: 'No encontramos un pedido con esos datos.' })
    res.json({ url: `/pago/resultado?pedido=${found.id}` })
  } catch (err) {
    console.error('/api/support/track:', err.message)
    res.status(500).json({ error: 'No pudimos buscar tu pedido.' })
  }
})

export default router
