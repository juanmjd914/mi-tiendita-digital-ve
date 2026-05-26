import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAuthStore } from '../../store/authStore'

const LOGO_URL = 'https://hhhijebsmajvphazvxlm.supabase.co/storage/v1/object/public/MI%20TIENDITA%20DIGITAL%20VE/logotipo_mi_tiendita_digital_ve-.png'

export default function Login() {
  const navigate   = useNavigate()
  const { user }   = useAuthStore()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  // Si ya está logueado, redirigir
  useEffect(() => {
    if (user) navigate('/cuenta', { replace: true })
  }, [user, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      const msg = authError.message
      setError(
        msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')
          ? 'Email o contraseña incorrectos'
          : msg.includes('Email not confirmed') || msg.includes('email_not_confirmed')
          ? 'Debes confirmar tu email antes de ingresar. Revisa tu bandeja de entrada (o spam) y haz clic en el enlace de confirmación.'
          : msg.includes('Too many requests') || msg.includes('over_email_send_rate_limit')
          ? 'Demasiados intentos. Espera unos minutos e intenta de nuevo.'
          : 'Error al iniciar sesión. Intenta de nuevo.'
      )
      setLoading(false)
      return
    }

    navigate('/cuenta', { replace: true })
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24" style={{ background: '#0a0a0f' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-brand-violet/10 via-transparent to-brand-cyan/5 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/">
            <img src={LOGO_URL} alt="Logo" className="w-16 h-16 object-contain mx-auto mb-4" />
          </Link>
          <h1 className="text-white font-bold text-2xl sm:text-3xl" style={{ fontFamily: 'Space Grotesk' }}>
            Iniciar Sesión
          </h1>
          <p className="text-white/40 text-sm mt-1" style={{ fontFamily: 'Inter' }}>
            Bienvenido de vuelta a Mi Tiendita Digital Ve
          </p>
        </div>

        <div className="glass rounded-3xl p-8 border border-brand-violet/20">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
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
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-brand-violet/60 transition-colors"
                  style={{ fontFamily: 'Inter' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-white/50 text-xs block mb-1.5" style={{ fontFamily: 'Space Grotesk' }}>
                Contraseña *
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setError(null) }}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-10 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-brand-violet/60 transition-colors"
                  style={{ fontFamily: 'Inter' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02, boxShadow: '0 0 20px rgba(129,215,66,0.3)' } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-brand-violet to-brand-cyan text-white font-bold text-sm rounded-xl disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{ fontFamily: 'Space Grotesk' }}
            >
              {loading
                ? <><Loader2 size={16} className="animate-spin" /> Ingresando...</>
                : <>Ingresar <ArrowRight size={16} /></>
              }
            </motion.button>
          </form>

          <div className="border-t border-white/5 mt-6 pt-6 space-y-3 text-center">
            <p className="text-white/40 text-sm" style={{ fontFamily: 'Inter' }}>
              <Link
                to="/cuenta/recuperar-password"
                className="text-white/40 hover:text-brand-violet transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </p>
            <p className="text-white/40 text-sm" style={{ fontFamily: 'Inter' }}>
              ¿No tienes cuenta?{' '}
              <Link
                to="/cuenta/registro"
                className="text-brand-violet hover:text-brand-cyan transition-colors font-semibold"
              >
                Regístrate gratis
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
