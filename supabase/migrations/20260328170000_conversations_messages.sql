-- Post-accept chat: one thread per activity + guest.

CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES public.activities(id) ON DELETE CASCADE,
  host_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id uuid REFERENCES public.activity_requests(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (activity_id, guest_id)
);

CREATE INDEX IF NOT EXISTS conversations_host_id_idx ON public.conversations(host_id);
CREATE INDEX IF NOT EXISTS conversations_guest_id_idx ON public.conversations(guest_id);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (char_length(trim(body)) > 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx
  ON public.messages(conversation_id, created_at);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can read conversations" ON public.conversations;
CREATE POLICY "Participants can read conversations"
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (host_id = auth.uid() OR guest_id = auth.uid());

DROP POLICY IF EXISTS "Host or guest can create conversation" ON public.conversations;
DROP POLICY IF EXISTS "System can insert conversations via participants" ON public.conversations;
CREATE POLICY "Host can create conversation on accept"
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (host_id = auth.uid());

DROP POLICY IF EXISTS "Participants can read messages" ON public.messages;
CREATE POLICY "Participants can read messages"
  ON public.messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.host_id = auth.uid() OR c.guest_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
CREATE POLICY "Participants can send messages"
  ON public.messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.host_id = auth.uid() OR c.guest_id = auth.uid())
    )
  );

CREATE OR REPLACE FUNCTION public.seed_conversation_request_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.request_id IS NOT NULL THEN
    INSERT INTO public.messages (conversation_id, sender_id, body)
    SELECT NEW.id, r.user_id, trim(r.message)
    FROM public.activity_requests r
    WHERE r.id = NEW.request_id
      AND char_length(trim(r.message)) > 0;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS conversations_seed_request_message ON public.conversations;
CREATE TRIGGER conversations_seed_request_message
  AFTER INSERT ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_conversation_request_message();
