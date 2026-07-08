-- ═══════════════════════════════════════════════════════════════
--  Mi Tiendita Digital Ve — Migración 003: panel admin robusto (FASE 5)
--  Ejecutar en: SQL Editor del proyecto de la tienda (hhhijebsmajvphazvxlm)
--  Segura de correr (IF NOT EXISTS). No borra datos.
--
--  Prepara: configuración de tienda (datos bancarios, envío, contacto),
--  métodos de entrega/pago, notas internas y costo de envío en pedidos,
--  e historial de ajustes de stock.
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Configuración de la tienda (fila única) ────────────────────
-- Saca del código todo lo hardcodeado. El backend lee/escribe esta fila.
CREATE TABLE IF NOT EXISTS store_settings (
  id                    INTEGER PRIMARY KEY DEFAULT 1,
  -- Datos bancarios (transferencia) — hoy estaban en server/email.js
  bank_name             TEXT DEFAULT 'Banco Falabella',
  bank_account_type     TEXT DEFAULT 'Cuenta Corriente',
  bank_account_number   TEXT DEFAULT '1-982-273710-0',
  bank_holder           TEXT DEFAULT 'Juan Carlos Mejias',
  bank_rut              TEXT DEFAULT '27.012.143-8',
  -- Envío / entrega
  delivery_cost_rancagua INTEGER DEFAULT 0,   -- costo del delivery en Rancagua (contra entrega y delivery local)
  shipping_flat_regions  INTEGER DEFAULT 0,    -- tarifa plana a regiones (Nivel 1 de la calculadora)
  pickup_enabled         BOOLEAN DEFAULT true, -- retiro en local (solo Rancagua)
  cod_enabled            BOOLEAN DEFAULT true, -- pago contra entrega (solo Rancagua)
  local_city             TEXT DEFAULT 'Rancagua', -- ciudad donde aplican retiro/COD/delivery local
  store_address          TEXT DEFAULT 'Rancagua, Región de O''Higgins',
  -- Contacto
  contact_email          TEXT DEFAULT 'soporte@mitienditadigitalve.com',
  contact_whatsapp       TEXT DEFAULT '56946216579',
  updated_at             TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT store_settings_singleton CHECK (id = 1)
);
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;  -- solo backend (service_role)
-- Inserta la fila única si no existe (con los valores por defecto = los actuales del código)
INSERT INTO store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- ── 2. Columnas nuevas en orders ──────────────────────────────────
ALTER TABLE orders ADD COLUMN IF NOT EXISTS admin_notes     TEXT;                       -- notas internas del admin
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost   INTEGER DEFAULT 0;          -- costo de envío cobrado
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_method TEXT DEFAULT 'delivery';    -- 'pickup' | 'delivery'
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method  TEXT;                       -- 'flow' | 'transfer' | 'cod'
-- Nota: el estado 'pending_cod' (contra entrega) es solo texto en la columna status; no requiere cambio de esquema.

-- ── 3. Historial de ajustes de stock (para la vista de inventario) ─
CREATE TABLE IF NOT EXISTS stock_adjustments (
  id          SERIAL PRIMARY KEY,
  product_id  INTEGER REFERENCES products(id) ON DELETE CASCADE,
  delta       INTEGER NOT NULL,          -- +/- unidades
  new_stock   INTEGER,                   -- stock resultante
  reason      TEXT,                      -- motivo (ej. 'ajuste manual', 'reposición')
  admin_user  TEXT,                      -- quién lo hizo
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE stock_adjustments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_stock_adj_product ON stock_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_delivery   ON orders(delivery_method);
CREATE INDEX IF NOT EXISTS idx_orders_payment    ON orders(payment_method);

-- ✅ Listo. Tras correr esto, desplegar el backend actualizado.
