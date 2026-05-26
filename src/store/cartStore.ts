import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartProduct {
  id: number
  name: string
  price: number
  img: string
  category: string
  badge?: string
}

export interface CartItem {
  product: CartProduct
  quantity: number
}

interface CartState {
  items: CartItem[]
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  addItem: (product: CartProduct) => void
  removeItem: (id: number) => void
  updateQuantity: (id: number, qty: number) => void
  clearCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      openCart:   () => set({ isOpen: true }),
      closeCart:  () => set({ isOpen: false }),
      toggleCart: () => set(s => ({ isOpen: !s.isOpen })),

      addItem: (product) => {
        const items = get().items
        const existing = items.find(i => i.product.id === product.id)
        if (existing) {
          set({
            items: items.map(i =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
            isOpen: true,
          })
        } else {
          set({ items: [...items, { product, quantity: 1 }], isOpen: true })
        }
      },

      removeItem: (id) =>
        set(s => ({ items: s.items.filter(i => i.product.id !== id) })),

      updateQuantity: (id, qty) =>
        set(s => ({
          items: qty <= 0
            ? s.items.filter(i => i.product.id !== id)
            : s.items.map(i => i.product.id === id ? { ...i, quantity: qty } : i),
        })),

      clearCart: () => set({ items: [] }),
      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      totalPrice: () => get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
    }),
    {
      name: 'mi-tiendita-digital-ve-cart',
      partialize: state => ({ items: state.items }),
    }
  )
)
