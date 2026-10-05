import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type UnreadRefreshListener = () => void;

const listeners = new Set<UnreadRefreshListener>();
let channel: RealtimeChannel | null = null;
let subscriberCount = 0;

function notifyListeners() {
  for (const listener of listeners) {
    listener();
  }
}

function ensureChannel() {
  if (channel) return;

  channel = supabase
    .channel("outzy-unread-totals")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages" },
      () => {
        notifyListeners();
      }
    )
    .subscribe();
}

function teardownChannel() {
  if (!channel) return;
  void supabase.removeChannel(channel);
  channel = null;
}

/** One shared Realtime channel; safe when navbar + mobile nav both mount the hook. */
export function subscribeUnreadRealtimeRefresh(
  listener: UnreadRefreshListener
): () => void {
  subscribersCountIncrement();
  listeners.add(listener);
  ensureChannel();

  return () => {
    listeners.delete(listener);
    subscribersCountDecrement();
    if (subscriberCount === 0) {
      teardownChannel();
    }
  };
}

function subscribersCountIncrement() {
  subscriberCount += 1;
}

function subscribersCountDecrement() {
  subscriberCount = Math.max(0, subscriberCount - 1);
}
