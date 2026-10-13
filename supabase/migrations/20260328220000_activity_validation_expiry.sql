-- Title/description constraints, optional end_time, cancelled requests, expiry sweep.

ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS end_time timestamptz;

-- Backfill existing rows so CHECK constraints can apply (junk titles like "kk").
UPDATE public.activities
SET title = left(
  CASE
    WHEN char_length(trim(coalesce(title, ''))) = 0 THEN 'Community plan'
    WHEN char_length(trim(title)) < 4 THEN trim(title) || ' plan'
    ELSE trim(regexp_replace(title, '\s+', ' ', 'g'))
  END,
  60
)
WHERE char_length(trim(coalesce(title, ''))) < 4
   OR char_length(trim(title)) > 60
   OR title IS DISTINCT FROM trim(regexp_replace(coalesce(title, ''), '\s+', ' ', 'g'));

UPDATE public.activities
SET title = left(trim(title) || ' plan', 60)
WHERE char_length(trim(title)) < 4;

UPDATE public.activities
SET description = left(
  trim(regexp_replace(coalesce(description, ''), '\s+', ' ', 'g')),
  1000
)
WHERE char_length(trim(coalesce(description, ''))) > 1000;

ALTER TABLE public.activities
  DROP CONSTRAINT IF EXISTS activities_title_length;

ALTER TABLE public.activities
  ADD CONSTRAINT activities_title_length
  CHECK (
    char_length(trim(title)) >= 4
    AND char_length(trim(title)) <= 60
  );

ALTER TABLE public.activities
  DROP CONSTRAINT IF EXISTS activities_description_length;

ALTER TABLE public.activities
  ADD CONSTRAINT activities_description_length
  CHECK (char_length(trim(description)) <= 1000);

COMMENT ON COLUMN public.activities.end_time IS 'Optional end; if null, activity ends at activity_date (start).';

ALTER TABLE public.activity_requests
  ADD COLUMN IF NOT EXISTS cancel_reason text;

ALTER TABLE public.activity_requests
  DROP CONSTRAINT IF EXISTS activity_requests_status_check;

ALTER TABLE public.activity_requests
  ADD CONSTRAINT activity_requests_status_check
  CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled'));

CREATE OR REPLACE FUNCTION public.activity_end_at(
  start_at timestamptz,
  end_at timestamptz
)
RETURNS timestamptz
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE(end_at, start_at);
$$;

CREATE OR REPLACE FUNCTION public.expire_past_activities()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.activity_requests r
  SET
    status = 'cancelled',
    cancel_reason = 'activity_ended'
  FROM public.activities a
  WHERE r.activity_id = a.id
    AND r.status = 'pending'
    AND public.activity_end_at(a.activity_date, a.end_time)
      < timezone('utc', now());

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_past_activities() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_past_activities() TO authenticated;
GRANT EXECUTE ON FUNCTION public.expire_past_activities() TO anon;

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
    AND EXISTS (
      SELECT 1
      FROM public.activities a
      WHERE a.id = activity_id
        AND public.activity_end_at(a.activity_date, a.end_time)
          >= timezone('utc', now())
    )
  );

DROP POLICY IF EXISTS "Public can read upcoming activities" ON public.activities;

CREATE POLICY "Public can read upcoming activities"
  ON public.activities
  FOR SELECT
  TO anon
  USING (
    public.activity_end_at(activity_date, end_time) >= timezone('utc', now())
  );

-- pg_cron: after enabling the extension in Supabase, run:
-- SELECT cron.schedule(
--   'outzy_expire_past_activities',
--   '*/15 * * * *',
--   $$SELECT public.expire_past_activities()$$
-- );
