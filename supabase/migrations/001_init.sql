-- ═══════════════════════════════════════════════════════════════
--  Mi Tiendita Digital Ve — Esquema inicial
--  Ejecutar en: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── Tabla productos ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id            SERIAL PRIMARY KEY,
  name          TEXT          NOT NULL,
  price         INTEGER       NOT NULL,          -- precio en CLP (sin decimales)
  original_price INTEGER,                        -- precio tachado (NULL si no hay)
  category      TEXT          NOT NULL,
  description   TEXT,
  badge         TEXT,                            -- 'OFERTA', 'NUEVO', 'HOT', etc.
  img_url       TEXT,                            -- URL imagen en Supabase Storage
  rating        DECIMAL(2,1)  DEFAULT 5.0,
  stock         INTEGER       DEFAULT 99,
  active        BOOLEAN       DEFAULT true,
  created_at    TIMESTAMPTZ   DEFAULT NOW()
);

-- ── Tabla pedidos ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_token     TEXT          UNIQUE,            -- token devuelto por Flow
  flow_order     BIGINT,                          -- número de orden Flow
  status         TEXT          DEFAULT 'pending', -- pending | paid | rejected | cancelled
  total          INTEGER       NOT NULL,
  customer_email TEXT          NOT NULL,
  customer_name  TEXT,
  created_at     TIMESTAMPTZ   DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   DEFAULT NOW()
);

-- ── Tabla items de pedido ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_items (
  id          SERIAL   PRIMARY KEY,
  order_id    UUID     REFERENCES orders(id) ON DELETE CASCADE,
  product_id  INTEGER  REFERENCES products(id),
  name        TEXT     NOT NULL,
  price       INTEGER  NOT NULL,
  quantity    INTEGER  NOT NULL
);

-- ── Tabla newsletter ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id         SERIAL      PRIMARY KEY,
  email      TEXT        UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Row Level Security ───────────────────────────────────────────
ALTER TABLE products               ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer productos activos (frontend público)
CREATE POLICY "Leer productos activos"
  ON products FOR SELECT
  USING (active = true);

-- El backend (service_role) tiene acceso total → no necesita políticas adicionales
-- El anon key sólo puede leer productos

-- ── Índices ──────────────────────────────────────────────────────
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_active    ON products(active);
CREATE INDEX idx_orders_status      ON orders(status);
CREATE INDEX idx_orders_flow_token  ON orders(flow_token);

-- ── Función auto-actualizar updated_at ───────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ═══════════════════════════════════════════════════════════════
--  Datos iniciales — productos reales
-- ═══════════════════════════════════════════════════════════════
INSERT INTO products (name, price, original_price, category, description, badge, img_url, rating, stock) VALUES

('Gabinete Gamer Cougar MX410-T',
 52500, 85000, 'Gabinetes Gamer',
 'Gabinete gaming con ventana lateral de vidrio templado, panel frontal mesh para máximo flujo de aire y soporte para refrigeración líquida. Compatible con ATX, Micro-ATX y Mini-ITX. Incluye 3 ventiladores RGB precargados.',
 'OFERTA',
 'https://hhhijebsmajvphazvxlm.supabase.co/storage/v1/object/public/Productos/gabinete-cougar-mx410t.webp',
 5.0, 5),

('Soporte de Escritorio para Micrófono Philco',
 7990, NULL, 'Accesorios',
 'Soporte de escritorio articulado para micrófono con brazo flexible de 360° y base con contrapeso. Compatible con micrófonos de podcast, streaming y grabación. Fácil instalación sin herramientas.',
 'NUEVO',
 'https://hhhijebsmajvphazvxlm.supabase.co/storage/v1/object/public/Productos/soporte-microfono-philco.webp',
 4.0, 15),

('Powerbank Carga Inalámbrica Philco',
 15200, NULL, 'Accesorios',
 'Powerbank de 10.000 mAh con carga inalámbrica Qi integrada. Compatible con iPhone, Samsung y cualquier dispositivo con Qi. Salida USB-A + USB-C. Indicador LED de batería. Carga rápida 18W.',
 'NUEVO',
 'https://hhhijebsmajvphazvxlm.supabase.co/storage/v1/object/public/Productos/powerbank-philco.webp',
 4.0, 20),

('Joystick Bluetooth 3.0 para Celular Ultra',
 19990, NULL, 'Accesorios',
 'Control inalámbrico Bluetooth 3.0 compatible con Android e iOS. Joysticks analógicos de alta precisión, gatillos L2/R2 y 4 botones de acción. Batería recargable de 600 mAh. Ideal para emuladores y gaming mobile.',
 'HOT',
 'https://hhhijebsmajvphazvxlm.supabase.co/storage/v1/object/public/Productos/joystick-bluetooth-ultra.webp',
 5.0, 30),

('Cable USB Tipo C a 3.5mm Auxiliar',
 3690, NULL, 'Accesorios',
 'Cable adaptador DAC USB Tipo-C a jack 3.5mm estéreo. Compatible con Samsung, Xiaomi, Huawei y todos los smartphones modernos sin conector de audio. Calidad de sonido 24-bit/96kHz.',
 NULL,
 'https://hhhijebsmajvphazvxlm.supabase.co/storage/v1/object/public/Productos/cable-usbc-35mm.webp',
 4.0, 50),

('Gabinete Gamer Cougar MX410-T Pro',
 52500, 85000, 'Gabinetes Gamer',
 'Versión Pro del MX410-T con panel lateral de vidrio templado extra-grueso, soporte PSU shroud y gestión de cables mejorada. Incluye 4 ventiladores ARGB de 120mm y hub controlador.',
 'OFERTA',
 'https://hhhijebsmajvphazvxlm.supabase.co/storage/v1/object/public/Productos/gabinete-cougar-mx410t-pro.webp',
 5.0, 3),

('Headset Gamer Philco 7.1 Surround',
 24990, 34990, 'Audio y Video',
 'Auriculares gaming con sonido surround virtual 7.1 canales. Drivers de 50mm de alta fidelidad, micrófono retráctil con cancelación de ruido. Compatible con PC, PS4, PS5 y Xbox. Cojines de memoria viscoelástica.',
 'OFERTA',
 'https://hhhijebsmajvphazvxlm.supabase.co/storage/v1/object/public/Productos/headset-philco-71.webp',
 4.5, 12),

('Mouse Gamer RGB 6400 DPI',
 12990, NULL, 'Computación',
 'Mouse gaming con sensor óptico de 6400 DPI ajustable en 4 niveles. 7 botones programables, iluminación RGB personalizable y cable trenzado de 1.8m. Switches con vida útil de 20 millones de clics.',
 'NUEVO',
 'https://hhhijebsmajvphazvxlm.supabase.co/storage/v1/object/public/Productos/mouse-gamer-rgb.webp',
 4.5, 25);
