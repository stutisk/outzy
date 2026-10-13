-- Host delete must cascade to requests, chats, and messages (RLS blocked this before).

GRANT DELETE ON public.activity_requests TO authenticated;
GRANT DELETE ON public.conversations TO authenticated;
GRANT DELETE ON public.messages TO authenticated;

DROP POLICY IF EXISTS "Hosts can delete requests for their activities" ON public.activity_requests;
CREATE POLICY "Hosts can delete requests for their activities"
  ON public.activity_requests
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.activities a
      WHERE a.id = activity_id
        AND a.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Host can delete conversations for their activities" ON public.conversations;
CREATE POLICY "Host can delete conversations for their activities"
  ON public.conversations
  FOR DELETE
  TO authenticated
  USING (host_id = auth.uid());

DROP POLICY IF EXISTS "Participants can delete messages in their conversations" ON public.messages;
CREATE POLICY "Participants can delete messages in their conversations"
  ON public.messages
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.host_id = auth.uid() OR c.guest_id = auth.uid())
    )
  );

CREATE OR REPLACE FUNCTION public.delete_host_activity(p_activity_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_host_id uuid;
BEGIN
  SELECT user_id INTO v_host_id
  FROM public.activities
  WHERE id = p_activity_id;

  IF v_host_id IS NULL OR v_host_id IS DISTINCT FROM auth.uid() THEN
    RETURN false;
  END IF;

  DELETE FROM public.messages m
  USING public.conversations c
  WHERE m.conversation_id = c.id
    AND c.activity_id = p_activity_id;

  DELETE FROM public.conversations
  WHERE activity_id = p_activity_id;

  DELETE FROM public.activity_requests
  WHERE activity_id = p_activity_id;

  DELETE FROM public.activities
  WHERE id = p_activity_id
    AND user_id = auth.uid();

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_host_activity(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_host_activity(uuid) TO authenticated;
