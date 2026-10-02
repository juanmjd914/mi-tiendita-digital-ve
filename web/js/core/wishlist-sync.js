// Fusiona los favoritos guardados en el navegador con los de la cuenta (tabla wishlist).
import { sb } from './auth.js'
import { wishlist } from './store.js'

export async function syncWishlist(userId) {
  if (!userId) return
  const local = wishlist.items()
  if (local.length) {
    await sb.from('wishlist').upsert(local.map((i) => ({ user_id: userId, product_id: i.id })), { onConflict: 'user_id,product_id', ignoreDuplicates: true })
  }
  const { data } = await sb.from('wishlist').select('product_id, created_at').eq('user_id', userId)
  if (!data) return
  try {
    localStorage.setItem('mtd_wishlist_v1', JSON.stringify(data.map((r) => ({ id: r.product_id, addedAt: r.created_at }))))
  } catch { /* sin almacenamiento */ }
  window.dispatchEvent(new CustomEvent('wishlist:change'))
}

// Refleja en la cuenta cada cambio de favoritos hecho con sesión iniciada.
export function mirrorWishlist(userId) {
  let prev = new Set(wishlist.items().map((i) => i.id))
  window.addEventListener('wishlist:change', async () => {
    const now = new Set(wishlist.items().map((i) => i.id))
    const added = [...now].filter((id) => !prev.has(id))
    const removed = [...prev].filter((id) => !now.has(id))
    prev = now
    if (added.length) await sb.from('wishlist').upsert(added.map((id) => ({ user_id: userId, product_id: id })), { onConflict: 'user_id,product_id', ignoreDuplicates: true })
    if (removed.length) await sb.from('wishlist').delete().eq('user_id', userId).in('product_id', removed)
  })
}
