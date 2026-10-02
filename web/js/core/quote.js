// Pide al servidor la cotización del carrito (precios, stock, cupón y envío reales).
import { cart } from './store.js'

const COUPON_KEY = 'mtd_coupon_v1'
export const savedCoupon = {
  get() { try { return localStorage.getItem(COUPON_KEY) || '' } catch { return '' } },
  set(code) { try { code ? localStorage.setItem(COUPON_KEY, code) : localStorage.removeItem(COUPON_KEY) } catch { /* sin almacenamiento */ } },
}

export async function getQuote({ deliveryMethod = 'local', comuna = 'Rancagua', couponCode = savedCoupon.get() } = {}) {
  const res = await fetch('/api/cart/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: cart.items(), couponCode, deliveryMethod, comuna }),
  })
  if (!res.ok) throw new Error('No pudimos calcular tu carrito')
  return res.json()
}
