import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import {
  Lock, BarChart3, ShoppingBag, Mail, TrendingUp, RefreshCw,
  ChevronDown, ChevronUp, LogOut, Package, Clock, CheckCircle2,
  XCircle, AlertCircle, Search, Filter, Plus, Edit2, Eye, EyeOff,
  Save, X, Image as ImageIcon, Tag, DollarSign, Layers, Copy, Loader2,
} from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'
const ADMIN_PIN_KEY = 'mtdv_admin_pin'

const CATEGORIES = ['ACCESORIOS', 'COMPUTACION', 'AUDIO Y VIDEO', 'HOGAR', 'GABINETES GAMER']
const BADGES     = ['', 'OFERTA', 'HOT', 'NUEVO', 'EXCLUSIVO']

// ── Types ──────────────────────────────────────────────────────────────────
interface Stats { paidOrders: number; totalRevenue: number; subscribers: number }

interface OrderItem { id: number; product_id: number; name: string; price: number; quantity: number }
interface Order {
  id: number; status: 'paid'|'pending'|'pending_transfer'|'rejected'|'cancelled'
  total: number; customer_email: string; customer_name: string|null
  created_at: string; flow_token: string|null; order_items: OrderItem[]
}

interface Product {
  id: number; name: string; price: number; original_price: number|null
  category: string; badge: string|null; rating: number; stock: number
  active: boolean; description: string|null; img_url: string|null; created_at: string
}

type OrderFilter = 'all'|'paid'|'pending'|'pending_transfer'|'rejected'

interface Subscriber {
  id: number
  email: string
  created_at: string
}

// ── Helpers ────────────────────────────────────────────────────────────────
const fmt     = (n: number) => n.toLocaleString('es-CL')
const fmtDate = (s: string) => new Date(s).toLocaleString('es-CL', {
  day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit',
})

// ── StatusBadge ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Order['status'] }) {
  const map = {
    paid:             { label:'Pagado',        color:'#81d742', bg:'rgba(129,215,66,0.12)', icon: CheckCircle2 },
    pending:          { label:'Pendiente',     color:'#ffc222', bg:'rgba(255,194,34,0.12)', icon: Clock },
    pending_transfer: { label:'Transferencia', color:'#06b6d4', bg:'rgba(6,182,212,0.12)',  icon: AlertCircle },
    rejected:         { label:'Rechazado',     color:'#ef4444', bg:'rgba(239,68,68,0.12)',  icon: XCircle },
    cancelled:        { label:'Cancelado',     color:'#6b7280', bg:'rgba(107,114,128,0.12)',icon: AlertCircle },
  }
  const { label, color, bg, icon: Icon } = map[status] ?? map.cancelled
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ color, background: bg, border: `1px solid ${color}30` }}>
      <Icon size={11} /> {label}
    </span>
  )
}

