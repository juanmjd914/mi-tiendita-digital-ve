import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { ShoppingCart, Search, User, Menu, X, ChevronDown, LogOut } from 'lucide-react'
import { useCartStore } from '../store/cartStore'
import { useAuthStore } from '../store/authStore'

const LOGO_URL = 'https://hhhijebsmajvphazvxlm.supabase.co/storage/v1/object/public/MI%20TIENDITA%20DIGITAL%20VE/logotipo_mi_tiendita_digital_ve-.png'

// label → valor de categoría en Supabase (mayúsculas)
const tiendaMenu = [
  { label: 'Todos los productos', cat: ''              },
  { label: 'Accesorios',          cat: 'ACCESORIOS'    },
  { label: 'Audio y Video',       cat: 'AUDIO Y VIDEO' },
  { label: 'Computación',         cat: 'COMPUTACION'   },
  { label: 'Hogar',               cat: 'HOGAR'         },
  { label: 'Gabinetes Gamer',     cat: 'GABINETES GAMER'},
]

export default function Navbar() {
  const [scrolled,      setScrolled]     = useState(false)
  const [mobileOpen,    setMobileOpen]   = useState(false)
  const [openDropdown,  setOpenDropdown] = useState<string | null>(null)
  const [showSearch,    setShowSearch]   = useState(false)
  const [searchQuery,   setSearchQuery]  = useState('')
  const { toggleCart, totalItems }       = useCartStore()
  const { user, signOut }               = useAuthStore()
  const { pathname }                     = useLocation()
  const navigate                         = useNavigate()
  const isHome                           = pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    if (!openDropdown) return
    const close = () => setOpenDropdown(null)
    window.addEventListener('click', close)
    return () => window.removeEventListener('click', close)
  }, [openDropdown])

  // Cerrar búsqueda con Escape
  useEffect(() => {
    if (!showSearch) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeSearch() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showSearch])

  function closeSearch() {
    setShowSearch(false)
    setSearchQuery('')
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    closeSearch()
    navigate(`/tienda?search=${encodeURIComponent(searchQuery.trim())}`)
  }

  const isDark = !isHome || scrolled

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
        animate={{
          backgroundColor: isDark ? 'rgba(10,10,15,0.92)' : 'rgba(0,0,0,0)',
          backdropFilter:   isDark ? 'blur(20px)' : 'blur(0px)',
        }}
        style={{ borderBottom: isDark ? '1px solid rgba(124,58,237,0.15)' : 'none' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">

            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <img src={LOGO_URL} alt="Mi Tiendita Digital Ve" className="h-14 w-14 object-contain" />
              <span className="hidden sm:block text-white font-bold text-sm leading-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                Mi Tiendita<br /><span className="text-brand-violet">Digital Ve</span>
              </span>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center gap-1">
              <NavLink to="/">Inicio</NavLink>
              <NavLink to="/tienda">Tienda</NavLink>

              {/* Dropdown categorías */}
              <div className="relative" onClick={e => e.stopPropagation()}>
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'tienda' ? null : 'tienda')}
                  className="flex items-center gap-1 px-2 py-2 text-white/50 hover:text-white text-sm font-medium transition-colors rounded-lg hover:bg-white/5"
                  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                  title="Categorías"
                >
                  <motion.span animate={{ rotate: openDropdown === 'tienda' ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown size={14} />
                  </motion.span>
                </button>
                <AnimatePresence>
                  {openDropdown === 'tienda' && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 mt-2 w-52 glass rounded-xl p-2 border border-brand-violet/20 shadow-xl"
                    >
                      {tiendaMenu.map(({ label, cat }) => (
                        <Link
                          key={label}
                          to={cat ? `/tienda?cat=${encodeURIComponent(cat)}` : '/tienda'}
                          onClick={() => setOpenDropdown(null)}
                          className="block px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-brand-violet/10 rounded-lg transition-all"
                          style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                        >
                          {label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <NavLink to="/nosotros">Nosotros</NavLink>
              <NavLink to="/soporte">Soporte</NavLink>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 lg:gap-3">
              <motion.button
                onClick={() => setShowSearch(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 text-white/60 hover:text-white transition-colors hidden sm:flex"
                title="Buscar productos"
              >
                <Search size={18} />
              </motion.button>

              {/* ── Icono de usuario inteligente ── */}
              {user ? (
                <div className="relative hidden sm:block" onClick={e => e.stopPropagation()}>
                  <motion.button
                    onClick={() => setOpenDropdown(openDropdown === 'user' ? null : 'user')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-black text-sm"
                    style={{ background: 'linear-gradient(135deg, #81d742, #06b6d4)', fontFamily: 'Space Grotesk' }}
                    title={user.user_metadata?.full_name || user.email || 'Mi Cuenta'}
                  >
                    {(user.user_metadata?.full_name?.[0] || user.email?.[0] || 'U').toUpperCase()}
                  </motion.button>

                  <AnimatePresence>
                    {openDropdown === 'user' && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-44 glass rounded-xl p-2 border border-brand-violet/20 shadow-xl z-50"
                      >
                        <p className="px-3 py-1.5 text-white/30 text-xs truncate border-b border-white/5 mb-1">
                          {user.email}
                        </p>
                        <Link
                          to="/cuenta"
                          onClick={() => setOpenDropdown(null)}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-brand-violet/10 rounded-lg transition-all"
                          style={{ fontFamily: 'Space Grotesk' }}
                        >
                          <User size={13} /> Mi Cuenta
                        </Link>
                        <button
                          onClick={() => { signOut(); setOpenDropdown(null) }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400/70 hover:text-red-400 hover:bg-red-400/5 rounded-lg transition-all"
                          style={{ fontFamily: 'Space Grotesk' }}
                        >
                          <LogOut size={13} /> Cerrar sesión
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  to="/cuenta/login"
                  className="p-2 text-white/60 hover:text-white transition-colors hidden sm:flex"
                  title="Iniciar sesión"
                >
                  <User size={18} />
                </Link>
              )}
              <motion.button
                onClick={toggleCart}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative p-2 text-white/80 hover:text-white transition-colors"
              >
                <ShoppingCart size={20} />
                {totalItems() > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-brand-violet text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                  >
                    {totalItems()}
                  </motion.span>
                )}
              </motion.button>
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 text-white/80 hover:text-white"
              >
                <Menu size={22} />
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ── Search Overlay ── */}
      <AnimatePresence>
        {showSearch && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSearch}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            />

            {/* Barra de búsqueda */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 pb-4"
              style={{ background: 'rgba(10,10,15,0.97)', borderBottom: '1px solid rgba(129,215,66,0.2)' }}
            >
              <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSearch} className="flex items-center gap-3">
                  <Search size={20} className="text-brand-violet flex-shrink-0" />
                  <input
                    autoFocus
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Buscar productos..."
                    className="flex-1 bg-transparent text-white text-lg placeholder-white/25 focus:outline-none"
                    style={{ fontFamily: 'Space Grotesk' }}
                  />
                  {searchQuery && (
                    <motion.button
                      type="submit"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-violet text-white text-sm font-bold rounded-xl flex-shrink-0"
                      style={{ fontFamily: 'Space Grotesk' }}
                    >
                      Buscar
                    </motion.button>
                  )}
                  <button
                    type="button"
                    onClick={closeSearch}
                    className="p-1.5 text-white/40 hover:text-white transition-colors flex-shrink-0"
                  >
                    <X size={20} />
                  </button>
                </form>
                <p className="text-white/20 text-xs mt-2 ml-8" style={{ fontFamily: 'Inter' }}>
                  Presiona <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white/40">Enter</kbd> para buscar · <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white/40">Esc</kbd> para cerrar
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/70 z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 32 }}
              className="fixed right-0 top-0 h-full w-72 bg-[#0f0f1a] border-l border-brand-violet/20 z-50 lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-white/5">
                <img src={LOGO_URL} alt="logo" className="h-8 w-8 object-contain" />
                <button onClick={() => setMobileOpen(false)} className="text-white/60 hover:text-white">
                  <X size={22} />
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto p-4 space-y-1">
                {[
                  { label: 'Inicio',    to: '/'          },
                  { label: 'Tienda',    to: '/tienda'    },
                  { label: 'Nosotros',  to: '/nosotros'  },
                  { label: 'Soporte',   to: '/soporte'   },
                  ...(user ? [{ label: 'Mi Cuenta', to: '/cuenta' }] : [{ label: 'Iniciar Sesión', to: '/cuenta/login' }]),
                ].map(({ label, to }) => (
                  <Link
                    key={label}
                    to={to}
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-3 text-white/70 hover:text-white hover:bg-brand-violet/10 rounded-xl transition-all font-medium"
                    style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                  >
                    {label}
                  </Link>
                ))}

                {/* Sub-categorías de tienda */}
                <div className="border-t border-white/5 mt-4 pt-4">
                  <p className="text-white/30 text-xs px-4 mb-2 uppercase tracking-wider" style={{ fontFamily: 'Space Grotesk' }}>
                    Categorías
                  </p>
                  {tiendaMenu.map(({ label, cat }) => (
                    <Link
                      key={label}
                      to={cat ? `/tienda?cat=${encodeURIComponent(cat)}` : '/tienda'}
                      onClick={() => setMobileOpen(false)}
                      className="block px-4 py-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg text-sm transition-all"
                      style={{ fontFamily: 'Space Grotesk, sans-serif' }}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="px-3 py-2 text-white/70 hover:text-white text-sm font-medium transition-colors rounded-lg hover:bg-white/5"
      style={{ fontFamily: 'Space Grotesk, sans-serif' }}
    >
      {children}
    </Link>
  )
}
