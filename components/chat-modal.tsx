"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Avatar } from "@/components/ui/avatar";
import { ChatPanel, type ChatPanelMeta } from "@/components/chat-panel";

const CHAT_OVERLAY_Z = "z-[110]";

export function ChatModal({
  open,
  conversationId,
  onClose,
}: {
  open: boolean;
  conversationId: string | null;
  onClose: () => void;
}) {
  const [meta, setMeta] = useState<ChatPanelMeta | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const handleClose = () => {
    setMeta(null);
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const isOpen = open && !!conversationId;
  if (!mounted || !isOpen) return null;

  return createPortal(
    <div
      className={`fixed inset-0 flex items-stretch justify-center ${CHAT_OVERLAY_Z} bg-ink/40 p-0 sm:p-4 sm:py-6`}
      role="presentation"
    >
      <div
        className="flex h-dvh w-full max-w-md flex-col overflow-hidden border-hairline bg-background sm:h-[min(720px,calc(100dvh-3rem))]"
        role="dialog"
        aria-modal="true"
        aria-label={meta?.activityTitle ?? "Chat"}
      >
        <header
          className="flex shrink-0 items-center gap-3 border-hairline-b bg-surface px-3 pb-3 pt-[max(0.65rem,env(safe-area-inset-top))] sm:px-4"
        >
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close chat"
            className="flex size-9 shrink-0 items-center justify-center text-muted hover:text-ink"
          >
            <ChevronLeft className="size-5" strokeWidth={2.25} />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-3">
            {meta?.otherUserId ? (
              <Link
                href={`/profile?userId=${meta.otherUserId}`}
                className="shrink-0"
                aria-label={`View @${meta.otherUsername}'s profile`}
              >
                <Avatar
                  src={meta.otherAvatarUrl}
                  name={meta.otherUsername}
                  size="md"
                  className="!size-10"
                />
              </Link>
            ) : (
              <Avatar
                src={meta?.otherAvatarUrl}
                name={meta?.otherUsername}
                size="md"
                className="!size-10"
              />
            )}
            <div className="min-w-0 flex-1">
              {meta?.activityId ? (
                <Link
                  href={`/activity/${meta.activityId}`}
                  className="block truncate font-display text-base leading-tight text-ink hover:text-accent"
                >
                  {meta.activityTitle}
                </Link>
              ) : (
                <h2 className="truncate font-display text-base leading-tight text-ink">
                  {meta?.activityTitle ?? "Messages"}
                </h2>
              )}
              {meta?.otherUserId ? (
                <Link
                  href={`/profile?userId=${meta.otherUserId}`}
                  className="truncate text-xs font-medium text-accent hover:underline"
                >
                  @{meta.otherUsername}
                </Link>
              ) : (
                <p className="truncate text-xs font-medium text-muted">
                  Loading…
                </p>
              )}
            </div>
          </div>
        </header>

        <ChatPanel
          conversationId={conversationId!}
          onMeta={setMeta}
          fillHeight
        />
      </div>
    </div>,
    document.body,
  );
}
