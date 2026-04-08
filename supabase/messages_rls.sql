-- =============================================
-- RLS: messages
-- Authenticated users can read/send messages they're a party to
-- =============================================

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can read messages" ON public.messages;
CREATE POLICY "Participants can read messages"
    ON public.messages
    FOR SELECT
    TO authenticated
    USING (sender_id = auth.uid() OR recipient_id = auth.uid());

DROP POLICY IF EXISTS "Senders can insert messages" ON public.messages;
CREATE POLICY "Senders can insert messages"
    ON public.messages
    FOR INSERT
    TO authenticated
    WITH CHECK (sender_id = auth.uid());

DROP POLICY IF EXISTS "Recipients can mark as read" ON public.messages;
CREATE POLICY "Recipients can mark as read"
    ON public.messages
    FOR UPDATE
    TO authenticated
    USING (recipient_id = auth.uid())
    WITH CHECK (recipient_id = auth.uid());

-- Allow authenticated users to read public profile fields of other users
-- (needed to display sender name + avatar in message threads)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are readable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are readable by authenticated users"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (true);
