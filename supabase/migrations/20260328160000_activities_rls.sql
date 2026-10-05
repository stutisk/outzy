-- Activities: authenticated users can read; hosts can update/delete own rows.

ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read activities" ON public.activities;
CREATE POLICY "Authenticated can read activities"
  ON public.activities
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert own activities" ON public.activities;
CREATE POLICY "Users can insert own activities"
  ON public.activities
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Hosts can update own activities" ON public.activities;
CREATE POLICY "Hosts can update own activities"
  ON public.activities
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Hosts can delete own activities" ON public.activities;
CREATE POLICY "Hosts can delete own activities"
  ON public.activities
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
