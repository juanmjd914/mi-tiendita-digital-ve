import { useEffect } from 'react'
import type { Product } from '../lib/supabase'

const ORIGIN = 'https://mitienditadigitalve.com'

/**
 * Inyecta datos estructurados Schema.org (ItemList de Product) en el <head>
 * para la lista de productos visible. Googlebot ejecuta JS, por lo que detecta
 * este JSON-LD aunque sea una SPA.
 *
 * Nota: NO se incluye aggregateRating a propósito — el `rating` del producto es
 * una valoración manual sin reseñas reales, y declararla podría considerarse
 * structured-data spam por Google.
 */
export default function ProductsJsonLd({ products }: { products: Product[] }) {
  useEffect(() => {
    if (!products.length) return

    const data = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: products.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: {
          '@type': 'Product',
          name: p.name,
          sku: String(p.id),
          category: p.category,
          ...(p.description ? { description: p.description } : {}),
          ...(p.img_url ? { image: p.img_url } : {}),
          brand: { '@type': 'Brand', name: 'Mi Tiendita Digital Ve' },
          offers: {
            '@type': 'Offer',
            price: p.price,
            priceCurrency: 'CLP',
            availability: p.stock > 0
              ? 'https://schema.org/InStock'
              : 'https://schema.org/OutOfStock',
            url: `${ORIGIN}/tienda?search=${encodeURIComponent(p.name)}`,
            seller: { '@type': 'Organization', name: 'Mi Tiendita Digital Ve' },
          },
        },
      })),
    }

    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.dataset.seo = 'products'
    script.textContent = JSON.stringify(data)
    document.head.appendChild(script)

    return () => { script.remove() }
  }, [products])

  return null
}
