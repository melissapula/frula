-- =============================================
-- PostGIS function: find_comps
-- Used by CmaService to query comparable sales
-- Run in Supabase SQL editor after schema.sql
-- =============================================

CREATE OR REPLACE FUNCTION find_comps(
  p_lat             DECIMAL,
  p_lng             DECIMAL,
  p_radius_meters   INTEGER,
  p_sqft            INTEGER DEFAULT NULL,
  p_beds            INTEGER DEFAULT NULL,
  p_property_type   TEXT    DEFAULT 'residential',
  p_months_back     INTEGER DEFAULT 18
)
RETURNS TABLE (
  parcel_id       TEXT,
  address         TEXT,
  city            TEXT,
  sqft            INTEGER,
  beds            INTEGER,
  baths           DECIMAL,
  year_built      INTEGER,
  garage          BOOLEAN,
  last_sale_price DECIMAL,
  last_sale_date  DATE,
  distance_miles  DECIMAL
)
LANGUAGE plpgsql
AS $$
DECLARE
  subject_point GEOGRAPHY;
  cutoff_date   DATE;
BEGIN
  subject_point := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::GEOGRAPHY;
  cutoff_date   := CURRENT_DATE - (p_months_back || ' months')::INTERVAL;

  RETURN QUERY
  SELECT
    p.parcel_id,
    p.address,
    p.city,
    p.sqft,
    p.beds,
    p.baths,
    p.year_built,
    p.garage,
    p.last_sale_price,
    p.last_sale_date,
    ROUND(
      (ST_Distance(p.location, subject_point) / 1609.34)::DECIMAL, 2
    ) AS distance_miles
  FROM parcels p
  WHERE
    -- Must have a sale price and date
    p.last_sale_price IS NOT NULL
    AND p.last_sale_price > 0
    AND p.last_sale_date IS NOT NULL
    AND p.last_sale_date >= cutoff_date

    -- Within radius
    AND ST_DWithin(p.location, subject_point, p_radius_meters)

    -- Sq footage filter (±30%) if provided
    AND (
      p_sqft IS NULL
      OR p.sqft IS NULL
      OR (p.sqft BETWEEN p_sqft * 0.70 AND p_sqft * 1.30)
    )

    -- Bed filter (±2) if provided
    AND (
      p_beds IS NULL
      OR p.beds IS NULL
      OR (p.beds BETWEEN p_beds - 2 AND p_beds + 2)
    )

  ORDER BY
    -- Prioritize: recent sales, close distance, similar sqft
    p.last_sale_date DESC,
    distance_miles ASC

  LIMIT 20; -- Return up to 20 raw candidates; service scores and trims to top 6
END;
$$;

-- =============================================
-- Also update the location column when lat/lng inserted
-- =============================================
CREATE OR REPLACE FUNCTION sync_parcel_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326)::GEOGRAPHY;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER parcels_sync_location
  BEFORE INSERT OR UPDATE ON parcels
  FOR EACH ROW EXECUTE FUNCTION sync_parcel_location();

-- Same for listings
CREATE TRIGGER listings_sync_location
  BEFORE INSERT OR UPDATE ON listings
  FOR EACH ROW
  WHEN (NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL)
  EXECUTE FUNCTION sync_parcel_location();
