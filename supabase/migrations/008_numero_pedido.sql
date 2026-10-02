-- 008 — Número de pedido legible: AAAAMMDD-N (N = correlativo del día, hora de Chile).
-- Ej.: el primer pedido del 1 de octubre de 2026 es 20261001-1, el segundo 20261001-2.
-- El contador es atómico (INSERT … ON CONFLICT … RETURNING), así dos compras simultáneas
-- nunca reciben el mismo número.

CREATE TABLE IF NOT EXISTS order_counters (
  day   DATE PRIMARY KEY,
  last  INTEGER NOT NULL DEFAULT 0
);
ALTER TABLE order_counters ENABLE ROW LEVEL SECURITY;  -- sin políticas: solo el backend (service role)

ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS orders_order_number_key ON orders(order_number);

CREATE OR REPLACE FUNCTION assign_order_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d DATE := (COALESCE(NEW.created_at, now()) AT TIME ZONE 'America/Santiago')::date;
  n INTEGER;
BEGIN
  IF NEW.order_number IS NOT NULL THEN
    RETURN NEW;
  END IF;
  INSERT INTO order_counters (day, last) VALUES (d, 1)
  ON CONFLICT (day) DO UPDATE SET last = order_counters.last + 1
  RETURNING last INTO n;
  NEW.order_number := to_char(d, 'YYYYMMDD') || '-' || n;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_assign_number ON orders;
CREATE TRIGGER orders_assign_number
  BEFORE INSERT ON orders
  FOR EACH ROW EXECUTE FUNCTION assign_order_number();

-- Pedidos existentes (si los hay) reciben número según su fecha, en orden de creación.
DO $$
DECLARE r RECORD; d DATE; n INTEGER;
BEGIN
  FOR r IN SELECT id, created_at FROM orders WHERE order_number IS NULL ORDER BY created_at LOOP
    d := (r.created_at AT TIME ZONE 'America/Santiago')::date;
    INSERT INTO order_counters (day, last) VALUES (d, 1)
    ON CONFLICT (day) DO UPDATE SET last = order_counters.last + 1
    RETURNING last INTO n;
    UPDATE orders SET order_number = to_char(d, 'YYYYMMDD') || '-' || n WHERE id = r.id;
  END LOOP;
END $$;

-- Verificación: debe devolver 1 fila con la columna y el trigger creados
SELECT
  (SELECT count(*) FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'order_number') AS columna,
  (SELECT count(*) FROM pg_trigger WHERE tgname = 'orders_assign_number') AS trigger_creado;
