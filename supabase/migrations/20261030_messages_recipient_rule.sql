-- The insert policy checked only the sender, so anyone could message anyone. The recipient check
-- is a function so it does not depend on the read policies of listings and messages.
BEGIN;

CREATE OR REPLACE FUNCTION public.can_message(target_listing uuid, target_recipient uuid)
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM public.listings l
                 WHERE l.id = target_listing
                   AND l.user_id = target_recipient
                   AND l.status = 'active')
      OR EXISTS (SELECT 1 FROM public.messages m
                 WHERE m.listing_id = target_listing
                   AND m.sender_id = target_recipient
                   AND m.recipient_id = auth.uid());
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '';

-- RLS runs this as the querying role, so authenticated must keep it.
REVOKE EXECUTE ON FUNCTION public.can_message(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_message(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Senders can insert messages" ON public.messages;

CREATE POLICY "Senders can insert messages"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND recipient_id <> sender_id
    AND public.can_message(listing_id, recipient_id)
    AND ((kind = 'text' AND payload IS NULL)
      OR (kind IN ('offer', 'viewing_request') AND payload->>'status' = 'pending'))
  );

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;

-- Without this every old message could be replayed for one more email.
UPDATE public.messages SET notified_at = created_at WHERE notified_at IS NULL;

CREATE OR REPLACE FUNCTION public.claim_message_notification(message_id uuid)
RETURNS boolean AS $$
BEGIN
  UPDATE public.messages m
     SET notified_at = NOW()
   WHERE m.id = message_id AND m.notified_at IS NULL;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.claim_message_notification(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_message_notification(uuid) TO service_role;

COMMIT;
