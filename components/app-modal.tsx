"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

type AppModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  footer?: ReactNode;
  contentClassName?: string;
  overlayClassName?: string;
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
      className={cn(
        "fixed inset-0 flex overflow-hidden bg-ink/50",
        fullHeight ? "flex-col p-0" : "items-center justify-center p-4",
        overlayClassName,
      )}
      role="presentation"
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-modal-title"
        className={cn(
          "relative flex w-full flex-col overflow-hidden border-hairline bg-surface",
          fullHeight
            ? "h-dvh max-h-dvh sm:mx-auto sm:max-w-lg sm:border-x"
            : cn("max-h-[min(85vh,720px)]", sizeClass[size]),
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-hairline-b px-4 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2
              id="app-modal-title"
              className="font-display text-xl text-ink"
            >
              {title}
            </h2>
            {subtitle ? (
              <p className="type-body-sm mt-1">{subtitle}</p>
            ) : null}
          </div>
          {fullHeight ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 px-2 py-1 text-2xl leading-none text-muted hover:text-ink"
            >
              <span aria-hidden>×</span>
            </button>
          ) : null}
        </div>

        <div
          className={cn(
            "min-h-0 overscroll-contain",
            fullHeight
              ? "flex flex-1 flex-col overflow-hidden"
              : "flex-1 overflow-y-auto px-6 py-4",
            contentClassName,
          )}
        >
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 border-hairline-t px-6 py-4">{footer}</div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
