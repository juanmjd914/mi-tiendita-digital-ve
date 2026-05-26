import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { useSEO } from '../hooks/useSEO'
import { MessageCircle, Mail, Clock, ChevronDown, HelpCircle, Package, CreditCard, RefreshCw, Headphones } from 'lucide-react'

const WHATSAPP = '56946216579'

const faqs = [
  {
    category: 'Envíos y Entregas',
    icon: Package,
    color: '#06b6d4',
    questions: [
      {
        q: '¿Hacen envíos fuera de Rancagua?',
        a: 'Sí, realizamos envíos a todo Chile a través de BlueExpress. Para productos físicos, el plazo de entrega es de 2 a 5 días hábiles dependiendo de tu región.',
      },
      {
        q: '¿Cuánto cuesta el envío?',
        a: 'Para productos físicos el costo depende del peso y destino. Los despachos se realizan con pago en destino a través de BlueExpress. En Rancagua ofrecemos delivery gratis en compras superiores a $30.000 CLP; si el monto es inferior, el costo de delivery es de $3.000 CLP. También ofrecemos retiro en tienda sin costo.',
      },
      {
        q: '¿Puedo retirar mi compra en la tienda?',
        a: 'Sí, puedes retirar directamente en nuestra tienda en Rancagua. Te avisamos cuando tu pedido esté listo. Coordina el horario con nosotros por WhatsApp.',
      },
    ],
  },
  {
    category: 'Pagos',
    icon: CreditCard,
    color: '#ffc222',
    questions: [
      {
        q: '¿Qué medios de pago aceptan?',
        a: 'Aceptamos efectivo, transferencias bancarias y Webpay. Elige el método que más te acomode al momento de finalizar tu compra.',
      },
      {
        q: '¿Es seguro comprar con ustedes?',
        a: 'Totalmente. Llevamos años operando en Rancagua con cientos de clientes satisfechos. Todas nuestras transacciones son seguras y siempre recibes lo que compraste.',
      },
      {
        q: '¿Puedo pagar en cuotas?',
        a: 'Sí, ofrecemos pago en cuotas sin interés a través de Transbank con tarjetas de crédito participantes. Consulta las condiciones disponibles al momento de tu compra.',
      },
    ],
  },
  {
    category: 'Devoluciones',
    icon: RefreshCw,
    color: '#f27d26',
    questions: [
      {
        q: '¿Cuál es la política de devoluciones?',
        a: 'Para productos con defecto de fábrica, aceptamos devoluciones dentro de los primeros 7 días. Revisamos cada caso y buscamos la solución más rápida para ti.',
      },
    ],
  },
]

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4"
      >
        <span className="text-white/80 text-sm font-medium leading-snug flex-1" style={{ fontFamily: 'Space Grotesk' }}>
          {q}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
          <ChevronDown size={16} className="text-white/30" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="text-white/50 text-sm leading-relaxed pb-4" style={{ fontFamily: 'Inter' }}>
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6 } },
}

