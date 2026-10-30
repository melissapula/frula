-- Offer and viewing responses go through here, so the client never writes payload.
BEGIN;

CREATE OR REPLACE FUNCTION public.respond_to_message(message_id uuid, new_status text)
RETURNS jsonb AS $$
DECLARE
  updated_payload jsonb;
BEGIN
  UPDATE public.messages m
     SET payload = jsonb_set(m.payload, '{status}', to_jsonb(new_status))
   WHERE m.id = message_id
     AND m.recipient_id = auth.uid()
     AND m.payload->>'status' = 'pending'
     AND ((m.kind = 'offer' AND new_status IN ('accepted', 'countered', 'declined'))
       OR (m.kind = 'viewing_request' AND new_status IN ('confirmed', 'declined')))
  RETURNING m.payload INTO updated_payload;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'permission denied' USING ERRCODE = '42501';
  END IF;

  RETURN updated_payload;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Functions are executable by PUBLIC by default.
REVOKE EXECUTE ON FUNCTION public.respond_to_message(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_message(uuid, text) TO authenticated;

COMMIT;
