import { motion, AnimatePresence } from 'motion/react'
import { X, Star, ShoppingCart, Zap, Package, Shield, ChevronRight } from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import type { Product } from '../lib/supabase'

interface Props {
  product: Product | null
  onClose: () => void
}

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  OFERTA: { bg: '#81d74220', text: '#81d742' },
  NUEVO:  { bg: '#06b6d420', text: '#06b6d4' },
  HOT:    { bg: '#f27d2620', text: '#f27d26' },
}

export default function ProductModal({ product, onClose }: Props) {
  const { addItem, openCart } = useCartStore()

  if (!product) return null

  // Capturamos en const para que TypeScript estreche el tipo en closures
  const p = product

  const discount = p.original_price
    ? Math.round((1 - p.price / p.original_price) * 100)
    : null

  const badgeStyle = p.badge ? (BADGE_COLORS[p.badge] ?? { bg: '#ffffff15', text: '#ffffff80' }) : null

  const imgSrc = p.img_url ||
    'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=700&q=80'

  function handleAddToCart() {
    addItem({
      id:       p.id,
      name:     p.name,
      price:    p.price,
      category: p.category,
      img:      imgSrc,
    })
    onClose()
    openCart()
  }

  function handleBuyNow() {
    addItem({
      id:       p.id,
      name:     p.name,
      price:    p.price,
      category: p.category,
      img:      imgSrc,
    })
    onClose()
    openCart()
  }

  return (
    <AnimatePresence>
      {product && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="relative w-full max-w-2xl bg-[#0f0f1a] border border-white/10 rounded-3xl overflow-hidden pointer-events-auto shadow-2xl"
              style={{ maxHeight: '90vh', overflowY: 'auto' }}
            >
              {/* Cerrar */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-all"
              >
                <X size={18} />
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2">
                {/* Imagen */}
                <div className="relative bg-[#080810] flex items-center justify-center" style={{ minHeight: '280px' }}>
                  <img
                    src={imgSrc}
                    alt={p.name}
                    className="w-full h-full object-cover"
                    style={{ maxHeight: '320px' }}
                    onError={(e) => {
                      const t = e.currentTarget
                      t.src = 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&q=80'
                    }}
                  />
                  {/* Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f1a]/40 to-transparent" />

                  {discount && (
                    <div className="absolute top-4 left-4 bg-[#81d742] text-white text-xs font-black px-2.5 py-1 rounded-full">
                      -{discount}%
                    </div>
                  )}
                  {p.badge && badgeStyle && (
                    <div
                      className="absolute top-4 left-4 text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{
                        background: badgeStyle.bg,
                        color: badgeStyle.text,
                        border: `1px solid ${badgeStyle.text}40`,
                        marginLeft: discount ? '52px' : 0,
                      }}
                    >
                      {p.badge}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-6 flex flex-col justify-between gap-4">
                  <div>
                    {/* Categoría */}
                    <p className="text-brand-cyan text-xs font-semibold tracking-widest uppercase mb-2" style={{ fontFamily: 'Space Grotesk' }}>
                      {p.category}
                    </p>

                    {/* Nombre */}
                    <h2 className="text-white font-bold text-xl leading-snug mb-3" style={{ fontFamily: 'Space Grotesk' }}>
                      {p.name}
                    </h2>

                    {/* Rating */}
                    <div className="flex items-center gap-1.5 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          className={i < Math.round(p.rating) ? 'text-brand-yellow fill-brand-yellow' : 'text-white/20'}
                        />
                      ))}
                      <span className="text-white/40 text-xs ml-1">{p.rating.toFixed(1)}</span>
                    </div>

                    {/* Precios */}
                    <div className="flex items-baseline gap-3 mb-4">
                      <span className="text-white font-black text-3xl" style={{ fontFamily: 'Space Grotesk' }}>
                        ${p.price.toLocaleString('es-CL')}
                      </span>
                      {p.original_price && (
                        <span className="text-white/30 text-base line-through">
                          ${p.original_price.toLocaleString('es-CL')}
                        </span>
                      )}
                    </div>

                    {/* Descripción */}
                    {p.description && (
                      <p className="text-white/55 text-sm leading-relaxed" style={{ fontFamily: 'Inter' }}>
                        {p.description}
                      </p>
                    )}
                  </div>

                  {/* Garantías */}
                  <div className="space-y-2 border-t border-white/5 pt-4">
                    <div className="flex items-center gap-2 text-white/40 text-xs">
                      <Shield size={13} className="text-brand-violet flex-shrink-0" />
                      Garantía de funcionamiento incluida
                    </div>
                    <div className="flex items-center gap-2 text-white/40 text-xs">
                      <Package size={13} className="text-brand-cyan flex-shrink-0" />
                      Envíos a todo Chile · Retiro en Rancagua
                    </div>
                    <div className="flex items-center gap-2 text-white/40 text-xs">
                      <Zap size={13} className="text-brand-yellow flex-shrink-0" />
                      Soporte posventa por WhatsApp
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex flex-col gap-2 pt-1">
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(129,215,66,0.3)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleBuyNow}
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-brand-violet to-brand-cyan text-white font-bold text-sm rounded-xl"
                      style={{ fontFamily: 'Space Grotesk' }}
                    >
                      Comprar ahora <ChevronRight size={16} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleAddToCart}
                      className="w-full flex items-center justify-center gap-2 py-3 border border-brand-violet/40 text-brand-violet hover:bg-brand-violet/10 font-semibold text-sm rounded-xl transition-colors"
                      style={{ fontFamily: 'Space Grotesk' }}
                    >
                      <ShoppingCart size={15} /> Añadir al carrito
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
