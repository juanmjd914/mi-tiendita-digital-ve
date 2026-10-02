-- 007: cuentas de cliente — perfil, direcciones, favoritos, reseñas y fotos de perfil.
-- Cada cliente solo puede ver y editar sus propios datos (RLS).

-- ---------- Perfil ----------
CREATE TABLE IF NOT EXISTS customer_profiles (
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name       TEXT,
  last_name        TEXT,
  rut              TEXT,
  phone            TEXT,
  avatar_url       TEXT,
  marketing_opt_in BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
DROP TRIGGER IF EXISTS customer_profiles_set_updated_at ON customer_profiles;
CREATE TRIGGER customer_profiles_set_updated_at BEFORE UPDATE ON customer_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Perfil propio: leer" ON customer_profiles;
DROP POLICY IF EXISTS "Perfil propio: crear" ON customer_profiles;
DROP POLICY IF EXISTS "Perfil propio: editar" ON customer_profiles;
CREATE POLICY "Perfil propio: leer"   ON customer_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Perfil propio: crear"  ON customer_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Perfil propio: editar" ON customer_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Crea el perfil automáticamente al registrarse (toma nombre y apellido del registro).
CREATE OR REPLACE FUNCTION public.handle_new_customer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.customer_profiles (user_id, first_name, last_name, marketing_opt_in)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    COALESCE((NEW.raw_user_meta_data->>'marketing_opt_in')::boolean, false)
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS on_auth_user_created_customer ON auth.users;
CREATE TRIGGER on_auth_user_created_customer AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_customer();

-- ---------- Direcciones ----------
CREATE TABLE IF NOT EXISTS customer_addresses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label       TEXT,
  region      TEXT NOT NULL,
  comuna      TEXT NOT NULL,
  street      TEXT NOT NULL,
  number      TEXT NOT NULL,
  apartment   TEXT,
  reference   TEXT,
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_addresses_user ON customer_addresses(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_addresses_default ON customer_addresses(user_id) WHERE is_default;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Direcciones propias" ON customer_addresses;
CREATE POLICY "Direcciones propias" ON customer_addresses FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------- Favoritos ----------
CREATE TABLE IF NOT EXISTS wishlist (
  user_id    UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, product_id)
);
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Favoritos propios" ON wishlist;
CREATE POLICY "Favoritos propios" ON wishlist FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------- Reseñas (se crean solo desde el servidor, que verifica la compra) ----------
CREATE TABLE IF NOT EXISTS product_reviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id        UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id       UUID REFERENCES orders(id) ON DELETE SET NULL,
  rating         SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment        TEXT CHECK (char_length(comment) <= 2000),
  author_display TEXT,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  moderated_at   TIMESTAMPTZ,
  UNIQUE (user_id, product_id)
);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id, status);
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reseñas aprobadas públicas" ON product_reviews;
DROP POLICY IF EXISTS "Reseñas propias" ON product_reviews;
CREATE POLICY "Reseñas aprobadas públicas" ON product_reviews FOR SELECT USING (status = 'approved');
CREATE POLICY "Reseñas propias" ON product_reviews FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ---------- Fotos de perfil (cada cliente solo escribe en su propia carpeta) ----------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Avatar propio: subir" ON storage.objects;
DROP POLICY IF EXISTS "Avatar propio: actualizar" ON storage.objects;
DROP POLICY IF EXISTS "Avatar propio: borrar" ON storage.objects;
CREATE POLICY "Avatar propio: subir" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Avatar propio: actualizar" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Avatar propio: borrar" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Perfiles para clientes que ya tenían cuenta antes de esta migración
INSERT INTO customer_profiles (user_id, first_name, last_name)
SELECT id, raw_user_meta_data->>'first_name', raw_user_meta_data->>'last_name' FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- Verificación
SELECT
  (SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'
     AND table_name IN ('customer_profiles', 'customer_addresses', 'wishlist', 'product_reviews')) AS tablas_cliente,
  (SELECT count(*) FROM storage.buckets WHERE id = 'avatars') AS bucket_avatars,
  (SELECT count(*) FROM pg_trigger WHERE tgname = 'on_auth_user_created_customer') AS trigger_perfil,
  (SELECT count(*) FROM customer_profiles) AS perfiles;
