"use client";

import { ChevronLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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

  const initial =
    meta?.otherUsername?.charAt(0).toUpperCase() ?? "?";

  return createPortal(
    <div
      className={`fixed inset-0 flex items-stretch justify-center ${CHAT_OVERLAY_Z} bg-stone-200/50 p-0 backdrop-blur-sm sm:p-4 sm:py-6`}
      role="presentation"
    >
      <div
        className="flex h-dvh w-full max-w-md flex-col overflow-hidden bg-[#faf9f7] shadow-none sm:h-[min(720px,calc(100dvh-3rem))] sm:rounded-3xl sm:border sm:border-stone-200/90 sm:bg-white sm:shadow-xl sm:shadow-stone-900/8"
        role="dialog"
        aria-modal="true"
        aria-label={meta?.activityTitle ?? "Chat"}
      >
        <header
          className="flex shrink-0 items-center gap-3 border-b border-stone-200/80 bg-white/95 px-3 pb-3 pt-[max(0.65rem,env(safe-area-inset-top))] backdrop-blur-sm sm:rounded-t-3xl sm:px-4"
        >
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close chat"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900"
          >
            <ChevronLeft className="size-5" strokeWidth={2.25} />
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span
              className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-coral to-coral-hover text-sm font-bold text-white ring-2 ring-white shadow-sm"
            >
              {meta?.otherAvatarUrl ? (
                <img
                  src={meta.otherAvatarUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                initial
              )}
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-[15px] font-bold leading-tight text-stone-900">
                {meta?.activityTitle ?? "Messages"}
              </h2>
              <p className="truncate text-xs font-medium text-coral">
                {meta ? `@${meta.otherUsername}` : "Loading…"}
              </p>
            </div>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col bg-[#f4f3f0] sm:bg-stone-50/80">
          {conversationId ? (
            <ChatPanel
              conversationId={conversationId}
              onMeta={setMeta}
              fillHeight
            />
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
