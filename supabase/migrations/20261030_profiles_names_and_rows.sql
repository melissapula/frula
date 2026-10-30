-- Names were kept only in auth metadata, the open read policy exposed every
-- profile, and the update policy let users set their own role.
BEGIN;

UPDATE public.profiles p
   SET full_name = NULLIF(TRIM(u.raw_user_meta_data->>'full_name'), '')
  FROM auth.users u
 WHERE u.id = p.id AND p.full_name IS NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

DROP POLICY IF EXISTS "Public profiles are viewable" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are readable by authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Profiles visible to self, for sellers, and to counterparties"
  ON public.profiles FOR SELECT TO anon, authenticated
  USING (
    id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.listings l
               WHERE l.user_id = profiles.id AND l.status = 'active')
    OR EXISTS (SELECT 1 FROM public.messages m
               WHERE (m.sender_id = profiles.id AND m.recipient_id = auth.uid())
                  OR (m.recipient_id = profiles.id AND m.sender_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.transactions t
               WHERE (t.seller_id = profiles.id AND t.buyer_id = auth.uid())
                  OR (t.buyer_id = profiles.id AND t.seller_id = auth.uid()))
  );

-- Nothing in the app writes profiles as a user. Server routes use the service role.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.profiles FROM anon, authenticated;

COMMIT;
