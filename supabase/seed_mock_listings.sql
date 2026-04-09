-- =============================================
-- Mock listings: 2 land parcels + 1 commercial.
-- Safe to re-run: deletes any prior rows with the
-- same address before inserting.
-- Uses the first profile in the table as the owner.
-- =============================================

DO $$
DECLARE
    owner_id uuid;
BEGIN
    SELECT id INTO owner_id FROM public.profiles ORDER BY created_at LIMIT 1;
    IF owner_id IS NULL THEN
        RAISE EXCEPTION 'No profile rows found. Sign up at least one user first.';
    END IF;

    -- Clean up any prior runs of this seed
    DELETE FROM public.listings
    WHERE address IN (
        '12450 Wilderness Trail',
        '8821 Pine Ridge Road',
        '215 Main Street W'
    );

    -- ============ LAND #1: lakefront acreage ============
    INSERT INTO public.listings (
        user_id, status,
        address, city, state, zip, county, lat, lng, location,
        property_type, listing_type,
        price,
        lot_size, lot_unit,
        title, description,
        waterfront, water_body_name, view_types, features,
        listed_at
    ) VALUES (
        owner_id, 'active',
        '12450 Wilderness Trail', 'Bemidji', 'MN', '56601', 'Beltrami',
        47.5234, -94.9123,
        ST_SetSRID(ST_MakePoint(-94.9123, 47.5234), 4326)::geography,
        'land', 'for_sale',
        89000,
        4.7, 'acres',
        'Lakefront acreage on Lake Bemidji',
        '4.7 wooded acres with 220 ft of private lake frontage. Driveway in, electric at the road, perked for septic. Build your dream cabin or year-round home.',
        TRUE, 'Lake Bemidji',
        ARRAY['water','lake','woods'],
        ARRAY['dock'],
        NOW() - INTERVAL '3 days'
    );

    -- ============ LAND #2: hunting / recreational acreage ============
    INSERT INTO public.listings (
        user_id, status,
        address, city, state, zip, county, lat, lng, location,
        property_type, listing_type,
        price,
        lot_size, lot_unit,
        title, description,
        waterfront, view_types,
        listed_at
    ) VALUES (
        owner_id, 'active',
        '8821 Pine Ridge Road', 'Park Rapids', 'MN', '56470', 'Hubbard',
        46.9220, -95.0586,
        ST_SetSRID(ST_MakePoint(-95.0586, 46.9220), 4326)::geography,
        'land', 'for_sale',
        145000,
        40.0, 'acres',
        '40-acre hunting parcel — mixed timber and food plots',
        '40 acres of mixed hardwood and pine with two established food plots and an existing deer stand. Trail system throughout. Borders state forest on the north side.',
        FALSE,
        ARRAY['woods'],
        NOW() - INTERVAL '11 days'
    );

    -- ============ COMMERCIAL: downtown storefront ============
    INSERT INTO public.listings (
        user_id, status,
        address, city, state, zip, county, lat, lng, location,
        property_type, listing_type,
        price,
        sqft, lot_size, lot_unit, year_built, stories,
        title, description,
        features,
        water_source, sewer_type,
        listed_at
    ) VALUES (
        owner_id, 'active',
        '215 Main Street W', 'Brainerd', 'MN', '56401', 'Crow Wing',
        46.3580, -94.2008,
        ST_SetSRID(ST_MakePoint(-94.2008, 46.3580), 4326)::geography,
        'commercial', 'for_sale',
        425000,
        4200, 0.18, 'acres', 1948, 2,
        'Downtown Brainerd mixed-use storefront',
        'Two-story brick building on Main St. Ground-floor retail (currently leased to a coffee shop) plus a 1,400 sqft second-floor apartment. New roof 2023, updated electrical, central A/C throughout.',
        ARRAY['central_ac','new_roof'],
        'city', 'city',
        NOW() - INTERVAL '6 days'
    );
END $$;
