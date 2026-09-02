INSERT INTO public.dq_site_settings (key, value) VALUES
  ('home_quran_order_image_url', '/images/quran-product.jpg')
ON CONFLICT (key) DO NOTHING;
