"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchUnreadMessageCounts } from "@/lib/chat";
import { subscribeUnreadRealtimeRefresh } from "@/lib/unread-messages-realtime";
import { supabase } from "@/lib/supabase";

export const MESSAGES_READ_EVENT = "outzy:messages-read";

export function notifyMessagesRead() {
  window.dispatchEvent(new Event(MESSAGES_READ_EVENT));
}

export function useUnreadMessageCounts() {
  const [total, setTotal] = useState(0);
  const [byConversation, setByConversation] = useState<
    Record<string, number>
  >({});

  const refresh = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setTotal(0);
      setByConversation({});
      return;
    }
    const result = await fetchUnreadMessageCounts();
    setTotal(result.total);
    setByConversation(result.byConversation);
  }, []);

  useEffect(() => {
    void refresh();

    const onRead = () => {
      void refresh();
    };
    window.addEventListener(MESSAGES_READ_EVENT, onRead);

    const unsubscribeRealtime = subscribeUnreadRealtimeRefresh(() => {
      void refresh();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });

    return () => {
      window.removeEventListener(MESSAGES_READ_EVENT, onRead);
      unsubscribeRealtime();
      subscription.unsubscribe();
    };
  }, [refresh]);

  return { total, byConversation, refresh };
}
