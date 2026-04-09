-- =============================================
-- PostGIS function: find active listing IDs within
-- a given radius (miles) of a center point, ordered
-- by distance ascending. Used by /browse "Near {place}".
-- =============================================

DROP FUNCTION IF EXISTS public.listing_ids_in_radius(double precision, double precision, double precision);

CREATE OR REPLACE FUNCTION public.listing_ids_in_radius(
    center_lat double precision,
    center_lng double precision,
    radius_miles double precision
)
RETURNS TABLE (id uuid, distance_meters double precision)
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
    SELECT
        l.id,
        ST_Distance(
            l.location,
            ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography
        ) AS distance_meters
    FROM public.listings l
    WHERE l.status = 'active'
      AND l.location IS NOT NULL
      AND ST_DWithin(
          l.location,
          ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
          radius_miles * 1609.344
      )
    ORDER BY distance_meters ASC;
$$;

GRANT EXECUTE ON FUNCTION public.listing_ids_in_radius(double precision, double precision, double precision)
    TO anon, authenticated;
