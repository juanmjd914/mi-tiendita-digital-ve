import { motion } from 'motion/react'
import { Trophy, ChevronRight } from 'lucide-react'
import ProductCard from './ProductCard'

const SB = 'https://hhhijebsmajvphazvxlm.supabase.co/storage/v1/object/public/MI%20TIENDITA%20DIGITAL%20VE'

const BESTSELLERS = [
  {
    id: 20,
    name: 'Gabinete Gamer Cougar MX410-T',
    price: 52500,
    originalPrice: 85000,
    category: 'Gabinetes Gamer',
    badge: '🏆 #1',
    img: `${SB}/Gabinete-MX410T-6.webp`,
    rating: 5,
    description: 'Midi-Tower con cristal templado, soporte ATX/mATX/Mini-ITX y ventilador 120 mm trasero.',
  },
  {
    id: 21,
    name: 'Joystick Bluetooth 3.0 para Celular Ultra',
    price: 19990,
    originalPrice: undefined,
    category: 'Accesorios',
    badge: '🏆 #2',
    img: `${SB}/Joystick%20Bluetooth%20para%20Celular%20Ultra1.webp`,
    rating: 5,
    description: 'Control inalámbrico Bluetooth 3.0 compatible con Android e iOS. Gatillos analógicos L2/R2.',
  },
  {
    id: 22,
    name: 'Powerbank Carga Inalámbrica Philco',
    price: 15200,
    originalPrice: undefined,
    category: 'Accesorios',
    badge: '🏆 #3',
    img: `${SB}/Powerbank%20Philco%20Carga%20inalambrica%20tipo%20c1.webp`,
    rating: 4,
    description: '10.000 mAh con carga Qi inalámbrica + USB-A + USB-C, carga rápida 18W.',
  },
  {
    id: 23,
    name: 'Mouse HP Gamer RGB M160',
    price: 4900,
    originalPrice: 6590,
    category: 'Computacion',
    badge: '🏆 #4',
    img: `${SB}/MOUSE%20HP%20GAMER%20RGB%20M160.webp`,
    rating: 4,
    description: 'Mouse gamer USB con iluminación RGB, 6 botones y resolución hasta 1600 DPI.',
  },
  {
    id: 24,
    name: 'Soporte de Escritorio para Micrófono Philco',
    price: 7990,
    originalPrice: undefined,
    category: 'Accesorios',
    badge: '🏆 #5',
    img: `${SB}/soporte%20para%20microfono%20philco.webp`,
    rating: 4,
    description: 'Soporte articulado de 360° con base estable para micrófonos de podcast y streaming.',
  },
]

export default function BestSellers() {
  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy size={18} className="text-brand-yellow" />
              <span className="text-brand-yellow text-xs font-semibold tracking-[0.3em] uppercase" style={{ fontFamily: 'Space Grotesk' }}>
                Ranking Digital
              </span>
            </div>
            <h2 className="text-white font-bold text-3xl sm:text-4xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Más <span className="gradient-text">Vendidos</span>
            </h2>
          </div>
          <button className="hidden sm:flex items-center gap-1 text-brand-cyan text-sm font-semibold hover:text-white transition-colors" style={{ fontFamily: 'Space Grotesk' }}>
            Ver ranking <ChevronRight size={16} />
          </button>
        </motion.div>

        {/* Carrusel horizontal en mobile, grid en desktop */}
        <div className="flex gap-4 overflow-x-auto no-scrollbar sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:overflow-visible pb-4 sm:pb-0">
          {BESTSELLERS.map((p, i) => (
            <div key={p.id} className="flex-shrink-0 w-52 sm:w-auto">
              <ProductCard product={p} delay={i * 0.08} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
