import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const LOGO_URL = 'https://hhhijebsmajvphazvxlm.supabase.co/storage/v1/object/public/MI%20TIENDITA%20DIGITAL%20VE/logotipo_mi_tiendita_digital_ve-.png'

export default function NuevaPassword() {
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)
  const [success,  setSuccess]  = useState(false)
  const [validLink, setValidLink] = useState<boolean | null>(null)

  // Supabase redirige con #access_token en la URL — verificar que llegó la sesión
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setValidLink(!!session)
    })

    // Escuchar el evento PASSWORD_RECOVERY que Supabase dispara al entrar por el link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setValidLink(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }

    setLoading(true)
    setError(null)

    const { error: updateErr } = await supabase.auth.updateUser({ password })

    if (updateErr) {
      setError('No se pudo actualizar la contraseña. El enlace puede haber expirado.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => navigate('/cuenta/login', { replace: true }), 3000)
  }

  // Cargando — esperando verificar el link
  if (validLink === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <div className="w-8 h-8 rounded-full border-2 border-brand-violet border-t-transparent animate-spin" />
      </div>
    )
  }

  // Link inválido o expirado
  if (validLink === false) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#0a0a0f' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-sm"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-400/10 border border-red-400/20 flex items-center justify-center">
            <AlertCircle size={36} className="text-red-400" />
          </div>
          <h2 className="text-white font-bold text-2xl mb-3" style={{ fontFamily: 'Space Grotesk' }}>
            Enlace inválido
          </h2>
          <p className="text-white/50 text-sm mb-8 leading-relaxed" style={{ fontFamily: 'Inter' }}>
            El enlace de recuperación expiró o ya fue usado. Solicita uno nuevo.
          </p>
          <Link
            to="/cuenta/recuperar-password"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-violet to-brand-cyan text-white font-bold text-sm rounded-full"
            style={{ fontFamily: 'Space Grotesk' }}
          >
            Solicitar nuevo enlace <ArrowRight size={15} />
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24" style={{ background: '#0a0a0f' }}>
      <div className="absolute inset-0 bg-gradient-to-br from-brand-violet/10 via-transparent to-brand-cyan/5 pointer-events-none" />

      <AnimatePresence mode="wait">
        {success ? (
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
              ¡Contraseña actualizada!
            </h2>
            <p className="text-white/50 text-sm mb-2 leading-relaxed" style={{ fontFamily: 'Inter' }}>
              Tu contraseña fue cambiada exitosamente.
            </p>
            <p className="text-white/30 text-xs" style={{ fontFamily: 'Inter' }}>
              Redirigiendo al login en unos segundos...
            </p>
          </motion.div>
        ) : (
          /* ── Formulario nueva contraseña ── */
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
                Nueva Contraseña
              </h1>
              <p className="text-white/40 text-sm mt-1" style={{ fontFamily: 'Inter' }}>
                Elige una contraseña segura para tu cuenta
              </p>
            </div>

            <div className="glass rounded-3xl p-8 border border-brand-violet/20">
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nueva contraseña */}
                <div>
                  <label className="text-white/50 text-xs block mb-1.5" style={{ fontFamily: 'Space Grotesk' }}>
                    Nueva contraseña *
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setError(null) }}
                      placeholder="Mínimo 6 caracteres"
                      required
                      autoFocus
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

                {/* Confirmar */}
                <div>
                  <label className="text-white/50 text-xs block mb-1.5" style={{ fontFamily: 'Space Grotesk' }}>
                    Confirmar contraseña *
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={confirm}
                      onChange={e => { setConfirm(e.target.value); setError(null) }}
                      placeholder="Repite tu nueva contraseña"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-white placeholder-white/20 text-sm focus:outline-none focus:border-brand-violet/60 transition-colors"
                      style={{ fontFamily: 'Inter' }}
                    />
                  </div>
                </div>

                {/* Indicador de fortaleza */}
                {password.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {[1,2,3,4].map(i => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{
                            background: password.length >= i * 3
                              ? i <= 1 ? '#ef4444' : i === 2 ? '#ffc222' : i === 3 ? '#06b6d4' : '#81d742'
                              : 'rgba(255,255,255,0.08)'
                          }}
                        />
                      ))}
                    </div>
                    <p className="text-white/25 text-xs" style={{ fontFamily: 'Inter' }}>
                      {password.length < 3 ? 'Muy corta' : password.length < 6 ? 'Débil' : password.length < 9 ? 'Buena' : 'Excelente'}
                    </p>
                  </div>
                )}

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
                    ? <><Loader2 size={16} className="animate-spin" /> Guardando...</>
                    : <>Guardar contraseña <ArrowRight size={16} /></>
                  }
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
