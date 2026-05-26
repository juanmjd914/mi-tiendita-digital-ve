import { motion } from 'motion/react'
import { useSEO } from '../hooks/useSEO'
import { Shield } from 'lucide-react'

const LAST_UPDATE = '26 de mayo de 2026'

const sections = [
  {
    title: '1. Responsable del tratamiento',
    content: `Mi Tiendita Digital Ve, con dominio mitienditadigitalve.com, es responsable del tratamiento de los datos personales recopilados a través de este sitio web. Puedes contactarnos en soporte@mitienditadigitalve.com o por WhatsApp al +56 9 4621 6579.`,
  },
  {
    title: '2. Datos que recopilamos',
    content: `Recopilamos los siguientes datos cuando interactúas con nuestro sitio:
• Datos de registro: nombre completo, correo electrónico y contraseña (encriptada) cuando creas una cuenta.
• Datos de compra: nombre, correo electrónico y dirección de despacho para procesar pedidos.
• Datos de navegación: cookies técnicas necesarias para el funcionamiento del sitio.
• Suscripción al newsletter: correo electrónico si te suscribes voluntariamente.`,
  },
  {
    title: '3. Finalidad del tratamiento',
    content: `Utilizamos tus datos para:
• Gestionar tu cuenta y pedidos.
• Procesar pagos de forma segura a través de Flow Chile.
• Enviarte confirmaciones de compra y novedades (solo si te suscribiste).
• Mejorar la experiencia de uso del sitio.
• Cumplir con obligaciones legales y fiscales.`,
  },
  {
    title: '4. Base legal',
    content: `El tratamiento de tus datos se basa en:
• La ejecución del contrato de compraventa cuando realizas un pedido.
• Tu consentimiento cuando creas una cuenta o te suscribes al newsletter.
• El cumplimiento de obligaciones legales aplicables en Chile.`,
  },
  {
    title: '5. Seguridad de los datos',
    content: `Implementamos medidas técnicas y organizativas para proteger tus datos, incluyendo cifrado SSL/TLS en todas las comunicaciones, almacenamiento seguro en Supabase y acceso restringido solo al personal autorizado. Los pagos son procesados directamente por Flow Chile y no almacenamos datos de tarjetas de crédito.`,
  },
  {
    title: '6. Conservación de los datos',
    content: `Conservamos tus datos mientras mantengas una cuenta activa con nosotros. Los datos de pedidos se conservan por el tiempo exigido por la legislación tributaria chilena (generalmente 6 años). Puedes solicitar la eliminación de tu cuenta en cualquier momento.`,
  },
  {
    title: '7. Compartición de datos',
    content: `No vendemos ni cedemos tus datos a terceros con fines comerciales. Compartimos datos únicamente con:
• Flow Chile: para procesar pagos.
• Supabase Inc.: proveedor de base de datos y autenticación.
• Empresas de transporte: nombre y dirección para despachos (solo cuando aplica).`,
  },
  {
    title: '8. Tus derechos',
    content: `De acuerdo con la Ley N° 19.628 de Protección de Datos Personales de Chile, tienes derecho a:
• Acceder a tus datos personales.
• Rectificar datos incorrectos.
• Cancelar o eliminar tus datos.
• Oponerte al tratamiento de tus datos.

Para ejercer estos derechos, contáctanos en soporte@mitienditadigitalve.com.`,
  },
  {
    title: '9. Cookies',
    content: `Utilizamos cookies técnicas estrictamente necesarias para el funcionamiento del sitio (gestión de sesión y carrito). No utilizamos cookies de seguimiento ni publicidad de terceros sin tu consentimiento.`,
  },
  {
    title: '10. Cambios en esta política',
    content: `Podemos actualizar esta política de privacidad ocasionalmente. Te notificaremos de cambios significativos publicando la nueva versión en esta página con la fecha de actualización. Te recomendamos revisar esta página periódicamente.`,
  },
]

export default function PoliticaPrivacidad() {
  useSEO({
    title: 'Política de Privacidad',
    description: 'Política de privacidad y tratamiento de datos personales de Mi Tiendita Digital Ve.',
  })

  return (
    <div className="min-h-screen pb-20" style={{ background: '#0a0a0f' }}>
      {/* Hero */}
      <section className="pt-32 pb-12 px-4 border-b border-white/5">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
              style={{ background: 'rgba(129,215,66,0.1)', border: '1px solid rgba(129,215,66,0.2)' }}
            >
              <Shield size={22} className="text-brand-violet" />
            </div>
            <span className="text-brand-violet text-xs font-semibold tracking-[0.3em] uppercase block mb-3" style={{ fontFamily: 'Space Grotesk' }}>
              Legal
            </span>
            <h1 className="text-white font-bold text-3xl sm:text-4xl mb-4" style={{ fontFamily: 'Space Grotesk' }}>
              Política de Privacidad
            </h1>
            <p className="text-white/40 text-sm" style={{ fontFamily: 'Inter' }}>
              Última actualización: {LAST_UPDATE}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contenido */}
      <section className="py-12 px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="rounded-2xl p-6 border border-white/6"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <h2 className="text-white font-bold text-base mb-3" style={{ fontFamily: 'Space Grotesk' }}>
                {section.title}
              </h2>
              <p className="text-white/55 text-sm leading-relaxed whitespace-pre-line" style={{ fontFamily: 'Inter' }}>
                {section.content}
              </p>
            </motion.div>
          ))}

          {/* Contacto */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl p-6 border text-center"
            style={{ background: 'rgba(129,215,66,0.04)', borderColor: 'rgba(129,215,66,0.15)' }}
          >
            <p className="text-white/60 text-sm mb-2" style={{ fontFamily: 'Inter' }}>
              ¿Tienes preguntas sobre el uso de tus datos?
            </p>
            <a
              href="mailto:soporte@mitienditadigitalve.com"
              className="text-brand-violet font-semibold text-sm hover:underline"
              style={{ fontFamily: 'Space Grotesk' }}
            >
              soporte@mitienditadigitalve.com
            </a>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
