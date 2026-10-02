import { getSettings } from './settings.js'

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase()

/**
 * Costo de envío.
 *  - pickup:  retiro en local, $0.
 *  - local:   delivery en la ciudad local (Rancagua). Gratis si el subtotal (tras cupón)
 *             alcanza free_shipping_min_rancagua; si no, delivery_cost_rancagua.
 *  - regions: tarifa plana shipping_flat_regions.
 * Compatibilidad: 'delivery' + comuna/ciudad se resuelve a local o regions.
 */
export async function computeShipping(method, comuna, subtotalAfterCoupon = 0) {
  const s = await getSettings()
  const localCity = norm(s.local_city || 'Rancagua')
  const isLocal = norm(comuna).includes(localCity)
  let kind = method
  if (kind === 'delivery' || !['pickup', 'local', 'regions'].includes(kind)) kind = isLocal ? 'local' : 'regions'
  if (kind === 'local' && !isLocal && comuna) kind = 'regions'

  const freeMin = Math.max(0, Number(s.free_shipping_min_rancagua ?? 80000) || 0)
  let cost = 0
  let free = false
  if (kind === 'local') {
    free = freeMin > 0 && subtotalAfterCoupon >= freeMin
    cost = free ? 0 : Math.max(0, Number(s.delivery_cost_rancagua) || 0)
  } else if (kind === 'regions') {
    cost = Math.max(0, Number(s.shipping_flat_regions) || 0)
  }
  return {
    shippingCost: cost,
    deliveryMethod: kind === 'pickup' ? 'pickup' : 'delivery',
    kind,
    isLocal: kind === 'local',
    freeShipping: free,
    freeShippingMin: freeMin,
    missingForFree: kind === 'regions' ? null : Math.max(0, freeMin - subtotalAfterCoupon),
  }
}
