// Datos fijos de la tienda que se muestran en el sitio, los correos y los datos estructurados.
// Las redes salen del sitio anterior (confirmadas por Juan, 2026-10-02); una variable de entorno
// SOCIAL_* las reemplaza si algún día cambian sin tocar el código.

// [icono, nombre visible, URL]
export const SOCIAL = [
  ['instagram', 'Instagram', process.env.SOCIAL_INSTAGRAM || 'https://www.instagram.com/mitienditadigitalve/'],
  ['facebook', 'Facebook', process.env.SOCIAL_FACEBOOK || 'https://www.facebook.com/juan.mejias.925059'],
  ['tiktok', 'TikTok', process.env.SOCIAL_TIKTOK || 'https://www.tiktok.com/@mitienditadigitalve'],
  ['xsocial', 'X', process.env.SOCIAL_X || 'https://twitter.com/tiendita_ve'],
].filter(([, , url]) => url)

// Horario de atención (WhatsApp, soporte y retiro en tienda), hora de Chile.
export const HOURS = [
  { days: 'Lunes a viernes', from: '09:00', to: '19:00', dayCodes: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] },
  { days: 'Sábados', from: '10:00', to: '13:00', dayCodes: ['Saturday'] },
]
export const HOURS_CLOSED = 'Domingos y festivos cerrado'

const hh = (t) => `${Number(t.slice(0, 2))}:${t.slice(3)}`
/** "Lunes a viernes de 9:00 a 19:00" */
export const hoursLine = (h) => `${h.days} de ${hh(h.from)} a ${hh(h.to)}`
/** Texto corto en una sola línea, para pies de página y correos. */
export const HOURS_TEXT = `${HOURS.map(hoursLine).join(' · ')}`

/** openingHoursSpecification de schema.org */
export const openingHoursSchema = () => HOURS.map((h) => ({
  '@type': 'OpeningHoursSpecification', dayOfWeek: h.dayCodes, opens: h.from, closes: h.to,
}))
