import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Package, User, LogOut, ShoppingBag,
  ChevronDown, ChevronUp, Loader2,
  Phone, MapPin, Check, Mail,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// ── Tipos ──────────────────────────────────────────────────────────────────
interface OrderItem {
  id:         string
  name:       string
  price:      number
  quantity:   number
}
interface Order {
  id:             string
  status:         'pending' | 'paid' | 'rejected' | 'cancelled' | 'pending_transfer'
  total:          number
  customer_email: string
  customer_name:  string | null
  created_at:     string
  order_items:    OrderItem[]
}

const STATUS: Record<string, { label: string; bg: string; text: string; border: string }> = {
  paid:             { label: 'Pagado',              bg: 'bg-green-500/15',  text: 'text-green-400',  border: 'border-green-500/30'  },
  pending:          { label: 'Pendiente',           bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  pending_transfer: { label: 'Esperando pago',      bg: 'bg-cyan-500/15',   text: 'text-cyan-400',   border: 'border-cyan-500/30'   },
  rejected:         { label: 'Rechazado',           bg: 'bg-red-500/15',    text: 'text-red-400',    border: 'border-red-500/30'    },
  cancelled:        { label: 'Cancelado',           bg: 'bg-white/8',       text: 'text-white/40',   border: 'border-white/15'      },
}

// ── Tarjeta de pedido ───────────────────────────────────────────────────────
function OrderCard({ order }: { order: Order }) {
  const [expanded, setExpanded] = useState(false)
  const st = STATUS[order.status] ?? STATUS.cancelled

  return (
    <div className="glass rounded-2xl border border-white/5 overflow-hidden">
      {/* Cabecera */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/3 transition-colors gap-3"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-brand-violet/10 border border-brand-violet/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShoppingBag size={14} className="text-brand-violet" />
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold truncate" style={{ fontFamily: 'Space Grotesk' }}>
              #{order.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-white/30 text-xs">
              {new Date(order.created_at).toLocaleDateString('es-CL', {
                day: '2-digit', month: 'short', year: 'numeric',
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${st.bg} ${st.text} ${st.border}`}>
            {st.label}
          </span>
          <span className="text-white font-black text-sm hidden sm:block" style={{ fontFamily: 'Space Grotesk' }}>
            ${order.total.toLocaleString('es-CL')}
          </span>
          {expanded
            ? <ChevronUp size={14} className="text-white/30" />
            : <ChevronDown size={14} className="text-white/30" />
          }
        </div>
      </div>

      {/* Detalle expandible */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="border-t border-white/5 px-4 pt-3 pb-4 space-y-2">
              {/* Aviso transferencia pendiente */}
              {order.status === 'pending_transfer' && (
                <div className="bg-cyan-500/8 border border-cyan-500/20 rounded-xl px-3 py-2.5 mb-1">
                  <p className="text-cyan-400 text-xs font-semibold mb-0.5" style={{ fontFamily: 'Space Grotesk' }}>
                    ⏳ Esperando tu transferencia
                  </p>
                  <p className="text-white/40 text-xs" style={{ fontFamily: 'Inter' }}>
                    Revisa tu correo con los datos bancarios. Te confirmaremos por email al recibir el pago.
                  </p>
                </div>
              )}
              {(order.order_items || []).map(item => (
                <div key={item.id} className="flex justify-between text-xs gap-2">
                  <span className="text-white/55 flex-1 truncate">
                    {item.name} <span className="text-white/30">×{item.quantity}</span>
                  </span>
                  <span className="text-white font-semibold whitespace-nowrap">
                    ${(item.price * item.quantity).toLocaleString('es-CL')}
                  </span>
                </div>
              ))}
              <div className="border-t border-white/5 pt-2 flex justify-between items-center">
                <span className="text-white/40 text-xs">Total del pedido</span>
                <span className="text-white font-black text-sm" style={{ fontFamily: 'Space Grotesk' }}>
                  ${order.total.toLocaleString('es-CL')}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Componente principal ────────────────────────────────────────────────────
export default function MiCuenta() {
  const { user, session, signOut } = useAuthStore()

  const [tab,          setTab]         = useState<'orders' | 'profile'>('orders')
  const [orders,       setOrders]      = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)

  // Profile
  const meta = user?.user_metadata ?? {}
  const [fullName,       setFullName]      = useState<string>(meta.full_name || '')
  const [phone,          setPhone]         = useState<string>(meta.phone    || '')
  const [address,        setAddress]       = useState<string>(meta.address  || '')
  const [profileSaving,  setProfileSaving] = useState(false)
  const [profileSaved,   setProfileSaved]  = useState(false)
  const [profileError,   setProfileError]  = useState<string | null>(null)

  // Cargar pedidos
  const loadOrders = useCallback(async () => {
    if (!session?.access_token) return
    setOrdersLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/my-orders`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
      if (res.ok) setOrders(await res.json())
    } catch { /* silent */ }
    finally  { setOrdersLoading(false) }
  }, [session?.access_token])

  useEffect(() => { loadOrders() }, [loadOrders])

  // Guardar perfil
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileSaving(true)
    setProfileError(null)

    const { error } = await supabase.auth.updateUser({
      data: { full_name: fullName, phone, address },
    })

    setProfileSaving(false)
    if (error) { setProfileError(error.message); return }
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2500)
  }

  // Datos del usuario
  const displayName = meta.full_name || user?.email?.split('@')[0] || 'Usuario'
  const initial     = displayName[0]?.toUpperCase() || 'U'
  const paidCount   = orders.filter(o => o.status === 'paid').length
  const totalSpent  = orders.filter(o => o.status === 'paid').reduce((s, o) => s + o.total, 0)

  return (
    <div style={{ background: '#0a0a0f' }}>
      {/* ── HERO ── */}
      <section className="relative pt-32 pb-8 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-violet/8 via-transparent to-brand-cyan/5 pointer-events-none" />
        <div className="max-w-4xl mx-auto relative z-10">

          {/* Avatar + saludo + logout */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between gap-4 flex-wrap"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #81d742, #06b6d4)', fontFamily: 'Space Grotesk' }}
              >
                {initial}
              </div>
              <div>
                <p className="text-brand-cyan text-xs font-semibold tracking-[0.3em] uppercase mb-0.5" style={{ fontFamily: 'Space Grotesk' }}>
                  Mi Cuenta
                </p>
                <h1 className="text-white font-bold text-2xl sm:text-3xl leading-tight" style={{ fontFamily: 'Space Grotesk' }}>
                  Hola, {displayName.split(' ')[0]} 👋
                </h1>
                <p className="text-white/30 text-xs mt-0.5">{user?.email}</p>
              </div>
            </div>

            <motion.button
              onClick={signOut}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-xl text-sm transition-colors"
              style={{ fontFamily: 'Space Grotesk' }}
            >
              <LogOut size={14} /> Cerrar sesión
            </motion.button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-3 mt-6"
          >
            {[
              { label: 'Pedidos totales', value: orders.length.toString()               },
              { label: 'Completados',     value: paidCount.toString()                   },
              { label: 'Total gastado',   value: `$${totalSpent.toLocaleString('es-CL')}` },
            ].map(({ label, value }) => (
              <div key={label} className="glass rounded-2xl p-3 sm:p-4 border border-white/5 text-center">
                <p className="text-white font-black text-lg sm:text-2xl gradient-text" style={{ fontFamily: 'Space Grotesk' }}>
                  {ordersLoading ? '…' : value}
                </p>
                <p className="text-white/35 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── TABS + CONTENIDO ── */}
      <section className="px-4 pb-20">
        <div className="max-w-4xl mx-auto">

          {/* Pestañas */}
          <div className="flex gap-2 mb-6 border-b border-white/5 pb-4">
            {([
              { id: 'orders'  as const, label: 'Mis Pedidos', Icon: Package },
              { id: 'profile' as const, label: 'Mi Perfil',   Icon: User    },
            ] as const).map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  tab === id
                    ? 'bg-brand-violet/20 text-brand-violet border border-brand-violet/30'
                    : 'text-white/40 hover:text-white hover:bg-white/5'
                }`}
                style={{ fontFamily: 'Space Grotesk' }}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          {/* ── Pedidos ── */}
          {tab === 'orders' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              {ordersLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 size={28} className="text-brand-violet animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingBag size={48} className="text-white/10 mx-auto mb-4" />
                  <p className="text-white/30 font-semibold" style={{ fontFamily: 'Space Grotesk' }}>
                    No tienes pedidos aún
                  </p>
                  <p className="text-white/20 text-sm mt-1">Tus compras aparecerán aquí</p>
                </div>
              ) : (
                orders.map(order => <OrderCard key={order.id} order={order} />)
              )}
            </motion.div>
          )}

          {/* ── Perfil ── */}
          {tab === 'profile' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <form onSubmit={handleSaveProfile} className="glass rounded-2xl p-6 border border-white/5 space-y-4">
                <p className="text-white/35 text-xs uppercase tracking-widest mb-2" style={{ fontFamily: 'Space Grotesk' }}>
                  Información personal
                </p>

                {/* Nombre */}
                <div>
                  <label className="text-white/50 text-xs block mb-1.5">Nombre completo</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Tu nombre"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-brand-violet/60 transition-colors"
                      style={{ fontFamily: 'Inter' }}
                    />
                  </div>
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="text-white/50 text-xs block mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20" />
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full bg-white/3 border border-white/5 rounded-xl pl-9 pr-4 py-3 text-white/35 text-sm cursor-not-allowed"
                      style={{ fontFamily: 'Inter' }}
                    />
                  </div>
                </div>

                {/* Teléfono */}
                <div>
                  <label className="text-white/50 text-xs block mb-1.5">Teléfono / WhatsApp</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+56 9 1234 5678"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-brand-violet/60 transition-colors"
                      style={{ fontFamily: 'Inter' }}
                    />
                  </div>
                </div>

                {/* Dirección */}
                <div>
                  <label className="text-white/50 text-xs block mb-1.5">Dirección predeterminada</label>
                  <div className="relative">
                    <MapPin size={14} className="absolute left-3 top-3.5 text-white/30" />
                    <textarea
                      value={address}
                      onChange={e => setAddress(e.target.value)}
                      placeholder="Calle, número, comuna, ciudad"
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-brand-violet/60 transition-colors resize-none"
                      style={{ fontFamily: 'Inter' }}
                    />
                  </div>
                </div>

                {profileError && (
                  <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">
                    {profileError}
                  </p>
                )}

                <motion.button
                  type="submit"
                  disabled={profileSaving || profileSaved}
                  whileHover={!profileSaving ? { scale: 1.02 } : {}}
                  whileTap={!profileSaving ? { scale: 0.98 } : {}}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-brand-violet to-brand-cyan text-white font-bold text-sm rounded-xl disabled:opacity-70"
                  style={{ fontFamily: 'Space Grotesk' }}
                >
                  {profileSaving
                    ? <><Loader2 size={16} className="animate-spin" /> Guardando...</>
                    : profileSaved
                    ? <><Check size={16} /> ¡Guardado con éxito!</>
                    : 'Guardar cambios'
                  }
                </motion.button>
              </form>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  )
}
