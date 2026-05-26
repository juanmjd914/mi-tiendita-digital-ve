import { useState } from 'react'
import { motion } from 'motion/react'
import { ShoppingCart, Star } from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import type { CartProduct } from '../store/cartStore'
import ProductModal from './ProductModal'
import type { Product } from '../lib/supabase'

interface LegacyProduct {
  id: number
  name: string
  price: number
  originalPrice?: number
  category: string
  badge?: string
  img?: string
  rating?: number
  description?: string
  stock?: number
}

interface Props {
  product: LegacyProduct
  delay?: number
}

const BADGE_COLORS: Record<string, { bg: string; text: string }> = {
  OFERTA:   { bg: '#81d74215', text: '#81d742' },
  NUEVO:    { bg: '#06b6d415', text: '#06b6d4' },
  HOT:      { bg: '#f27d2615', text: '#f27d26' },
  '🏆 #1':  { bg: '#ffc22215', text: '#ffc222' },
  '🏆 #2':  { bg: '#ffc22215', text: '#ffc222' },
  '🏆 #3':  { bg: '#ffc22215', text: '#ffc222' },
  '🏆 #4':  { bg: '#ffc22215', text: '#ffc222' },
  '🏆 #5':  { bg: '#ffc22215', text: '#ffc222' },
}

export default function ProductCard({ product, delay = 0 }: Props) {
  const { addItem } = useCartStore()
  const [modalOpen, setModalOpen] = useState(false)

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null

  const badgeStyle = product.badge
    ? (BADGE_COLORS[product.badge] ?? { bg: '#ffffff10', text: '#ffffff60' })
    : null

  const imgSrc = product.img ||
    'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&q=80'

  const isOutOfStock = product.stock !== undefined && product.stock === 0

  function handleAddToCart(e: React.MouseEvent) {
    e.stopPropagation()
    if (isOutOfStock) return
    const cartProduct: CartProduct = {
      id:       product.id,
      name:     product.name,
      price:    product.price,
      category: product.category,
      img:      imgSrc,
    }
    addItem(cartProduct)
  }

  // Objeto compatible con ProductModal
  const modalProduct: Product = {
    id:             product.id,
    name:           product.name,
    price:          product.price,
    original_price: product.originalPrice ?? null,
    category:       product.category,
    description:    product.description ?? null,
    badge:          product.badge ?? null,
    img_url:        imgSrc,
    rating:         product.rating ?? 5,
    stock:          product.stock ?? 99,
    active:         true,
    created_at:     '',
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay }}
        whileHover={{ y: -4, boxShadow: '0 0 25px rgba(129,215,66,0.12)' }}
        onClick={() => setModalOpen(true)}
        className="group relative bg-[#0f0f1a] border border-white/5 hover:border-brand-violet/30 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col"
      >
        {/* Imagen */}
        <div className="relative aspect-square overflow-hidden bg-[#080810]">
          <img
            src={imgSrc}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=400&q=80'
            }}
          />

          {/* Badge */}
          {product.badge && badgeStyle && (
            <div
              className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: badgeStyle.bg,
                color: badgeStyle.text,
                border: `1px solid ${badgeStyle.text}40`,
                fontFamily: 'Space Grotesk',
              }}
            >
              {product.badge}
            </div>
          )}

          {/* Descuento */}
          {discount && (
            <div className="absolute top-2 right-2 bg-brand-violet text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
              -{discount}%
            </div>
          )}

          {/* Overlay agotado */}
          {isOutOfStock && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="bg-black/70 text-white/80 text-xs font-black px-3 py-1.5 rounded-full border border-white/20 tracking-widest uppercase" style={{ fontFamily: 'Space Grotesk' }}>
                Agotado
              </span>
            </div>
          )}

          {/* Overlay carrito */}
          {!isOutOfStock && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddToCart}
                className="w-10 h-10 rounded-full bg-brand-violet text-white flex items-center justify-center shadow-lg"
                title="Añadir al carrito"
              >
                <ShoppingCart size={17} />
              </motion.button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 sm:p-4 flex flex-col flex-1">
          <p className="text-brand-cyan text-[10px] font-semibold tracking-wider uppercase mb-1" style={{ fontFamily: 'Space Grotesk' }}>
            {product.category}
          </p>
          <h3 className="text-white font-semibold text-xs sm:text-sm leading-snug line-clamp-2 mb-2 flex-1" style={{ fontFamily: 'Space Grotesk' }}>
            {product.name}
          </h3>

          {product.rating && (
            <div className="flex items-center gap-0.5 mb-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={10}
                  className={i < Math.round(product.rating!) ? 'text-brand-yellow fill-brand-yellow' : 'text-white/20'}
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap mt-auto">
            <span className="text-white font-black text-base sm:text-lg" style={{ fontFamily: 'Space Grotesk' }}>
              ${product.price.toLocaleString('es-CL')}
            </span>
            {product.originalPrice && (
              <span className="text-white/30 text-xs line-through">
                ${product.originalPrice.toLocaleString('es-CL')}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      <ProductModal
        product={modalOpen ? modalProduct : null}
        onClose={() => setModalOpen(false)}
      />
    </>
  )
}
