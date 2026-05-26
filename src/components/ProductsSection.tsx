import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Product } from '../lib/supabase'
import ProductCard from './ProductCard'

// Mapea Product de Supabase al formato LegacyProduct que usa ProductCard
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

export default function ProductsSection() {
  const [products, setProducts] = useState<ReturnType<typeof toLegacy>[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
      .limit(4)
      .then(({ data }) => {
        if (data) setProducts(data.map(toLegacy))
        setLoading(false)
      })
  }, [])

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
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white/3 rounded-2xl aspect-square animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? null : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} delay={i * 0.1} />
            ))}
          </div>
        )}

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
