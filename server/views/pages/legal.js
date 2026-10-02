import { html } from '../html.js'
import { clp } from '../partials/product.js'

// Datos del responsable (persona natural). El domicilio exacto no se publica por decisión de Juan.
function owner(settings) {
  return {
    name: 'Juan Carlos Mejías Daza',
    rut: '27.012.143-8',
    email: settings.contact_email,
    whatsapp: `+${String(settings.contact_whatsapp).replace(/\D/g, '')}`,
    city: settings.local_city || 'Rancagua',
  }
}

const UPDATED = '1 de octubre de 2026'

function shell(title, intro, body) {
  return html`<section class="page-hero"><div class="wrap">
  <nav aria-label="Miga de pan"><ol class="breadcrumb"><li><a href="/">Inicio</a></li><li>${title}</li></ol></nav>
  <h1>${title}</h1><p class="page-hero__sub">Última actualización: ${UPDATED}</p>
</div></section>
<article class="wrap legal">
  <p class="legal__intro">${intro}</p>
  ${body}
  <nav class="legal__nav" aria-label="Documentos legales">
    <a href="/terminos-y-condiciones">Términos y Condiciones</a>
    <a href="/politica-de-privacidad">Política de Privacidad</a>
    <a href="/politica-de-cambios-y-devoluciones">Cambios, devoluciones y garantía</a>
  </nav>
</article>`
}

export function terminosBody(settings) {
  const o = owner(settings)
  return shell('Términos y Condiciones', 'Estos Términos y Condiciones regulan el uso del sitio mitienditadigitalve.com y las compras realizadas en él. Al comprar, aceptas estas condiciones, las que se rigen por la Ley N° 19.496 sobre Protección de los Derechos de los Consumidores y demás normativa chilena aplicable.', html`
  <h2>1. Identificación del proveedor</h2>
  <p>El sitio es operado por ${o.name}, RUT ${o.rut}, persona natural con inicio de actividades, con domicilio en ${o.city}, Región de O'Higgins, Chile (en adelante, "Mi Tiendita Digital Ve"). Contacto: ${o.email} · WhatsApp ${o.whatsapp}.</p>

  <h2>2. Capacidad y registro</h2>
  <p>Puedes comprar como invitado o creando una cuenta. Eres responsable de que los datos entregados sean verdaderos y de mantener la confidencialidad de tu contraseña. Las compras deben ser realizadas por personas mayores de 18 años o con autorización de su representante legal.</p>

  <h2>3. Productos, precios y stock</h2>
  <p>Los precios se expresan en pesos chilenos e incluyen IVA. Las fotografías son referenciales. Los precios y promociones son válidos mientras se publiquen en el sitio y hasta agotar stock. Si por un error evidente de publicación un precio no corresponde, te informaremos y podrás elegir mantener la compra al precio correcto o anularla con devolución total de lo pagado.</p>

  <h2>4. Proceso de compra y confirmación</h2>
  <p>La compra se perfecciona cuando confirmas el pedido y, según el medio de pago elegido, el pago es aprobado (Webpay), se recibe la transferencia o se acuerda el pago contra entrega. Te enviaremos un correo de confirmación con el detalle del pedido. Los pedidos por transferencia reservan los productos; si el pago no se recibe en un plazo razonable informado por correo, el pedido podrá anularse y el stock liberarse.</p>

  <h2>5. Medios de pago</h2>
  <p>Aceptamos tarjetas de débito y crédito a través de Webpay mediante la plataforma Flow, transferencia bancaria y pago contra entrega (solo delivery en ${o.city}). Mi Tiendita Digital Ve no almacena datos de tarjetas: el pago lo procesa Flow bajo estándares de seguridad bancarios.</p>

  <h2>6. Despacho y retiro</h2>
  <p>Ofrecemos retiro gratuito en nuestro local, delivery en ${o.city} (24 a 48 horas hábiles; gratis en compras sobre ${clp(settings.free_shipping_min_rancagua || 80000)}) y despacho a regiones (5 a 8 días hábiles) con tarifa plana informada en el checkout antes de pagar. Los plazos se cuentan desde la confirmación del pago y pueden variar por causas ajenas a nuestra voluntad (por ejemplo, retrasos del transportista o fuerza mayor), lo que te informaremos oportunamente.</p>

  <h2>7. Derecho a retracto</h2>
  <p><strong>Conforme al artículo 3 bis letra b) de la Ley N° 19.496, informamos de forma previa a la compra que los productos vendidos en este sitio no admiten derecho a retracto.</strong> Esta exclusión no afecta tu garantía legal ante productos con fallas, descrita en la <a href="/politica-de-cambios-y-devoluciones">Política de cambios, devoluciones y garantía</a>.</p>

  <h2>8. Garantía legal</h2>
  <p>Todos los productos cuentan con la garantía legal de 6 meses desde su recepción (artículos 20 y 21 de la Ley N° 19.496): si el producto presenta fallas o defectos de fabricación, puedes optar entre su cambio, reparación gratuita o la devolución del dinero pagado.</p>

  <h2>9. Cupones y promociones</h2>
  <p>Los cupones tienen las condiciones informadas en cada caso (monto mínimo, vigencia y usos). No son canjeables por dinero ni acumulables, salvo que se indique lo contrario.</p>

  <h2>10. Propiedad intelectual</h2>
  <p>Los contenidos del sitio (textos, diseño, logotipo e imágenes propias) pertenecen a Mi Tiendita Digital Ve o se usan con autorización. Las marcas de los productos pertenecen a sus respectivos dueños.</p>

  <h2>11. Datos personales</h2>
  <p>El tratamiento de tus datos se rige por nuestra <a href="/politica-de-privacidad">Política de Privacidad</a>.</p>

  <h2>12. Atención de consultas y reclamos</h2>
  <p>Puedes contactarnos en ${o.email} o por WhatsApp al ${o.whatsapp}, o mediante el <a href="/soporte">Centro de soporte</a>. Sin perjuicio de lo anterior, puedes ejercer tus derechos ante el Servicio Nacional del Consumidor (SERNAC) y los tribunales competentes.</p>

  <h2>13. Modificaciones y legislación aplicable</h2>
  <p>Podemos actualizar estos Términos; la versión vigente es la publicada en el sitio al momento de tu compra. Estos Términos se rigen por las leyes de la República de Chile.</p>`)
}

