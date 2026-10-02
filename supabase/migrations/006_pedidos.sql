-- 006: pedidos con dirección chilena estructurada, cliente vinculado y fechas por etapa.

ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id            UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_rut       TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_region    TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_comuna    TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_street    TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_number    TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_apartment TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_reference TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS terms_accepted_at  TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at            TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS preparing_at       TIMESTAMPTZ;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivered_at       TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_orders_user  ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(lower(customer_email));

-- Estampa la fecha de cada etapa al cambiar el estado (webhook, consulta de pago o admin).
CREATE OR REPLACE FUNCTION orders_stamp_stages()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS DISTINCT FROM 'paid') AND NEW.paid_at IS NULL THEN
    NEW.paid_at := now();
  END IF;
  IF NEW.fulfillment_status IS DISTINCT FROM OLD.fulfillment_status THEN
    IF NEW.fulfillment_status = 'preparing' AND NEW.preparing_at IS NULL THEN NEW.preparing_at := now(); END IF;
    IF NEW.fulfillment_status = 'shipped'   AND NEW.shipped_at   IS NULL THEN NEW.shipped_at   := now(); END IF;
    IF NEW.fulfillment_status = 'delivered' AND NEW.delivered_at IS NULL THEN NEW.delivered_at := now(); END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS orders_stamp_stages ON orders;
CREATE TRIGGER orders_stamp_stages
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION orders_stamp_stages();

UPDATE orders SET paid_at = COALESCE(updated_at, created_at) WHERE status = 'paid' AND paid_at IS NULL;

-- Envío gratis en la ciudad local desde este monto (editable desde Ajustes del admin).
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS free_shipping_min_rancagua INTEGER NOT NULL DEFAULT 80000;

-- Verificación
SELECT
  (SELECT count(*) FROM information_schema.columns WHERE table_name = 'orders'
     AND column_name IN ('user_id','customer_rut','customer_region','customer_comuna','customer_street','customer_number',
                         'customer_apartment','customer_reference','terms_accepted_at','paid_at','preparing_at','delivered_at')) AS columnas_pedido,
  (SELECT count(*) FROM pg_trigger WHERE tgname = 'orders_stamp_stages') AS trigger_etapas,
  (SELECT free_shipping_min_rancagua FROM store_settings WHERE id = 1) AS envio_gratis_desde;
