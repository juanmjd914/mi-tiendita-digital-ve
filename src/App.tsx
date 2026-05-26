import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Navbar          from './components/Navbar'
import CartDrawer      from './components/CartDrawer'
import WhatsAppButton  from './components/WhatsAppButton'
import ScrollToTop     from './components/ScrollToTop'
import ProtectedRoute  from './components/ProtectedRoute'
import HeroSection     from './components/HeroSection'
import TrustBadges     from './components/TrustBadges'
import ProductsSection from './components/ProductsSection'
import CategoriesGrid  from './components/CategoriesGrid'
import OffersSection   from './components/OffersSection'
import BestSellers     from './components/BestSellers'
import Newsletter      from './components/Newsletter'
import Testimonials    from './components/Testimonials'
import Footer          from './components/Footer'
import Nosotros        from './pages/Nosotros'
import Soporte         from './pages/Soporte'
import Tienda          from './pages/Tienda'
import PagoResultado   from './pages/PagoResultado'
import Login              from './pages/cuenta/Login'
import Registro           from './pages/cuenta/Registro'
import MiCuenta           from './pages/cuenta/MiCuenta'
import RecuperarPassword  from './pages/cuenta/RecuperarPassword'
import NuevaPassword      from './pages/cuenta/NuevaPassword'
import PoliticaPrivacidad from './pages/PoliticaPrivacidad'
import Admin              from './pages/Admin'
import { supabase }    from './lib/supabase'
import { useAuthStore } from './store/authStore'

function Home() {
  return (
    <main className="bg-deep-black min-h-screen">
      <HeroSection />
      <TrustBadges />
      <ProductsSection />
      <CategoriesGrid />
      <OffersSection />
      <BestSellers />
      <Newsletter />
      <Testimonials />
      <Footer />
    </main>
  )
}

function PageLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-deep-black pt-20">
      {children}
      <Footer />
    </div>
  )
}

function ComingSoon({ title }: { title: string }) {
  return (
    <PageLayout>
      <div className="flex flex-col items-center justify-center py-32 px-4 text-center">
        <p className="text-brand-violet text-xs tracking-widest uppercase mb-3" style={{ fontFamily: 'Space Grotesk' }}>Próximamente</p>
        <h1 className="text-white font-bold text-4xl sm:text-6xl mb-4" style={{ fontFamily: 'Space Grotesk' }}>{title}</h1>
        <p className="text-white/40 text-sm">Esta sección estará disponible muy pronto.</p>
      </div>
    </PageLayout>
  )
}

// Navbar/Cart/WhatsApp solo aparecen fuera del panel admin
function SiteShell() {
  const { pathname } = useLocation()
  if (pathname.toLowerCase().startsWith('/admin')) return null
  return (
    <>
      <Navbar />
      <CartDrawer />
      <WhatsAppButton />
    </>
  )
}

export default function App() {
  const { setSession, setInitialized } = useAuthStore()

  // Inicializar listener de Supabase Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setInitialized()
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [setSession, setInitialized])

  return (
    <BrowserRouter>
      {/* Filtro SVG para efecto ondas-textured */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
        <defs>
          <filter id="rough-edges">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" />
          </filter>
        </defs>
      </svg>

      <ScrollToTop />
      <SiteShell />

      <Routes>
        <Route path="/"               element={<Home />} />
        <Route path="/nosotros"       element={<PageLayout><Nosotros /></PageLayout>} />
        <Route path="/soporte"        element={<PageLayout><Soporte /></PageLayout>} />
        <Route path="/tienda"         element={<PageLayout><Tienda /></PageLayout>} />
        <Route path="/pago/resultado" element={<PageLayout><PagoResultado /></PageLayout>} />
        <Route path="/cuenta"         element={<PageLayout><ProtectedRoute><MiCuenta /></ProtectedRoute></PageLayout>} />
        <Route path="/cuenta/login"   element={<Login />} />
        <Route path="/cuenta/registro"          element={<Registro />} />
        <Route path="/cuenta/recuperar-password" element={<RecuperarPassword />} />
        <Route path="/cuenta/nueva-password"        element={<NuevaPassword />} />
        <Route path="/politica-de-privacidad"    element={<PageLayout><PoliticaPrivacidad /></PageLayout>} />
        <Route path="/admin"                     element={<Admin />} />
        <Route path="/ADMIN"                     element={<Navigate to="/admin" replace />} />
        <Route path="*"               element={<ComingSoon title="Página no encontrada" />} />
      </Routes>
    </BrowserRouter>
  )
}
