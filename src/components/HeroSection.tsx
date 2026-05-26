import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { ArrowRight, ChevronDown, Zap } from 'lucide-react'

const VIDEO_URL = 'https://hhhijebsmajvphazvxlm.supabase.co/storage/v1/object/public/MI%20TIENDITA%20DIGITAL%20VE/video%20hero%20mi%20tiendita%20digital%20ve.mp4'

const springConfig = { stiffness: 100, damping: 30 }

export default function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const moveX = useSpring(useTransform(mouseX, [-0.5, 0.5], [-30, 30]), springConfig)
  const moveY = useSpring(useTransform(mouseY, [-0.5, 0.5], [-30, 30]), springConfig)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-screen min-h-[600px] overflow-hidden flex items-center justify-center"
    >
      {/* Video de fondo — a todo color, sin overlay que mate el color */}
      <motion.div
        style={{ x: moveX, y: moveY, scale: 1.1 }}
        className="absolute inset-0 w-full h-full"
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
          src={VIDEO_URL}
        />
      </motion.div>

      {/* Gradiente sutil solo en la parte inferior para legibilidad del texto */}
      <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/40 to-transparent pointer-events-none" />

      {/* Contenido del Hero */}
      <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
        {/* Badge animado */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0 }}
          className="inline-flex items-center gap-2 mb-6"
        >
          <div className="flex items-center gap-2 px-4 py-2 glass-violet rounded-full border border-brand-violet/40">
            <Zap size={14} className="text-brand-yellow" />
            <span className="text-white/90 text-xs sm:text-sm font-semibold tracking-widest uppercase" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Tecnología · Gaming · Rancagua, Chile
            </span>
          </div>
        </motion.div>

        {/* Título H1 */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-none mb-6 text-white"
          style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}
        >
          Tu Tienda de{' '}
          <span className="gradient-text">Tecnología</span>
          <br />
          en Rancagua
        </motion.h1>

        {/* Subtítulo */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-white/70 text-base sm:text-lg lg:text-xl mb-10 max-w-2xl mx-auto leading-relaxed"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Accesorios, computación y tecnología con garantía local.
          <br className="hidden sm:block" /> Las mejores marcas al mejor precio en Rancagua, Chile.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.a
            href="#tienda"
            whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(124,58,237,0.6)' }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 px-8 py-4 bg-brand-violet text-white font-bold text-sm tracking-wide rounded-full transition-all"
            style={{ fontFamily: 'Space Grotesk, sans-serif' }}
          >
            Visitar Tienda <ArrowRight size={16} />
          </motion.a>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2"
      >
        <span className="text-white/30 text-xs tracking-widest uppercase" style={{ fontFamily: 'Space Grotesk' }}>Scroll</span>
        <ChevronDown size={20} className="text-white/40 animate-bounce-slow" />
      </motion.div>
    </section>
  )
}
