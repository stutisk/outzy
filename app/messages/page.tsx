"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ChatModal } from "@/components/chat-modal";
import { MessagesGroupedList } from "@/components/messages-grouped-list";
import {
  EmptyState,
  InlineLoading,
  PageLoadingScreen,
} from "@/components/ui/page-state";
import { groupConversationsByActivity } from "@/lib/group-conversations";
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

  const groups = useMemo(() => groupConversationsByActivity(items), [items]);

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
      subtitle="Grouped by plan — open a thread or visit a profile"
    >
      <div className="mx-auto w-full max-w-2xl">
        {loading ? (
          <InlineLoading label="Loading conversations…" />
        ) : items.length === 0 ? (
          <EmptyState
            title="No chats yet"
            description="When a join request is accepted, your conversation shows up here."
            actionLabel="Browse plans"
            onAction={() => router.push("/feed")}
          />
        ) : (
          <MessagesGroupedList groups={groups} onOpenChat={openChat} />
        )}
      </div>

      <ChatModal open={chatOpen} conversationId={chatId} onClose={closeChat} />
    </AppShell>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<PageLoadingScreen label="Loading messages…" />}>
      <MessagesContent />
    </Suspense>
  );
}
