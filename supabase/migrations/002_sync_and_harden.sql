-- ═══════════════════════════════════════════════════════════════
--  Mi Tiendita Digital Ve — Migración 002: sincronización + robustez
--  Ejecutar en: Supabase Dashboard → SQL Editor (proyecto de la tienda)
--
--  Es SEGURA de correr sobre la base de producción actual: todo usa
--  IF NOT EXISTS / CREATE OR REPLACE. No borra datos.
--
--  Qué hace:
--   1. Documenta la tabla `coupons` (que hoy existe pero no estaba en 001).
--   2. Agrega columnas faltantes a `orders` (teléfono, dirección, cupón,
--      descuento, bandera de stock, fulfillment, tracking).
--   3. Agrega columnas ricas a `products` (marca, sku, garantía, specs,
--      galería, peso, umbral de stock bajo).
--   4. Crea funciones atómicas de inventario y cupones (evitan condiciones
--      de carrera): adjust_stock, increment_coupon_use, decrement_coupon_use.
--   5. Prepara el newsletter para bajas (unsubscribe_token + active).
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Tabla de cupones (documentada) ─────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  code           TEXT          UNIQUE NOT NULL,
  description    TEXT,
  discount_type  TEXT          NOT NULL DEFAULT 'percentage', -- 'percentage' | 'fixed'
  discount_value NUMERIC       NOT NULL,
  min_order      NUMERIC       DEFAULT 0,
  max_uses       INTEGER,                                     -- NULL = ilimitado
  uses           INTEGER       DEFAULT 0,
  active         BOOLEAN       DEFAULT true,
  expires_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ   DEFAULT NOW()
);
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
-- Sin políticas públicas: solo el backend (service_role) los gestiona.

-- ── 2. Columnas faltantes en orders ───────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone     TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_address   TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code        TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount    INTEGER DEFAULT 0;
-- Bandera de idempotencia: el stock se descuenta una sola vez por orden.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stock_decremented  BOOLEAN DEFAULT false;
-- Fulfillment / envío
ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_status TEXT DEFAULT 'pending'; -- pending|preparing|shipped|delivered
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code      TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at         TIMESTAMPTZ;

-- ── 3. Columnas ricas en products ─────────────────────────────────
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand               TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku                 TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS warranty            TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS weight_grams        INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 3;
-- specs: [{ "label": "Conexión", "value": "USB-C" }, ...]  ·  gallery: ["url1","url2",...]
ALTER TABLE products ADD COLUMN IF NOT EXISTS specs               JSONB  DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS gallery             JSONB  DEFAULT '[]'::jsonb;

-- ── 4. Funciones atómicas ─────────────────────────────────────────

-- Ajusta stock en +/- delta de forma atómica (nunca baja de 0).
CREATE OR REPLACE FUNCTION adjust_stock(p_id INTEGER, p_delta INTEGER)
RETURNS INTEGER AS $$
DECLARE new_stock INTEGER;
BEGIN
  UPDATE products
     SET stock = GREATEST(0, COALESCE(stock, 0) + p_delta)
   WHERE id = p_id
   RETURNING stock INTO new_stock;
  RETURN new_stock;
END;
$$ LANGUAGE plpgsql;

-- Incrementa el uso de un cupón de forma atómica, respetando max_uses.
CREATE OR REPLACE FUNCTION increment_coupon_use(p_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE coupons
     SET uses = COALESCE(uses, 0) + 1
   WHERE lower(code) = lower(trim(p_code))
     AND (max_uses IS NULL OR uses < max_uses);
END;
$$ LANGUAGE plpgsql;

-- Devuelve un uso al cancelar un pedido con cupón.
CREATE OR REPLACE FUNCTION decrement_coupon_use(p_code TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE coupons
     SET uses = GREATEST(0, COALESCE(uses, 0) - 1)
   WHERE lower(code) = lower(trim(p_code));
END;
$$ LANGUAGE plpgsql;

-- ── 5. Newsletter: soporte de baja ────────────────────────────────
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS active            BOOLEAN DEFAULT true;
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS unsubscribe_token UUID    DEFAULT gen_random_uuid();

-- ── 6. Índices útiles ─────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment ON orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_products_stock      ON products(stock);
CREATE INDEX IF NOT EXISTS idx_coupons_code        ON coupons(lower(code));

-- ✅ Listo. Tras correr esto, desplegar el backend actualizado.
