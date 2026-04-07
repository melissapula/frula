-- =============================================
-- SEED: Demo listings for development
-- Run AFTER schema.sql, functions.sql, seed.sql
-- =============================================

-- ---------------------------------------------
-- 1. RLS policies so the anon key can read
--    active listings + their photos
-- ---------------------------------------------
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listing_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active listings are public read" ON public.listings;
CREATE POLICY "Active listings are public read"
  ON public.listings
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

DROP POLICY IF EXISTS "Photos of active listings are public read" ON public.listing_photos;
CREATE POLICY "Photos of active listings are public read"
  ON public.listing_photos
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.listings l
      WHERE l.id = listing_photos.listing_id
        AND l.status = 'active'
    )
  );

-- ---------------------------------------------
-- 2. Demo seller user
--    (uses a fixed UUID so the seed is idempotent)
-- ---------------------------------------------
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'demo@frulahomes.com',
  '',
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Demo Seller"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- Make sure profile exists (the trigger may not have fired if upsert)
INSERT INTO public.profiles (id, email, full_name)
VALUES ('00000000-0000-0000-0000-000000000001', 'demo@frulahomes.com', 'Demo Seller')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------
-- 3. Six demo listings around Bemidji, MN
-- ---------------------------------------------
INSERT INTO public.listings (
  id, user_id, status, address, city, state, zip, county, lat, lng,
  property_type, price, sqft, lot_size, beds, full_baths, half_baths,
  year_built, garage, garage_stalls, basement, basement_finished,
  title, description, highlights, heat_type, water_source, sewer_type,
  listed_at, expires_at
) VALUES
(
  '11111111-1111-1111-1111-111111111101',
  '00000000-0000-0000-0000-000000000001',
  'active',
  '1842 Birchmont Beach Rd NE', 'Bemidji', 'MN', '56601', 'Beltrami',
  47.5305, -94.8611,
  'residential', 425000, 2400, 0.65, 4, 2, 1,
  1998, true, 2, true, true,
  'Lakefront 4BR with Walkout Basement',
  'Stunning lakefront home on Lake Bemidji with 100ft of shoreline. Open floor plan, vaulted ceilings, and a finished walkout basement perfect for entertaining. Recent updates include a new roof (2022) and updated kitchen.',
  '["100ft lake frontage","New roof 2022","Walkout basement","Vaulted ceilings"]'::jsonb,
  'forced air', 'well', 'septic',
  NOW() - INTERVAL '12 days', NOW() + INTERVAL '78 days'
),
(
  '11111111-1111-1111-1111-111111111102',
  '00000000-0000-0000-0000-000000000001',
  'active',
  '512 America Ave NW', 'Bemidji', 'MN', '56601', 'Beltrami',
  47.4742, -94.8860,
  'residential', 218000, 1450, 0.18, 3, 1, 1,
  1962, true, 1, true, false,
  'Charming 3BR Near Downtown',
  'Move-in ready 1962 rambler walking distance to downtown Bemidji and Lake Bemidji. Original hardwood floors, updated bathroom, and a large fenced backyard. Perfect starter home or investment property.',
  '["Walk to downtown","Original hardwood","Fenced yard","Updated bath"]'::jsonb,
  'forced air', 'city', 'city',
  NOW() - INTERVAL '5 days', NOW() + INTERVAL '85 days'
),
(
  '11111111-1111-1111-1111-111111111103',
  '00000000-0000-0000-0000-000000000001',
  'active',
  '8745 Movil Lake Rd NE', 'Bemidji', 'MN', '56601', 'Beltrami',
  47.6422, -94.8005,
  'residential', 549000, 3100, 2.40, 5, 3, 0,
  2015, true, 3, true, true,
  'Modern 5BR on 2.4 Acres',
  'Beautiful contemporary home built in 2015 on 2.4 wooded acres. Gourmet kitchen with granite counters and stainless appliances, primary suite with spa bath, and a heated 3-car garage. Geothermal heating keeps utility bills low.',
  '["2.4 acres","Geothermal heat","3-car heated garage","Gourmet kitchen","Built 2015"]'::jsonb,
  'geothermal', 'well', 'septic',
  NOW() - INTERVAL '20 days', NOW() + INTERVAL '70 days'
),
(
  '11111111-1111-1111-1111-111111111104',
  '00000000-0000-0000-0000-000000000001',
  'active',
  '321 14th St NW', 'Bemidji', 'MN', '56601', 'Beltrami',
  47.4810, -94.8902,
  'residential', 165000, 1100, 0.14, 2, 1, 0,
  1948, false, 0, true, false,
  'Cozy 2BR Bungalow',
  'Adorable bungalow in a quiet neighborhood. Updated electrical and plumbing, new windows in 2021, and a sweet front porch. Affordable entry into the Bemidji market.',
  '["New windows 2021","Updated electrical","Quiet street","Front porch"]'::jsonb,
  'forced air', 'city', 'city',
  NOW() - INTERVAL '3 days', NOW() + INTERVAL '87 days'
),
(
  '11111111-1111-1111-1111-111111111105',
  '00000000-0000-0000-0000-000000000001',
  'active',
  '4521 Lavinia Rd SW', 'Bemidji', 'MN', '56601', 'Beltrami',
  47.4188, -94.9355,
  'residential', 339000, 1980, 1.10, 3, 2, 0,
  2006, true, 2, true, true,
  'Hill Country 3BR with Finished Basement',
  'Well-maintained 2006 build on a peaceful 1.1-acre lot just minutes from Lake Bemidji State Park. Open concept main floor, finished basement family room, and a low-maintenance composite deck.',
  '["Composite deck","Finished basement","1.1 acres","Near state park"]'::jsonb,
  'forced air', 'well', 'septic',
  NOW() - INTERVAL '8 days', NOW() + INTERVAL '82 days'
),
(
  '11111111-1111-1111-1111-111111111106',
  '00000000-0000-0000-0000-000000000001',
  'active',
  '12 Wedgewood Ln', 'Cass Lake', 'MN', '56633', 'Cass',
  47.3791, -94.6088,
  'residential', 289000, 1750, 0.42, 3, 2, 0,
  1985, true, 2, false, false,
  'Cass Lake 3BR with Detached Workshop',
  'Solid 1985 split-level with a huge detached workshop perfect for hobbies, ATVs, or a small business. Walking distance to Cass Lake and the Chippewa National Forest.',
  '["Detached workshop","Walk to Cass Lake","Near national forest","Split-level"]'::jsonb,
  'forced air', 'well', 'septic',
  NOW() - INTERVAL '15 days', NOW() + INTERVAL '75 days'
)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------
-- 4. Demo photos (Unsplash, free for any use)
-- ---------------------------------------------
INSERT INTO public.listing_photos (listing_id, url, sort_order, is_primary) VALUES
('11111111-1111-1111-1111-111111111101', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80', 0, true),
('11111111-1111-1111-1111-111111111101', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80', 1, false),
('11111111-1111-1111-1111-111111111102', 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80', 0, true),
('11111111-1111-1111-1111-111111111103', 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80', 0, true),
('11111111-1111-1111-1111-111111111104', 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&q=80', 0, true),
('11111111-1111-1111-1111-111111111105', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=80', 0, true),
('11111111-1111-1111-1111-111111111106', 'https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1200&q=80', 0, true)
ON CONFLICT DO NOTHING;