// ── OrderRow ───────────────────────────────────────────────────────────────
function OrderRow({ order, pin, onConfirmTransfer }: {
  order: Order
  pin: string
  onConfirmTransfer: (id: number) => void
}) {
  const [open,       setOpen]       = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [confirmErr, setConfirmErr] = useState('')

  async function handleConfirmTransfer() {
    setConfirming(true)
    setConfirmErr('')
    try {
      const res = await fetch(`${API}/api/admin/orders/${order.id}/confirm-transfer`, {
        method: 'POST',
        headers: { 'x-admin-pin': pin },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al confirmar')
      onConfirmTransfer(order.id)
    } catch (err: unknown) {
      setConfirmErr(err instanceof Error ? err.message : 'Error')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <motion.div layout className="border border-white/8 rounded-xl overflow-hidden" style={{ background:'rgba(255,255,255,0.02)' }}>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/3 transition-colors">
        <span className="text-white/30 text-xs font-mono w-10 shrink-0">#{order.id}</span>
        <span className="text-white/70 text-xs flex-1 truncate">{order.customer_email}</span>
        <span className="text-white/50 text-xs hidden sm:block shrink-0">{fmtDate(order.created_at)}</span>
        <span className="text-white font-bold text-sm shrink-0">${fmt(order.total)}</span>
        <StatusBadge status={order.status} />
        <span className="text-white/30 shrink-0 ml-1">{open ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
            exit={{ height:0, opacity:0 }} transition={{ duration:0.2 }} className="overflow-hidden">
            <div className="px-4 pb-3 pt-1 border-t border-white/5">
              {order.customer_name && <p className="text-white/40 text-xs mb-2">Cliente: <span className="text-white/70">{order.customer_name}</span></p>}
              <div className="space-y-1.5">
                {order.order_items?.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <span className="text-white/60 flex-1">{item.name}</span>
                    <span className="text-white/40 mx-3">×{item.quantity}</span>
                    <span className="text-white/70 font-semibold">${fmt(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              {/* Botón confirmar transferencia */}
              {order.status === 'pending_transfer' && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  {confirmErr && (
                    <p className="text-red-400 text-xs mb-2">{confirmErr}</p>
                  )}
                  <motion.button
                    onClick={handleConfirmTransfer}
                    disabled={confirming}
                    whileHover={!confirming ? { scale:1.02 } : {}}
                    whileTap={!confirming ? { scale:0.98 } : {}}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-xs font-bold disabled:opacity-50 transition-all"
                    style={{ fontFamily:'Space Grotesk', background:'linear-gradient(135deg,#81d742,#06b6d4)' }}>
                    {confirming ? (
                      <><Loader2 size={13} className="animate-spin"/> Confirmando...</>
                    ) : (
                      <><CheckCircle2 size={13}/> ✅ Confirmar Pago por Transferencia</>
                    )}
                  </motion.button>
                  <p className="text-white/25 text-[10px] mt-1.5" style={{ fontFamily:'Inter' }}>
                    Esto marcará el pedido como Pagado, descontará el stock y enviará confirmación al cliente.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── ProductForm (modal de crear/editar) ────────────────────────────────────
const EMPTY: Partial<Product> = {
  name:'', price:0, original_price:null, category:'ACCESORIOS',
  badge:null, stock:0, rating:5, active:true, description:'', img_url:'',
}

function ProductForm({
  product, pin, onSave, onClose,
}: {
  product: Partial<Product>|null
  pin: string
  onSave: (p: Product) => void
  onClose: () => void
}) {
  const isNew = !product?.id
  const [form,    setForm]    = useState<Partial<Product>>(product ?? EMPTY)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  function set(key: keyof Product, val: unknown) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name?.trim()) { setError('El nombre es obligatorio'); return }
    if (!form.price || form.price <= 0) { setError('El precio debe ser mayor a 0'); return }

    setLoading(true)
    setError('')

    const body = {
      name:           form.name?.trim(),
      price:          Number(form.price),
      original_price: form.original_price ? Number(form.original_price) : null,
      category:       form.category,
      badge:          form.badge || null,
      stock:          Number(form.stock ?? 0),
      rating:         Number(form.rating ?? 5),
      active:         form.active ?? true,
      description:    form.description?.trim() || null,
      img_url:        form.img_url?.trim() || null,
    }

    const url    = isNew ? `${API}/api/admin/products` : `${API}/api/admin/products/${form.id}`
    const method = isNew ? 'POST' : 'PUT'

    try {
      const res  = await fetch(url, { method, headers: { 'Content-Type':'application/json', 'x-admin-pin': pin }, body: JSON.stringify(body) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al guardar')
      onSave(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:'rgba(0,0,0,0.7)', backdropFilter:'blur(8px)' }}>
      <motion.div initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }}
        exit={{ opacity:0, scale:0.95 }} transition={{ duration:0.2 }}
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10"
        style={{ background:'#0f0f1a' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h2 className="text-white font-bold text-lg" style={{ fontFamily:'Space Grotesk' }}>
            {isNew ? 'Nuevo Producto' : 'Editar Producto'}
          </h2>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Nombre */}
          <div>
            <label className="text-white/50 text-xs mb-1.5 block" style={{ fontFamily:'Space Grotesk' }}>Nombre *</label>
            <input value={form.name ?? ''} onChange={e => set('name', e.target.value)}
              placeholder="Nombre del producto" required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-brand-violet/50 transition-colors"
              style={{ fontFamily:'Inter' }} />
          </div>

          {/* Categoría + Badge */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/50 text-xs mb-1.5 flex items-center gap-1.5" style={{ fontFamily:'Space Grotesk' }}>
                <Layers size={11}/> Categoría *
              </label>
              <select value={form.category ?? 'ACCESORIOS'} onChange={e => set('category', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-violet/50 transition-colors cursor-pointer"
                style={{ fontFamily:'Space Grotesk' }}>
                {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0f0f1a]">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-white/50 text-xs mb-1.5 flex items-center gap-1.5" style={{ fontFamily:'Space Grotesk' }}>
                <Tag size={11}/> Badge
              </label>
              <select value={form.badge ?? ''} onChange={e => set('badge', e.target.value || null)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-brand-violet/50 transition-colors cursor-pointer"
                style={{ fontFamily:'Space Grotesk' }}>
                {BADGES.map(b => <option key={b} value={b} className="bg-[#0f0f1a]">{b || '— Sin badge —'}</option>)}
              </select>
            </div>
          </div>

          {/* Precio + Precio original */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-white/50 text-xs mb-1.5 flex items-center gap-1.5" style={{ fontFamily:'Space Grotesk' }}>
                <DollarSign size={11}/> Precio CLP *
              </label>
              <input type="number" min="0" value={form.price ?? ''} onChange={e => set('price', e.target.value)}
                placeholder="15990" required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-brand-violet/50 transition-colors"
                style={{ fontFamily:'Inter' }} />
            </div>
            <div>
              <label className="text-white/50 text-xs mb-1.5 flex items-center gap-1.5" style={{ fontFamily:'Space Grotesk' }}>
                <DollarSign size={11}/> Precio tachado
              </label>
              <input type="number" min="0" value={form.original_price ?? ''} onChange={e => set('original_price', e.target.value || null)}
                placeholder="29990 (opcional)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-brand-violet/50 transition-colors"
                style={{ fontFamily:'Inter' }} />
            </div>
          </div>

          {/* Stock */}
          <div>
            <label className="text-white/50 text-xs mb-1.5 block" style={{ fontFamily:'Space Grotesk' }}>Stock</label>
            <input type="number" min="0" value={form.stock ?? ''} onChange={e => set('stock', e.target.value)}
              placeholder="0"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-brand-violet/50 transition-colors"
              style={{ fontFamily:'Inter' }} />
          </div>

          {/* Descripción */}
          <div>
            <label className="text-white/50 text-xs mb-1.5 block" style={{ fontFamily:'Space Grotesk' }}>Descripción</label>
            <textarea value={form.description ?? ''} onChange={e => set('description', e.target.value)}
              placeholder="Descripción del producto..." rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-brand-violet/50 transition-colors resize-none"
              style={{ fontFamily:'Inter' }} />
          </div>

          {/* URL imagen */}
          <div>
            <label className="text-white/50 text-xs mb-1.5 flex items-center gap-1.5" style={{ fontFamily:'Space Grotesk' }}>
              <ImageIcon size={11}/> URL de imagen
            </label>
            <input value={form.img_url ?? ''} onChange={e => set('img_url', e.target.value)}
              placeholder="https://..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 text-sm focus:outline-none focus:border-brand-violet/50 transition-colors"
              style={{ fontFamily:'Inter' }} />
            {form.img_url && (
              <img src={form.img_url} alt="preview" className="mt-2 w-16 h-16 object-cover rounded-xl border border-white/10"
                onError={e => { e.currentTarget.style.display = 'none' }} />
            )}
          </div>

          {/* Activo toggle */}
          <div className="flex items-center justify-between py-2 px-4 rounded-xl border border-white/8" style={{ background:'rgba(255,255,255,0.02)' }}>
            <div>
              <p className="text-white/80 text-sm font-semibold" style={{ fontFamily:'Space Grotesk' }}>Producto activo</p>
              <p className="text-white/30 text-xs" style={{ fontFamily:'Inter' }}>
                {form.active ? 'Visible en la tienda' : 'Oculto en la tienda'}
              </p>
            </div>
            <button type="button" onClick={() => set('active', !form.active)}
              className="relative w-12 h-6 rounded-full transition-all duration-300"
              style={{ background: form.active ? '#81d742' : 'rgba(255,255,255,0.1)' }}>
              <span className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300"
                style={{ left: form.active ? '26px' : '2px' }} />
            </button>
          </div>

          {error && (
            <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">
              {error}
            </motion.p>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white hover:bg-white/5 text-sm font-semibold transition-all"
              style={{ fontFamily:'Space Grotesk' }}>
              Cancelar
            </button>
            <motion.button type="submit" disabled={loading}
              whileHover={!loading ? { scale:1.02 } : {}} whileTap={!loading ? { scale:0.98 } : {}}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-bold disabled:opacity-50 transition-all"
              style={{ fontFamily:'Space Grotesk', background:'linear-gradient(135deg,#81d742,#06b6d4)' }}>
              {loading ? 'Guardando...' : <><Save size={14}/> {isNew ? 'Crear producto' : 'Guardar cambios'}</>}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}

// ── ProductRow ─────────────────────────────────────────────────────────────
function ProductRow({ product, pin, onEdit, onToggle }: {
  product: Product; pin: string
  onEdit: (p: Product) => void
  onToggle: (id: number, active: boolean) => void
}) {
  const [toggling, setToggling] = useState(false)

  async function handleToggle() {
    setToggling(true)
    const res = await fetch(`${API}/api/admin/products/${product.id}`, {
      method: 'PUT',
      headers: { 'Content-Type':'application/json', 'x-admin-pin': pin },
      body: JSON.stringify({ active: !product.active }),
    })
    if (res.ok) onToggle(product.id, !product.active)
    setToggling(false)
  }

  const discount = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : null

  return (
    <motion.div layout
      className="flex items-center gap-3 px-4 py-3 border border-white/8 rounded-xl hover:border-white/15 transition-all"
      style={{ background:'rgba(255,255,255,0.02)', opacity: product.active ? 1 : 0.5 }}>

      {/* Imagen */}
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 shrink-0">
        {product.img_url
          ? <img src={product.img_url} alt={product.name} className="w-full h-full object-cover"
              onError={e => { e.currentTarget.style.display='none' }} />
          : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={14} className="text-white/20"/></div>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-white text-sm font-semibold truncate" style={{ fontFamily:'Space Grotesk' }}>
            {product.name}
          </p>
          {product.badge && (
            <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full"
              style={{ background:'rgba(129,215,66,0.15)', color:'#81d742', border:'1px solid rgba(129,215,66,0.3)' }}>
              {product.badge}
            </span>
          )}
        </div>
        <p className="text-white/35 text-xs mt-0.5" style={{ fontFamily:'Inter' }}>
          {product.category} · Stock: {product.stock}
        </p>
      </div>

      {/* Precio */}
      <div className="text-right shrink-0 hidden sm:block">
        <p className="text-white font-bold text-sm" style={{ fontFamily:'Space Grotesk' }}>
          ${fmt(product.price)}
        </p>
        {discount && (
          <p className="text-white/30 text-xs line-through">${fmt(product.original_price!)}</p>
        )}
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Toggle activo */}
        <button onClick={handleToggle} disabled={toggling}
          className="w-9 h-5 rounded-full transition-all duration-300 relative disabled:opacity-50"
          style={{ background: product.active ? '#81d742' : 'rgba(255,255,255,0.1)' }}
          title={product.active ? 'Desactivar' : 'Activar'}>
          <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-300"
            style={{ left: product.active ? '20px' : '2px' }} />
        </button>
        {/* Editar */}
        <button onClick={() => onEdit(product)}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 transition-all">
          <Edit2 size={14}/>
        </button>
      </div>
    </motion.div>
  )
}

// ── ProductosTab ───────────────────────────────────────────────────────────
function ProductosTab({ pin }: { pin: string }) {
  const [products,    setProducts]    = useState<Product[]>([])
  const [loading,     setLoading]     = useState(true)
  const [search,      setSearch]      = useState('')
  const [catFilter,   setCatFilter]   = useState('')
  const [showInactive,setShowInactive]= useState(false)
  const [editProduct, setEditProduct] = useState<Partial<Product>|null>(null)
  const [showForm,    setShowForm]    = useState(false)

  const loadProducts = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search)    params.set('search', search)
      if (catFilter) params.set('category', catFilter)
      const res = await fetch(`${API}/api/admin/products?${params}`, { headers: { 'x-admin-pin': pin } })
      if (res.ok) setProducts(await res.json())
    } finally {
      setLoading(false)
    }
  }, [pin, search, catFilter])

  useEffect(() => { loadProducts() }, [loadProducts])

  const filtered = showInactive ? products : products.filter(p => p.active)
  const inactive = products.filter(p => !p.active).length

  function handleSave(saved: Product) {
    setProducts(prev => {
      const idx = prev.findIndex(p => p.id === saved.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next }
      return [saved, ...prev]
    })
    setShowForm(false)
    setEditProduct(null)
  }

  function handleToggle(id: number, active: boolean) {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, active } : p))
  }

  function openAdd()           { setEditProduct(EMPTY); setShowForm(true) }
  function openEdit(p: Product){ setEditProduct(p);     setShowForm(true) }
  function closeForm()         { setShowForm(false);    setEditProduct(null) }

  return (
    <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-white font-bold text-lg" style={{ fontFamily:'Space Grotesk' }}>Productos</h2>
          <p className="text-white/30 text-xs mt-0.5" style={{ fontFamily:'Inter' }}>
            {products.length} total · {products.filter(p=>p.active).length} activos
            {inactive > 0 && ` · ${inactive} inactivos`}
          </p>
        </div>
        <motion.button onClick={openAdd}
          whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-bold text-sm"
          style={{ fontFamily:'Space Grotesk', background:'linear-gradient(135deg,#81d742,#06b6d4)' }}>
          <Plus size={15}/> Nuevo Producto
        </motion.button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        {/* Búsqueda */}
        <div className="relative flex-1">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-white placeholder-white/25 text-xs focus:outline-none focus:border-brand-violet/40 transition-colors"
            style={{ fontFamily:'Inter' }} />
        </div>

        {/* Categoría */}
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-xs focus:outline-none focus:border-brand-violet/40 transition-colors cursor-pointer"
          style={{ fontFamily:'Space Grotesk' }}>
          <option value="" className="bg-[#0f0f1a]">Todas las categorías</option>
          {CATEGORIES.map(c => <option key={c} value={c} className="bg-[#0f0f1a]">{c}</option>)}
        </select>

        {/* Mostrar inactivos */}
        <button onClick={() => setShowInactive(!showInactive)}
          className="flex items-center gap-1.5 px-3 py-2.5 text-xs border rounded-xl transition-all whitespace-nowrap"
          style={{
            fontFamily:'Space Grotesk',
            background: showInactive ? 'rgba(129,215,66,0.1)' : 'rgba(255,255,255,0.03)',
            borderColor: showInactive ? 'rgba(129,215,66,0.3)' : 'rgba(255,255,255,0.08)',
            color: showInactive ? '#81d742' : 'rgba(255,255,255,0.4)',
          }}>
          {showInactive ? <Eye size={12}/> : <EyeOff size={12}/>}
          {showInactive ? 'Mostrando inactivos' : 'Ver inactivos'}
        </button>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-white/3 animate-pulse"/>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Package size={40} className="text-white/15 mx-auto mb-3"/>
          <p className="text-white/30 text-sm" style={{ fontFamily:'Space Grotesk' }}>
            {search || catFilter ? 'No hay productos que coincidan' : 'No hay productos'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <ProductRow key={p.id} product={p} pin={pin} onEdit={openEdit} onToggle={handleToggle}/>
          ))}
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-white/20 text-xs mt-3 text-right" style={{ fontFamily:'Inter' }}>
          Mostrando {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Modal form */}
      <AnimatePresence>
        {showForm && editProduct && (
          <ProductForm product={editProduct} pin={pin} onSave={handleSave} onClose={closeForm}/>
        )}
      </AnimatePresence>
    </>
  )
}

// ── NewsletterTab ──────────────────────────────────────────────────────────
function NewsletterTab({ pin }: { pin: string }) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading,     setLoading]     = useState(true)
  const [copied,      setCopied]      = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/api/admin/newsletter`, { headers: { 'x-admin-pin': pin } })
        if (res.ok) setSubscribers(await res.json())
      } finally { setLoading(false) }
    }
    load()
  }, [pin])

  function copyEmails() {
    const emails = subscribers.map(s => s.email).join(', ')
    navigator.clipboard.writeText(emails)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-white font-bold text-lg" style={{ fontFamily:'Space Grotesk' }}>Newsletter</h2>
          <p className="text-white/30 text-xs mt-0.5" style={{ fontFamily:'Inter' }}>
            {loading ? '…' : `${subscribers.length} suscriptor${subscribers.length !== 1 ? 'es' : ''} registrados`}
          </p>
        </div>
        {subscribers.length > 0 && (
          <motion.button onClick={copyEmails}
            whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
            style={{
              fontFamily:'Space Grotesk',
              background: copied ? 'rgba(129,215,66,0.15)' : 'rgba(255,255,255,0.05)',
              border: copied ? '1px solid rgba(129,215,66,0.3)' : '1px solid rgba(255,255,255,0.1)',
              color: copied ? '#81d742' : 'rgba(255,255,255,0.6)',
            }}>
            {copied ? <CheckCircle2 size={14}/> : <Copy size={14}/>}
            {copied ? '¡Copiado!' : 'Copiar todos los emails'}
          </motion.button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-white/3 animate-pulse"/>
          ))}
        </div>
      ) : subscribers.length === 0 ? (
        <div className="py-16 text-center">
          <Mail size={40} className="text-white/15 mx-auto mb-3"/>
          <p className="text-white/30 text-sm" style={{ fontFamily:'Space Grotesk' }}>No hay suscriptores aún</p>
          <p className="text-white/20 text-xs mt-1" style={{ fontFamily:'Inter' }}>
            Los emails del formulario Newsletter aparecerán aquí
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {subscribers.map((s, i) => (
            <motion.div key={s.id} layout
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.03 }}
              className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/8 hover:border-white/15 transition-all"
              style={{ background:'rgba(255,255,255,0.02)' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background:'rgba(255,194,34,0.12)', border:'1px solid rgba(255,194,34,0.2)' }}>
                  <Mail size={13} className="text-brand-yellow"/>
                </div>
                <span className="text-white/80 text-sm" style={{ fontFamily:'Inter' }}>{s.email}</span>
              </div>
              <span className="text-white/25 text-xs hidden sm:block" style={{ fontFamily:'Inter' }}>
                {fmtDate(s.created_at)}
              </span>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && subscribers.length > 0 && (
        <p className="text-white/20 text-xs mt-3 text-right" style={{ fontFamily:'Inter' }}>
          {subscribers.length} email{subscribers.length !== 1 ? 's' : ''} en total
        </p>
      )}
    </>
  )
}

// ── StatCard ───────────────────────────────────────────────────────────────
function StatCard({ icon:Icon, label, value, sub, color, delay }: {
  icon: React.ElementType; label: string; value: string; sub: string; color: string; delay: number
}) {
  return (
    <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay }}
      whileHover={{ y:-3, boxShadow:`0 8px 30px ${color}15` }}
      className="rounded-2xl p-5 border transition-all duration-300"
      style={{ background:'rgba(255,255,255,0.025)', borderColor:`${color}20`, borderTop:`1px solid ${color}30` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{ background:`${color}12`, border:`1px solid ${color}25` }}>
        <Icon size={20} style={{ color }}/>
      </div>
      <p className="text-white/40 text-xs mb-1" style={{ fontFamily:'Space Grotesk' }}>{label}</p>
      <p className="text-white font-black text-2xl leading-none mb-1" style={{ fontFamily:'Space Grotesk', color }}>{value}</p>
      <p className="text-white/25 text-xs" style={{ fontFamily:'Inter' }}>{sub}</p>
    </motion.div>
  )
}

// ── PedidosTab ─────────────────────────────────────────────────────────────
function PedidosTab({ pin }: { pin: string }) {
  const [stats,         setStats]         = useState<Stats|null>(null)
  const [orders,        setOrders]        = useState<Order[]>([])
  const [statusFilter,  setStatusFilter]  = useState<OrderFilter>('all')
  const [loadingStats,  setLoadingStats]  = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [searchQuery,   setSearchQuery]   = useState('')
  const [lastRefresh,   setLastRefresh]   = useState(new Date())

  const headers = { 'x-admin-pin': pin }

  const loadStats = useCallback(async () => {
    setLoadingStats(true)
    try {
      const res = await fetch(`${API}/api/admin/stats`, { headers })
      if (res.ok) setStats(await res.json())
    } finally { setLoadingStats(false) }
  }, [pin])

  const loadOrders = useCallback(async () => {
    setLoadingOrders(true)
    try {
      const params = new URLSearchParams({ limit:'100' })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      const res = await fetch(`${API}/api/admin/orders?${params}`, { headers })
      if (res.ok) setOrders(await res.json())
    } finally { setLoadingOrders(false) }
  }, [pin, statusFilter])

  useEffect(() => { loadStats() }, [loadStats])
  useEffect(() => { loadOrders() }, [loadOrders])

  function refresh() { loadStats(); loadOrders(); setLastRefresh(new Date()) }

  const filtered = orders.filter(o => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return o.customer_email.toLowerCase().includes(q) || (o.customer_name?.toLowerCase().includes(q)) || String(o.id).includes(q)
  })

  const STATUS_TABS: { label:string; value:OrderFilter; color:string }[] = [
    { label:'Todos',          value:'all',              color:'#ffffff' },
    { label:'Pagados',        value:'paid',             color:'#81d742' },
    { label:'Transferencias', value:'pending_transfer', color:'#06b6d4' },
    { label:'Pendientes',     value:'pending',          color:'#ffc222' },
    { label:'Rechazados',     value:'rejected',         color:'#ef4444' },
  ]

  return (
    <>
      {/* Stats */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={ShoppingBag} label="Pedidos Pagados"         value={loadingStats?'…':fmt(stats?.paidOrders??0)}         sub="órdenes completadas"   color="#81d742" delay={0}    />
        <StatCard icon={TrendingUp}  label="Ingresos Totales"        value={loadingStats?'…':`$${fmt(stats?.totalRevenue??0)}`} sub="en pedidos pagados"    color="#06b6d4" delay={0.06} />
        <StatCard icon={Mail}        label="Suscriptores Newsletter" value={loadingStats?'…':fmt(stats?.subscribers??0)}        sub="emails registrados"    color="#ffc222" delay={0.12} />
      </motion.div>

      {/* Órdenes */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.18 }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-white font-bold text-lg" style={{ fontFamily:'Space Grotesk' }}>Órdenes</h2>
            <p className="text-white/30 text-xs mt-0.5" style={{ fontFamily:'Inter' }}>
              Última actualización: {lastRefresh.toLocaleTimeString('es-CL')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"/>
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar email o ID..."
                className="bg-white/5 border border-white/10 rounded-xl pl-8 pr-4 py-2.5 text-white placeholder-white/25 text-xs focus:outline-none focus:border-brand-violet/40 transition-colors w-52"
                style={{ fontFamily:'Inter' }}/>
            </div>
            <button onClick={refresh}
              className="flex items-center gap-1.5 px-3 py-2.5 text-white/50 hover:text-white text-xs border border-white/10 rounded-xl hover:bg-white/5 transition-all"
              style={{ fontFamily:'Space Grotesk' }}>
              <RefreshCw size={12}/>
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
          {STATUS_TABS.map(tab => (
            <button key={tab.value} onClick={() => setStatusFilter(tab.value)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
              style={{
                fontFamily:'Space Grotesk',
                background: statusFilter===tab.value ? `${tab.color}15` : 'rgba(255,255,255,0.03)',
                border: statusFilter===tab.value ? `1px solid ${tab.color}35` : '1px solid rgba(255,255,255,0.06)',
                color: statusFilter===tab.value ? tab.color : 'rgba(255,255,255,0.45)',
              }}>
              <Filter size={10}/> {tab.label}
            </button>
          ))}
        </div>

        {loadingOrders ? (
          <div className="space-y-2">{Array.from({length:5}).map((_,i)=><div key={i} className="h-12 rounded-xl bg-white/3 animate-pulse"/>)}</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Package size={40} className="text-white/15 mx-auto mb-3"/>
            <p className="text-white/30 text-sm" style={{ fontFamily:'Space Grotesk' }}>
              {searchQuery ? 'No hay órdenes que coincidan' : 'No hay órdenes en este estado'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">{filtered.map(o=>(
            <OrderRow key={o.id} order={o} pin={pin}
              onConfirmTransfer={(id) => {
                setOrders(prev => prev.map(x => x.id === id ? { ...x, status: 'paid' } : x))
              }}
            />
          ))}</div>
        )}
        {!loadingOrders && filtered.length > 0 && (
          <p className="text-white/20 text-xs mt-3 text-right" style={{ fontFamily:'Inter' }}>
            {filtered.length} orden{filtered.length!==1?'es':''}
          </p>
        )}
      </motion.div>
    </>
  )
}

// ── Dashboard ──────────────────────────────────────────────────────────────
function Dashboard({ pin, onLogout }: { pin: string; onLogout: () => void }) {
  const [tab, setTab] = useState<'pedidos'|'productos'|'newsletter'>('pedidos')

  const TABS = [
    { id:'pedidos',     label:'📊 Pedidos',     },
    { id:'productos',   label:'📦 Productos',   },
    { id:'newsletter',  label:'📧 Newsletter',  },
  ] as const

  return (
    <div className="min-h-screen pb-20 px-4" style={{ background:'#0a0a0f' }}>
      {/* Header */}
      <div className="sticky top-0 z-30 py-4 mb-8"
        style={{ background:'rgba(10,10,15,0.9)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background:'rgba(129,215,66,0.12)', border:'1px solid rgba(129,215,66,0.25)' }}>
              <BarChart3 size={18} className="text-brand-violet"/>
            </div>
            <div>
              <h1 className="text-white font-bold text-base leading-none" style={{ fontFamily:'Space Grotesk' }}>Panel Admin</h1>
              <p className="text-white/30 text-[10px] mt-0.5" style={{ fontFamily:'Inter' }}>Mi Tiendita Digital Ve</p>
            </div>
          </div>
          <button onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-white/50 hover:text-red-400 text-xs border border-white/10 rounded-lg hover:bg-red-400/5 hover:border-red-400/20 transition-all"
            style={{ fontFamily:'Space Grotesk' }}>
            <LogOut size={12}/> <span className="hidden sm:inline">Salir</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto flex gap-1 mt-4">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                fontFamily:'Space Grotesk',
                background: tab===t.id ? 'rgba(129,215,66,0.12)' : 'transparent',
                border: tab===t.id ? '1px solid rgba(129,215,66,0.25)' : '1px solid transparent',
                color: tab===t.id ? '#81d742' : 'rgba(255,255,255,0.4)',
              }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {tab === 'pedidos' ? (
            <motion.div key="pedidos" initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:10 }} transition={{ duration:0.2 }}>
              <PedidosTab pin={pin}/>
            </motion.div>
          ) : tab === 'productos' ? (
            <motion.div key="productos" initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }} transition={{ duration:0.2 }}>
              <ProductosTab pin={pin}/>
            </motion.div>
          ) : (
            <motion.div key="newsletter" initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-10 }} transition={{ duration:0.2 }}>
              <NewsletterTab pin={pin}/>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Login Screen ───────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (pin: string) => void }) {
  const [pin,     setPin]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!pin) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/api/admin/stats`, { headers: { 'x-admin-pin': pin } })
      if (res.ok) { onLogin(pin) }
      else { setError('PIN incorrecto'); setPin('') }
    } catch {
      setError('No se pudo conectar al servidor')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background:'#0a0a0f' }}>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-violet/8 rounded-full blur-3xl"/>
      </div>
      <motion.div initial={{ opacity:0, y:30 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}
        className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center"
            style={{ background:'rgba(129,215,66,0.1)', border:'1px solid rgba(129,215,66,0.25)' }}>
            <Lock size={28} className="text-brand-violet"/>
          </div>
          <h1 className="text-white font-bold text-2xl" style={{ fontFamily:'Space Grotesk' }}>Panel de Admin</h1>
          <p className="text-white/40 text-sm mt-1" style={{ fontFamily:'Inter' }}>Ingresa el PIN para continuar</p>
        </div>
        <div className="rounded-3xl p-8 border" style={{ background:'rgba(255,255,255,0.03)', backdropFilter:'blur(20px)', borderColor:'rgba(129,215,66,0.15)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-white/50 text-xs block mb-2" style={{ fontFamily:'Space Grotesk' }}>PIN de administrador</label>
              <input type="password" value={pin} onChange={e => { setPin(e.target.value); setError('') }}
                placeholder="••••••••••" autoFocus
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 text-sm tracking-widest focus:outline-none focus:border-brand-violet/50 transition-colors text-center"
                style={{ fontFamily:'Space Grotesk', letterSpacing:'0.2em' }}/>
            </div>
            {error && (
              <motion.p initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }}
                className="text-red-400 text-xs text-center bg-red-400/10 border border-red-400/20 rounded-xl py-2">{error}</motion.p>
            )}
            <motion.button type="submit" disabled={loading||!pin}
              whileHover={!loading ? { scale:1.02 } : {}} whileTap={!loading ? { scale:0.98 } : {}}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ fontFamily:'Space Grotesk', background:'linear-gradient(135deg,#81d742,#06b6d4)' }}>
              {loading ? 'Verificando...' : 'Ingresar'}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

// ── Root ───────────────────────────────────────────────────────────────────
export default function Admin() {
  const [pin, setPin] = useState<string|null>(() => sessionStorage.getItem(ADMIN_PIN_KEY))

  function handleLogin(p: string)  { sessionStorage.setItem(ADMIN_PIN_KEY, p); setPin(p) }
  function handleLogout()          { sessionStorage.removeItem(ADMIN_PIN_KEY); setPin(null) }

  return (
    <AnimatePresence mode="wait">
      {pin ? (
        <motion.div key="dashboard" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.3 }}>
          <Dashboard pin={pin} onLogout={handleLogout}/>
        </motion.div>
      ) : (
        <motion.div key="login" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} transition={{ duration:0.3 }}>
          <LoginScreen onLogin={handleLogin}/>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
