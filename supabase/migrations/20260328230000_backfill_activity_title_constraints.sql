-- Run this if 20260328220000 failed on activities_title_length (existing junk titles).

ALTER TABLE public.activities
  DROP CONSTRAINT IF EXISTS activities_title_length;

ALTER TABLE public.activities
  DROP CONSTRAINT IF EXISTS activities_description_length;

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
  ADD CONSTRAINT activities_title_length
  CHECK (
    char_length(trim(title)) >= 4
    AND char_length(trim(title)) <= 60
  );

ALTER TABLE public.activities
  ADD CONSTRAINT activities_description_length
  CHECK (char_length(trim(description)) <= 1000);
