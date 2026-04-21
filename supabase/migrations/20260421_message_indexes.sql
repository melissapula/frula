-- Add indexes for inbox query performance.
-- The inbox fetches all messages where user is sender or recipient,
-- ordered by created_at. These indexes cover the common query patterns.

CREATE INDEX IF NOT EXISTS messages_recipient_created_idx
  ON public.messages (recipient_id, created_at DESC);

CREATE INDEX IF NOT EXISTS messages_sender_created_idx
  ON public.messages (sender_id, created_at DESC);
