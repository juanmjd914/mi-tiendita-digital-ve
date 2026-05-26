import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Mail, CheckCircle, ArrowRight, Loader2 } from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function Newsletter() {
  const [email,      setEmail]      = useState('')
  const [subscribed, setSubscribed] = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@')) { setError('Ingresa un email válido'); return }
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${API_URL}/api/newsletter`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al suscribir')
      setSubscribed(true)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al suscribir'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="py-20 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-animated-gradient opacity-80" />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-purple/30 via-brand-violet/20 to-brand-cyan/10" />
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-brand-violet/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-64 h-64 bg-brand-cyan/10 rounded-full blur-3xl" />

      <div className="max-w-2xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="inline-flex items-center justify-center w-14 h-14 glass-violet rounded-2xl border border-brand-violet/30 mb-6 mx-auto">
            <Mail size={24} className="text-brand-violet" />
          </div>

          <h2 className="text-white font-black text-3xl sm:text-5xl leading-tight mb-4" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            📨 ¡Suscríbete y recibe<br />las <span className="gradient-text">mejores ofertas!</span>
          </h2>
          <p className="text-white/50 text-sm sm:text-base mb-8">
            Ofertas exclusivas, lanzamientos y novedades primero que nadie
          </p>

          <AnimatePresence mode="wait">
            {subscribed ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-3"
              >
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }}>
                  <CheckCircle size={48} className="text-green-400" />
                </motion.div>
                <p className="text-white font-bold text-lg" style={{ fontFamily: 'Space Grotesk' }}>
                  ¡Gracias! Ya eres parte de la comunidad 🎮
                </p>
                <p className="text-white/50 text-sm">Pronto recibirás las mejores ofertas en tu correo</p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                className="flex flex-col gap-3 max-w-md mx-auto"
              >
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(null) }}
                    placeholder="tu@correo.com"
                    required
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/30 text-sm focus:outline-none focus:border-brand-violet/60 transition-colors"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  />
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={!loading ? { scale: 1.04, boxShadow: '0 0 25px rgba(129,215,66,0.4)' } : {}}
                    whileTap={!loading ? { scale: 0.96 } : {}}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-brand-violet to-brand-cyan text-white font-bold text-sm rounded-xl whitespace-nowrap disabled:opacity-70"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                  >
                    {loading
                      ? <Loader2 size={16} className="animate-spin" />
                      : <><span>Suscribirme</span> <ArrowRight size={14} /></>
                    }
                  </motion.button>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-400 text-xs text-center"
                  >
                    {error}
                  </motion.p>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  )
}
