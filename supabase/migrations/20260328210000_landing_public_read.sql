-- Public landing: read upcoming plans and host display names without sign-in.

DROP POLICY IF EXISTS "Public can read upcoming activities" ON public.activities;
CREATE POLICY "Public can read upcoming activities"
  ON public.activities
  FOR SELECT
  TO anon
  USING (activity_date >= timezone('utc', now()));

DROP POLICY IF EXISTS "Public can read profiles for discovery" ON public.users;
CREATE POLICY "Public can read profiles for discovery"
  ON public.users
  FOR SELECT
  TO anon
  USING (true);
