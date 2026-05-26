/**
 * Mi Tiendita Digital Ve — Emails transaccionales con Resend
 * Docs: https://resend.com/docs
 */
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM   = process.env.RESEND_FROM
  ? `Mi Tiendita Digital Ve <${process.env.RESEND_FROM}>`
  : 'onboarding@resend.dev'

// ── Formato moneda chilena ─────────────────────────────────────────
const clp = (n) => `$${Number(n).toLocaleString('es-CL')}`

// ── Template HTML: Confirmación de pedido ─────────────────────────
function buildConfirmationHTML({ order, items }) {
  const itemsRows = items.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #1e1e2e;color:#c0c0d0;font-size:14px;">
        ${item.name}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #1e1e2e;color:#c0c0d0;font-size:14px;text-align:center;">
        ×${item.quantity}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #1e1e2e;color:#e8e8f0;font-size:14px;text-align:right;font-weight:600;">
        ${clp(item.price * item.quantity)}
      </td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Pedido confirmado — Mi Tiendita Digital Ve</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Helvetica Neue',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header con logo -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f0f1a 0%,#12122a 100%);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;border:1px solid #1e1e3a;border-bottom:none;">
              <img src="https://hhhijebsmajvphazvxlm.supabase.co/storage/v1/object/public/MI%20TIENDITA%20DIGITAL%20VE/logotipo_mi_tiendita_digital_ve-.png"
                   alt="Mi Tiendita Digital Ve" width="64" height="64"
                   style="border-radius:12px;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto;"/>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
                Mi Tiendita Digital Ve
              </h1>
              <p style="margin:6px 0 0;color:#7c5af0;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;font-weight:600;">
                Tecnología &amp; Gaming · Rancagua, Chile
              </p>
            </td>
          </tr>

          <!-- Banner "¡Pedido confirmado!" -->
          <tr>
            <td style="background:linear-gradient(135deg,#1a2f1a,#0f1f2a);padding:28px 40px;text-align:center;border-left:1px solid #1e1e3a;border-right:1px solid #1e1e3a;">
              <div style="display:inline-block;background:rgba(129,215,66,0.12);border:1px solid rgba(129,215,66,0.3);border-radius:50px;padding:8px 20px;margin-bottom:16px;">
                <span style="color:#81d742;font-size:13px;font-weight:700;letter-spacing:0.08em;">
                  ✅ PAGO RECIBIDO
                </span>
              </div>
              <h2 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;">
                ¡Tu pedido está confirmado!
              </h2>
              <p style="margin:10px 0 0;color:#8080a0;font-size:15px;">
                Hola${order.customer_name ? ` <strong style="color:#c0c0d0;">${order.customer_name}</strong>` : ''},
                gracias por tu compra 🎉
              </p>
            </td>
          </tr>

          <!-- Número de orden -->
          <tr>
            <td style="background:#0f0f1a;padding:20px 40px;border-left:1px solid #1e1e3a;border-right:1px solid #1e1e3a;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:rgba(255,255,255,0.03);border:1px solid #1e1e3a;border-radius:12px;padding:16px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="margin:0;color:#606080;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Número de orden</p>
                          <p style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:800;font-family:monospace;">#${order.id}</p>
                        </td>
                        <td style="text-align:right;">
                          <p style="margin:0;color:#606080;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Total pagado</p>
                          <p style="margin:4px 0 0;color:#81d742;font-size:22px;font-weight:800;">${clp(order.total)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Detalle de productos -->
          <tr>
            <td style="background:#0f0f1a;padding:0 40px 24px;border-left:1px solid #1e1e3a;border-right:1px solid #1e1e3a;">
              <p style="margin:0 0 12px;color:#606080;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">
                Detalle del pedido
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.02);border:1px solid #1e1e3a;border-radius:12px;padding:4px 16px;overflow:hidden;">
                <tbody>
                  ${itemsRows}
                  <!-- Total -->
                  <tr>
                    <td colspan="2" style="padding:12px 0 8px;color:#606080;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">
                      Total
                    </td>
                    <td style="padding:12px 0 8px;color:#81d742;font-size:18px;font-weight:800;text-align:right;">
                      ${clp(order.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Próximos pasos -->
          <tr>
            <td style="background:#0f0f1a;padding:0 40px 28px;border-left:1px solid #1e1e3a;border-right:1px solid #1e1e3a;">
              <p style="margin:0 0 14px;color:#606080;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">
                ¿Qué sigue?
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:rgba(6,182,212,0.06);border:1px solid rgba(6,182,212,0.18);border-radius:12px;padding:16px 20px;">
                    <p style="margin:0;color:#06b6d4;font-size:13px;font-weight:600;">📦 Procesaremos tu pedido en menos de 24 horas hábiles.</p>
                    <p style="margin:8px 0 0;color:#7070a0;font-size:13px;line-height:1.6;">
                      Si tienes dudas, escríbenos por WhatsApp o al correo
                      <a href="mailto:soporte@mitienditadigitalve.com" style="color:#06b6d4;text-decoration:none;">soporte@mitienditadigitalve.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA WhatsApp -->
          <tr>
            <td style="background:#0f0f1a;padding:0 40px 36px;text-align:center;border-left:1px solid #1e1e3a;border-right:1px solid #1e1e3a;">
              <a href="https://wa.me/56946216579?text=Hola%2C%20hice%20el%20pedido%20%23${order.id}%20y%20quisiera%20consultar"
                 style="display:inline-block;background:#25d366;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 28px;border-radius:12px;letter-spacing:0.02em;">
                💬 Contactar por WhatsApp
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#070710;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border:1px solid #1e1e3a;border-top:1px solid #1a1a2e;">
              <p style="margin:0;color:#404060;font-size:12px;">
                © Mi Tiendita Digital Ve 2026 · Rancagua, Chile
              </p>
              <p style="margin:6px 0 0;color:#303050;font-size:11px;">
                Desarrollado por
                <a href="https://technecreativ.com" style="color:#5a3aad;text-decoration:none;">Techne Creativ</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

// ── Template HTML: Instrucciones de transferencia ─────────────────
function buildTransferHTML({ order, items }) {
  const itemsRows = items.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #1e1e2e;color:#c0c0d0;font-size:14px;">
        ${item.name}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #1e1e2e;color:#c0c0d0;font-size:14px;text-align:center;">
        ×${item.quantity}
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #1e1e2e;color:#e8e8f0;font-size:14px;text-align:right;font-weight:600;">
        ${clp(item.price * item.quantity)}
      </td>
    </tr>
  `).join('')

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Instrucciones de pago — Mi Tiendita Digital Ve</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f0f1a 0%,#12122a 100%);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;border:1px solid #1e1e3a;border-bottom:none;">
              <img src="https://hhhijebsmajvphazvxlm.supabase.co/storage/v1/object/public/MI%20TIENDITA%20DIGITAL%20VE/logotipo_mi_tiendita_digital_ve-.png"
                   alt="Mi Tiendita Digital Ve" width="64" height="64"
                   style="border-radius:12px;margin-bottom:16px;display:block;margin-left:auto;margin-right:auto;"/>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">
                Mi Tiendita Digital Ve
              </h1>
              <p style="margin:6px 0 0;color:#7c5af0;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;font-weight:600;">
                Tecnología &amp; Gaming · Rancagua, Chile
              </p>
            </td>
          </tr>

          <!-- Banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f1a2a,#0a1520);padding:28px 40px;text-align:center;border-left:1px solid #1e1e3a;border-right:1px solid #1e1e3a;">
              <div style="display:inline-block;background:rgba(6,182,212,0.12);border:1px solid rgba(6,182,212,0.3);border-radius:50px;padding:8px 20px;margin-bottom:16px;">
                <span style="color:#06b6d4;font-size:13px;font-weight:700;letter-spacing:0.08em;">
                  🏦 PEDIDO RECIBIDO — PENDIENTE DE PAGO
                </span>
              </div>
              <h2 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;">
                ¡Tu pedido está reservado!
              </h2>
              <p style="margin:10px 0 0;color:#8080a0;font-size:15px;">
                Hola${order.customer_name ? ` <strong style="color:#c0c0d0;">${order.customer_name}</strong>` : ''},
                completa tu pago por transferencia para confirmar el pedido 🎉
              </p>
            </td>
          </tr>

          <!-- Número de orden -->
          <tr>
            <td style="background:#0f0f1a;padding:20px 40px;border-left:1px solid #1e1e3a;border-right:1px solid #1e1e3a;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:rgba(255,255,255,0.03);border:1px solid #1e1e3a;border-radius:12px;padding:16px 20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td>
                          <p style="margin:0;color:#606080;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Número de orden</p>
                          <p style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:800;font-family:monospace;">#${order.id}</p>
                        </td>
                        <td style="text-align:right;">
                          <p style="margin:0;color:#606080;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">Total a transferir</p>
                          <p style="margin:4px 0 0;color:#06b6d4;font-size:22px;font-weight:800;">${clp(order.total)}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Datos bancarios -->
          <tr>
            <td style="background:#0f0f1a;padding:0 40px 24px;border-left:1px solid #1e1e3a;border-right:1px solid #1e1e3a;">
              <p style="margin:0 0 12px;color:#606080;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">
                Datos para la transferencia
              </p>
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:rgba(6,182,212,0.05);border:1px solid rgba(6,182,212,0.2);border-radius:12px;padding:0;overflow:hidden;">
                <tbody>
                  ${[
                    ['Banco',          'Banco Falabella'],
                    ['Tipo de cuenta', 'Cuenta Corriente'],
                    ['Número',         '1-982-273710-0'],
                    ['Titular',        'Juan Carlos Mejias'],
                    ['RUT',            '27.012.143-8'],
                  ].map(([k,v], i) => `
                  <tr style="border-bottom:1px solid rgba(6,182,212,0.1);">
                    <td style="padding:12px 20px;color:#7090a0;font-size:13px;font-weight:600;width:45%;">${k}</td>
                    <td style="padding:12px 20px;color:#e0f0ff;font-size:13px;font-weight:700;">${v}</td>
                  </tr>`).join('')}
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Detalle productos -->
          <tr>
            <td style="background:#0f0f1a;padding:0 40px 24px;border-left:1px solid #1e1e3a;border-right:1px solid #1e1e3a;">
              <p style="margin:0 0 12px;color:#606080;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">
                Detalle del pedido
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.02);border:1px solid #1e1e3a;border-radius:12px;padding:4px 16px;overflow:hidden;">
                <tbody>
                  ${itemsRows}
                  <tr>
                    <td colspan="2" style="padding:12px 0 8px;color:#606080;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;">Total</td>
                    <td style="padding:12px 0 8px;color:#06b6d4;font-size:18px;font-weight:800;text-align:right;">${clp(order.total)}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>

          <!-- Instrucciones -->
          <tr>
            <td style="background:#0f0f1a;padding:0 40px 28px;border-left:1px solid #1e1e3a;border-right:1px solid #1e1e3a;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:rgba(255,194,34,0.06);border:1px solid rgba(255,194,34,0.18);border-radius:12px;padding:16px 20px;">
                    <p style="margin:0;color:#ffc222;font-size:13px;font-weight:600;">⚡ Pasos para confirmar tu pedido</p>
                    <ol style="margin:10px 0 0;padding-left:18px;color:#7070a0;font-size:13px;line-height:1.8;">
                      <li>Realiza la transferencia por <strong style="color:#e0d080;">${clp(order.total)}</strong> a los datos indicados arriba.</li>
                      <li>Envía el comprobante por WhatsApp al <strong style="color:#e0d080;">+56 9 4621 6579</strong> indicando el N° de orden <strong style="color:#e0d080;">#${order.id}</strong>.</li>
                      <li>Una vez verificado el pago, confirmaremos tu pedido y coordinaremos la entrega.</li>
                    </ol>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA WhatsApp -->
          <tr>
            <td style="background:#0f0f1a;padding:0 40px 36px;text-align:center;border-left:1px solid #1e1e3a;border-right:1px solid #1e1e3a;">
              <a href="https://wa.me/56946216579?text=Hola%2C%20quiero%20enviar%20el%20comprobante%20de%20transferencia%20del%20pedido%20%23${order.id}"
                 style="display:inline-block;background:#25d366;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 28px;border-radius:12px;letter-spacing:0.02em;">
                💬 Enviar Comprobante por WhatsApp
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#070710;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border:1px solid #1e1e3a;border-top:1px solid #1a1a2e;">
              <p style="margin:0;color:#404060;font-size:12px;">
                © Mi Tiendita Digital Ve 2026 · Rancagua, Chile
              </p>
              <p style="margin:6px 0 0;color:#303050;font-size:11px;">
                Desarrollado por
                <a href="https://technecreativ.com" style="color:#5a3aad;text-decoration:none;">Techne Creativ</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

// ── Enviar instrucciones de transferencia ─────────────────────────
/**
 * @param {{ order: Object, items: Array }} opts
 * @returns {Promise<void>}
 */
export async function sendTransferInstructions({ order, items }) {
  try {
    const { data, error } = await resend.emails.send({
      from:    FROM,
      to:      [order.customer_email],
      subject: `🏦 Instrucciones de pago — Pedido #${order.id} — Mi Tiendita Digital Ve`,
      html:    buildTransferHTML({ order, items }),
    })
    if (error) { console.error('❌ Resend error:', error); return }
    console.log(`📧 Email transferencia enviado → ${order.customer_email} (id: ${data?.id})`)
  } catch (err) {
    console.error('❌ sendTransferInstructions error:', err.message)
  }
}

// ── Enviar confirmación de pedido ──────────────────────────────────
/**
 * @param {{ order: Object, items: Array }} opts
 * @returns {Promise<void>}
 */
export async function sendOrderConfirmation({ order, items }) {
  try {
    const { data, error } = await resend.emails.send({
      from:    FROM,
      to:      [order.customer_email],
      subject: `✅ Pedido #${order.id} confirmado — Mi Tiendita Digital Ve`,
      html:    buildConfirmationHTML({ order, items }),
    })

    if (error) {
      console.error('❌ Resend error:', error)
      return
    }

    console.log(`📧 Email confirmación enviado → ${order.customer_email} (id: ${data?.id})`)
  } catch (err) {
    // No lanzamos el error para no interrumpir el flujo de pago
    console.error('❌ sendOrderConfirmation error:', err.message)
  }
}
