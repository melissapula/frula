-- =============================================
-- ZIP-level market data for the Market Snapshot
-- feature on listing detail pages.
--
-- Populated from Zillow Research's ZHVI public CSV
-- (zillow.com/research/data) via a Node ingestion
-- script. Refreshed monthly. Free, public data;
-- Zillow attribution required wherever rendered.
-- =============================================

CREATE TABLE IF NOT EXISTS public.zip_market_data (
    zip                  TEXT PRIMARY KEY,
    -- Smoothed median home value for this ZIP
    median_home_value    DECIMAL(12, 2),
    -- Year-over-year percent change (e.g. 4.2 for +4.2%)
    yoy_change_pct       DECIMAL(6, 2),
    -- Month the figure represents (first of month)
    data_month           DATE,
    -- City/state metadata for display
    city                 TEXT,
    state                TEXT,
    metro                TEXT,
    county               TEXT,
    -- Data source attribution (always required)
    data_source          TEXT NOT NULL DEFAULT 'zillow_zhvi',
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS zip_market_data_state_idx
    ON public.zip_market_data (state);

ALTER TABLE public.zip_market_data ENABLE ROW LEVEL SECURITY;

-- Public read — this is published market data, not personal data
CREATE POLICY "Market data is public read"
    ON public.zip_market_data
    FOR SELECT
    TO anon, authenticated
    USING (true);
