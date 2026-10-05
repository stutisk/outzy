-- Step 1: location-based discovery — store coordinates for each activity.
-- Run in Supabase Dashboard → SQL Editor (or via supabase db push if you use the CLI).

ALTER TABLE public.activities
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

ALTER TABLE public.activities
  DROP CONSTRAINT IF EXISTS activities_latitude_range;

ALTER TABLE public.activities
  ADD CONSTRAINT activities_latitude_range
  CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90));

ALTER TABLE public.activities
  DROP CONSTRAINT IF EXISTS activities_longitude_range;

ALTER TABLE public.activities
  ADD CONSTRAINT activities_longitude_range
  CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180));

COMMENT ON COLUMN public.activities.latitude IS 'WGS84 latitude; geocoded from location text at create time';
COMMENT ON COLUMN public.activities.longitude IS 'WGS84 longitude; geocoded from location text at create time';
