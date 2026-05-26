import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Trophy, ChevronRight } from 'lucide-react'
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

export default function BestSellers() {
  const [products, setProducts] = useState<ReturnType<typeof toLegacy>[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    // Primero intenta traer los productos con badge 🏆
    supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .like('badge', '🏆%')
      .order('badge', { ascending: true })
      .limit(5)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setProducts(data.map(toLegacy))
        } else {
          // Fallback: top 5 por rating si no hay badges 🏆
          supabase
            .from('products')
            .select('*')
            .eq('active', true)
            .order('rating', { ascending: false })
            .limit(5)
            .then(({ data: d2 }) => {
              if (d2) setProducts(d2.map((p, i) => ({ ...toLegacy(p), badge: `🏆 #${i + 1}` })))
            })
        }
        setLoading(false)
      })
  }, [])

  // Si no hay productos ni carga, no renderizamos
  if (!loading && products.length === 0) return null

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
          <Link to="/tienda" className="hidden sm:flex items-center gap-1 text-brand-cyan text-sm font-semibold hover:text-white transition-colors" style={{ fontFamily: 'Space Grotesk' }}>
            Ver ranking <ChevronRight size={16} />
          </Link>
        </motion.div>

        {/* Skeleton */}
        {loading ? (
          <div className="flex gap-4 overflow-x-auto no-scrollbar sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:overflow-visible pb-4 sm:pb-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-52 sm:w-auto bg-white/3 rounded-2xl aspect-square animate-pulse" />
            ))}
          </div>
        ) : (
          /* Carrusel horizontal en mobile, grid en desktop */
          <div className="flex gap-4 overflow-x-auto no-scrollbar sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:overflow-visible pb-4 sm:pb-0">
            {products.map((p, i) => (
              <div key={p.id} className="flex-shrink-0 w-52 sm:w-auto">
                <ProductCard product={p} delay={i * 0.08} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
