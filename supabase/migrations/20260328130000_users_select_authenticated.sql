-- Let signed-in users read host/requester profiles on the feed (username, avatar, etc.)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read profiles" ON public.users;

CREATE POLICY "Authenticated users can read profiles"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);
