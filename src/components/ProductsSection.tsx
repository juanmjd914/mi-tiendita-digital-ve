import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import ProductCard from './ProductCard'

const WC = 'https://mitienditadigitalve.com/wp-content/uploads'

const PRODUCTS = [
  {
    id: 1,
    name: 'Gabinete Gamer Cougar MX410-T',
    price: 52500,
    originalPrice: 85000,
    category: 'Gabinetes Gamer',
    badge: 'OFERTA',
    img: `${WC}/2021/12/Gabinete-MX410T-6.webp`,
    rating: 5,
    description: 'Factor de forma: Midi-Tower · Cristal Templado · Tarjetas madre: ATX, Micro ATX, Mini-ITX · 2x USB 2.0 · Ventilador trasero 120 mm.',
  },
  {
    id: 2,
    name: 'Joystick Bluetooth 3.0 para Celular Ultra',
    price: 19990,
    originalPrice: undefined,
    category: 'Accesorios',
    badge: 'HOT',
    img: `${WC}/2026/04/Joystick-Bluetooth-para-Celular-Ultra1.webp`,
    rating: 5,
    description: 'Control inalámbrico Bluetooth 3.0 compatible con Android e iOS. Joysticks analógicos, gatillos L2/R2 y batería recargable.',
  },
  {
    id: 3,
    name: 'Powerbank Carga Inalámbrica Philco',
    price: 15200,
    originalPrice: undefined,
    category: 'Accesorios',
    badge: 'NUEVO',
    img: `${WC}/2026/04/Powerbank-Philco-Carga-inalambrica-tipo-c1.webp`,
    rating: 4,
    description: 'Powerbank 10.000 mAh con carga Qi inalámbrica. Salida USB-A + USB-C, carga rápida 18W.',
  },
  {
    id: 4,
    name: 'Soporte de Escritorio para Micrófono Philco',
    price: 7990,
    originalPrice: undefined,
    category: 'Accesorios',
    badge: 'NUEVO',
    img: `${WC}/2026/04/soporte-para-microfono-philco.webp`,
    rating: 4,
    description: 'Soporte articulado de 360° con base estable. Compatible con todos los micrófonos de podcast y streaming.',
  },
]

export default function ProductsSection() {
  return (
    <section id="tienda" className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="text-brand-cyan text-xs font-semibold tracking-[0.3em] uppercase block mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Recién Llegados
          </span>
          <h2 className="text-white font-bold text-3xl sm:text-5xl leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Nuevos <span className="gradient-text">Productos</span>
          </h2>
          <p className="text-white/40 mt-3 text-sm max-w-lg mx-auto">
            Los mejores equipos tech y gamer disponibles para ti en Rancagua
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {PRODUCTS.map((p, i) => (
            <ProductCard key={p.id} product={p} delay={i * 0.1} />
          ))}
        </div>

        {/* Ver más */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-10"
        >
          <Link to="/tienda">
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 25px rgba(129,215,66,0.3)' }}
              whileTap={{ scale: 0.96 }}
              className="px-8 py-3 border border-brand-violet/40 text-brand-violet hover:bg-brand-violet hover:text-white font-semibold text-sm rounded-full transition-all"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Ver todos los productos
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
