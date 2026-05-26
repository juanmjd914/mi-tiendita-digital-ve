import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      as string
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!SUPABASE_URL || SUPABASE_URL.includes('PENDIENTE')) {
  console.warn('⚠️  Supabase keys no configuradas. Agrega VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY al .env')
}

export const supabase = createClient(
  SUPABASE_URL      || 'https://hhhijebsmajvphazvxlm.supabase.co',
  SUPABASE_ANON_KEY || '',
)

// ── Tipos alineados con la tabla `products` de Supabase ──────────
export interface Product {
  id:             number
  name:           string
  price:          number
  original_price: number | null
  category:       string
  description:    string | null
  badge:          string | null
  img_url:        string | null
  rating:         number
  stock:          number
  active:         boolean
  created_at:     string
}

export interface Order {
  id:             string
  flow_token:     string | null
  flow_order:     number | null
  status:         'pending' | 'paid' | 'rejected' | 'cancelled'
  total:          number
  customer_email: string
  customer_name:  string | null
  created_at:     string
  updated_at:     string
}
