import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { X, ShoppingCart, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Mail, Loader2, Phone, MapPin, CreditCard, Building2, CheckCircle2, Copy } from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

type Step = 'cart' | 'checkout' | 'transfer-success'
type PaymentMethod = 'flow' | 'transfer'

const BANK_DETAILS = [
  { label: 'Banco',          value: 'Banco Falabella' },
  { label: 'Tipo',           value: 'Cuenta Corriente' },
  { label: 'N° de cuenta',   value: '1-982-273710-0' },
  { label: 'Titular',        value: 'Juan Carlos Mejias' },
  { label: 'RUT',            value: '27.012.143-8' },
]

export default function CartDrawer() {
  const { isOpen, closeCart, items, removeItem, updateQuantity, totalPrice, clearCart } = useCartStore()
  const { user } = useAuthStore()

  const [step,          setStep]          = useState<Step>('cart')
  const [email,         setEmail]         = useState('')
  const [name,          setName]          = useState('')
  const [phone,         setPhone]         = useState('')
  const [address,       setAddress]       = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('flow')
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState<string | null>(null)
  const [transferOrder, setTransferOrder] = useState<{ id: number; total: number } | null>(null)
  const [copied,        setCopied]        = useState<string | null>(null)

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
    setTimeout(() => {
      setStep('cart')
      setError(null)
      setTransferOrder(null)
    }, 300)
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) { setError('Ingresa un email válido'); return }
    if (!phone.trim())        { setError('Ingresa tu número de teléfono o WhatsApp'); return }
    if (!address.trim())      { setError('Ingresa tu dirección de entrega'); return }
    setLoading(true)
    setError(null)

    const payload = {
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
    }

    try {
      if (paymentMethod === 'flow') {
        // ── Flow Chile ─────────────────────────────────────────────
        const res  = await fetch(`${API_URL}/api/payment/create`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Error al crear el pago')
        clearCart()
        window.location.href = data.redirectUrl
      } else {
        // ── Transferencia bancaria ──────────────────────────────────
        const res  = await fetch(`${API_URL}/api/payment/transfer`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Error al crear el pedido')
        clearCart()
        setTransferOrder({ id: data.orderId, total: data.total })
        setStep('transfer-success')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al procesar el pago'
      setError(msg)
      setLoading(false)
    }
  }

  const headerTitle: Record<Step, string> = {
    'cart':             'Mi Carrito',
    'checkout':         'Datos de Pago',
    'transfer-success': '✅ Pedido Creado',
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
            onClick={step === 'transfer-success' ? undefined : handleClose}
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
                  {headerTitle[step]}
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
                {step !== 'transfer-success' && (
                  <button onClick={handleClose} className="text-white/60 hover:text-white transition-colors p-1">
                    <X size={20} />
                  </button>
                )}
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
                      whileHover={{ scale: 1.02, boxShadow: '0 0 25px rgba(124,58,237,0.3)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setStep('checkout')}
                      className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-brand-violet to-brand-cyan text-white font-bold text-sm rounded-xl"
                      style={{ fontFamily: 'Space Grotesk' }}
                    >
                      Proceder al Pago <ArrowRight size={16} />
                    </motion.button>
                    <p className="text-white/25 text-xs text-center">Pago seguro · Flow Chile o Transferencia</p>
                  </div>
                )}
              </>
            )}

            {/* ── STEP 2: datos + método de pago ── */}
            {step === 'checkout' && (
              <form onSubmit={handleCheckout} className="flex flex-col flex-1 overflow-hidden">
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
                  </div>

                  {/* Selector de método de pago */}
                  <div className="space-y-2">
                    <p className="text-white/40 text-xs uppercase tracking-widest" style={{ fontFamily: 'Space Grotesk' }}>Método de pago</p>

                    {/* Flow */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('flow')}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left"
                      style={{
                        background: paymentMethod === 'flow' ? 'rgba(124,58,237,0.1)' : 'rgba(255,255,255,0.03)',
                        borderColor: paymentMethod === 'flow' ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: paymentMethod === 'flow' ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.05)' }}>
                        <CreditCard size={16} style={{ color: paymentMethod === 'flow' ? '#7c3aed' : 'rgba(255,255,255,0.4)' }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ fontFamily: 'Space Grotesk', color: paymentMethod === 'flow' ? '#c4b5fd' : 'rgba(255,255,255,0.7)' }}>
                          Pagar con Flow Chile
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter' }}>
                          Débito, crédito, Webpay, efectivo
                        </p>
                      </div>
                      <div className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                        style={{ borderColor: paymentMethod === 'flow' ? '#7c3aed' : 'rgba(255,255,255,0.2)' }}>
                        {paymentMethod === 'flow' && (
                          <div className="w-2 h-2 rounded-full bg-brand-violet" />
                        )}
                      </div>
                    </button>

                    {/* Transferencia */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('transfer')}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left"
                      style={{
                        background: paymentMethod === 'transfer' ? 'rgba(6,182,212,0.1)' : 'rgba(255,255,255,0.03)',
                        borderColor: paymentMethod === 'transfer' ? 'rgba(6,182,212,0.5)' : 'rgba(255,255,255,0.08)',
                      }}
                    >
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: paymentMethod === 'transfer' ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.05)' }}>
                        <Building2 size={16} style={{ color: paymentMethod === 'transfer' ? '#06b6d4' : 'rgba(255,255,255,0.4)' }} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold" style={{ fontFamily: 'Space Grotesk', color: paymentMethod === 'transfer' ? '#67e8f9' : 'rgba(255,255,255,0.7)' }}>
                          Transferencia Bancaria
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Inter' }}>
                          Banco Falabella · Cuenta Corriente
                        </p>
                      </div>
                      <div className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center"
                        style={{ borderColor: paymentMethod === 'transfer' ? '#06b6d4' : 'rgba(255,255,255,0.2)' }}>
                        {paymentMethod === 'transfer' && (
                          <div className="w-2 h-2 rounded-full bg-brand-cyan" />
                        )}
                      </div>
                    </button>
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
                    {paymentMethod === 'flow'
                      ? <>Al continuar serás redirigido al portal seguro de <strong className="text-white/40">Flow Chile</strong> para completar tu pago.</>
                      : <>Recibirás los datos de transferencia por email. Tu pedido quedará reservado hasta confirmar el pago.</>
                    }
                  </p>
                </div>

                <div className="p-5 border-t border-white/5">
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={!loading ? { scale: 1.02, boxShadow: paymentMethod === 'flow' ? '0 0 25px rgba(124,58,237,0.3)' : '0 0 25px rgba(6,182,212,0.3)' } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                    className="w-full flex items-center justify-center gap-2 py-4 text-white font-bold text-sm rounded-xl disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    style={{
                      fontFamily: 'Space Grotesk',
                      background: paymentMethod === 'flow'
                        ? 'linear-gradient(135deg, #7c3aed, #06b6d4)'
                        : 'linear-gradient(135deg, #0891b2, #06b6d4)',
                    }}
                  >
                    {loading ? (
                      <><Loader2 size={16} className="animate-spin" /> Procesando...</>
                    ) : paymentMethod === 'flow' ? (
                      <><CreditCard size={16} /> Pagar con Flow</>
                    ) : (
                      <><Building2 size={16} /> Reservar con Transferencia</>
                    )}
                  </motion.button>
                </div>
              </form>
            )}

            {/* ── STEP 3: éxito transferencia ── */}
            {step === 'transfer-success' && transferOrder && (
              <div className="flex-1 overflow-y-auto">
                {/* Banner éxito */}
                <div className="p-6 text-center border-b border-white/5"
                  style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(10,10,15,0))' }}>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(6,182,212,0.15)', border: '2px solid rgba(6,182,212,0.3)' }}
                  >
                    <CheckCircle2 size={32} className="text-brand-cyan" />
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <p className="text-brand-cyan text-xs font-bold tracking-widest uppercase mb-2" style={{ fontFamily: 'Space Grotesk' }}>
                      ¡Pedido reservado!
                    </p>
                    <p className="text-white font-black text-xl mb-1" style={{ fontFamily: 'Space Grotesk' }}>
                      Orden #{transferOrder.id}
                    </p>
                    <p className="text-white/50 text-sm">
                      Total a transferir:{' '}
                      <span className="text-brand-cyan font-bold">${transferOrder.total.toLocaleString('es-CL')}</span>
                    </p>
                  </motion.div>
                </div>

                <div className="p-5 space-y-4">
                  {/* Datos bancarios */}
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <p className="text-white/40 text-xs uppercase tracking-widest mb-2" style={{ fontFamily: 'Space Grotesk' }}>
                      Datos para la transferencia
                    </p>
                    <div className="rounded-xl border overflow-hidden"
                      style={{ background: 'rgba(6,182,212,0.04)', borderColor: 'rgba(6,182,212,0.2)' }}>
                      {BANK_DETAILS.map(({ label, value }) => (
                        <div key={label}
                          className="flex items-center justify-between px-4 py-2.5 border-b last:border-b-0"
                          style={{ borderColor: 'rgba(6,182,212,0.1)' }}>
                          <span className="text-white/45 text-xs" style={{ fontFamily: 'Space Grotesk' }}>{label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold text-sm" style={{ fontFamily: 'Inter' }}>{value}</span>
                            <button
                              onClick={() => copyToClipboard(value, label)}
                              className="text-white/20 hover:text-brand-cyan transition-colors"
                              title="Copiar"
                            >
                              {copied === label
                                ? <CheckCircle2 size={13} className="text-brand-cyan" />
                                : <Copy size={13} />
                              }
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Instrucciones */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-xl border p-4"
                    style={{ background: 'rgba(255,194,34,0.04)', borderColor: 'rgba(255,194,34,0.2)' }}
                  >
                    <p className="text-brand-yellow text-xs font-bold mb-2" style={{ fontFamily: 'Space Grotesk' }}>
                      ⚡ Próximos pasos
                    </p>
                    <ol className="space-y-1.5 text-white/50 text-xs list-decimal list-inside leading-relaxed" style={{ fontFamily: 'Inter' }}>
                      <li>Transfiere <span className="text-white/80 font-semibold">${transferOrder.total.toLocaleString('es-CL')}</span> a los datos de arriba.</li>
                      <li>Envía el comprobante por WhatsApp con el N° de orden <span className="text-white/80 font-semibold">#{transferOrder.id}</span>.</li>
                      <li>Confirmaremos tu pedido y coordinaremos la entrega.</li>
                    </ol>
                    <p className="text-white/30 text-xs mt-3" style={{ fontFamily: 'Inter' }}>
                      También te enviamos las instrucciones a tu email.
                    </p>
                  </motion.div>

                  {/* Botón WhatsApp */}
                  <motion.a
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    href={`https://wa.me/56946216579?text=Hola%2C%20quiero%20enviar%20el%20comprobante%20de%20transferencia%20del%20pedido%20%23${transferOrder.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white font-bold text-sm"
                    style={{ fontFamily: 'Space Grotesk', background: '#25d366' }}
                  >
                    💬 Enviar Comprobante por WhatsApp
                  </motion.a>

                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    onClick={handleClose}
                    className="w-full py-3 rounded-xl text-white/40 hover:text-white text-sm font-semibold transition-colors border border-white/8 hover:border-white/20"
                    style={{ fontFamily: 'Space Grotesk' }}
                  >
                    Cerrar
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
