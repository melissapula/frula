-- Closes a Frula account without erasing the person's ChoreQuest account (audit item 20).
--
-- Frula and ChoreQuest share one Supabase project and one auth.users table, and chore.users
-- cascades from auth.users (chore-app/supabase/migrations/0001_initial_schema.sql:58). Frula's
-- delete route removed the auth.users row, so deleting a Frula account also deleted the person's
-- ChoreQuest account.
--
-- Contract: close_frula_account(user) deletes the user's profile, which cascades all their Frula
-- data (20261113_profile_delete_actions.sql). It returns true when the sign-in is safe to delete.
-- When ChoreQuest uses the sign-in, it recreates a blank profile (id and email only) so Frula keeps
-- working for that sign-in, and returns false: the caller must not delete the auth.users row.
-- Calling it again after the profile is gone is safe. Only the service role may call it.
--
-- Run MIGRATION_CHECKLIST.md step 25 after it.

BEGIN;

CREATE OR REPLACE FUNCTION public.close_frula_account(p_user uuid)
RETURNS boolean AS $$
DECLARE
  v_email text;
  v_has_chore boolean := false;
BEGIN
  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = p_user;

  DELETE FROM public.profiles WHERE id = p_user;

  -- Cross-app dependency: ChoreQuest's chore.users. If ChoreQuest renames or moves it, this check
  -- finds nothing, returns true, and Frula deletes the shared sign-in again. Dynamic SQL so the
  -- function still works where the chore schema doesn't exist.
  IF to_regclass('chore.users') IS NOT NULL THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM chore.users WHERE id = $1)'
      INTO v_has_chore USING p_user;
  END IF;

  IF v_has_chore THEN
    INSERT INTO public.profiles (id, email) VALUES (p_user, v_email);
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.close_frula_account(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.close_frula_account(uuid) TO service_role;

COMMIT;
