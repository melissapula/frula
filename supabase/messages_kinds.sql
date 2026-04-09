-- =============================================
-- Adds support for structured message types:
--   - kind:    'text' (default), 'offer', 'viewing_request'
--   - payload: JSONB blob with the structured fields for offers/viewings
--
-- The plain `body` text is still populated with a human-readable summary
-- so the existing inbox UI works without changes. The `payload` is there
-- so a future "Open as offer card" view can render the structured fields
-- with their own UI.
-- =============================================

ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'text'
        CHECK (kind IN ('text','offer','viewing_request')),
    ADD COLUMN IF NOT EXISTS payload JSONB;

CREATE INDEX IF NOT EXISTS messages_kind_idx ON public.messages (kind);
