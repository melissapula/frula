-- =============================================
-- Security: Enable RLS on tables that were missing it
-- =============================================

-- listing_documents: private seller documents (disclosures, inspections, etc.)
ALTER TABLE public.listing_documents ENABLE ROW LEVEL SECURITY;

-- Public documents on active listings are viewable by anyone
CREATE POLICY "Public documents are viewable"
  ON public.listing_documents FOR SELECT
  USING (
    is_public = TRUE
    AND listing_id IN (SELECT id FROM public.listings WHERE status = 'active')
  );

-- Listing owners can manage their own documents
CREATE POLICY "Owners manage documents"
  ON public.listing_documents FOR ALL
  USING (
    auth.uid() = (SELECT user_id FROM public.listings WHERE id = listing_id)
  );

-- listing_plans: user's own listing plans only
ALTER TABLE public.listing_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own listing plans"
  ON public.listing_plans FOR ALL
  USING (
    auth.uid() = (SELECT user_id FROM public.listings WHERE id = listing_id)
  );

-- search_alerts: user's own alerts only
ALTER TABLE public.search_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own search alerts"
  ON public.search_alerts FOR ALL
  USING (auth.uid() = user_id);

-- cma_reports: tied to listing ownership
ALTER TABLE public.cma_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view own CMA reports"
  ON public.cma_reports FOR SELECT
  USING (
    auth.uid() = (SELECT user_id FROM public.listings WHERE id = listing_id)
  );

-- parcels: public read-only reference data (no write access for users)
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parcels are public reference data"
  ON public.parcels FOR SELECT
  USING (true);
