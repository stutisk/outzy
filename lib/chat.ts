import { supabase } from "@/lib/supabase";

export type ConversationRow = {
  id: string;
  activity_id: string;
  host_id: string;
  guest_id: string;
  request_id: string | null;
  created_at: string;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

/** Live INSERT events for a thread (requires messages on supabase_realtime publication). */
export function subscribeToConversationMessages(
  conversationId: string,
  onInsert: (message: MessageRow) => void
): () => void {
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        onInsert(payload.new as MessageRow);
      }
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

function formatChatError(error: unknown, fallback: string): Error {
  if (error && typeof error === "object" && "message" in error) {
    return new Error(String((error as { message: string }).message));
  }
  return new Error(fallback);
}

/** After host accepts, open (or reuse) a thread and seed the guest's request message. */
export async function ensureConversationOnAccept(
  requestId: string,
  activityId: string,
  hostId: string,
  guestId: string
): Promise<{ conversationId: string | null; error: Error | null }> {
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("activity_id", activityId)
    .eq("guest_id", guestId)
    .maybeSingle();

  if (existing?.id) {
    return { conversationId: existing.id, error: null };
  }

  const { data: created, error: insertError } = await supabase
    .from("conversations")
    .insert({
      activity_id: activityId,
      host_id: hostId,
      guest_id: guestId,
      request_id: requestId,
    })
    .select("id")
    .single();

  if (insertError || !created) {
    return {
      conversationId: null,
      error: formatChatError(insertError, "Failed to create conversation"),
    };
  }

  return { conversationId: created.id, error: null };
}

/** Create or return conversation for an accepted request (host or guest). */
export async function ensureConversationForRequest(
  requestId: string
): Promise<{ conversationId: string | null; error: Error | null }> {
  const { data, error } = await supabase.rpc("ensure_conversation_for_request", {
    p_request_id: requestId,
  });

  if (error) {
    const msg = error.message ?? "";
    if (
      msg.includes("ensure_conversation_for_request") ||
      msg.includes("schema cache") ||
      msg.includes("Could not find the function")
    ) {
      return {
        conversationId: null,
        error: new Error(
          "Chat RPC missing — run supabase/migrations/20260328180000_chat_grants_and_backfill_rpc.sql in Supabase SQL Editor."
        ),
      };
    }
    if (msg.includes("conversations") && msg.includes("does not exist")) {
      return {
        conversationId: null,
        error: new Error(
          "Chat tables missing — run supabase/migrations/20260328170000_conversations_messages.sql first."
        ),
      };
    }
    return { conversationId: null, error: formatChatError(error, "Chat RPC failed") };
  }

  const id =
    typeof data === "string"
      ? data
      : data != null
        ? String(data)
        : null;

  if (!id) {
    return {
      conversationId: null,
      error: new Error(
        "No chat thread yet. The host must accept your request (status: accepted). If they already did, run chat migrations in Supabase and try again."
      ),
    };
  }

  return { conversationId: id, error: null };
}

async function fetchAcceptedRequestId(
  activityId: string,
  guestUserId: string
): Promise<{ requestId: string | null; status: string | null; error: Error | null }> {
  const { data, error } = await supabase
    .from("activity_requests")
    .select("id, status")
    .eq("activity_id", activityId)
    .eq("user_id", guestUserId)
    .maybeSingle();

  if (error) {
    return {
      requestId: null,
      status: null,
      error: formatChatError(error, "Could not load your join request"),
    };
  }

  return {
    requestId: data?.id ?? null,
    status: data?.status ?? null,
    error: null,
  };
}

export async function openChatForAcceptedJoin(
  activityId: string,
  guestUserId: string,
  requestId?: string
): Promise<{ conversationId: string | null; error: Error | null }> {
  const existing = await getConversationForGuest(activityId, guestUserId);
  if (existing) {
    return { conversationId: existing, error: null };
  }

  let rid = requestId;
  let status: string | null = null;

  if (!rid) {
    const fetched = await fetchAcceptedRequestId(activityId, guestUserId);
    if (fetched.error) {
      return { conversationId: null, error: fetched.error };
    }
    rid = fetched.requestId ?? undefined;
    status = fetched.status;
  }

  if (!rid) {
    return {
      conversationId: null,
      error: new Error(
        "You have not requested to join this plan yet. Tap Message host on the card first."
      ),
    };
  }

  if (status === "pending") {
    return {
      conversationId: null,
      error: new Error(
        "Still waiting for the host to accept your request."
      ),
    };
  }

  if (status === "rejected") {
    return {
      conversationId: null,
      error: new Error("This request was declined by the host."),
    };
  }

  return ensureConversationForRequest(rid);
}

export async function getConversationForGuest(
  activityId: string,
  guestId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("conversations")
    .select("id")
    .eq("activity_id", activityId)
    .eq("guest_id", guestId)
    .maybeSingle();

  if (error) {
    console.error("getConversationForGuest:", error.message);
    return null;
  }

  return data?.id ?? null;
}

export type ConversationListItem = {
  id: string;
  activity_id: string;
  activity_title: string;
  other_username: string;
  other_avatar_url: string | null;
  created_at: string;
  unread_count: number;
};

export async function fetchUnreadMessageCounts(): Promise<{
  total: number;
  byConversation: Record<string, number>;
}> {
  const { data, error } = await supabase.rpc("get_my_unread_counts");

  if (error) {
    console.warn("get_my_unread_counts:", error.message);
    return { total: 0, byConversation: {} };
  }

  const byConversation: Record<string, number> = {};
  let total = 0;
  for (const row of data ?? []) {
    const id = row.conversation_id as string;
    const n = Number(row.unread_count) || 0;
    if (n > 0) {
      byConversation[id] = n;
      total += n;
    }
  }
  return { total, byConversation };
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const { error } = await supabase.rpc("mark_conversation_read", {
    p_conversation_id: conversationId,
  });
  if (error) {
    console.warn("mark_conversation_read:", error.message);
  }
}

export async function listMyConversations(
  userId: string
): Promise<ConversationListItem[]> {
  const { data: convs, error } = await supabase
    .from("conversations")
    .select("id, activity_id, host_id, guest_id, created_at")
    .or(`host_id.eq.${userId},guest_id.eq.${userId}`)
    .order("created_at", { ascending: false });

  if (error || !convs?.length) {
    return [];
  }

  const activityIds = [...new Set(convs.map((c) => c.activity_id))];
  const otherIds = [
    ...new Set(
      convs.map((c) => (c.host_id === userId ? c.guest_id : c.host_id))
    ),
  ];

  const [{ data: activities }, { data: users }, unread] = await Promise.all([
    supabase.from("activities").select("id, title").in("id", activityIds),
    supabase.from("users").select("id, username, avatar_url").in("id", otherIds),
    fetchUnreadMessageCounts(),
  ]);

  const titleMap = new Map(
    (activities ?? []).map((a) => [a.id, a.title as string])
  );
  const userMap = new Map(
    (users ?? []).map((u) => [u.id, u])
  );

  return convs.map((c) => {
    const otherId = c.host_id === userId ? c.guest_id : c.host_id;
    const other = userMap.get(otherId);
    return {
      id: c.id,
      activity_id: c.activity_id,
      activity_title: titleMap.get(c.activity_id) ?? "Plan",
      other_username: other?.username ?? "user",
      other_avatar_url: other?.avatar_url ?? null,
      created_at: c.created_at,
      unread_count: unread.byConversation[c.id] ?? 0,
    };
  });
}

export async function getConversationByRequest(
  activityId: string,
  guestId: string
): Promise<ConversationRow | null> {
  const { data } = await supabase
    .from("conversations")
    .select("*")
    .eq("activity_id", activityId)
    .eq("guest_id", guestId)
    .maybeSingle();
  return data as ConversationRow | null;
}
