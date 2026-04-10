-- =============================================
-- Rich seed data for testing — 10 diverse listings
-- across multiple states, property types, and features.
--
-- Uses the first profile as the owner. Safe to re-run:
-- deletes prior seed rows by address before inserting.
-- =============================================

DO $$
DECLARE
    owner_id uuid;
BEGIN
    SELECT id INTO owner_id FROM public.profiles ORDER BY created_at LIMIT 1;
    IF owner_id IS NULL THEN
        RAISE EXCEPTION 'No profile rows found. Sign up at least one user first.';
    END IF;

    -- Clean up prior runs
    DELETE FROM public.listings
    WHERE address IN (
        '742 Evergreen Terrace',
        '1600 Pennsylvania Ave NW',
        '350 Fifth Avenue',
        '8844 Lakeshore Drive',
        '2200 Mountain View Road',
        '15 Oceanfront Way',
        '9901 Prairie Wind Lane',
        '445 Live Oak Circle',
        '7720 Desert Bloom Trail',
        '120 Timber Ridge Court'
    );

    -- ============ 1. Classic suburban home — Colorado ============
    INSERT INTO public.listings (
        user_id, status, address, city, state, zip, county,
        lat, lng, location,
        property_type, listing_type, price,
        sqft, lot_size, lot_unit, beds, full_baths, half_baths,
        year_built, garage, garage_stalls, stories, single_story,
        basement, basement_finished,
        waterfront, view_types, features,
        water_source, sewer_type,
        title, description, highlights, listed_at
    ) VALUES (
        owner_id, 'active', '742 Evergreen Terrace', 'Boulder', 'CO', '80302', 'Boulder',
        40.0150, -105.2705,
        ST_SetSRID(ST_MakePoint(-105.2705, 40.0150), 4326)::geography,
        'residential', 'for_sale', 575000,
        2400, 0.28, 'acres', 4, 3, 1,
        2005, TRUE, 2, 2, FALSE,
        TRUE, TRUE,
        FALSE, ARRAY['mountain'], ARRAY['open_concept','updated_kitchen','granite_quartz','stainless_appliances','kitchen_island','hardwood_floors','deck','fenced_yard','central_ac','fireplace','smart_home'],
        'city', 'city',
        'Mountain-view 4BR in Boulder with updated kitchen',
        'Stunning 4-bedroom home with unobstructed views of the Flatirons. Open concept main level with hardwood floors throughout, updated kitchen with granite countertops and stainless appliances. Finished walkout basement, fenced yard, and a massive deck perfect for morning coffee with mountain views.',
        '["Mountain views of the Flatirons","Updated kitchen 2023","Finished walkout basement","Smart home with Ecobee + Ring","Bike path access 2 blocks"]'::jsonb,
        NOW() - INTERVAL '2 days'
    );

    -- ============ 2. Waterfront cottage — Vermont ============
    INSERT INTO public.listings (
        user_id, status, address, city, state, zip, county,
        lat, lng, location,
        property_type, listing_type, price,
        sqft, lot_size, lot_unit, beds, full_baths, half_baths,
        year_built, garage, garage_stalls, stories, single_story,
        waterfront, water_body_name, view_types, features,
        water_source, sewer_type,
        title, description, highlights, listed_at
    ) VALUES (
        owner_id, 'active', '8844 Lakeshore Drive', 'Stowe', 'VT', '05672', 'Lamoille',
        44.4654, -72.6874,
        ST_SetSRID(ST_MakePoint(-72.6874, 44.4654), 4326)::geography,
        'residential', 'for_sale', 425000,
        1800, 0.75, 'acres', 3, 2, 0,
        1962, TRUE, 1, 1.5, FALSE,
        TRUE, 'Lake Stowe',
        ARRAY['water','lake','woods'],
        ARRAY['fireplace','covered_porch','dock','hardwood_floors','mud_room','walk_in_pantry'],
        'well', 'septic',
        'Charming lakefront cottage on Lake Stowe',
        'A cozy 3-bedroom cottage with 150 feet of private lake frontage. Original hardwood floors, stone fireplace, covered porch overlooking the water, and a private dock. The kind of place you never want to leave. Well-maintained with a newer roof (2021) and updated electrical.',
        '["150 ft lake frontage","Private dock","Stone fireplace","New roof 2021","Covered porch with lake view"]'::jsonb,
        NOW() - INTERVAL '5 days'
    );

    -- ============ 3. Modern condo — Texas ============
    INSERT INTO public.listings (
        user_id, status, address, city, state, zip, county,
        lat, lng, location,
        property_type, listing_type, price,
        sqft, beds, full_baths, half_baths,
        year_built, garage, garage_stalls, stories,
        hoa, hoa_fee, hoa_frequency,
        view_types, features,
        title, description, highlights, listed_at
    ) VALUES (
        owner_id, 'active', '350 Fifth Avenue', 'Austin', 'TX', '78701', 'Travis',
        30.2672, -97.7431,
        ST_SetSRID(ST_MakePoint(-97.7431, 30.2672), 4326)::geography,
        'condo', 'for_sale', 389000,
        1200, 2, 2, 0,
        2019, TRUE, 1, 1,
        TRUE, 350, 'monthly',
        ARRAY['city'],
        ARRAY['open_concept','stainless_appliances','granite_quartz','hardwood_floors','central_ac','smart_home','home_office'],
        'Modern 2BR downtown Austin condo with skyline views',
        'Sleek downtown condo in the heart of Austin. Floor-to-ceiling windows with city skyline views. Open concept living with quartz countertops, stainless appliances, and built-in home office nook. One reserved garage spot. Walk to everything — restaurants, music, trails.',
        '["Downtown Austin walkable location","Floor-to-ceiling windows","City skyline views","Built-in home office","One reserved parking spot"]'::jsonb,
        NOW() - INTERVAL '8 days'
    );

    -- ============ 4. Ranch on acreage — Montana ============
    INSERT INTO public.listings (
        user_id, status, address, city, state, zip, county,
        lat, lng, location,
        property_type, listing_type, price,
        sqft, lot_size, lot_unit, beds, full_baths, half_baths,
        year_built, garage, garage_stalls, stories, single_story,
        basement, waterfront,
        view_types, features,
        water_source, sewer_type,
        title, description, highlights, listed_at
    ) VALUES (
        owner_id, 'active', '2200 Mountain View Road', 'Bozeman', 'MT', '59715', 'Gallatin',
        45.6770, -111.0429,
        ST_SetSRID(ST_MakePoint(-111.0429, 45.6770), 4326)::geography,
        'residential', 'for_sale', 895000,
        3200, 5.0, 'acres', 4, 3, 1,
        1998, TRUE, 3, 1, TRUE,
        FALSE, FALSE,
        ARRAY['mountain','woods'],
        ARRAY['open_concept','main_level_master','master_ensuite','walk_in_closet','walk_in_pantry','main_level_laundry','covered_porch','fire_pit','workshop','fireplace','generator'],
        'well', 'septic',
        'Single-story ranch on 5 acres with Bridger Mountain views',
        'True single-story living on 5 beautiful acres just outside Bozeman. Soaring great room with stone fireplace, main-level primary suite with walk-in closet and en-suite bath, chef''s pantry, and 3-car attached garage. 30x40 heated workshop with concrete floor. Covered porch wraps two sides of the home. Mountain views in every direction.',
        '["Single story — no stairs","5 acres","Bridger Mountain views","30x40 heated workshop","3-car garage","Covered wraparound porch"]'::jsonb,
        NOW() - INTERVAL '1 day'
    );

    -- ============ 5. Beachfront — Florida ============
    INSERT INTO public.listings (
        user_id, status, address, city, state, zip, county,
        lat, lng, location,
        property_type, listing_type, price,
        sqft, lot_size, lot_unit, beds, full_baths, half_baths,
        year_built, garage, garage_stalls, stories,
        waterfront, water_body_name, view_types, features,
        title, description, highlights, listed_at
    ) VALUES (
        owner_id, 'active', '15 Oceanfront Way', 'Destin', 'FL', '32541', 'Okaloosa',
        30.3935, -86.4958,
        ST_SetSRID(ST_MakePoint(-86.4958, 30.3935), 4326)::geography,
        'residential', 'for_sale', 1250000,
        2800, 0.18, 'acres', 5, 4, 1,
        2016, TRUE, 2, 3,
        TRUE, 'Gulf of Mexico',
        ARRAY['water'],
        ARRAY['open_concept','master_ensuite','double_vanity','pool','outdoor_kitchen','deck','screened_porch','central_ac','smart_home','ev_charger'],
        'Gulf-front 5BR with pool and rooftop deck',
        'Live on the Gulf. Three-story coastal home with direct beach access, private pool, outdoor kitchen, and a rooftop deck with panoramic ocean views. Five bedrooms including a primary suite with double vanity and walk-in shower. Smart home throughout with EV charger in the garage.',
        '["Direct Gulf of Mexico beach access","Private saltwater pool","Rooftop deck with 360° views","Outdoor kitchen","EV charger in garage","Smart home with whole-house automation"]'::jsonb,
        NOW() - INTERVAL '3 days'
    );

    -- ============ 6. Land — Kansas prairie ============
    INSERT INTO public.listings (
        user_id, status, address, city, state, zip, county,
        lat, lng, location,
        property_type, listing_type, price,
        lot_size, lot_unit,
        terrain, road_access, utilities,
        title, description, highlights, listed_at
    ) VALUES (
        owner_id, 'active', '9901 Prairie Wind Lane', 'Salina', 'KS', '67401', 'Saline',
        38.8403, -97.6114,
        ST_SetSRID(ST_MakePoint(-97.6114, 38.8403), 4326)::geography,
        'land', 'for_sale', 175000,
        80.0, 'acres',
        ARRAY['flat','prairie','tillable'],
        'paved',
        ARRAY['electric','city_water'],
        '80-acre Kansas farm ground — tillable + CRP',
        '80 acres of prime farmland in central Kansas. 62 acres currently in crop production (corn/soy rotation), 18 acres in CRP with annual payment. Paved road frontage on two sides, electric at the lot line, rural water available. Flat, fertile, and ready to produce.',
        '["62 acres tillable","18 acres CRP with annual payment","Paved road on 2 sides","Electric at lot line","Rural water available","Mineral rights convey"]'::jsonb,
        NOW() - INTERVAL '12 days'
    );

    -- ============ 7. Historic home — Georgia ============
    INSERT INTO public.listings (
        user_id, status, address, city, state, zip, county,
        lat, lng, location,
        property_type, listing_type, price,
        sqft, lot_size, lot_unit, beds, full_baths, half_baths,
        year_built, garage, stories,
        features, view_types,
        title, description, highlights, listed_at
    ) VALUES (
        owner_id, 'active', '445 Live Oak Circle', 'Savannah', 'GA', '31401', 'Chatham',
        32.0809, -81.0912,
        ST_SetSRID(ST_MakePoint(-81.0912, 32.0809), 4326)::geography,
        'residential', 'for_sale', 695000,
        3400, 0.35, 'acres', 5, 3, 1,
        1892, FALSE, 2.5,
        ARRAY['hardwood_floors','fireplace','covered_porch','sunroom','walk_in_closet','double_vanity'],
        ARRAY['woods'],
        'Historic 1892 Victorian in Savannah''s Live Oak district',
        'A rare 5-bedroom Victorian with original hardwood floors, three fireplaces, 12-foot ceilings, and a wraparound porch draped in Spanish moss. Updated systems (HVAC 2020, plumbing 2018) behind period-correct details. Detached carriage house could be a studio or guest suite. Walking distance to Forsyth Park.',
        '["Original 1892 Victorian architecture","12-foot ceilings","3 working fireplaces","Wraparound porch","Detached carriage house","Walk to Forsyth Park"]'::jsonb,
        NOW() - INTERVAL '15 days'
    );

    -- ============ 8. Desert modern — Arizona ============
    INSERT INTO public.listings (
        user_id, status, address, city, state, zip, county,
        lat, lng, location,
        property_type, listing_type, price,
        sqft, lot_size, lot_unit, beds, full_baths, half_baths,
        year_built, garage, garage_stalls, stories, single_story,
        view_types, features,
        title, description, highlights, listed_at
    ) VALUES (
        owner_id, 'active', '7720 Desert Bloom Trail', 'Scottsdale', 'AZ', '85262', 'Maricopa',
        33.7313, -111.9226,
        ST_SetSRID(ST_MakePoint(-111.9226, 33.7313), 4326)::geography,
        'residential', 'for_sale', 785000,
        2600, 0.5, 'acres', 3, 3, 0,
        2021, TRUE, 2, 1, TRUE,
        ARRAY['mountain'],
        ARRAY['open_concept','main_level_master','master_ensuite','walk_in_closet','kitchen_island','stainless_appliances','pool','outdoor_kitchen','fire_pit','solar','ev_charger','smart_home','central_ac'],
        'Desert modern single-story with pool and mountain views',
        'Brand-new desert modern architecture on half an acre. Open-concept living with 20-foot ceilings, wall of glass facing the McDowell Mountains. Chef''s kitchen with waterfall island. Resort-style backyard: heated pool, outdoor kitchen, fire pit, and desert landscaping. Fully solar-powered with Tesla Powerwall and EV charger. Single story, ADA-friendly layout.',
        '["Built 2021 — like new","Solar powered + Tesla Powerwall","Heated pool + outdoor kitchen","Mountain views from every room","Single story ADA-friendly","EV charger in garage"]'::jsonb,
        NOW() - INTERVAL '4 days'
    );

    -- ============ 9. Land — wooded acreage — Tennessee ============
    INSERT INTO public.listings (
        user_id, status, address, city, state, zip, county,
        lat, lng, location,
        property_type, listing_type, price,
        lot_size, lot_unit,
        waterfront, water_body_name, view_types,
        terrain, road_access, utilities,
        title, description, highlights, listed_at
    ) VALUES (
        owner_id, 'active', '120 Timber Ridge Court', 'Gatlinburg', 'TN', '37738', 'Sevier',
        35.7143, -83.5102,
        ST_SetSRID(ST_MakePoint(-83.5102, 35.7143), 4326)::geography,
        'land', 'for_sale', 225000,
        12.0, 'acres',
        TRUE, 'Little Pigeon River',
        ARRAY['mountain','water','river','woods'],
        ARRAY['wooded','hilly','rolling'],
        'gravel',
        ARRAY['electric','internet'],
        '12 wooded acres on the Little Pigeon River near Gatlinburg',
        '12 acres of hardwood forest with 400 feet of river frontage on the Little Pigeon River. Mountain views, mature timber, and a cleared building pad with electric and fiber internet at the road. Gravel drive already in place. Perfect for a cabin, retreat, or homestead. Minutes from Gatlinburg and the Great Smoky Mountains National Park.',
        '["400 ft river frontage","Little Pigeon River","Mountain + river views","Electric + fiber at road","Cleared building pad","Minutes to Great Smoky Mountains NP"]'::jsonb,
        NOW() - INTERVAL '7 days'
    );

    -- ============ 10. Multi-family — North Carolina ============
    INSERT INTO public.listings (
        user_id, status, address, city, state, zip, county,
        lat, lng, location,
        property_type, listing_type, price,
        sqft, lot_size, lot_unit, beds, full_baths,
        year_built, garage, parking_spaces, stories,
        features,
        water_source, sewer_type,
        title, description, highlights, listed_at
    ) VALUES (
        owner_id, 'active', '1600 Pennsylvania Ave NW', 'Asheville', 'NC', '28801', 'Buncombe',
        35.5951, -82.5515,
        ST_SetSRID(ST_MakePoint(-82.5515, 35.5951), 4326)::geography,
        'multi-family', 'for_sale', 540000,
        3600, 0.22, 'acres', 6, 4,
        1955, FALSE, 4, 2,
        ARRAY['hardwood_floors','covered_porch','fenced_yard','central_ac','new_roof'],
        'city', 'city',
        'Duplex in Asheville — live in one, rent the other',
        'Well-maintained side-by-side duplex in walkable West Asheville. Each unit has 3 bedrooms, 2 full baths, and its own covered porch entry. Hardwood floors throughout, new roof 2024, updated HVAC. Currently both units rented at $1,450/month each. Live in one side and let the other cover your mortgage. 4 off-street parking spaces. Walking distance to breweries, restaurants, and the River Arts District.',
        '["Two 3BR/2BA units","Both currently rented ($1,450/mo each)","New roof 2024","Walking distance to West Asheville","4 off-street parking spaces","Live in one, rent the other"]'::jsonb,
        NOW() - INTERVAL '10 days'
    );

    -- =============================================
    -- SEED PHOTOS for each listing
    -- Uses Lorem Picsum for reliable placeholder images.
    -- Each seed string produces a consistent image.
    -- =============================================

    -- Clean up prior photo seed runs (photos cascade-delete with listings,
    -- but if we re-run just this section we want idempotency)
    DELETE FROM public.listing_photos
    WHERE listing_id IN (
        SELECT id FROM public.listings WHERE address IN (
            '742 Evergreen Terrace','8844 Lakeshore Drive','350 Fifth Avenue',
            '2200 Mountain View Road','15 Oceanfront Way','9901 Prairie Wind Lane',
            '445 Live Oak Circle','7720 Desert Bloom Trail','120 Timber Ridge Court',
            '1600 Pennsylvania Ave NW'
        )
    );

    -- 1. Boulder mountain home
    INSERT INTO public.listing_photos (listing_id, url, thumbnail_url, sort_order, is_primary) VALUES
    ((SELECT id FROM public.listings WHERE address = '742 Evergreen Terrace'),
     'https://picsum.photos/seed/boulder-exterior/1200/800',
     'https://picsum.photos/seed/boulder-exterior/400/300', 0, TRUE),
    ((SELECT id FROM public.listings WHERE address = '742 Evergreen Terrace'),
     'https://picsum.photos/seed/boulder-kitchen/1200/800',
     'https://picsum.photos/seed/boulder-kitchen/400/300', 1, FALSE),
    ((SELECT id FROM public.listings WHERE address = '742 Evergreen Terrace'),
     'https://picsum.photos/seed/boulder-living/1200/800',
     'https://picsum.photos/seed/boulder-living/400/300', 2, FALSE),
    ((SELECT id FROM public.listings WHERE address = '742 Evergreen Terrace'),
     'https://picsum.photos/seed/boulder-deck/1200/800',
     'https://picsum.photos/seed/boulder-deck/400/300', 3, FALSE);

    -- 2. Vermont lakefront cottage
    INSERT INTO public.listing_photos (listing_id, url, thumbnail_url, sort_order, is_primary) VALUES
    ((SELECT id FROM public.listings WHERE address = '8844 Lakeshore Drive'),
     'https://picsum.photos/seed/vermont-cottage/1200/800',
     'https://picsum.photos/seed/vermont-cottage/400/300', 0, TRUE),
    ((SELECT id FROM public.listings WHERE address = '8844 Lakeshore Drive'),
     'https://picsum.photos/seed/vermont-dock/1200/800',
     'https://picsum.photos/seed/vermont-dock/400/300', 1, FALSE),
    ((SELECT id FROM public.listings WHERE address = '8844 Lakeshore Drive'),
     'https://picsum.photos/seed/vermont-fireplace/1200/800',
     'https://picsum.photos/seed/vermont-fireplace/400/300', 2, FALSE),
    ((SELECT id FROM public.listings WHERE address = '8844 Lakeshore Drive'),
     'https://picsum.photos/seed/vermont-porch/1200/800',
     'https://picsum.photos/seed/vermont-porch/400/300', 3, FALSE);

    -- 3. Austin modern condo
    INSERT INTO public.listing_photos (listing_id, url, thumbnail_url, sort_order, is_primary) VALUES
    ((SELECT id FROM public.listings WHERE address = '350 Fifth Avenue'),
     'https://picsum.photos/seed/austin-building/1200/800',
     'https://picsum.photos/seed/austin-building/400/300', 0, TRUE),
    ((SELECT id FROM public.listings WHERE address = '350 Fifth Avenue'),
     'https://picsum.photos/seed/austin-skyline/1200/800',
     'https://picsum.photos/seed/austin-skyline/400/300', 1, FALSE),
    ((SELECT id FROM public.listings WHERE address = '350 Fifth Avenue'),
     'https://picsum.photos/seed/austin-kitchen/1200/800',
     'https://picsum.photos/seed/austin-kitchen/400/300', 2, FALSE),
    ((SELECT id FROM public.listings WHERE address = '350 Fifth Avenue'),
     'https://picsum.photos/seed/austin-office/1200/800',
     'https://picsum.photos/seed/austin-office/400/300', 3, FALSE);

    -- 4. Montana ranch
    INSERT INTO public.listing_photos (listing_id, url, thumbnail_url, sort_order, is_primary) VALUES
    ((SELECT id FROM public.listings WHERE address = '2200 Mountain View Road'),
     'https://picsum.photos/seed/montana-ranch/1200/800',
     'https://picsum.photos/seed/montana-ranch/400/300', 0, TRUE),
    ((SELECT id FROM public.listings WHERE address = '2200 Mountain View Road'),
     'https://picsum.photos/seed/montana-greatroom/1200/800',
     'https://picsum.photos/seed/montana-greatroom/400/300', 1, FALSE),
    ((SELECT id FROM public.listings WHERE address = '2200 Mountain View Road'),
     'https://picsum.photos/seed/montana-workshop/1200/800',
     'https://picsum.photos/seed/montana-workshop/400/300', 2, FALSE),
    ((SELECT id FROM public.listings WHERE address = '2200 Mountain View Road'),
     'https://picsum.photos/seed/montana-porch/1200/800',
     'https://picsum.photos/seed/montana-porch/400/300', 3, FALSE);

    -- 5. Florida beachfront
    INSERT INTO public.listing_photos (listing_id, url, thumbnail_url, sort_order, is_primary) VALUES
    ((SELECT id FROM public.listings WHERE address = '15 Oceanfront Way'),
     'https://picsum.photos/seed/florida-beach/1200/800',
     'https://picsum.photos/seed/florida-beach/400/300', 0, TRUE),
    ((SELECT id FROM public.listings WHERE address = '15 Oceanfront Way'),
     'https://picsum.photos/seed/florida-pool/1200/800',
     'https://picsum.photos/seed/florida-pool/400/300', 1, FALSE),
    ((SELECT id FROM public.listings WHERE address = '15 Oceanfront Way'),
     'https://picsum.photos/seed/florida-rooftop/1200/800',
     'https://picsum.photos/seed/florida-rooftop/400/300', 2, FALSE),
    ((SELECT id FROM public.listings WHERE address = '15 Oceanfront Way'),
     'https://picsum.photos/seed/florida-bedroom/1200/800',
     'https://picsum.photos/seed/florida-bedroom/400/300', 3, FALSE);

    -- 6. Kansas farmland
    INSERT INTO public.listing_photos (listing_id, url, thumbnail_url, sort_order, is_primary) VALUES
    ((SELECT id FROM public.listings WHERE address = '9901 Prairie Wind Lane'),
     'https://picsum.photos/seed/kansas-field/1200/800',
     'https://picsum.photos/seed/kansas-field/400/300', 0, TRUE),
    ((SELECT id FROM public.listings WHERE address = '9901 Prairie Wind Lane'),
     'https://picsum.photos/seed/kansas-aerial/1200/800',
     'https://picsum.photos/seed/kansas-aerial/400/300', 1, FALSE),
    ((SELECT id FROM public.listings WHERE address = '9901 Prairie Wind Lane'),
     'https://picsum.photos/seed/kansas-road/1200/800',
     'https://picsum.photos/seed/kansas-road/400/300', 2, FALSE),
    ((SELECT id FROM public.listings WHERE address = '9901 Prairie Wind Lane'),
     'https://picsum.photos/seed/kansas-sunset/1200/800',
     'https://picsum.photos/seed/kansas-sunset/400/300', 3, FALSE);

    -- 7. Savannah Victorian
    INSERT INTO public.listing_photos (listing_id, url, thumbnail_url, sort_order, is_primary) VALUES
    ((SELECT id FROM public.listings WHERE address = '445 Live Oak Circle'),
     'https://picsum.photos/seed/savannah-victorian/1200/800',
     'https://picsum.photos/seed/savannah-victorian/400/300', 0, TRUE),
    ((SELECT id FROM public.listings WHERE address = '445 Live Oak Circle'),
     'https://picsum.photos/seed/savannah-interior/1200/800',
     'https://picsum.photos/seed/savannah-interior/400/300', 1, FALSE),
    ((SELECT id FROM public.listings WHERE address = '445 Live Oak Circle'),
     'https://picsum.photos/seed/savannah-fireplace/1200/800',
     'https://picsum.photos/seed/savannah-fireplace/400/300', 2, FALSE),
    ((SELECT id FROM public.listings WHERE address = '445 Live Oak Circle'),
     'https://picsum.photos/seed/savannah-porch/1200/800',
     'https://picsum.photos/seed/savannah-porch/400/300', 3, FALSE);

    -- 8. Scottsdale desert modern
    INSERT INTO public.listing_photos (listing_id, url, thumbnail_url, sort_order, is_primary) VALUES
    ((SELECT id FROM public.listings WHERE address = '7720 Desert Bloom Trail'),
     'https://picsum.photos/seed/scottsdale-exterior/1200/800',
     'https://picsum.photos/seed/scottsdale-exterior/400/300', 0, TRUE),
    ((SELECT id FROM public.listings WHERE address = '7720 Desert Bloom Trail'),
     'https://picsum.photos/seed/scottsdale-pool/1200/800',
     'https://picsum.photos/seed/scottsdale-pool/400/300', 1, FALSE),
    ((SELECT id FROM public.listings WHERE address = '7720 Desert Bloom Trail'),
     'https://picsum.photos/seed/scottsdale-kitchen/1200/800',
     'https://picsum.photos/seed/scottsdale-kitchen/400/300', 2, FALSE),
    ((SELECT id FROM public.listings WHERE address = '7720 Desert Bloom Trail'),
     'https://picsum.photos/seed/scottsdale-living/1200/800',
     'https://picsum.photos/seed/scottsdale-living/400/300', 3, FALSE);

    -- 9. Tennessee wooded acreage
    INSERT INTO public.listing_photos (listing_id, url, thumbnail_url, sort_order, is_primary) VALUES
    ((SELECT id FROM public.listings WHERE address = '120 Timber Ridge Court'),
     'https://picsum.photos/seed/tennessee-river/1200/800',
     'https://picsum.photos/seed/tennessee-river/400/300', 0, TRUE),
    ((SELECT id FROM public.listings WHERE address = '120 Timber Ridge Court'),
     'https://picsum.photos/seed/tennessee-forest/1200/800',
     'https://picsum.photos/seed/tennessee-forest/400/300', 1, FALSE),
    ((SELECT id FROM public.listings WHERE address = '120 Timber Ridge Court'),
     'https://picsum.photos/seed/tennessee-mountain/1200/800',
     'https://picsum.photos/seed/tennessee-mountain/400/300', 2, FALSE),
    ((SELECT id FROM public.listings WHERE address = '120 Timber Ridge Court'),
     'https://picsum.photos/seed/tennessee-clearing/1200/800',
     'https://picsum.photos/seed/tennessee-clearing/400/300', 3, FALSE);

    -- 10. Asheville duplex
    INSERT INTO public.listing_photos (listing_id, url, thumbnail_url, sort_order, is_primary) VALUES
    ((SELECT id FROM public.listings WHERE address = '1600 Pennsylvania Ave NW'),
     'https://picsum.photos/seed/asheville-duplex/1200/800',
     'https://picsum.photos/seed/asheville-duplex/400/300', 0, TRUE),
    ((SELECT id FROM public.listings WHERE address = '1600 Pennsylvania Ave NW'),
     'https://picsum.photos/seed/asheville-living/1200/800',
     'https://picsum.photos/seed/asheville-living/400/300', 1, FALSE),
    ((SELECT id FROM public.listings WHERE address = '1600 Pennsylvania Ave NW'),
     'https://picsum.photos/seed/asheville-porch/1200/800',
     'https://picsum.photos/seed/asheville-porch/400/300', 2, FALSE),
    ((SELECT id FROM public.listings WHERE address = '1600 Pennsylvania Ave NW'),
     'https://picsum.photos/seed/asheville-street/1200/800',
     'https://picsum.photos/seed/asheville-street/400/300', 3, FALSE);

END $$;
