import { motion } from 'motion/react'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

const CATEGORIES = [
  {
    name:  'Computación',
    sub:   'Laptops · PCs · Periféricos',
    img:   'https://hhhijebsmajvphazvxlm.supabase.co/storage/v1/object/public/MI%20TIENDITA%20DIGITAL%20VE/computacion1.webp',
    color: '#06b6d4',
    span:  '',
    cat:   'COMPUTACION',
  },
  {
    name:  'Accesorios',
    sub:   'Cables · Soportes · Más',
    img:   'https://hhhijebsmajvphazvxlm.supabase.co/storage/v1/object/public/MI%20TIENDITA%20DIGITAL%20VE/tecnologia.webp',
    color: '#ffc222',
    span:  '',
    cat:   'ACCESORIOS',
  },
  {
    name:  'Audio, Video y Hogar',
    sub:   'Headsets · Cámaras · Smart Home',
    img:   'https://hhhijebsmajvphazvxlm.supabase.co/storage/v1/object/public/MI%20TIENDITA%20DIGITAL%20VE/audio%20video%20y%20hogar.webp',
    color: '#f27d26',
    span:  'col-span-2',
    cat:   'AUDIO Y VIDEO',
  },
]

export default function CategoriesGrid() {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-transparent via-[#0d0d1a]/50 to-transparent">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-brand-violet text-xs font-semibold tracking-[0.3em] uppercase block mb-3" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Nuestras Categorías
          </span>
          <h2 className="text-white font-bold text-3xl sm:text-5xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Explora la <span className="gradient-text">Tienda</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[240px]">
          {CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className={`group relative overflow-hidden rounded-2xl cursor-pointer ${cat.span}`}
            >
              <Link
                to={`/tienda?cat=${encodeURIComponent(cat.cat)}`}
                className="absolute inset-0 z-10"
                aria-label={`Ver categoría ${cat.name}`}
              />

              {/* Image */}
              <img
                src={cat.img}
                alt={cat.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />

              {/* Dark base layer */}
              <div className="absolute inset-0 bg-black/50" />

              {/* Color tint overlay */}
              <div
                className="absolute inset-0 opacity-25 group-hover:opacity-50 transition-opacity duration-500"
                style={{ background: `linear-gradient(135deg, ${cat.color}99 0%, transparent 60%)` }}
              />

              {/* Strong bottom gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              {/* Top vignette */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-transparent" style={{ height: '40%' }} />

              {/* Accent border glow on hover */}
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ boxShadow: `inset 0 0 0 1.5px ${cat.color}60` }}
              />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 z-20 pointer-events-none">
                <p className="text-white/50 text-[10px] sm:text-xs tracking-widest uppercase mb-1" style={{ fontFamily: 'Space Grotesk' }}>
                  {cat.sub}
                </p>
                <div className="flex items-end justify-between">
                  <h3
                    className="text-white font-bold leading-tight text-base sm:text-lg"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                  >
                    {cat.name}
                  </h3>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300"
                    style={{ background: cat.color }}
                  >
                    <ArrowRight size={14} className="text-white" />
                  </div>
                </div>

                {/* Color accent bar */}
                <div
                  className="mt-3 h-0.5 w-8 rounded-full group-hover:w-16 transition-all duration-500"
                  style={{ background: cat.color }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Ver todos link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-8"
        >
          <Link
            to="/tienda"
            className="inline-flex items-center gap-2 text-white/40 hover:text-brand-cyan text-sm font-semibold transition-colors"
            style={{ fontFamily: 'Space Grotesk' }}
          >
            Ver todos los productos <ArrowRight size={14} />
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
