import { motion } from 'motion/react'
import { useSEO } from '../hooks/useSEO'
import { MapPin, Gamepad2, Shield, Zap, Users, Star, Heart, Award } from 'lucide-react'

const LOGO_URL = 'https://hhhijebsmajvphazvxlm.supabase.co/storage/v1/object/public/MI%20TIENDITA%20DIGITAL%20VE/logotipo_mi_tiendita_digital_ve-.png'

const values = [
  { icon: Shield,   title: 'Confianza',    desc: 'Llevamos años siendo la tienda de referencia en Rancagua para todo lo relacionado con tecnología y gaming.',           color: '#81d742' },
  { icon: Zap,      title: 'Rapidez',      desc: 'Atención rápida y despachos eficientes. Tus pedidos se procesan y envían en el menor tiempo posible.',              color: '#06b6d4' },
  { icon: Heart,    title: 'Pasión Gamer', desc: 'Somos gamers como tú. Conocemos cada título, cada accesorio y te asesoramos con honestidad para que compres lo correcto.', color: '#ffc222' },
  { icon: Award,    title: 'Calidad',      desc: 'Solo trabajamos con productos y servicios que hemos probado. Tu satisfacción no es un slogan, es nuestra prioridad.',       color: '#f27d26' },
]

const stats = [
  { number: '500+', label: 'Clientes Satisfechos' },
  { number: '1.000+', label: 'Productos Vendidos' },
  { number: '4.9★', label: 'Calificación Promedio' },
  { number: '24/7', label: 'Soporte Disponible' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.12 } },
}

