-- Join requests: member message to host; host accepts or rejects.

CREATE TABLE IF NOT EXISTS public.activity_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (activity_id, user_id)
);

CREATE INDEX IF NOT EXISTS activity_requests_activity_id_idx
  ON public.activity_requests(activity_id);

CREATE INDEX IF NOT EXISTS activity_requests_user_id_idx
  ON public.activity_requests(user_id);

ALTER TABLE public.activity_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create join requests" ON public.activity_requests;
CREATE POLICY "Users can create join requests"
  ON public.activity_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND char_length(trim(message)) > 0
    AND NOT EXISTS (
      SELECT 1
      FROM public.activities a
      WHERE a.id = activity_id
        AND a.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can read own requests" ON public.activity_requests;
CREATE POLICY "Users can read own requests"
  ON public.activity_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Hosts can read requests for their activities" ON public.activity_requests;
CREATE POLICY "Hosts can read requests for their activities"
  ON public.activity_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.activities a
      WHERE a.id = activity_id
        AND a.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Hosts can update request status" ON public.activity_requests;
CREATE POLICY "Hosts can update request status"
  ON public.activity_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.activities a
      WHERE a.id = activity_id
        AND a.user_id = auth.uid()
    )
  )
  WITH CHECK (
    status IN ('accepted', 'rejected')
    AND EXISTS (
      SELECT 1
      FROM public.activities a
      WHERE a.id = activity_id
        AND a.user_id = auth.uid()
    )
  );
