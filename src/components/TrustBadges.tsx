import { motion } from 'motion/react'
import { CreditCard, Truck, Headphones, Package } from 'lucide-react'

const badges = [
  { icon: CreditCard, title: 'Medios de Pago',     desc: 'Efectivo, Transferencias y Webpay',     color: '#81d742' },
  { icon: Truck,      title: 'Envíos Rápidos',     desc: 'En Rancagua y todo Chile',               color: '#06b6d4' },
  { icon: Headphones, title: 'Soporte 24/7',       desc: 'Atención por WhatsApp y chat',            color: '#ffc222' },
  { icon: Package,    title: 'Envíos Nacionales',  desc: 'A todo Chile por BlueExpress',             color: '#f27d26' },
]

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}
const item = {
  hidden: { opacity: 0, y: 30 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function TrustBadges() {
  return (
    <section className="relative z-10 -mt-16 px-4 pb-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.3 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
        >
          {badges.map(({ icon: Icon, title, desc, color }) => (
            <motion.div
              key={title}
              variants={item}
              whileHover={{ y: -4, boxShadow: `0 0 20px ${color}33` }}
              className="glass rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3 border transition-all duration-300 cursor-default"
              style={{ borderColor: `${color}20` }}
            >
              <div
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${color}1a`, border: `1px solid ${color}30` }}
              >
                <Icon size={18} style={{ color }} />
              </div>
              <div>
                <p className="text-white font-semibold text-sm leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {title}
                </p>
                <p className="text-white/40 text-xs mt-0.5 leading-tight">{desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
