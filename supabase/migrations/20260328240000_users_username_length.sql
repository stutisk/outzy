-- Username length 2–12 characters (trimmed).

UPDATE public.users
SET username = left(trim(username), 12)
WHERE username IS NOT NULL
  AND char_length(trim(username)) > 12;

UPDATE public.users
SET username = 'user' || left(replace(id::text, '-', ''), 8)
WHERE username IS NULL
   OR char_length(trim(coalesce(username, ''))) < 2;

DO $$
DECLARE
  r RECORD;
  base text;
  suffix text;
  candidate text;
  n integer;
BEGIN
  FOR r IN
    SELECT
      id,
      trim(username) AS uname,
      row_number() OVER (
        PARTITION BY lower(trim(username))
        ORDER BY created_at NULLS LAST, id
      ) AS rn
    FROM public.users
    WHERE username IS NOT NULL
  LOOP
    IF r.rn > 1 THEN
      base := left(r.uname, 12);
      n := r.rn::integer;
      suffix := n::text;
      candidate := left(base, greatest(2, 12 - char_length(suffix))) || suffix;
      WHILE EXISTS (
        SELECT 1
        FROM public.users u
        WHERE lower(trim(u.username)) = lower(trim(candidate))
          AND u.id <> r.id
      ) LOOP
        n := n + 1;
        suffix := n::text;
        candidate := left(base, greatest(2, 12 - char_length(suffix))) || suffix;
      END LOOP;
      UPDATE public.users SET username = candidate WHERE id = r.id;
    END IF;
  END LOOP;
END $$;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_username_length;

ALTER TABLE public.users
  ADD CONSTRAINT users_username_length
  CHECK (
    char_length(trim(username)) >= 2
    AND char_length(trim(username)) <= 12
  );