export function privacidadBody(settings) {
  const o = owner(settings)
  return shell('Política de Privacidad', 'En Mi Tiendita Digital Ve respetamos tu privacidad. Esta política explica qué datos personales tratamos, para qué y cuáles son tus derechos, conforme a la Ley N° 19.628 sobre Protección de la Vida Privada y a la Ley N° 21.719, que la moderniza.', html`
  <h2>1. Responsable del tratamiento</h2>
  <p>${o.name}, RUT ${o.rut}, con domicilio en ${o.city}, Región de O'Higgins, Chile. Contacto para temas de privacidad: ${o.email}.</p>

  <h2>2. Datos que tratamos</h2>
  <ul>
    <li><strong>Datos de compra y contacto:</strong> nombre, apellido, correo, teléfono, RUT (opcional) y dirección de despacho.</li>
    <li><strong>Datos de cuenta:</strong> correo, contraseña (almacenada de forma cifrada por nuestro proveedor de autenticación), foto de perfil opcional, direcciones guardadas y favoritos.</li>
    <li><strong>Datos de pedidos:</strong> productos comprados, montos, medio de pago elegido y estado del pedido. No almacenamos datos de tarjetas: los procesa Flow.</li>
    <li><strong>Opiniones:</strong> calificación y comentario que publiques sobre productos comprados.</li>
    <li><strong>Datos de navegación:</strong> información estadística de uso del sitio mediante Google Analytics y cookies técnicas necesarias para el carrito y la sesión.</li>
  </ul>

  <h2>3. Finalidades</h2>
  <ul>
    <li>Procesar y despachar tus pedidos, emitir confirmaciones y darte seguimiento.</li>
    <li>Gestionar tu cuenta, garantías, cambios y consultas de soporte.</li>
    <li>Enviarte ofertas y novedades solo si lo autorizaste expresamente (puedes darte de baja en cualquier momento).</li>
    <li>Mejorar el sitio mediante estadísticas agregadas y prevenir fraudes.</li>
  </ul>

  <h2>4. Base de licitud</h2>
  <p>Tratamos tus datos para ejecutar el contrato de compraventa, cumplir obligaciones legales y, en el caso de comunicaciones comerciales, con tu consentimiento.</p>

  <h2>5. Con quién compartimos tus datos</h2>
  <p>Solo con proveedores necesarios para operar la tienda, que actúan por cuenta nuestra: Flow (pagos), Supabase (base de datos y autenticación), Resend (envío de correos), Hostinger (alojamiento), Google (estadísticas) y la empresa de transporte que realice el despacho. No vendemos ni cedemos tus datos a terceros con fines comerciales.</p>

  <h2>6. Conservación</h2>
  <p>Conservamos los datos de pedidos por el tiempo necesario para cumplir obligaciones legales y tributarias y atender garantías. Los datos de tu cuenta se mantienen mientras la cuenta esté activa; puedes solicitar su eliminación.</p>

  <h2>7. Tus derechos</h2>
  <p>Puedes ejercer tus derechos de acceso, rectificación, supresión (cancelación), oposición y portabilidad, y revocar tu consentimiento para comunicaciones comerciales, escribiendo a ${o.email}. Responderemos dentro de los plazos legales. También puedes actualizar tus datos directamente en <a href="/cuenta">Mi cuenta</a>.</p>

  <h2>8. Seguridad</h2>
  <p>Aplicamos medidas técnicas y organizativas razonables: conexión cifrada (HTTPS), control de acceso por usuario a los datos de cada cuenta y procesamiento de pagos por un proveedor certificado.</p>

  <h2>9. Cookies</h2>
  <p>Usamos almacenamiento local y cookies técnicas para el carrito, favoritos y la sesión, y cookies de Google Analytics para estadísticas de uso. Puedes bloquearlas desde tu navegador, aunque algunas funciones del sitio podrían dejar de funcionar.</p>

  <h2>10. Cambios a esta política</h2>
  <p>Podemos actualizar esta política; publicaremos la versión vigente en esta página con su fecha de actualización.</p>`)
}

