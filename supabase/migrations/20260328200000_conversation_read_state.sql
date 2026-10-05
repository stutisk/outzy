-- Per-participant read cursors for unread badges.

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS host_last_read_at timestamptz,
  ADD COLUMN IF NOT EXISTS guest_last_read_at timestamptz;

UPDATE public.conversations
SET
  host_last_read_at = COALESCE(host_last_read_at, now()),
  guest_last_read_at = COALESCE(guest_last_read_at, now())
WHERE host_last_read_at IS NULL OR guest_last_read_at IS NULL;

GRANT UPDATE ON public.conversations TO authenticated;

DROP POLICY IF EXISTS "Participants can update read state" ON public.conversations;
CREATE POLICY "Participants can update read state"
  ON public.conversations
  FOR UPDATE
  TO authenticated
  USING (host_id = auth.uid() OR guest_id = auth.uid())
  WITH CHECK (host_id = auth.uid() OR guest_id = auth.uid());

CREATE OR REPLACE FUNCTION public.get_my_unread_counts()
RETURNS TABLE (conversation_id uuid, unread_count bigint)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    c.id,
    COUNT(m.id)::bigint
  FROM public.conversations c
  INNER JOIN public.messages m ON m.conversation_id = c.id
  WHERE (c.host_id = auth.uid() OR c.guest_id = auth.uid())
    AND m.sender_id IS DISTINCT FROM auth.uid()
    AND m.created_at > CASE
      WHEN c.host_id = auth.uid() THEN COALESCE(c.host_last_read_at, c.created_at)
      ELSE COALESCE(c.guest_last_read_at, c.created_at)
    END
  GROUP BY c.id;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_unread_counts() TO authenticated;

CREATE OR REPLACE FUNCTION public.mark_conversation_read(p_conversation_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
  SET host_last_read_at = now()
  WHERE id = p_conversation_id AND host_id = auth.uid();

  UPDATE public.conversations
  SET guest_last_read_at = now()
  WHERE id = p_conversation_id AND guest_id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_conversation_read(uuid) TO authenticated;
