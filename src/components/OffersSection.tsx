import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Zap, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Product } from '../lib/supabase'
import ProductCard from './ProductCard'

function toLegacy(p: Product) {
  return {
    id:            p.id,
    name:          p.name,
    price:         p.price,
    originalPrice: p.original_price ?? undefined,
    category:      p.category,
    badge:         p.badge         ?? undefined,
    img:           p.img_url       ?? undefined,
    rating:        p.rating,
    description:   p.description   ?? undefined,
    stock:         p.stock,
  }
}

export default function OffersSection() {
  const [offers,  setOffers]  = useState<ReturnType<typeof toLegacy>[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .in('badge', ['OFERTA', 'HOT'])
      .limit(3)
      .then(({ data }) => {
        if (data) setOffers(data.map(toLegacy))
        setLoading(false)
      })
  }, [])

  // Si no hay ofertas ni carga, no renderizamos la sección
  if (!loading && offers.length === 0) return null

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
            left: `${(i * 8.3) % 100}%`,
            top:  `${(i * 13.7) % 100}%`,
            animation: `pulse ${2 + (i % 3)}s ease-in-out infinite`,
            animationDelay: `${(i * 0.3) % 2}s`,
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
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-10">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white/3 rounded-2xl aspect-square animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-10">
            {offers.map((p, i) => (
              <ProductCard key={p.id} product={p} delay={i * 0.12} />
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="text-center">
          <Link to="/tienda?badge=OFERTA,HOT">
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(124,58,237,0.5)' }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-brand-violet to-brand-cyan text-white font-bold text-sm rounded-full"
              style={{ fontFamily: 'Space Grotesk, sans-serif' }}
            >
              Ver todas las ofertas <ArrowRight size={16} />
            </motion.button>
          </Link>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-cyan/30 to-transparent" />
    </section>
  )
}