export default function Nosotros() {
  useSEO({ title: 'Nosotros', description: 'Conoce a Mi Tiendita Digital Ve, tu tienda de tecnología y gaming en Rancagua, Chile.' })

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      {/* ── HERO ── */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-purple/30 via-transparent to-brand-cyan/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-violet/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center justify-center w-20 h-20 mb-8 mx-auto"
          >
            <img src={LOGO_URL} alt="Logo" className="w-full h-full object-contain" />
          </motion.div>

          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="block text-brand-cyan text-xs font-semibold tracking-[0.3em] uppercase mb-4"
            style={{ fontFamily: 'Space Grotesk' }}
          >
            Nuestra Historia
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="text-4xl sm:text-6xl font-bold text-white leading-tight mb-6"
            style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}
          >
            Somos <span className="gradient-text">Mi Tiendita</span><br />
            Digital Ve
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-white/60 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Nacimos con una misión clara: llevar la mejor tecnología y entretenimiento digital
            a los gamers y entusiastas de la tecnología en <strong className="text-white/90">Rancagua, Chile</strong>.
            Hoy somos el punto de referencia para quienes buscan tecnología gamer, accesorios,
            computación y mucho más con garantía real y atención personalizada.
          </motion.p>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-12 px-4 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {stats.map(({ number, label }) => (
              <motion.div
                key={label}
                variants={fadeUp}
                className="text-center"
              >
                <p className="text-3xl sm:text-4xl font-black text-white mb-1" style={{ fontFamily: 'Space Grotesk' }}>
                  <span className="gradient-text">{number}</span>
                </p>
                <p className="text-white/40 text-xs sm:text-sm" style={{ fontFamily: 'Inter' }}>{label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── QUIÉNES SOMOS ── */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Texto */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <span className="text-brand-violet text-xs font-semibold tracking-[0.3em] uppercase block mb-3" style={{ fontFamily: 'Space Grotesk' }}>
                ¿Quiénes Somos?
              </span>
              <h2 className="text-white font-bold text-3xl sm:text-4xl leading-tight mb-6" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Tu aliado tech en<br /><span className="gradient-text">Rancagua</span>
              </h2>
              <div className="space-y-4 text-white/60 text-sm leading-relaxed" style={{ fontFamily: 'Inter' }}>
                <p>
                  Somos una tienda local especializada en tecnología, gaming y entretenimiento digital.
                  Nos encontramos en <strong className="text-white/90">Rancagua, Región del Libertador O'Higgins, Chile</strong>,
                  y desde aquí atendemos a clientes de toda la región y el país.
                </p>
                <p>
                  Nuestro equipo está formado por apasionados de los videojuegos y la tecnología
                  que entienden exactamente lo que necesitas. No somos solo una tienda —
                  somos gamers que conocen el producto que venden.
                </p>
                <p>
                  Ofrecemos accesorios gamer, equipos de computación, audio, video,
                  domótica y mucho más, siempre con garantía y respaldo posventa.
                </p>
              </div>

              <div className="flex items-center gap-2 mt-6 text-white/50 text-sm">
                <MapPin size={16} className="text-brand-violet flex-shrink-0" />
                <span style={{ fontFamily: 'Inter' }}>Rancagua, Región del Libertador O'Higgins, Chile</span>
              </div>
            </motion.div>

            {/* Card visual */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="glass rounded-3xl p-8 border border-brand-violet/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-violet/10 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-brand-cyan/10 rounded-full blur-2xl" />

                <Gamepad2 size={48} className="text-brand-violet mb-6 relative z-10" />
                <h3 className="text-white font-bold text-xl mb-4 relative z-10" style={{ fontFamily: 'Space Grotesk' }}>
                  Especialistas en Gaming Digital
                </h3>
                <ul className="space-y-3 relative z-10">
                  {[
                    '🎮 Consolas y controladores',
                    '🖥️  Computación y periféricos',
                    '🎧 Audio y video premium',
                    '🏠 Hogar inteligente',
                    '🕹️  Accesorios y gadgets',
                    '📦 Gabinetes gamer',
                  ].map(item => (
                    <li key={item} className="flex items-center gap-3 text-white/70 text-sm" style={{ fontFamily: 'Inter' }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── VALORES ── */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent via-[#0d0020]/40 to-transparent">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-brand-cyan text-xs font-semibold tracking-[0.3em] uppercase block mb-3" style={{ fontFamily: 'Space Grotesk' }}>
              Lo que nos define
            </span>
            <h2 className="text-white font-bold text-3xl sm:text-5xl" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              Nuestros <span className="gradient-text">Valores</span>
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
          >
            {values.map(({ icon: Icon, title, desc, color }) => (
              <motion.div
                key={title}
                variants={fadeUp}
                whileHover={{ y: -6, boxShadow: `0 0 25px ${color}20` }}
                className="glass rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-all duration-300"
                style={{ borderTop: `1px solid ${color}30` }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${color}15`, border: `1px solid ${color}25` }}
                >
                  <Icon size={22} style={{ color }} />
                </div>
                <h3 className="text-white font-bold text-base mb-2" style={{ fontFamily: 'Space Grotesk' }}>
                  {title}
                </h3>
                <p className="text-white/50 text-xs leading-relaxed" style={{ fontFamily: 'Inter' }}>
                  {desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── RESEÑAS CTA ── */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-10 border border-brand-violet/20 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-violet/5 to-brand-cyan/5 pointer-events-none" />
            <Users size={40} className="text-brand-violet mx-auto mb-4 relative z-10" />
            <h2 className="text-white font-bold text-2xl sm:text-3xl mb-4 relative z-10" style={{ fontFamily: 'Space Grotesk' }}>
              Más de 500 clientes confían en nosotros
            </h2>
            <div className="flex items-center justify-center gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={20} className="text-brand-yellow fill-brand-yellow" />
              ))}
            </div>
            <p className="text-white/50 text-sm mb-8 relative z-10" style={{ fontFamily: 'Inter' }}>
              Únete a la comunidad de gamers y tech lovers que ya nos eligieron en Rancagua.
            </p>
            <motion.a
              href="https://wa.me/56946216579?text=Hola%2C%20me%20interesa%20conocer%20más%20sobre%20sus%20productos"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(124,58,237,0.5)' }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-brand-violet to-brand-cyan text-white font-bold text-sm rounded-full relative z-10"
              style={{ fontFamily: 'Space Grotesk' }}
            >
              Contáctanos por WhatsApp
            </motion.a>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
