-- Bucket público para imagens de produtos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Leitura pública
DROP POLICY IF EXISTS "product-images: leitura publica" ON storage.objects;
CREATE POLICY "product-images: leitura publica"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Upload: apenas admin
DROP POLICY IF EXISTS "product-images: admin envia" ON storage.objects;
CREATE POLICY "product-images: admin envia"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Substituição: apenas admin
DROP POLICY IF EXISTS "product-images: admin atualiza" ON storage.objects;
CREATE POLICY "product-images: admin atualiza"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Deleção: apenas admin
DROP POLICY IF EXISTS "product-images: admin deleta" ON storage.objects;
CREATE POLICY "product-images: admin deleta"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images'
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);
