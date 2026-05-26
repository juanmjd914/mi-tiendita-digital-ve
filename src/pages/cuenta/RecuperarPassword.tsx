import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Mail, ArrowRight, Loader2, CheckCircle, ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const LOGO_URL = 'https://hhhijebsmajvphazvxlm.supabase.co/storage/v1/object/public/MI%20TIENDITA%20DIGITAL%20VE/logotipo_mi_tiendita_digital_ve-.png'

export default function RecuperarPassword() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [sent,    setSent]    = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/cuenta/nueva-password`,
    })

    if (authError) {
      setError('No se pudo enviar el correo. Verifica el email e intenta de nuevo.')
      setLoading(false)
      return
    }

    setSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24" style={{ background: '#0a0a0f' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-brand-cyan/8 via-transparent to-brand-violet/10 pointer-events-none" />

      <AnimatePresence mode="wait">
        {sent ? (
          /* ── Pantalla de éxito ── */
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center relative z-10 max-w-sm mx-auto"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-brand-violet/15 border border-brand-violet/30 flex items-center justify-center">
              <CheckCircle size={36} className="text-brand-violet" />
            </div>
            <h2 className="text-white font-bold text-2xl mb-3" style={{ fontFamily: 'Space Grotesk' }}>
              ¡Correo enviado!
            </h2>
            <p className="text-white/50 text-sm mb-2 leading-relaxed" style={{ fontFamily: 'Inter' }}>
              Revisa tu bandeja de entrada en
            </p>
            <p className="text-brand-violet font-semibold text-sm mb-6" style={{ fontFamily: 'Inter' }}>
              {email}
            </p>
            <p className="text-white/30 text-xs mb-8 leading-relaxed" style={{ fontFamily: 'Inter' }}>
              Haz clic en el enlace del correo para crear tu nueva contraseña. Si no lo ves, revisa la carpeta de spam.
            </p>
            <Link
              to="/cuenta/login"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-violet to-brand-cyan text-white font-bold text-sm rounded-full"
              style={{ fontFamily: 'Space Grotesk' }}
            >
              Volver al login <ArrowRight size={15} />
            </Link>
          </motion.div>
        ) : (
          /* ── Formulario ── */
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md relative z-10"
          >
            <div className="text-center mb-8">
              <Link to="/">
                <img src={LOGO_URL} alt="Logo" className="w-16 h-16 object-contain mx-auto mb-4" />
              </Link>
              <h1 className="text-white font-bold text-2xl sm:text-3xl" style={{ fontFamily: 'Space Grotesk' }}>
                Recuperar Contraseña
              </h1>
              <p className="text-white/40 text-sm mt-1" style={{ fontFamily: 'Inter' }}>
                Te enviaremos un enlace para restablecer tu contraseña
              </p>
            </div>

            <div className="glass rounded-3xl p-8 border border-brand-violet/20">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-white/50 text-xs block mb-1.5" style={{ fontFamily: 'Space Grotesk' }}>
                    Correo electrónico *
                  </label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); setError(null) }}
                      placeholder="tu@correo.com"
                      required
                      autoFocus
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-brand-violet/60 transition-colors"
                      style={{ fontFamily: 'Inter' }}
                    />
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2"
                  >
                    {error}
                  </motion.p>
                )}

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={!loading ? { scale: 1.02, boxShadow: '0 0 20px rgba(129,215,66,0.3)' } : {}}
                  whileTap={!loading ? { scale: 0.98 } : {}}
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-brand-violet to-brand-cyan text-white font-bold text-sm rounded-xl disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                  style={{ fontFamily: 'Space Grotesk' }}
                >
                  {loading
                    ? <><Loader2 size={16} className="animate-spin" /> Enviando...</>
                    : <>Enviar enlace <ArrowRight size={16} /></>
                  }
                </motion.button>
              </form>

              <div className="border-t border-white/5 mt-6 pt-6 text-center">
                <Link
                  to="/cuenta/login"
                  className="inline-flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors"
                  style={{ fontFamily: 'Inter' }}
                >
                  <ArrowLeft size={14} /> Volver al login
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
