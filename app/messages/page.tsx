"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, MessageSquare } from "lucide-react";
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

  const grouped = useMemo(() => {
    const map = new Map<
      string,
      { activityId: string; title: string; threads: ConversationListItem[] }
    >();
    for (const c of items) {
      const existing = map.get(c.activity_id);
      if (existing) {
        existing.threads.push(c);
      } else {
        map.set(c.activity_id, {
          activityId: c.activity_id,
          title: c.activity_title,
          threads: [c],
        });
      }
    }
    return [...map.values()];
  }, [items]);

  return (
    <AppShell
      title="Messages"
      subtitle="Grouped by plan — one thread per person you matched with"
    >
      <div className="mx-auto w-full max-w-lg">
        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner label="Loading conversations…" />
          </div>
        ) : items.length === 0 ? (
          <div
            className="rounded-2xl border border-dashed border-black/15 bg-white px-6 py-14 text-center"
          >
            <MessageSquare
              className="mx-auto size-10 text-stone-400"
              strokeWidth={1.5}
              aria-hidden
            />
            <p className="mt-4 text-sm font-medium text-stone-700">No chats yet</p>
            <p className="mt-2 text-sm text-stone-500">
              When a host accepts your request, the thread shows up here under
              that plan.
            </p>
            <button
              type="button"
              onClick={() => router.push("/feed")}
              className="mt-6 rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-white"
            >
              Browse plans
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.map((group) => {
              const groupUnread = group.threads.reduce(
                (n, t) => n + t.unread_count,
                0,
              );
              return (
                <section
                  key={group.activityId}
                  className="overflow-hidden rounded-2xl border border-black/10 bg-white"
                  aria-label={group.title}
                >
                  <header
                    className="flex items-center justify-between gap-3 border-b border-black/5 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <h2 className="truncate text-sm font-semibold text-navy">
                        {group.title}
                      </h2>
                      <p className="text-xs text-stone-500">
                        {group.threads.length} conversation
                        {group.threads.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    {groupUnread > 0 ? (
                      <UnreadCountBadge count={groupUnread} />
                    ) : null}
                  </header>
                  <ul className="divide-y divide-black/5">
                    {group.threads.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => openChat(c.id)}
                          className="group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-stone-50"
                        >
                          <span
                            className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-50 text-sm font-semibold text-teal-800"
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
                            <span className="block truncate text-sm font-semibold text-stone-900">
                              @{c.other_username}
                            </span>
                            <span className="block text-xs text-stone-500">
                              {new Date(c.created_at).toLocaleDateString(
                                undefined,
                                { month: "short", day: "numeric" },
                              )}
                            </span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            {c.unread_count > 0 ? (
                              <UnreadCountBadge count={c.unread_count} />
                            ) : null}
                            <ArrowRight
                              className="size-4 text-stone-400 transition-transform group-hover:translate-x-0.5"
                              strokeWidth={1.5}
                              aria-hidden
                            />
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
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
        <main className="flex min-h-screen items-center justify-center">
          <Spinner label="Loading messages…" />
        </main>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
