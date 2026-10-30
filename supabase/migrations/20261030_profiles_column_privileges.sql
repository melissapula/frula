-- Row policies cannot hide columns. Table-level access must go first because a
-- column-level REVOKE does not affect a table-level grant.
BEGIN;

REVOKE ALL ON public.profiles FROM anon, authenticated;
GRANT SELECT (id, full_name, avatar_url, created_at)
  ON public.profiles TO anon, authenticated;

COMMIT;
