import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSEO } from '../hooks/useSEO'
import { useProducts, type SortOption } from '../hooks/useProducts'
import ProductModal from '../components/ProductModal'
import type { Product } from '../lib/supabase'

const CATEGORIES = [
  { label: 'Todas',            value: 'Todas'           },
  { label: 'Accesorios',       value: 'ACCESORIOS'      },
  { label: 'Computación',      value: 'COMPUTACION'     },
  { label: 'Audio y Video',    value: 'AUDIO Y VIDEO'   },
  { label: 'Gabinetes Gamer',  value: 'GABINETES GAMER' },
  { label: 'Hogar',            value: 'HOGAR'           },
]

const PAGE_SIZE = 24

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'Relevancia',      value: 'default'    },
  { label: 'Menor precio',    value: 'price_asc'  },
  { label: 'Mayor precio',    value: 'price_desc' },
  { label: 'Mejor valorados', value: 'rating'     },
]

// ── Componente de paginación ───────────────────────────────────────────────
function Pagination({
  page, total, pageSize, onChange,
}: { page: number; total: number; pageSize: number; onChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  // Genera los números de página a mostrar (máx 7 con puntos suspensivos)
  const pages: (number | '…')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3)          pages.push('…')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('…')
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-center gap-1 mt-10 flex-wrap">
      {/* Anterior */}
      <motion.button
        whileHover={page > 1 ? { scale: 1.05 } : {}}
        whileTap={page > 1 ? { scale: 0.95 } : {}}
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed text-white/60 hover:text-white hover:bg-white/5"
        style={{ fontFamily: 'Space Grotesk' }}
      >
        <ChevronLeft size={15} /> Anterior
      </motion.button>

      {/* Números */}
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-white/20 text-sm">…</span>
        ) : (
          <motion.button
            key={p}
            whileHover={p !== page ? { scale: 1.08 } : {}}
            whileTap={p !== page ? { scale: 0.95 } : {}}
            onClick={() => onChange(p)}
            className={`w-9 h-9 rounded-xl text-sm font-bold transition-all ${
              p === page
                ? 'bg-brand-violet text-white shadow-lg'
                : 'text-white/50 hover:text-white hover:bg-white/5'
            }`}
            style={{ fontFamily: 'Space Grotesk' }}
          >
            {p}
          </motion.button>
        )
      )}

      {/* Siguiente */}
      <motion.button
        whileHover={page < totalPages ? { scale: 1.05 } : {}}
        whileTap={page < totalPages ? { scale: 0.95 } : {}}
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed text-white/60 hover:text-white hover:bg-white/5"
        style={{ fontFamily: 'Space Grotesk' }}
      >
        Siguiente <ChevronRight size={15} />
      </motion.button>
    </div>
  )
}

