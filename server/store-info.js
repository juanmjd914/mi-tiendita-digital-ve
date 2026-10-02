// Datos fijos de la tienda que se muestran en el sitio, los correos y los datos estructurados.
// Las redes salen del sitio anterior (confirmadas por Juan, 2026-10-02); una variable de entorno
// SOCIAL_* las reemplaza si algún día cambian sin tocar el código.

// [icono, nombre visible, URL]
export const SOCIAL = [
  ['instagram', 'Instagram', process.env.SOCIAL_INSTAGRAM || 'https://www.instagram.com/mitienditadigitalve/'],
  ['facebook', 'Facebook', process.env.SOCIAL_FACEBOOK || 'https://www.facebook.com/mitiendita.digitalve'],
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

// Opiniones reales de Google (perfil de empresa de la tienda). Texto tal como lo escribió cada
// cliente. Se excluyen las de familiares y las que no tienen texto (decisión de Juan, 2026-10-02).
// Se muestran con inicial de color, sin fotos de perfil.
// Enlace oficial de Google para pedir reseñas (botón "Consigue más opiniones"), verificado 2026-10-02.
// El QR de /img/qr-resena-google.svg contiene este mismo enlace.
export const GOOGLE_REVIEW_URL = 'https://g.page/r/CdNAFUX9g6fpEAE/review'
export const GOOGLE_RATING = { score: 5.0, count: 9, url: GOOGLE_REVIEW_URL }
export const TESTIMONIALS = [
  { name: 'Tomás Pinto D.', date: '2023-11-10', text: 'Muy buena atención! Son muy amables, tienen buena comunicación y son rápidos. Mi producto llegó a casa el mismo día que lo pedí, en menos de 2 horas. Todo perfecto. 👌' },
  { name: 'Dj pancho Lara', date: '2023-09-19', text: 'Super buena atención me tocó comprar en otras parte el mismo tipo de cable que necesitaba sin respuestas positivas en esta tienda on line no tuve inconvenientes con el cable que compre buena calidad buena atención buen precio 3b para mi tiendita digital aprobado .' },
  { name: 'Diego Espinosa', date: '2023-09-06', text: 'Buena atención y servicio a puerta, 10/10' },
  { name: 'Bruno Jaramillo P.', date: '2022-05-11', text: 'Buena tienda fui a comprar un soporte y justo lo tenían.' },
  { name: 'Fernando Márquez', date: '2023-09-12', text: 'Todo muy bien' },
  { name: 'bastixism', date: '2023-09-03', text: 'Rápido y efectivo' },
]
