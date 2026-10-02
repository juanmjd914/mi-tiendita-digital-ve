// RUT chileno: limpia, valida dígito verificador (módulo 11) y formatea 12.345.678-5.
export function cleanRut(v) { return String(v || '').replace(/[^0-9kK]/g, '').toUpperCase() }

export function validRut(v) {
  const s = cleanRut(v)
  if (s.length < 2) return false
  const body = s.slice(0, -1)
  const dv = s.slice(-1)
  let sum = 0
  let mul = 2
  for (let i = body.length - 1; i >= 0; i--) { sum += Number(body[i]) * mul; mul = mul === 7 ? 2 : mul + 1 }
  const r = 11 - (sum % 11)
  return dv === (r === 11 ? '0' : r === 10 ? 'K' : String(r))
}

export function formatRut(v) {
  const s = cleanRut(v)
  if (s.length < 2) return s
  return `${s.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${s.slice(-1)}`
}
