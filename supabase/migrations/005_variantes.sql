-- 005: variantes de producto (color, largo, modelo…), cada una con su stock y foto.

CREATE TABLE IF NOT EXISTS product_variants (
  id          SERIAL PRIMARY KEY,
  product_id  INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  kind        TEXT    NOT NULL DEFAULT 'Color',
  label       TEXT    NOT NULL,
  sku         TEXT,
  price       INTEGER CHECK (price IS NULL OR price >= 0),          -- NULL = usa el precio del producto
  original_price INTEGER CHECK (original_price IS NULL OR original_price >= 0),
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  img_url     TEXT,
  gallery     TEXT[]  NOT NULL DEFAULT '{}',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, label)
);
CREATE INDEX IF NOT EXISTS idx_variants_product ON product_variants(product_id);

DROP TRIGGER IF EXISTS product_variants_set_updated_at ON product_variants;
CREATE TRIGGER product_variants_set_updated_at
  BEFORE UPDATE ON product_variants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leer variantes activas" ON product_variants;
CREATE POLICY "Leer variantes activas" ON product_variants
  FOR SELECT USING (active = true);

-- Los pedidos recuerdan qué variante se compró (el nombre queda guardado aunque se borre).
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id    INTEGER REFERENCES product_variants(id) ON DELETE SET NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_label TEXT;

-- Ajuste atómico de stock por variante (mismo patrón que adjust_stock).
CREATE OR REPLACE FUNCTION adjust_variant_stock(p_id INTEGER, p_delta INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE new_stock INTEGER;
BEGIN
  UPDATE product_variants
     SET stock = GREATEST(0, COALESCE(stock, 0) + p_delta)
   WHERE id = p_id
   RETURNING stock INTO new_stock;
  RETURN new_stock;
END;
$$;

-- Verificación
SELECT
  (SELECT count(*) FROM information_schema.tables  WHERE table_name = 'product_variants') AS tabla_variantes,
  (SELECT count(*) FROM information_schema.columns WHERE table_name = 'order_items' AND column_name IN ('variant_id','variant_label')) AS columnas_pedido,
  (SELECT count(*) FROM pg_proc WHERE proname = 'adjust_variant_stock') AS funcion_stock;
