import { useState } from 'react'
import { motion } from 'motion/react'
import { ShoppingCart, Star } from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import type { CartProduct } from '../store/cartStore'
import ProductModal from './ProductModal'
import type { Product, ProductSpec } from '../lib/supabase'

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
  // Campos ricos (opcionales — no todas las secciones los cargan)
  brand?:    string
  sku?:      string
  warranty?: string
  specs?:    ProductSpec[]
  gallery?:  string[]
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
    'https://hhhijebsmajvphazvxlm.supabase.co/storage/v1/object/public/MI%20TIENDITA%20DIGITAL%20VE/logotipo_mi_tiendita_digital_ve-.png'

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
    brand:          product.brand    ?? null,
    sku:            product.sku      ?? null,
    warranty:       product.warranty ?? null,
    specs:          product.specs    ?? null,
    gallery:        product.gallery  ?? null,
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay }}
        whileHover={{ y: -6 }}
        onClick={() => setModalOpen(true)}
        className="group relative rounded-3xl overflow-hidden cursor-pointer transition-colors duration-300 flex flex-col"
        style={{
          background: 'linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015))',
          backdropFilter: 'blur(20px) saturate(160%)',
          WebkitBackdropFilter: 'blur(20px) saturate(160%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10), 0 8px 30px rgba(0,0,0,0.35)',
        }}
      >
        {/* Borde con glow al hover */}
        <div
          className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20"
          style={{ boxShadow: '0 0 0 1px rgba(129,215,66,0.35), 0 0 28px rgba(129,215,66,0.18)' }}
        />

        {/* Zona de imagen — producto flotando sobre halo de luz */}
        <div className="relative aspect-square overflow-hidden flex items-center justify-center" style={{ background: 'radial-gradient(circle at 50% 30%, #14142a, #080810 78%)' }}>
          {/* Halo de color detrás del producto (verde→cian, marca de la tienda) */}
          <div
            className="absolute left-1/2 bottom-[14%] -translate-x-1/2 rounded-full pointer-events-none transition-opacity duration-300 opacity-70 group-hover:opacity-100"
            style={{
              width: '78%', height: '55%',
              background: 'radial-gradient(ellipse at center, rgba(129,215,66,0.35) 0%, rgba(6,182,212,0.22) 45%, transparent 72%)',
              filter: 'blur(18px)',
            }}
          />
          {/* Plataforma / sombra elíptica al pie */}
          <div
            className="absolute left-1/2 bottom-[10%] -translate-x-1/2 rounded-[50%] pointer-events-none"
            style={{ width: '50%', height: '10px', background: 'rgba(129,215,66,0.45)', filter: 'blur(6px)' }}
          />

          {/* Tamaño en % (no padding fijo) para que se vea igual de grande en cualquier ancho de pantalla */}
          <motion.img
            src={imgSrc}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="relative z-10 object-contain transition-transform duration-500 group-hover:scale-[1.06]"
            style={{ maxWidth: '66%', maxHeight: '66%', width: 'auto', height: 'auto', filter: 'drop-shadow(0 16px 20px rgba(0,0,0,0.5))' }}
            whileHover={{ y: -6 }}
            onError={(e) => {
              e.currentTarget.src = 'https://hhhijebsmajvphazvxlm.supabase.co/storage/v1/object/public/MI%20TIENDITA%20DIGITAL%20VE/logotipo_mi_tiendita_digital_ve-.png'
            }}
          />

          {/* Badge */}
          {product.badge && badgeStyle && (
            <div
              className="absolute top-3 left-3 z-20 text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(255,255,255,0.10)',
                backdropFilter: 'blur(6px)',
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
            <div className="absolute top-3 right-3 z-20 bg-brand-violet text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg">
              -{discount}%
            </div>
          )}

          {/* Overlay agotado */}
          {isOutOfStock && (
            <div className="absolute inset-0 z-20 bg-black/50 flex items-center justify-center">
              <span className="bg-black/70 text-white/80 text-xs font-black px-3 py-1.5 rounded-full border border-white/20 tracking-widest uppercase" style={{ fontFamily: 'Space Grotesk' }}>
                Agotado
              </span>
            </div>
          )}

          {/* Botón añadir al carrito — vidrio con glow, aparece al hover */}
          {!isOutOfStock && (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleAddToCart}
              title="Añadir al carrito"
              className="absolute bottom-3 right-3 z-20 w-9 h-9 rounded-full flex items-center justify-center opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
              style={{
                background: 'linear-gradient(135deg, rgba(129,215,66,0.9), rgba(6,182,212,0.9))',
                boxShadow: '0 0 16px rgba(129,215,66,0.5)',
              }}
            >
              <ShoppingCart size={15} className="text-white" />
            </motion.button>
          )}
        </div>

        {/* Info */}
        <div className="relative p-3 sm:p-4 flex flex-col flex-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
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
