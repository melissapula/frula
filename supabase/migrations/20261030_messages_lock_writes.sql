-- The FOR ALL policy overrode every narrower rule, because permissive policies are OR'd, and row
-- policies cannot limit columns. Table-level UPDATE must go first because a column-level REVOKE
-- does not affect a table-level grant.
BEGIN;

DROP POLICY IF EXISTS "Message participants only" ON public.messages;
DROP POLICY IF EXISTS "Recipients can mark as read" ON public.messages;
DROP POLICY IF EXISTS "Participants can read messages" ON public.messages;
DROP POLICY IF EXISTS "Senders can insert messages" ON public.messages;

CREATE POLICY "Participants can read messages"
  ON public.messages FOR SELECT TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Senders can insert messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND ((kind = 'text' AND payload IS NULL)
      OR (kind IN ('offer', 'viewing_request') AND payload->>'status' = 'pending'))
  );

CREATE POLICY "Participants can update messages"
  ON public.messages FOR UPDATE TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid())
  WITH CHECK (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Participants can delete messages"
  ON public.messages FOR DELETE TO authenticated
  USING (sender_id = auth.uid() OR recipient_id = auth.uid());

REVOKE UPDATE ON public.messages FROM anon, authenticated;
GRANT UPDATE (is_read, flagged) ON public.messages TO authenticated;

COMMIT;