// ── Página principal ───────────────────────────────────────────────────────
export default function Tienda() {
  useSEO({
    title: 'Tienda',
    description: 'Catálogo completo de Mi Tiendita Digital Ve — gabinetes gamer, accesorios, computación y más en Rancagua, Chile.',
  })

  const [searchParams] = useSearchParams()
  const [search,       setSearch]       = useState(() => searchParams.get('search') || '')
  const [category,     setCategory]     = useState(() => searchParams.get('cat') || 'Todas')
  const [sort,         setSort]         = useState<SortOption>('default')
  const [modalProduct, setModalProduct] = useState<Product | null>(null)
  const [showFilters,  setShowFilters]  = useState(false)
  const [page,         setPage]         = useState(1)

  // Sincronizar cuando cambien los parámetros de la URL
  useEffect(() => {
    const cat   = searchParams.get('cat')
    const query = searchParams.get('search')
    setCategory(cat   || 'Todas')
    setSearch(query   || '')
    setPage(1)
  }, [searchParams])

  // Resetear página al cambiar filtros
  function handleSearch(v: string) { setSearch(v);   setPage(1) }
  function handleCategory(v: string) { setCategory(v); setPage(1) }
  function handleSort(v: SortOption) { setSort(v);    setPage(1) }

  const { products, loading, total } = useProducts({
    category: category === 'Todas' ? undefined : category,
    search:   search || undefined,
    page,
    pageSize: PAGE_SIZE,
    sort,
  })

  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Scroll al top al cambiar página
  function handlePageChange(p: number) {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4" style={{ background: '#0a0a0f' }}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <span className="text-brand-cyan text-xs font-semibold tracking-[0.3em] uppercase block mb-2" style={{ fontFamily: 'Space Grotesk' }}>
            Catálogo completo
          </span>
          <h1 className="text-white font-bold text-3xl sm:text-5xl" style={{ fontFamily: 'Space Grotesk' }}>
            Nuestra <span className="gradient-text">Tienda</span>
          </h1>
          <p className="text-white/40 text-sm mt-2">
            {loading
              ? 'Cargando productos...'
              : `${total} producto${total !== 1 ? 's' : ''} disponible${total !== 1 ? 's' : ''}`
            }
          </p>
          {!loading && total > 0 && totalPages > 1 && (
            <p className="text-white/20 text-xs mt-1">
              Página {page} de {totalPages}
            </p>
          )}
        </motion.div>

        {/* Barra de búsqueda + filtros */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-10 py-3 text-white placeholder-white/25 text-sm focus:outline-none focus:border-brand-violet/50 transition-colors"
              style={{ fontFamily: 'Inter' }}
            />
            {search && (
              <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={sort}
            onChange={e => handleSort(e.target.value as SortOption)}
            className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/70 text-sm focus:outline-none focus:border-brand-violet/50 transition-colors cursor-pointer"
            style={{ fontFamily: 'Space Grotesk' }}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value} className="bg-[#0f0f1a]">{o.label}</option>
            ))}
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="sm:hidden flex items-center justify-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white/60 text-sm"
          >
            <SlidersHorizontal size={15} /> Filtros
          </button>
        </div>

        <div className="flex gap-6">
          {/* Sidebar categorías */}
          <aside className={`${showFilters ? 'block' : 'hidden'} sm:block w-full sm:w-48 flex-shrink-0`}>
            <div className="sticky top-24">
              <p className="text-white/40 text-xs font-semibold tracking-widest uppercase mb-3" style={{ fontFamily: 'Space Grotesk' }}>
                Categorías
              </p>
              <div className="space-y-1">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => handleCategory(cat.value)}
                    className={`w-full text-left text-sm px-3 py-2 rounded-xl transition-all ${
                      category === cat.value
                        ? 'bg-brand-violet/20 text-brand-violet font-semibold border border-brand-violet/30'
                        : 'text-white/50 hover:text-white hover:bg-white/5'
                    }`}
                    style={{ fontFamily: 'Space Grotesk' }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Grid productos */}
          <div className="flex-1">
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white/3 rounded-2xl aspect-square animate-pulse" />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-white/20 text-5xl mb-4">🔍</p>
                <p className="text-white/40 font-semibold" style={{ fontFamily: 'Space Grotesk' }}>
                  No encontramos productos
                </p>
                <p className="text-white/25 text-sm mt-1">Intenta con otro término o categoría</p>
                <button
                  onClick={() => { handleSearch(''); handleCategory('Todas') }}
                  className="mt-4 text-brand-violet text-sm hover:underline"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map((product, i) => (
                    <ProductTile
                      key={product.id}
                      product={product}
                      delay={Math.min(i * 0.03, 0.4)}
                      onOpen={() => setModalProduct(product)}
                    />
                  ))}
                </div>

                <Pagination
                  page={page}
                  total={total}
                  pageSize={PAGE_SIZE}
                  onChange={handlePageChange}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <ProductModal
        product={modalProduct}
        onClose={() => setModalProduct(null)}
      />
    </div>
  )
}

// ── Tarjeta de producto ────────────────────────────────────────────────────
function ProductTile({
  product, delay, onOpen,
}: { product: Product; delay: number; onOpen: () => void }) {
  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : null

  const imgSrc = product.img_url ||
    'https://mitienditadigitalve.com/wp-content/uploads/2021/12/Gabinete-MX410T-6.webp'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ y: -4, boxShadow: '0 0 20px rgba(129,215,66,0.1)' }}
      onClick={onOpen}
      className="group bg-[#0f0f1a] border border-white/5 hover:border-brand-violet/30 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300"
    >
      <div className="relative aspect-square overflow-hidden bg-[#080810]">
        <img
          src={imgSrc}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={e => {
            e.currentTarget.src = 'https://mitienditadigitalve.com/wp-content/uploads/2021/12/Gabinete-MX410T-6.webp'
          }}
        />
        {discount && (
          <div className="absolute top-2 right-2 bg-brand-violet text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
            -{discount}%
          </div>
        )}
        {product.badge && (
          <div className="absolute top-2 left-2 bg-white/10 text-white/70 text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/10">
            {product.badge}
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <p className="text-brand-cyan text-[10px] font-semibold tracking-wider uppercase mb-1" style={{ fontFamily: 'Space Grotesk' }}>
          {product.category}
        </p>
        <h3 className="text-white text-xs sm:text-sm font-semibold line-clamp-2 leading-snug mb-2" style={{ fontFamily: 'Space Grotesk' }}>
          {product.name}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-black text-base" style={{ fontFamily: 'Space Grotesk' }}>
            ${product.price.toLocaleString('es-CL')}
          </span>
          {product.original_price && (
            <span className="text-white/30 text-xs line-through">
              ${product.original_price.toLocaleString('es-CL')}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  )
}
