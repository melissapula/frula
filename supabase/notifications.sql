-- =============================================
-- In-app notification feed for the bell dropdown.
--
-- One row = one event the user might care about
-- (offer received, message received, listing saved,
-- offer accepted, etc.). Read/unread state is tracked
-- per row so the bell badge can show "3 new" accurately.
-- =============================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    kind        TEXT NOT NULL CHECK (kind IN (
        'offer',
        'offer_accepted',
        'offer_declined',
        'offer_countered',
        'viewing_request',
        'viewing_confirmed',
        'viewing_declined',
        'message',
        'save'
    )),
    title       TEXT NOT NULL,
    body        TEXT,
    link        TEXT, -- where the bell row navigates on click
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    payload     JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_unread_idx
    ON public.notifications (user_id, is_read, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Each user can only see/modify their own notifications
CREATE POLICY "Own notifications"
    ON public.notifications
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
