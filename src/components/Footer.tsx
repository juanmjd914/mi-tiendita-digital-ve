import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { MessageCircle, ExternalLink } from 'lucide-react'

const LOGO_URL = 'https://hhhijebsmajvphazvxlm.supabase.co/storage/v1/object/public/MI%20TIENDITA%20DIGITAL%20VE/logotipo_mi_tiendita_digital_ve-.png'
const WHATSAPP_NUMBER = '56946216579'

// ── SVG iconos de redes sociales ───────────────────────────────
const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
)

const FacebookIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
)

const XIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
)

const TikTokIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.53V6.75a4.85 4.85 0 01-1.02-.06z"/>
  </svg>
)

export default function Footer() {
  const socialLinks = [
    { icon: <InstagramIcon />, href: 'https://www.instagram.com/mitienditadigitalve/?hl=es-la', label: 'Instagram', color: '#e1306c' },
    { icon: <FacebookIcon />,  href: 'https://www.facebook.com/juan.mejias.925059',              label: 'Facebook',  color: '#1877f2' },
    { icon: <XIcon />,         href: 'https://twitter.com/tiendita_ve',                          label: 'X',         color: '#e7e9ea' },
    { icon: <TikTokIcon />,    href: 'https://www.tiktok.com/@mitienditadigitalve',              label: 'TikTok',    color: '#ff0050' },
  ]

  return (
    <footer className="relative pt-16 pb-8 px-4 border-t border-white/5">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 sm:gap-8 mb-12">

          {/* Col 1: Logo + tagline + contacto */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={LOGO_URL} alt="Mi Tiendita Digital Ve" className="h-12 w-12 object-contain" />
              <div>
                <p className="text-white font-bold text-sm leading-tight" style={{ fontFamily: 'Space Grotesk' }}>Mi Tiendita</p>
                <p className="text-brand-violet font-bold text-sm" style={{ fontFamily: 'Space Grotesk' }}>Digital Ve</p>
              </div>
            </div>
            <p className="text-white/40 text-sm leading-relaxed mb-5">
              Tu tienda de tecnología gamer de confianza en Rancagua. Accesorios, computación y mucho más.
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 text-green-400 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
              style={{ fontFamily: 'Space Grotesk' }}
            >
              <MessageCircle size={15} />
              WhatsApp
              <ExternalLink size={12} className="opacity-60" />
            </a>

            {/* Social icons */}
            <div className="flex items-center gap-3 mt-5">
              {socialLinks.map(({ icon, href, label, color }) => (
                <motion.a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  whileHover={{ scale: 1.15, boxShadow: `0 0 15px ${color}50` }}
                  whileTap={{ scale: 0.95 }}
                  className="w-9 h-9 glass rounded-xl flex items-center justify-center border border-white/5 transition-all hover:border-white/20"
                  style={{ color }}
                >
                  {icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Col 2: Links rápidos */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-5 uppercase tracking-widest" style={{ fontFamily: 'Space Grotesk' }}>
              Links Rápidos
            </h4>
            <ul className="space-y-3">
              {['Inicio', 'Tienda', 'Nosotros', 'Soporte'].map(item => (
                <li key={item}>
                  <Link
                    to={item === 'Inicio' ? '/' : `/${item.toLowerCase()}`}
                    className="text-white/40 hover:text-brand-violet text-sm transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-2 h-px bg-brand-violet transition-all duration-300" />
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Categorías */}
          <div>
            <h4 className="text-white font-semibold text-sm mb-5 uppercase tracking-widest" style={{ fontFamily: 'Space Grotesk' }}>
              Categorías
            </h4>
            <ul className="space-y-3">
              {[
                { label: 'Accesorios',      cat: 'ACCESORIOS'     },
                { label: 'Audio y Video',   cat: 'AUDIO Y VIDEO'  },
                { label: 'Computación',     cat: 'COMPUTACION'    },
                { label: 'Hogar',           cat: 'HOGAR'          },
                { label: 'Gabinetes Gamer', cat: 'GABINETES GAMER'},
              ].map(({ label, cat }) => (
                <li key={label}>
                  <Link
                    to={`/tienda?cat=${encodeURIComponent(cat)}`}
                    className="text-white/40 hover:text-brand-cyan text-sm transition-colors flex items-center gap-2 group"
                  >
                    <span className="w-0 group-hover:w-2 h-px bg-brand-cyan transition-all duration-300" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-6 flex flex-col items-center gap-2 text-center pb-4">
          <p className="text-white/25 text-xs" style={{ fontFamily: 'Inter' }}>
            © Mi Tiendita Digital Ve 2026 · Todos los derechos reservados
          </p>
          <a
            href="/politica-de-privacidad"
            className="text-white/20 hover:text-white/50 text-xs transition-colors"
            style={{ fontFamily: 'Inter' }}
          >
            Política de Privacidad
          </a>
          <p className="text-white/25 text-xs">
            Desarrollado por{' '}
            <a
              href="https://technecreativ.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-violet/60 hover:text-brand-violet transition-colors"
            >
              Techne Creativ
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
