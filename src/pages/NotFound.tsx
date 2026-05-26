import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { Home, ShoppingBag, ArrowRight } from 'lucide-react'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-24 relative overflow-hidden"
      style={{ background: '#0a0a0f' }}
    >
      {/* Glow de fondo */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl opacity-20"
          style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full blur-3xl opacity-10"
          style={{ background: '#06b6d4' }} />
      </div>

      <div className="relative z-10 text-center max-w-lg mx-auto">

        {/* Número 404 grande */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 120 }}
          className="mb-6"
        >
          <span
            className="block font-black leading-none select-none"
            style={{
              fontFamily: 'Space Grotesk, sans-serif',
              fontSize: 'clamp(100px, 22vw, 180px)',
              background: 'linear-gradient(135deg, #7c3aed 0%, #06b6d4 50%, #ffc222 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              opacity: 0.9,
            }}
          >
            404
          </span>
        </motion.div>

        {/* Ícono decorativo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center mb-6"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)' }}
          >
            <span className="text-3xl">🔍</span>
          </div>
        </motion.div>

        {/* Texto */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h1
            className="text-white font-bold text-2xl sm:text-3xl mb-3"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Página no encontrada
          </h1>
          <p
            className="text-white/40 text-sm leading-relaxed mb-10 max-w-sm mx-auto"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            La página que buscas no existe o fue movida. Pero no te preocupes, aquí tienes dónde ir:
          </p>
        </motion.div>

        {/* Botones */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link to="/">
            <motion.div
              whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(124,58,237,0.35)' }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-bold text-sm"
              style={{
                fontFamily: 'Space Grotesk',
                background: 'linear-gradient(135deg, #7c3aed, #06b6d4)',
              }}
            >
              <Home size={15} /> Ir al Inicio
            </motion.div>
          </Link>

          <Link to="/tienda">
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white/70 hover:text-white font-semibold text-sm border border-white/10 hover:border-white/20 transition-colors"
              style={{ fontFamily: 'Space Grotesk' }}
            >
              <ShoppingBag size={15} /> Ver Tienda <ArrowRight size={13} />
            </motion.div>
          </Link>
        </motion.div>

        {/* Enlace soporte */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-10 text-white/20 text-xs"
          style={{ fontFamily: 'Inter' }}
        >
          ¿Necesitas ayuda?{' '}
          <Link to="/soporte" className="text-brand-violet hover:text-brand-cyan transition-colors">
            Contacta soporte
          </Link>
        </motion.p>
      </div>
    </div>
  )
}