export function devolucionesBody(settings) {
  const o = owner(settings)
  return shell('Cambios, devoluciones y garantía', 'Queremos que estés conforme con tu compra. Aquí te explicamos cómo funciona la garantía legal y qué hacer si un producto presenta problemas.', html`
  <h2>1. Derecho a retracto</h2>
  <p>Informamos de forma previa a la compra que <strong>los productos vendidos en este sitio no admiten derecho a retracto</strong> (artículo 3 bis letra b) de la Ley N° 19.496). Por lo tanto, no se aceptan devoluciones por arrepentimiento o cambio de opinión.</p>

  <h2>2. Garantía legal de 6 meses</h2>
  <p>Si un producto presenta fallas o defectos de fabricación, o no corresponde a lo comprado, tienes <strong>6 meses desde que lo recibiste</strong> para elegir entre:</p>
  <ul><li>Cambio por un producto igual (o equivalente si no hay stock).</li><li>Reparación gratuita.</li><li>Devolución del dinero pagado.</li></ul>
  <p>La garantía no cubre daños causados por mal uso, golpes, humedad, intervención de terceros o desgaste normal.</p>

  <h2>3. Producto dañado o incorrecto al recibirlo</h2>
  <p>Revisa tu pedido al recibirlo. Si llega dañado o con un producto distinto, escríbenos dentro de las 48 horas siguientes con fotos del producto y del embalaje. Lo resolveremos sin costo para ti.</p>

  <h2>4. Cómo solicitar la garantía</h2>
  <ol>
    <li>Escríbenos a ${o.email} o por WhatsApp al ${o.whatsapp} con tu número de pedido, el producto y una descripción de la falla (idealmente con fotos o video).</li>
    <li>Te indicaremos cómo entregar el producto: en nuestro local en ${o.city} o mediante envío.</li>
    <li>Presenta el producto con sus accesorios y, si es posible, su embalaje original.</li>
    <li>Una vez revisado, aplicaremos la opción que elegiste (cambio, reparación o devolución).</li>
  </ol>

  <h2>5. Costos de envío por garantía</h2>
  <p>Cuando corresponde la garantía legal, los costos de envío del producto con falla y de su reemplazo son de cargo de Mi Tiendita Digital Ve.</p>

  <h2>6. Devolución del dinero</h2>
  <p>Si eliges la devolución, reembolsaremos el monto pagado por el mismo medio de pago o por transferencia a la cuenta que nos indiques, dentro de los plazos legales.</p>

  <h2>7. Garantía del fabricante</h2>
  <p>Algunos productos incluyen además garantía del fabricante, indicada en su ficha. Esta garantía voluntaria es adicional y no reemplaza la garantía legal.</p>`)
}
