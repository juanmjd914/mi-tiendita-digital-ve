-- 004: preparar el catálogo nuevo (sitio HTML)
-- Borrar un producto ya no rompe el historial: order_items guarda name y price.

ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;
ALTER TABLE order_items
  ADD CONSTRAINT order_items_product_id_fkey
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL;

-- slug nullable mientras el admin React siga vivo; el servidor nuevo lo genera.
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug              TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS featured          BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order        INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS gtin              TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at        TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS products_slug_key ON products(slug);

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_slug_format;
ALTER TABLE products
  ADD CONSTRAINT products_slug_format
  CHECK (slug IS NULL OR slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

DROP TRIGGER IF EXISTS products_set_updated_at ON products;
CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
