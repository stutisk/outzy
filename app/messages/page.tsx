"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ChatModal } from "@/components/chat-modal";
import { Spinner } from "@/components/spinner";
import { UnreadCountBadge } from "@/components/unread-count-badge";
import { listMyConversations, type ConversationListItem } from "@/lib/chat";
import { MESSAGES_READ_EVENT } from "@/lib/use-unread-messages";
import { supabase } from "@/lib/supabase";

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openFromUrl = searchParams.get("open");

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ConversationListItem[]>([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/");
      return;
    }
    const list = await listMyConversations(user.id);
    setItems(list);
    setLoading(false);
  }, [router]);

  const openChat = useCallback((id: string) => {
    setChatId(id);
    setChatOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setChatOpen(false);
    setChatId(null);
    void loadConversations();
    if (openFromUrl) {
      router.replace("/messages", { scroll: false });
    }
  }, [openFromUrl, router, loadConversations]);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const onRead = () => {
      void loadConversations();
    };
    window.addEventListener(MESSAGES_READ_EVENT, onRead);
    return () => window.removeEventListener(MESSAGES_READ_EVENT, onRead);
  }, [loadConversations]);

  useEffect(() => {
    if (openFromUrl && !loading) {
      openChat(openFromUrl);
    }
  }, [openFromUrl, loading, openChat]);

  return (
    <AppShell
      title="Messages"
      subtitle="Chats for plans you host or joined"
    >
      <div className="mx-auto w-full max-w-md">
      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner label="Loading conversations…" />
        </div>
      ) : items.length === 0 ? (
        <div
          className="rounded-3xl border border-dashed border-stone-200 bg-white px-6 py-14 text-center"
        >
          <p className="text-sm font-medium text-stone-700">No chats yet</p>
          <p className="mt-2 text-sm text-stone-500">
            When a join request is accepted, your conversation shows up here.
          </p>
          <button
            type="button"
            onClick={() => router.push("/feed")}
            className="mt-6 rounded-full bg-coral px-5 py-2.5 text-sm font-bold text-white"
          >
            Browse plans
          </button>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => openChat(c.id)}
                className="flex w-full items-center gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 text-left transition-colors hover:border-coral-200 hover:bg-coral-50/30"
              >
                <span
                  className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-coral to-coral-hover text-sm font-bold text-white"
                >
                  {c.other_avatar_url ? (
                    <img
                      src={c.other_avatar_url}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    c.other_username.charAt(0).toUpperCase()
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-stone-900">
                    {c.activity_title}
                  </span>
                  <span className="block truncate text-sm text-stone-500">
                    @{c.other_username}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  {c.unread_count > 0 ? (
                    <UnreadCountBadge count={c.unread_count} />
                  ) : null}
                  <span className="text-xs text-stone-400">
                    {new Date(c.created_at).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      </div>

      <ChatModal open={chatOpen} conversationId={chatId} onClose={closeChat} />
    </AppShell>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#faf9f7]">
          <Spinner />
        </main>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
