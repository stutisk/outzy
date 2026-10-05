"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type AppModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** sm = 28rem, md = 32rem, lg = 42rem */
  size?: "sm" | "md" | "lg";
  footer?: ReactNode;
  contentClassName?: string;
  /** e.g. z-[60] when stacking above other modals */
  overlayClassName?: string;
  /** Edge-to-edge viewport height (e.g. chat) */
  fullHeight?: boolean;
};

const sizeClass = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function AppModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = "sm",
  footer,
  contentClassName = "",
  overlayClassName = "z-[100]",
  fullHeight = false,
}: AppModalProps) {
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

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className={`fixed inset-0 flex overflow-hidden ${fullHeight ? "flex-col p-0" : "items-center justify-center p-4"} ${overlayClassName}`}
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-modal-title"
        className={`relative flex w-full flex-col overflow-hidden bg-white ${
          fullHeight
            ? "h-dvh max-h-dvh rounded-none border-0 shadow-none sm:mx-auto sm:max-w-lg sm:border-x sm:border-stone-200"
            : `max-h-[min(85vh,720px)] rounded-3xl border border-stone-200 shadow-xl ${sizeClass[size]}`
        }`}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-stone-100 px-4 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2
              id="app-modal-title"
              className="text-lg font-bold text-stone-900"
            >
              {title}
            </h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-stone-500">{subtitle}</p>
            ) : null}
          </div>
          {fullHeight ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
            >
              <span className="block text-xl leading-none" aria-hidden>
                ×
              </span>
            </button>
          ) : null}
        </div>

        <div
          className={`min-h-0 overscroll-contain ${fullHeight ? "flex flex-1 flex-col overflow-hidden" : "flex-1 overflow-y-auto px-6 py-4"} ${contentClassName}`}
        >
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 border-t border-stone-100 px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
