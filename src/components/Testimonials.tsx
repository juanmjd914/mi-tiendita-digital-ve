import { motion } from 'motion/react'
import { Star, Quote } from 'lucide-react'

const REVIEWS = [
  {
    name: 'Tomas Pinto Dinamarca',
    avatar: 'T',
    stars: 5,
    text: '¡Muy buena atención! Son muy amables. Todo perfecto 👌',
    color: '#81d742',
  },
  {
    name: 'Dj Pancho Lara',
    avatar: 'D',
    stars: 5,
    text: 'Buena calidad, buena atención, buen precio. 3B para mi tiendita 👍',
    color: '#06b6d4',
  },
  {
    name: 'Bruno Jaramillo',
    avatar: 'B',
    stars: 5,
    text: 'Buena tienda, fui a comprar un soporte y justo lo tenían 👌',
    color: '#ffc222',
  },
  {
    name: 'Diego Espinoza',
    avatar: 'D',
    stars: 5,
    text: 'Buena atención y servicio a puerta, 10/10 👌',
    color: '#f27d26',
  },
]

export default function Testimonials() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-brand-cyan text-xs font-semibold tracking-[0.3em] uppercase block mb-3" style={{ fontFamily: 'Space Grotesk' }}>
            Lo que dicen nuestros clientes
          </span>
          <h2 className="text-white font-bold text-3xl sm:text-5xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Reseñas <span className="gradient-text">Reales</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {REVIEWS.map((r, i) => (
            <motion.div
              key={r.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -6, boxShadow: `0 0 25px ${r.color}20` }}
              className="glass rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all duration-300 flex flex-col"
              style={{ borderTop: `1px solid ${r.color}30` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${r.color}, ${r.color}80)` }}
                >
                  {r.avatar}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm leading-tight" style={{ fontFamily: 'Space Grotesk' }}>
                    {r.name}
                  </p>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {Array.from({ length: r.stars }).map((_, j) => (
                      <Star key={j} size={10} className="text-brand-yellow fill-brand-yellow" />
                    ))}
                  </div>
                </div>
                <Quote size={16} className="ml-auto text-white/10 flex-shrink-0" />
              </div>
              <p className="text-white/60 text-sm leading-relaxed flex-1" style={{ fontFamily: 'Inter' }}>
                "{r.text}"
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
