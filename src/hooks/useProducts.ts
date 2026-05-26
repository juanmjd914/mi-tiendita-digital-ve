import { useState, useEffect } from 'react'
import { supabase, type Product } from '../lib/supabase'

export type SortOption = 'default' | 'price_asc' | 'price_desc' | 'rating'

interface UseProductsOptions {
  category?: string
  search?:   string
  limit?:    number       // para secciones de home (sin paginación)
  page?:     number       // 1-based, para Tienda
  pageSize?: number
  sort?:     SortOption
}

const WC = 'https://mitienditadigitalve.com/wp-content/uploads'

const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 1, name: 'Gabinete Gamer Cougar MX410-T', price: 52500, original_price: 85000,
    category: 'GABINETES GAMER', badge: 'OFERTA', rating: 5, stock: 5, active: true,
    description: 'Factor de forma: Midi-Tower · Cristal Templado · Tarjetas madre: ATX, Micro ATX, Mini-ITX.',
    img_url: `${WC}/2021/12/Gabinete-MX410T-6.webp`, created_at: '',
  },
  {
    id: 2, name: 'Soporte de Escritorio para Micrófono Philco', price: 7990, original_price: null,
    category: 'ACCESORIOS', badge: null, rating: 4, stock: 15, active: true,
    description: 'Soporte articulado de 360° con base estable.',
    img_url: `${WC}/2026/04/soporte-para-microfono-philco.webp`, created_at: '',
  },
  {
    id: 3, name: 'Powerbank Carga Inalámbrica Philco', price: 15200, original_price: null,
    category: 'ACCESORIOS', badge: null, rating: 4, stock: 20, active: true,
    description: 'Powerbank 10.000 mAh con carga Qi inalámbrica.',
    img_url: `${WC}/2026/04/Powerbank-Philco-Carga-inalambrica-tipo-c1.webp`, created_at: '',
  },
  {
    id: 4, name: 'Joystick Bluetooth 3.0 para Celular Ultra', price: 19990, original_price: null,
    category: 'ACCESORIOS', badge: 'HOT', rating: 5, stock: 30, active: true,
    description: 'Control inalámbrico Bluetooth 3.0 compatible con Android e iOS.',
    img_url: `${WC}/2026/04/Joystick-Bluetooth-para-Celular-Ultra1.webp`, created_at: '',
  },
  {
    id: 5, name: 'Cable USB Tipo C a 3.5MM Auxiliar', price: 3690, original_price: null,
    category: 'ACCESORIOS', badge: null, rating: 4, stock: 50, active: true,
    description: 'Cable adaptador USB-C a jack 3.5mm estéreo.',
    img_url: `${WC}/2026/04/CABLE-USB-TIPO-C-A-3.5MM1-300x300.webp`, created_at: '',
  },
  {
    id: 6, name: 'Audifonos Gamer Ultra', price: 9990, original_price: null,
    category: 'AUDIO Y VIDEO', badge: null, rating: 4, stock: 12, active: true,
    description: 'Auriculares gamer con drivers de 40mm y micrófono integrado.',
    img_url: `${WC}/2026/04/AUDIFONO-GAMER-ULTRA1-300x300.webp`, created_at: '',
  },
  {
    id: 7, name: 'Mouse HP Gamer RGB M160', price: 4900, original_price: 6590,
    category: 'COMPUTACION', badge: 'OFERTA', rating: 4, stock: 25, active: true,
    description: 'Mouse gamer USB con iluminación RGB, 6 botones y resolución hasta 1600 DPI.',
    img_url: `${WC}/2026/04/MOUSE-HP-GAMER-RGB-M160-300x300.webp`, created_at: '',
  },
  {
    id: 8, name: 'Kit Gamer Monster 4 en 1', price: 20000, original_price: 40990,
    category: 'COMPUTACION', badge: 'OFERTA', rating: 5, stock: 3, active: true,
    description: 'Combo gaming: Teclado + Mouse + Audífonos + Mousepad Monster.',
    img_url: `${WC}/2026/04/KIT-MONSTER-CREW-INSERTION-B-300x300.webp`, created_at: '',
  },
]

export function useProducts({
  category,
  search,
  limit,
  page     = 1,
  pageSize = 24,
  sort     = 'default',
}: UseProductsOptions = {}) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState<string | null>(null)
  const [total,    setTotal]    = useState(0)

  useEffect(() => {
    let cancelled = false

    async function fetchProducts() {
      setLoading(true)
      setError(null)

      try {
        // Orden server-side
        const orderCol = sort === 'price_asc' || sort === 'price_desc' ? 'price'
          : sort === 'rating' ? 'rating'
          : 'id'
        const ascending = sort !== 'price_desc' && sort !== 'rating'

        let query = supabase
          .from('products')
          .select('*', { count: 'exact' })
          .eq('active', true)
          .order(orderCol, { ascending })

        if (category) query = query.ilike('category', `%${category}%`)
        if (search)   query = query.ilike('name',     `%${search}%`)

        if (limit) {
          // Secciones home: solo límite, sin paginación
          query = query.limit(limit)
        } else {
          // Tienda: paginación real
          const from = (page - 1) * pageSize
          const to   = from + pageSize - 1
          query = query.range(from, to)
        }

        const { data, error: sbError, count } = await query

        if (cancelled) return

        if (sbError || !data) {
          console.warn('Supabase no disponible, usando datos de fallback')
          let fb = [...FALLBACK_PRODUCTS]
          if (category) fb = fb.filter(p => p.category === category)
          if (search)   fb = fb.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
          if (limit)    fb = fb.slice(0, limit)
          else {
            const from = (page - 1) * pageSize
            fb = fb.slice(from, from + pageSize)
          }
          setProducts(fb)
          setTotal(fb.length)
        } else {
          setProducts(data as Product[])
          setTotal(count ?? 0)
        }
      } catch {
        if (!cancelled) {
          setProducts(FALLBACK_PRODUCTS)
          setTotal(FALLBACK_PRODUCTS.length)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchProducts()
    return () => { cancelled = true }
  }, [category, search, limit, page, pageSize, sort])

  return { products, loading, error, total }
}
