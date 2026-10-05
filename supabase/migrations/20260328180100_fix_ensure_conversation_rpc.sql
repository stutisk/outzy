-- Re-apply if you already ran 20260328180000 before the unique_violation fix.

CREATE OR REPLACE FUNCTION public.ensure_conversation_for_request(p_request_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r public.activity_requests;
  v_host_id uuid;
  v_conversation_id uuid;
BEGIN
  SELECT * INTO r FROM public.activity_requests WHERE id = p_request_id;
  IF NOT FOUND OR r.status <> 'accepted' THEN
    RETURN NULL;
  END IF;

  SELECT user_id INTO v_host_id
  FROM public.activities
  WHERE id = r.activity_id;

  IF v_host_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF auth.uid() IS DISTINCT FROM v_host_id AND auth.uid() IS DISTINCT FROM r.user_id THEN
    RETURN NULL;
  END IF;

  SELECT id INTO v_conversation_id
  FROM public.conversations
  WHERE activity_id = r.activity_id
    AND guest_id = r.user_id;

  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  BEGIN
    INSERT INTO public.conversations (activity_id, host_id, guest_id, request_id)
    VALUES (r.activity_id, v_host_id, r.user_id, r.id)
    RETURNING id INTO v_conversation_id;
  EXCEPTION
    WHEN unique_violation THEN
      SELECT id INTO v_conversation_id
      FROM public.conversations
      WHERE activity_id = r.activity_id
        AND guest_id = r.user_id;
  END;

  RETURN v_conversation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_conversation_for_request(uuid) TO authenticated;