export default function Soporte() {
  useSEO({ title: 'Soporte', description: 'Centro de ayuda y soporte de Mi Tiendita Digital Ve. Resuelve tus dudas sobre productos, envíos y pagos.' })

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0f' }}>
      {/* ── HERO ── */}
      <section className="relative pt-32 pb-16 px-4 overflow-hidden text-center">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/10 via-transparent to-brand-violet/10 pointer-events-none" />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="inline-flex items-center justify-center w-16 h-16 glass-violet rounded-2xl border border-brand-violet/30 mb-6 mx-auto">
            <Headphones size={28} className="text-brand-violet" />
          </div>
          <span className="block text-brand-cyan text-xs font-semibold tracking-[0.3em] uppercase mb-3" style={{ fontFamily: 'Space Grotesk' }}>
            Centro de Ayuda
          </span>
          <h1 className="text-4xl sm:text-6xl font-bold text-white leading-tight mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.02em' }}>
            ¿En qué podemos<br /><span className="gradient-text">ayudarte?</span>
          </h1>
          <p className="text-white/50 text-sm sm:text-base max-w-xl mx-auto" style={{ fontFamily: 'Inter' }}>
            Encuentra respuestas rápidas en nuestro FAQ o contáctanos directamente. Estamos disponibles para ti.
          </p>
        </motion.div>
      </section>

      {/* ── CONTACTO RÁPIDO ── */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {/* WhatsApp */}
            <motion.a
              variants={fadeUp}
              href={`https://wa.me/${WHATSAPP}?text=Hola%2C%20necesito%20ayuda%20con%20mi%20compra`}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ y: -4, boxShadow: '0 0 25px rgba(37,211,102,0.2)' }}
              className="glass rounded-2xl p-5 border border-green-500/20 hover:border-green-500/40 flex flex-col items-center text-center gap-3 transition-all"
            >
              <div className="w-12 h-12 bg-green-500/15 rounded-xl flex items-center justify-center border border-green-500/20">
                <MessageCircle size={22} className="text-green-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm" style={{ fontFamily: 'Space Grotesk' }}>WhatsApp</p>
                <p className="text-green-400 font-bold text-base mt-0.5">+56 9 4621 6579</p>
                <p className="text-white/30 text-xs mt-1">Respuesta inmediata</p>
              </div>
            </motion.a>

            {/* Email */}
            <motion.a
              variants={fadeUp}
              href="mailto:soporte@mitienditadigitalve.com"
              whileHover={{ y: -4, boxShadow: '0 0 25px rgba(124,58,237,0.2)' }}
              className="glass rounded-2xl p-5 border border-brand-violet/20 hover:border-brand-violet/40 flex flex-col items-center text-center gap-3 transition-all"
            >
              <div className="w-12 h-12 bg-brand-violet/15 rounded-xl flex items-center justify-center border border-brand-violet/20">
                <Mail size={22} className="text-brand-violet" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm" style={{ fontFamily: 'Space Grotesk' }}>Correo Electrónico</p>
                <p className="text-brand-violet text-sm font-medium mt-0.5 break-all">soporte@mitienditadigitalve.com</p>
                <p className="text-white/30 text-xs mt-1">Respuesta en 24 hrs</p>
              </div>
            </motion.a>

            {/* Horario */}
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -4 }}
              className="glass rounded-2xl p-5 border border-brand-cyan/20 flex flex-col items-center text-center gap-3 transition-all"
            >
              <div className="w-12 h-12 bg-brand-cyan/15 rounded-xl flex items-center justify-center border border-brand-cyan/20">
                <Clock size={22} className="text-brand-cyan" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm" style={{ fontFamily: 'Space Grotesk' }}>Horario de Atención</p>
                <p className="text-white/70 text-xs mt-1 leading-relaxed">
                  Lun — Vie: 10:00 — 20:00<br />
                  Sáb: 10:00 — 18:00<br />
                  <span className="text-brand-cyan">Digital 24/7</span>
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 glass-violet px-4 py-2 rounded-full border border-brand-violet/30 mb-4">
              <HelpCircle size={14} className="text-brand-violet" />
              <span className="text-brand-violet text-xs font-semibold tracking-widest uppercase" style={{ fontFamily: 'Space Grotesk' }}>
                Preguntas Frecuentes
              </span>
            </div>
            <h2 className="text-white font-bold text-3xl sm:text-4xl" style={{ fontFamily: 'Space Grotesk' }}>
              Resolvemos tus <span className="gradient-text">dudas</span>
            </h2>
          </motion.div>

          <div className="space-y-4">
            {faqs.map(({ category, icon: Icon, color, questions }, i) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass rounded-2xl border border-white/5 overflow-hidden"
                style={{ borderTop: `1px solid ${color}30` }}
              >
                {/* Header categoría */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}18`, border: `1px solid ${color}25` }}
                  >
                    <Icon size={15} style={{ color }} />
                  </div>
                  <h3 className="text-white font-semibold text-sm" style={{ fontFamily: 'Space Grotesk' }}>
                    {category}
                  </h3>
                </div>
                {/* Preguntas */}
                <div className="px-5">
                  {questions.map(({ q, a }) => (
                    <FAQItem key={q} q={q} a={a} />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-8 sm:p-10 border border-brand-violet/20 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-violet/5 to-brand-cyan/5 pointer-events-none" />
            <MessageCircle size={36} className="text-green-400 mx-auto mb-4 relative z-10" />
            <h2 className="text-white font-bold text-xl sm:text-2xl mb-3 relative z-10" style={{ fontFamily: 'Space Grotesk' }}>
              ¿No encontraste lo que buscabas?
            </h2>
            <p className="text-white/50 text-sm mb-6 relative z-10" style={{ fontFamily: 'Inter' }}>
              Nuestro equipo responde en minutos por WhatsApp. No dejes tu consulta sin respuesta.
            </p>
            <motion.a
              href={`https://wa.me/${WHATSAPP}?text=Hola%2C%20tengo%20una%20consulta%20sobre`}
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.04, boxShadow: '0 0 30px rgba(37,211,102,0.4)' }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-400 text-white font-bold text-sm rounded-full transition-all relative z-10"
              style={{ fontFamily: 'Space Grotesk' }}
            >
              <MessageCircle size={16} />
              Escribir por WhatsApp
            </motion.a>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
