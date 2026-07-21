import { useState, useEffect } from 'react'
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
  const [activeIdx, setActiveIdx] = useState(0)

  // Reinicia la imagen activa cada vez que se abre un producto distinto
  useEffect(() => {
    setActiveIdx(0)
  }, [product?.id])

  if (!product) return null

  // Capturamos en const para que TypeScript estreche el tipo en closures
  const p = product

  const discount = p.original_price
    ? Math.round((1 - p.price / p.original_price) * 100)
    : null

  const badgeStyle = p.badge ? (BADGE_COLORS[p.badge] ?? { bg: '#ffffff15', text: '#ffffff80' }) : null

  const FALLBACK_IMG = 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=700&q=80'

  // Imagen principal + galería, sin duplicados
  const images = [p.img_url, ...(p.gallery ?? [])].filter(
    (url, i, arr): url is string => !!url && arr.indexOf(url) === i
  )
  const imgSrc = images[activeIdx] || images[0] || FALLBACK_IMG

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
              {/* Cerrar — z-30 y tamaño de toque cómodo para que quede SIEMPRE sobre la imagen flotante en móvil */}
              <button
                onClick={onClose}
                aria-label="Cerrar"
                className="absolute top-3 right-3 z-30 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white/80 hover:text-white transition-all"
                style={{ zIndex: 30, backdropFilter: 'blur(6px)' }}
              >
                <X size={20} />
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2">
                {/* Imagen */}
                <div className="relative flex items-center justify-center overflow-hidden" style={{ minHeight: images.length > 1 ? '350px' : '300px', background: 'radial-gradient(circle at 50% 40%, #14142a, #080810 75%)' }}>
                  {/* Halo suave detrás del producto */}
                  <div className="absolute w-40 h-40 rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.25), transparent 70%)', filter: 'blur(20px)' }} />
                  {/* Sombra que "respira" bajo el producto */}
                  <motion.div
                    className="absolute rounded-[50%] pointer-events-none"
                    style={{ bottom: images.length > 1 ? '68px' : '34px', width: '55%', height: '18px', background: 'rgba(0,0,0,0.45)', filter: 'blur(10px)' }}
                    animate={{ scaleX: [1, 0.82, 1], opacity: [0.45, 0.28, 0.45] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  {/* Producto flotante */}
                  <motion.img
                    key={imgSrc}
                    src={imgSrc}
                    alt={p.name}
                    className="relative z-10 object-contain p-6"
                    style={{ maxHeight: images.length > 1 ? '260px' : '300px', width: '100%', filter: 'drop-shadow(0 14px 22px rgba(0,0,0,0.45))' }}
                    initial={{ opacity: 0.4 }}
                    animate={{ opacity: 1, y: [0, -14, 0] }}
                    transition={{
                      opacity: { duration: 0.25, ease: 'easeOut' },
                      y:       { duration: 4, repeat: Infinity, ease: 'easeInOut' },
                    }}
                    onError={(e) => {
                      const t = e.currentTarget
                      t.src = FALLBACK_IMG
                    }}
                  />

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

                  {/* Miniaturas de la galería — solo si hay más de una imagen */}
                  {images.length > 1 && (
                    <div className="absolute bottom-3 left-0 right-0 z-20 flex items-center justify-center gap-2 px-4">
                      {images.map((url, i) => (
                        <button
                          key={url + i}
                          type="button"
                          onClick={() => setActiveIdx(i)}
                          aria-label={`Ver imagen ${i + 1}`}
                          className="rounded-lg overflow-hidden flex-shrink-0 transition-all"
                          style={{
                            width: 40,
                            height: 40,
                            border: i === activeIdx ? '2px solid #7c3aed' : '2px solid rgba(255,255,255,0.15)',
                            opacity: i === activeIdx ? 1 : 0.6,
                            background: '#0f0f1a',
                          }}
                        >
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => { e.currentTarget.style.visibility = 'hidden' }}
                          />
                        </button>
                      ))}
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

                    {/* Marca */}
                    {p.brand && (
                      <p className="text-white/40 text-xs mb-2" style={{ fontFamily: 'Inter' }}>
                        Marca: <span className="text-white/70 font-semibold">{p.brand}</span>
                      </p>
                    )}

                    {/* Descripción — respeta los saltos de línea guardados (ej. viñetas "·") */}
                    {p.description && (
                      <p className="text-white/55 text-sm leading-relaxed" style={{ fontFamily: 'Inter', whiteSpace: 'pre-line' }}>
                        {p.description}
                      </p>
                    )}

                    {/* Especificaciones técnicas */}
                    {p.specs && p.specs.length > 0 && (
                      <div className="mt-4 border-t border-white/5 pt-4">
                        <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2" style={{ fontFamily: 'Space Grotesk' }}>
                          Especificaciones
                        </p>
                        <div className="space-y-1.5">
                          {p.specs.map((s, i) => (
                            <div key={i} className="flex items-start justify-between gap-3 text-xs">
                              <span className="text-white/40" style={{ fontFamily: 'Inter' }}>{s.label}</span>
                              <span className="text-white/75 text-right font-medium" style={{ fontFamily: 'Inter' }}>{s.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Garantías */}
                  <div className="space-y-2 border-t border-white/5 pt-4">
                    <div className="flex items-center gap-2 text-white/40 text-xs">
                      <Shield size={13} className="text-brand-violet flex-shrink-0" />
                      {p.warranty ? `Garantía: ${p.warranty}` : 'Garantía de funcionamiento incluida'}
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
