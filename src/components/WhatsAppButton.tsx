import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import juanCarlosPhoto from '../assets/equipo-juan-carlos.jpeg'

const PHONE  = '56946216579'
const WA_URL = `https://wa.me/${PHONE}?text=Hola%2C%20estoy%20interesado%20en%20sus%20productos`

const SESSION_KEY = 'mtd_wa_bubble_shown'

export default function WhatsAppButton() {
  const [showBubble, setShowBubble] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Desktop: se muestra en hover. Móvil/táctil: aparece una sola vez por
  // sesión a los pocos segundos, igual que en la landing de Venezuela.
  useEffect(() => {
    const isDesktopHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (isDesktopHover) return

    if (!sessionStorage.getItem(SESSION_KEY)) {
      timeoutRef.current = setTimeout(() => {
        setShowBubble(true)
        sessionStorage.setItem(SESSION_KEY, '1')
      }, 3500)
    }
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }
  }, [])

  const isDesktopHover = typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches

  return (
    <div
      className="fixed z-40 bottom-[18px] right-[18px] sm:bottom-6 sm:right-6"
      onMouseEnter={() => { if (isDesktopHover) setShowBubble(true) }}
      onMouseLeave={() => { if (isDesktopHover) setShowBubble(false) }}
    >
      <div className="relative w-12 h-12 sm:w-[60px] sm:h-[60px]">
        {/* Globo de bienvenida con la foto del equipo */}
        <AnimatePresence>
          {showBubble && (
            <motion.div
              initial={{ opacity: 0, x: 8, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 8, scale: 0.96 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="absolute flex items-start gap-2.5 bg-white rounded-2xl shadow-2xl w-[210px] right-[62px] sm:w-[240px] sm:right-[74px]"
              style={{
                bottom: 2,
                padding: '12px 14px 12px 12px',
                boxShadow: '0 14px 36px rgba(16,16,20,0.28), 0 2px 8px rgba(16,16,20,0.15)',
              }}
            >
              {/* Cerrar */}
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowBubble(false) }}
                aria-label="Cerrar"
                className="absolute flex items-center justify-center text-gray-400 hover:text-gray-600"
                style={{
                  top: -8, left: -8, width: 20, height: 20, borderRadius: '50%',
                  background: '#fff', border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 6px rgba(16,16,20,0.12)', fontSize: 11,
                }}
              >
                ✕
              </button>

              {/* Foto del equipo */}
              <div
                className="flex-shrink-0 rounded-full overflow-hidden"
                style={{ width: 36, height: 36, border: '2px solid #eafaf1' }}
              >
                <img
                  src={juanCarlosPhoto}
                  alt="Juan Carlos, Mi Tiendita Digital Ve"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: 'center 18%' }}
                />
              </div>

              {/* Texto */}
              <div className="text-[13px] leading-snug text-gray-600" style={{ paddingTop: 2 }}>
                <b className="block text-[12px] text-gray-900 mb-0.5">👋 ¡Hola!</b>
                ¿Cómo podemos ayudarte hoy?
              </div>

              {/* Colita del globo */}
              <div
                className="absolute bg-white"
                style={{ right: -6, bottom: 20, width: 12, height: 12, transform: 'rotate(45deg)' }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Doble anillo pulsante */}
        <span className="absolute inset-0 rounded-full animate-wa-ripple" style={{ background: '#25d366' }} />
        <span className="absolute inset-0 rounded-full animate-wa-ripple-delay" style={{ background: '#25d366' }} />

        {/* Botón */}
        <motion.a
          href={WA_URL}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.08, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="absolute inset-0 rounded-full flex items-center justify-center"
          style={{
            background: 'linear-gradient(155deg, #3adf7a 0%, #25d366 55%, #1cb355 100%)',
            boxShadow: '0 10px 28px rgba(16,120,60,0.4), inset 0 1px 1px rgba(255,255,255,0.5), inset 0 -2px 4px rgba(0,0,0,0.12)',
            border: '2px solid rgba(255,255,255,0.55)',
          }}
          aria-label="Contactar por WhatsApp"
        >
          <svg viewBox="0 0 24 24" fill="#fff" className="w-[22px] h-[22px] sm:w-7 sm:h-7" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.15))' }}>
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a7.33 7.33 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.123.556 4.116 1.528 5.848L.17 23.527l5.835-1.53A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.956a9.948 9.948 0 01-5.067-1.384l-.364-.216-3.768.99 1.008-3.674-.237-.378A9.957 9.957 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
          </svg>
        </motion.a>
      </div>
    </div>
  )
}
