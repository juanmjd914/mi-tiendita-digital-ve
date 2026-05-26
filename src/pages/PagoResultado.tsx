import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { CheckCircle, XCircle, Clock, ArrowLeft, MessageCircle, Loader2 } from 'lucide-react'
import { useSEO } from '../hooks/useSEO'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

type Status = 'loading' | 'paid' | 'pending' | 'rejected' | 'cancelled' | 'error'

interface OrderData {
  id: string
  status: string
  total: number
  customer_email: string
  created_at: string
}

const CONFIG: Record<Exclude<Status, 'loading'>, {
  icon: React.ElementType
  iconColor: string
  title: string
  subtitle: string
  bg: string
}> = {
  paid: {
    icon: CheckCircle,
    iconColor: 'text-green-400',
    title: '¡Pago exitoso!',
    subtitle: 'Tu pedido fue confirmado. Recibirás los detalles en tu correo.',
    bg: 'from-green-500/10',
  },
  pending: {
    icon: Clock,
    iconColor: 'text-brand-yellow',
    title: 'Pago en proceso',
    subtitle: 'Tu pago está siendo procesado. Te notificaremos cuando se confirme.',
    bg: 'from-brand-yellow/10',
  },
  rejected: {
    icon: XCircle,
    iconColor: 'text-red-400',
    title: 'Pago rechazado',
    subtitle: 'Tu pago fue rechazado. Puedes intentarlo nuevamente.',
    bg: 'from-red-500/10',
  },
  cancelled: {
    icon: XCircle,
    iconColor: 'text-white/40',
    title: 'Pago cancelado',
    subtitle: 'Cancelaste el proceso de pago. Tus productos siguen en el carrito.',
    bg: 'from-white/5',
  },
  error: {
    icon: XCircle,
    iconColor: 'text-red-400',
    title: 'Error al consultar el pago',
    subtitle: 'No pudimos obtener el estado de tu pedido. Contáctanos por WhatsApp.',
    bg: 'from-red-500/10',
  },
}

export default function PagoResultado() {
  useSEO({ title: 'Resultado del Pago', description: 'Estado de tu pago en Mi Tiendita Digital Ve' })

  const [params]    = useSearchParams()
  const token       = params.get('token')
  const [status,    setStatus]  = useState<Status>('loading')
  const [orderData, setOrderData] = useState<OrderData | null>(null)

  useEffect(() => {
    if (!token) { setStatus('error'); return }

    const check = async () => {
      try {
        const res  = await fetch(`${API_URL}/api/payment/status/${token}`)
        const data = await res.json()
        if (!res.ok) { setStatus('error'); return }
        setOrderData(data)
        setStatus((data.status as Status) || 'error')
      } catch {
        setStatus('error')
      }
    }

    check()
    // Si está pending, reintenta cada 5s por hasta 30s
    if (status === 'pending') {
      const interval = setInterval(check, 5000)
      const timeout  = setTimeout(() => clearInterval(interval), 30000)
      return () => { clearInterval(interval); clearTimeout(timeout) }
    }
  }, [token])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="text-brand-violet animate-spin" />
          <p className="text-white/50">Verificando tu pago...</p>
        </div>
      </div>
    )
  }

  const cfg = CONFIG[status]
  const Icon = cfg.icon

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className={`glass rounded-3xl p-8 sm:p-10 border border-white/10 text-center relative overflow-hidden`}>
          <div className={`absolute inset-0 bg-gradient-to-b ${cfg.bg} to-transparent pointer-events-none`} />

          <Icon size={64} className={`${cfg.iconColor} mx-auto mb-5 relative z-10`} />

          <h1 className="text-white font-bold text-2xl sm:text-3xl mb-3 relative z-10" style={{ fontFamily: 'Space Grotesk' }}>
            {cfg.title}
          </h1>
          <p className="text-white/50 text-sm mb-6 relative z-10" style={{ fontFamily: 'Inter' }}>
            {cfg.subtitle}
          </p>

          {/* Detalles del pedido */}
          {orderData && status === 'paid' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass rounded-xl p-4 border border-green-500/20 mb-6 text-left space-y-2 relative z-10"
            >
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Pedido</span>
                <span className="text-white font-mono text-xs">{orderData.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Total</span>
                <span className="text-white font-bold">${orderData.total.toLocaleString('es-CL')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Correo</span>
                <span className="text-white text-xs">{orderData.customer_email}</span>
              </div>
            </motion.div>
          )}

          {/* Acciones */}
          <div className="flex flex-col gap-3 relative z-10">
            {(status === 'rejected' || status === 'cancelled') && (
              <Link to="/">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 bg-gradient-to-r from-brand-violet to-brand-cyan text-white font-bold text-sm rounded-xl"
                  style={{ fontFamily: 'Space Grotesk' }}
                >
                  Volver a la tienda
                </motion.button>
              </Link>
            )}

            <motion.a
              href="https://wa.me/56946216579?text=Hola%2C%20tengo%20una%20consulta%20sobre%20mi%20pago"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-green-500/15 hover:bg-green-500/25 text-green-400 font-semibold text-sm rounded-xl border border-green-500/20 transition-colors"
              style={{ fontFamily: 'Space Grotesk' }}
            >
              <MessageCircle size={15} /> Contactar por WhatsApp
            </motion.a>

            <Link to="/" className="flex items-center justify-center gap-1 text-white/30 hover:text-white/60 text-sm transition-colors mt-2">
              <ArrowLeft size={14} /> Volver al inicio
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
