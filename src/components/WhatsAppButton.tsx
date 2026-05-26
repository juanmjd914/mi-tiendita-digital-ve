import { motion, AnimatePresence } from 'motion/react'
import { useState } from 'react'
import { MessageCircle, X } from 'lucide-react'

const PHONE   = '56946216579'
const WA_URL  = `https://wa.me/${PHONE}?text=Hola%2C%20estoy%20interesado%20en%20sus%20productos`

export default function WhatsAppButton() {
  const [tooltip, setTooltip] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {tooltip && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="glass bg-[#0f0f1a] rounded-xl px-4 py-3 border border-green-500/20 shadow-xl max-w-[200px]"
          >
            <p className="text-white font-semibold text-xs leading-tight" style={{ fontFamily: 'Space Grotesk' }}>
              ¿Necesitas ayuda?
            </p>
            <p className="text-white/40 text-xs mt-0.5">Escríbenos por WhatsApp</p>
            <button
              onClick={() => setTooltip(false)}
              className="absolute -top-2 -right-2 w-5 h-5 bg-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-white"
            >
              <X size={10} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Anillo pulsante */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-green-500/30 animate-pulse-ring" />
        <motion.a
          href={WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          onHoverStart={() => setTooltip(true)}
          onHoverEnd={() => setTooltip(false)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-14 h-14 bg-green-500 hover:bg-green-400 rounded-full flex items-center justify-center shadow-lg transition-colors"
          style={{ boxShadow: '0 0 25px rgba(37,211,102,0.4)' }}
          aria-label="Contactar por WhatsApp"
        >
          <MessageCircle size={26} className="text-white" />
        </motion.a>
      </div>
    </div>
  )
}
