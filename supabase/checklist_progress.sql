-- =============================================
-- Educational checklist progress tracking
--
-- Stores per-user progress on the seller prep
-- and buyer guide checklists. One row per user
-- per checklist; checked items stored as a text
-- array of item IDs.
--
-- Run in Supabase SQL Editor before using
-- the /checklist/* pages.
-- =============================================

CREATE TABLE IF NOT EXISTS public.checklist_progress (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    checklist   TEXT NOT NULL,
    checked     TEXT[] NOT NULL DEFAULT '{}',
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, checklist)
);

ALTER TABLE public.checklist_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own progress"
    ON public.checklist_progress FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users insert own progress"
    ON public.checklist_progress FOR INSERT TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own progress"
    ON public.checklist_progress FOR UPDATE TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
