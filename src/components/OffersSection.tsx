import { motion } from 'motion/react'
import { Zap, ArrowRight } from 'lucide-react'
import ProductCard from './ProductCard'

const SB = 'https://hhhijebsmajvphazvxlm.supabase.co/storage/v1/object/public/MI%20TIENDITA%20DIGITAL%20VE'

const OFFERS = [
  {
    id: 10,
    name: 'Gabinete Gamer Cougar MX410-T',
    price: 52500,
    originalPrice: 85000,
    category: 'Gabinetes Gamer',
    badge: 'OFERTA',
    img: `${SB}/Gabinete-MX410T-6.webp`,
    rating: 5,
    description: 'Factor de forma: Midi-Tower · Cristal Templado · Tarjetas madre: ATX, Micro ATX, Mini-ITX · 2x USB 2.0.',
  },
  {
    id: 11,
    name: 'Kit Gamer Monster 4 en 1',
    price: 20000,
    originalPrice: 40990,
    category: 'Computacion',
    badge: 'OFERTA',
    img: `${SB}/KIT%20MONSTER%20CREW%20INSERTION%20B.webp`,
    rating: 5,
    description: 'Combo gaming completo: Teclado + Mouse + Audífonos + Mousepad. Todo lo que necesitas para jugar.',
  },
  {
    id: 12,
    name: 'Teclado Gaming Backlight Ultra',
    price: 9800,
    originalPrice: undefined,
    category: 'Computacion',
    badge: 'HOT',
    img: `${SB}/Teclado%20Gaming%20Backlight%20Ultra.webp`,
    rating: 4,
    description: 'Interface USB 1.1/2.0 · 104 teclas con luz · Teclas multimedia · Medidas: 485x185x25 mm.',
  },
]

export default function OffersSection() {
  return (
    <section className="py-20 px-4 relative overflow-hidden">
      {/* Fondo con partículas */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/20 via-brand-violet/5 to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-violet/40 to-transparent" />

      {/* Puntos de luz */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-brand-violet/30"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `pulse ${2 + Math.random() * 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 2}s`,
          }}
        />
      ))}

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-flex items-center gap-2 glass-violet px-5 py-2 rounded-full mb-6 border border-brand-violet/30"
          >
            <Zap size={16} className="text-brand-yellow" />
            <span className="text-brand-yellow font-black text-sm tracking-widest uppercase" style={{ fontFamily: 'Space Grotesk' }}>
              TIEMPO LIMITADO
            </span>
          </motion.div>

          <h2 className="text-white font-black text-4xl sm:text-6xl leading-none mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.03em' }}>
            ⚡ ¡Hasta <span className="text-brand-yellow">50%</span> de Descuento!
          </h2>
          <p className="text-white/40 text-sm">
            Stock limitado · Oportunidades únicas · Por tiempo limitado
          </p>
        </motion.div>

        {/* Productos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-10">
          {OFFERS.map((p, i) => (
            <ProductCard key={p.id} product={p} delay={i * 0.12} />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(124,58,237,0.5)' }}
            whileTap={{ scale: 0.96 }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-brand-violet to-brand-cyan text-white font-bold text-sm rounded-full"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Ver todas las ofertas <ArrowRight size={16} />
          </motion.button>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-cyan/30 to-transparent" />
    </section>
  )
}
