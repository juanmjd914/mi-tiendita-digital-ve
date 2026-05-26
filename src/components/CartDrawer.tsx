import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, ShoppingCart, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Mail, Loader2, Phone, MapPin } from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function CartDrawer() {
  const { isOpen, closeCart, items, removeItem, updateQuantity, totalPrice, clearCart } = useCartStore()
  const { user } = useAuthStore()

  const [step,    setStep]    = useState<'cart' | 'checkout'>('cart')
  const [email,   setEmail]   = useState('')
  const [name,    setName]    = useState('')
  const [phone,   setPhone]   = useState('')
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  // Pre-llenar datos si el usuario está logueado
  useEffect(() => {
    if (user) {
      const meta = user.user_metadata ?? {}
      if (user.email)       setEmail(user.email)
      if (meta.full_name)   setName(meta.full_name)
      if (meta.phone)       setPhone(meta.phone)
      if (meta.address)     setAddress(meta.address)
    }
  }, [user])

  function handleClose() {
    closeCart()
    setStep('cart')
    setError(null)
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) { setError('Ingresa un email válido'); return }
    if (!phone.trim())        { setError('Ingresa tu número de teléfono o WhatsApp'); return }
    if (!address.trim())      { setError('Ingresa tu dirección de entrega'); return }
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/api/payment/create`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          customerName: name,
          customerPhone:   phone,
          customerAddress: address,
          items: items.map(({ product, quantity }) => ({
            id:       product.id,
            name:     product.name,
            price:    product.price,
            quantity,
          })),
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Error al crear el pago')

      // Redirigir al portal de pago de Flow
      clearCart()
      window.location.href = data.redirectUrl
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar el pago'
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 32 }}
            className="fixed right-0 top-0 h-full w-full sm:w-96 bg-[#0f0f1a] border-l border-brand-violet/20 z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} className="text-brand-violet" />
                <h2 className="text-white font-bold text-base" style={{ fontFamily: 'Space Grotesk' }}>
                  {step === 'cart' ? 'Mi Carrito' : 'Datos de Pago'}
                </h2>
                {step === 'cart' && items.length > 0 && (
                  <span className="bg-brand-violet/20 text-brand-violet text-xs font-bold px-2 py-0.5 rounded-full">
                    {items.length}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {step === 'cart' && items.length > 0 && (
                  <button onClick={clearCart} className="text-white/30 hover:text-red-400 text-xs transition-colors flex items-center gap-1">
                    <Trash2 size={12} /> Vaciar
                  </button>
                )}
                {step === 'checkout' && (
                  <button onClick={() => setStep('cart')} className="text-white/40 hover:text-white text-xs transition-colors">
                    ← Volver
                  </button>
                )}
                <button onClick={handleClose} className="text-white/60 hover:text-white transition-colors p-1">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* ── STEP 1: carrito ── */}
            {step === 'cart' && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <AnimatePresence mode="popLayout">
                    {items.length === 0 ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col items-center justify-center h-full text-center py-16"
                      >
                        <ShoppingBag size={48} className="text-white/10 mb-4" />
                        <p className="text-white/40 font-semibold" style={{ fontFamily: 'Space Grotesk' }}>Tu carrito está vacío</p>
                        <p className="text-white/25 text-sm mt-1">Agrega productos para comenzar</p>
                      </motion.div>
                    ) : (
                      items.map(({ product, quantity }) => (
                        <motion.div
                          key={product.id}
                          layout
                          initial={{ opacity: 0, x: 30 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 30, height: 0 }}
                          transition={{ duration: 0.25 }}
                          className="flex gap-3 glass rounded-xl p-3 border border-white/5"
                        >
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                            {product.img
                              ? <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
                              : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-xs leading-tight line-clamp-2 mb-1" style={{ fontFamily: 'Space Grotesk' }}>
                              {product.name}
                            </p>
                            <p className="text-brand-violet font-bold text-sm">
                              ${(product.price * quantity).toLocaleString('es-CL')}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <button
                                onClick={() => updateQuantity(product.id, quantity - 1)}
                                className="w-6 h-6 rounded-md bg-white/5 hover:bg-brand-violet/20 flex items-center justify-center text-white/60 hover:text-white transition-all"
                              >
                                <Minus size={10} />
                              </button>
                              <span className="text-white text-xs font-bold w-4 text-center">{quantity}</span>
                              <button
                                onClick={() => updateQuantity(product.id, quantity + 1)}
                                className="w-6 h-6 rounded-md bg-white/5 hover:bg-brand-violet/20 flex items-center justify-center text-white/60 hover:text-white transition-all"
                              >
                                <Plus size={10} />
                              </button>
                              <button
                                onClick={() => removeItem(product.id)}
                                className="ml-auto text-white/20 hover:text-red-400 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </AnimatePresence>
                </div>

                {items.length > 0 && (
                  <div className="p-5 border-t border-white/5 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60 text-sm">Total</span>
                      <span className="text-white font-black text-xl" style={{ fontFamily: 'Space Grotesk' }}>
                        ${totalPrice().toLocaleString('es-CL')}
                      </span>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(129,215,66,0.3)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep('checkout')}
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-brand-violet to-brand-cyan text-white font-bold text-sm rounded-xl"
                      style={{ fontFamily: 'Space Grotesk' }}
                    >
                      Proceder al Pago <ArrowRight size={16} />
                    </motion.button>
                    <p className="text-white/25 text-xs text-center">Pago seguro con Flow Chile</p>
                  </div>
                )}
              </>
            )}

            {/* ── STEP 2: datos para pago ── */}
            {step === 'checkout' && (
              <form onSubmit={handleCheckout} className="flex flex-col flex-1">
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {/* Resumen */}
                  <div className="glass rounded-xl p-4 border border-white/5 space-y-2">
                    <p className="text-white/40 text-xs uppercase tracking-widest mb-3" style={{ fontFamily: 'Space Grotesk' }}>Resumen del pedido</p>
                    {items.map(({ product, quantity }) => (
                      <div key={product.id} className="flex justify-between text-xs">
                        <span className="text-white/60 flex-1 line-clamp-1 pr-2">{product.name} ×{quantity}</span>
                        <span className="text-white font-semibold whitespace-nowrap">${(product.price * quantity).toLocaleString('es-CL')}</span>
                      </div>
                    ))}
                    <div className="border-t border-white/5 pt-2 flex justify-between">
                      <span className="text-white/60 text-sm">Total</span>
                      <span className="text-white font-black text-base" style={{ fontFamily: 'Space Grotesk' }}>
                        ${totalPrice().toLocaleString('es-CL')}
                      </span>
                    </div>
                  </div>

                  {/* Formulario */}
                  <div className="space-y-3">
                    <p className="text-white/40 text-xs uppercase tracking-widest" style={{ fontFamily: 'Space Grotesk' }}>Tus datos</p>

                    <div>
                      <label className="text-white/50 text-xs block mb-1">Nombre (opcional)</label>
                      <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Tu nombre"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-brand-violet/60 transition-colors"
                        style={{ fontFamily: 'Inter' }}
                      />
                    </div>

                    <div>
                      <label className="text-white/50 text-xs block mb-1">Email para recibir confirmación *</label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                          type="email"
                          value={email}
                          onChange={e => { setEmail(e.target.value); setError(null) }}
                          placeholder="tu@correo.com"
                          required
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-brand-violet/60 transition-colors"
                          style={{ fontFamily: 'Inter' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-white/50 text-xs block mb-1">Teléfono / WhatsApp *</label>
                      <div className="relative">
                        <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                        <input
                          type="tel"
                          value={phone}
                          onChange={e => { setPhone(e.target.value); setError(null) }}
                          placeholder="+56 9 1234 5678"
                          required
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-brand-violet/60 transition-colors"
                          style={{ fontFamily: 'Inter' }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-white/50 text-xs block mb-1">Dirección de entrega *</label>
                      <div className="relative">
                        <MapPin size={15} className="absolute left-3 top-3.5 text-white/30" />
                        <textarea
                          value={address}
                          onChange={e => { setAddress(e.target.value); setError(null) }}
                          placeholder="Calle, número, comuna, ciudad"
                          required
                          rows={2}
                          className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-brand-violet/60 transition-colors resize-none"
                          style={{ fontFamily: 'Inter' }}
                        />
                      </div>
                    </div>

                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2"
                      >
                        {error}
                      </motion.p>
                    )}

                    <p className="text-white/25 text-xs leading-relaxed">
                      Al continuar serás redirigido al portal seguro de <strong className="text-white/40">Flow Chile</strong> para completar tu pago.
                    </p>
                  </div>
                </div>

                <div className="p-5 border-t border-white/5">
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={!loading ? { scale: 1.02, boxShadow: '0 0 25px rgba(129,215,66,0.3)' } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-brand-violet to-brand-cyan text-white font-bold text-sm rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ fontFamily: 'Space Grotesk' }}
                  >
                    {loading ? (
                      <><Loader2 size={16} className="animate-spin" /> Procesando...</>
                    ) : (
                      <>Pagar con Flow <ArrowRight size={16} /></>
                    )}
                  </motion.button>
                </div>
              </form>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
