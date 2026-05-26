/**
 * Flow Chile — Helper de integración
 * Docs: https://www.getflow.cl/
 *
 * Firma: HMAC-SHA256 sobre parámetros ordenados alfabéticamente
 */
import crypto from 'crypto'

const API_KEY    = process.env.FLOW_API_KEY
const SECRET_KEY = process.env.FLOW_SECRET_KEY
const BASE_URL   = process.env.FLOW_BASE_URL || 'https://sandbox.flow.cl/api'
const PUBLIC_URL = process.env.PUBLIC_URL    || 'http://localhost:3001'

// En dev el frontend corre en :5174, en producción en el mismo dominio
const FRONTEND_URL = process.env.NODE_ENV === 'production'
  ? PUBLIC_URL
  : PUBLIC_URL.replace(':3001', ':5174')

/**
 * Genera la firma HMAC-SHA256 requerida por Flow
 * @param {Object} params - parámetros a firmar (sin 's')
 * @returns {string} firma hex
 */
export function sign(params) {
  const sorted = Object.keys(params)
    .sort()
    .map(k => `${k}${params[k]}`)
    .join('')
  return crypto
    .createHmac('sha256', SECRET_KEY)
    .update(sorted)
    .digest('hex')
}

/**
 * Verifica la firma de un webhook de Flow
 */
export function verifySignature(params) {
  const { s, ...rest } = params
  return sign(rest) === s
}

/**
 * Crea un pago en Flow y retorna la URL de redirección + token
 * @param {{ orderId: string, subject: string, amount: number, email: string }} opts
 */
export async function createPayment({ orderId, subject, amount, email }) {
  const params = {
    apiKey:          API_KEY,
    commerceOrder:   String(orderId),
    subject:         subject.slice(0, 255),
    currency:        'CLP',
    amount:          Math.round(amount),
    email:           email,
    urlConfirmation: `${PUBLIC_URL}/api/payment/confirm`,
    urlReturn:       `${FRONTEND_URL}/pago/resultado`,
  }
  params.s = sign(params)

  const body = new URLSearchParams(params).toString()

  const res = await fetch(`${BASE_URL}/payment/create`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  const data = await res.json()

  if (!res.ok || data.code) {
    throw new Error(data.message || `Flow error ${res.status}`)
  }

  return {
    url:         data.url,
    token:       data.token,
    redirectUrl: `${data.url}?token=${data.token}`,
  }
}

/**
 * Consulta el estado de un pago por token
 * Statuses: 1=pendiente 2=pagado 3=rechazado 4=anulado
 */
export async function getPaymentStatus(token) {
  const params = { apiKey: API_KEY, token }
  params.s = sign(params)

  const qs  = new URLSearchParams(params).toString()
  const res = await fetch(`${BASE_URL}/payment/getStatus?${qs}`)
  const data = await res.json()

  if (!res.ok || data.code) {
    throw new Error(data.message || `Flow status error ${res.status}`)
  }

  const STATUS_MAP = { 1: 'pending', 2: 'paid', 3: 'rejected', 4: 'cancelled' }
  return {
    ...data,
    statusLabel: STATUS_MAP[data.status] || 'unknown',
  }
}
