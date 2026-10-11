"use client";

import { Send } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { fieldInputClass } from "@/components/ui/field";
import { InlineLoading } from "@/components/ui/page-state";
import { Spinner } from "@/components/spinner";
import {
  markConversationRead,
  subscribeToConversationMessages,
  type ConversationRow,
  type MessageRow,
} from "@/lib/chat";
import { notifyMessagesRead } from "@/lib/use-unread-messages";
import { supabase } from "@/lib/supabase";

function appendMessageUnique(prev: MessageRow[], msg: MessageRow): MessageRow[] {
  if (prev.some((m) => m.id === msg.id)) return prev;
  return [...prev, msg].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
}

export type ChatPanelMeta = {
  activityTitle: string;
  activityId: string;
  otherUserId: string;
  otherUsername: string;
  otherAvatarUrl: string | null;
};

function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ChatPanel({
  conversationId,
  onMeta,
  fillHeight = false,
}: {
  conversationId: string;
  onMeta?: (meta: ChatPanelMeta) => void;
  fillHeight?: boolean;
}) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [conversation, setConversation] = useState<ConversationRow | null>(
    null
  );
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        setError("Sign in to view messages.");
        return;
      }
      setUserId(user.id);

      const { data: conv, error: convError } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .maybeSingle();

      if (convError || !conv) {
        setError("Could not load this chat.");
        setLoading(false);
        return;
      }

      const row = conv as ConversationRow;
      if (row.host_id !== user.id && row.guest_id !== user.id) {
        setError("You do not have access to this chat.");
        setLoading(false);
        return;
      }

      setConversation(row);
      const otherId =
        row.host_id === user.id ? row.guest_id : row.host_id;

      const [{ data: activity }, { data: otherUser }, { data: msgs }] =
        await Promise.all([
          supabase
            .from("activities")
            .select("id, title")
            .eq("id", row.activity_id)
            .maybeSingle(),
          supabase
            .from("users")
            .select("username, avatar_url")
            .eq("id", otherId)
            .maybeSingle(),
          supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true }),
        ]);

      const meta = {
        activityTitle: activity?.title ?? "Plan",
        activityId: row.activity_id,
        otherUserId: otherId,
        otherUsername: otherUser?.username ?? "user",
        otherAvatarUrl: otherUser?.avatar_url ?? null,
      };
      onMeta?.(meta);
      setMessages((msgs ?? []) as MessageRow[]);
      setLoading(false);
    };

    load();
  }, [conversationId, onMeta]);

  const markRead = useCallback(async () => {
    await markConversationRead(conversationId);
    notifyMessagesRead();
  }, [conversationId]);

  useEffect(() => {
    if (loading || !conversation) return;
    void markRead();
  }, [loading, conversation, conversationId, messages.length, markRead]);

  useEffect(() => {
    if (loading || !conversation) return;

    return subscribeToConversationMessages(conversationId, (msg) => {
      setMessages((prev) => appendMessageUnique(prev, msg));
      if (msg.sender_id !== userId) {
        void markRead();
      }
    });
  }, [conversationId, loading, conversation, userId, markRead]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = async () => {
    if (!userId || !conversation || !draft.trim()) return;
    setSending(true);
    setError("");

    const body = draft.trim();
    const { data, error: sendError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversation.id,
        sender_id: userId,
        body,
      })
      .select("*")
      .single();

    if (sendError) {
      console.error(sendError);
      setError("Could not send message.");
      setSending(false);
      return;
    }

    setMessages((prev) => appendMessageUnique(prev, data as MessageRow));
    setDraft("");
    setSending(false);
  };

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center py-12 ${fillHeight ? "min-h-0 flex-1" : "min-h-60"}`}
      >
        <Spinner label="Loading messages…" />
      </div>
    );
  }

  if (!conversation || !userId) {
    return (
      <p className="border-hairline bg-surface py-8 text-center text-sm text-muted">
        {error || "Chat unavailable."}
      </p>
    );
  }

  const composer = (
    <form
      className={`flex shrink-0 items-end gap-2 ${
        fillHeight
          ? "border-hairline-t bg-surface px-3 py-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] sm:px-4 sm:py-3"
          : "mt-3"
      }`}
      onSubmit={(e) => {
        e.preventDefault();
        sendMessage();
      }}
    >
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Write a message…"
        className={fieldInputClass}
      />
      <Button
        type="submit"
        disabled={sending || !draft.trim()}
        aria-label="Send message"
        showArrow={false}
        className="!px-3 !py-3"
      >
        <Send className="size-[18px]" strokeWidth={2.25} />
      </Button>
    </form>
  );

  const renderBubble = (m: MessageRow, mine: boolean) => (
    <div
      key={m.id}
      className={`flex flex-col gap-0.5 ${mine ? "items-end" : "items-start"}`}
    >
      <div
        className={`max-w-[92%] border-hairline px-3.5 py-2 text-[15px] leading-relaxed ${
          mine
            ? "bg-ink text-surface"
            : "bg-surface text-ink"
        }`}
      >
        {m.body}
      </div>
      <span
        className={`px-1 text-[10px] font-medium tabular-nums text-muted ${mine ? "text-right" : "text-left"}`}
      >
        {formatMessageTime(m.created_at)}
      </span>
    </div>
  );

  if (fillHeight) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div
          className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-3 py-4 sm:px-4"
        >
          {messages.length === 0 ? (
            <div className="mx-auto max-w-[240px] py-14 text-center">
              <p className="text-sm font-medium text-ink">
                Start the conversation
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                Share timing, meeting spot, or what to bring for the plan.
              </p>
            </div>
          ) : (
            messages.map((m) => renderBubble(m, m.sender_id === userId))
          )}
          <div ref={bottomRef} className="h-px shrink-0" />
        </div>

        {error ? (
          <p className="shrink-0 px-4 pb-1 text-xs font-medium text-accent">
            {error}
          </p>
        ) : null}

        {composer}
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div
        className="flex max-h-[min(50vh,400px)] min-h-55 flex-col gap-2.5 overflow-y-auto border-hairline bg-background p-3"
      >
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">
            No messages yet — coordinate the plan here.
          </p>
        ) : (
          messages.map((m) => renderBubble(m, m.sender_id === userId))
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="mt-2 text-xs font-medium text-accent">{error}</p>
      )}

      {composer}
    </div>
  );
}
