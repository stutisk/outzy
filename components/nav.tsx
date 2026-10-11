"use client";

import Link from "next/link";
import { PAGE_CONTAINER } from "@/lib/layout";
import { cn } from "@/lib/cn";

const LANDING_LINKS = [
  { href: "#plans", label: "Plans" },
  { href: "#about", label: "About" },
] as const;

type NavProps = {
  onPrimaryCta?: () => void;
  primaryCtaLabel?: string;
  primaryCtaDisabled?: boolean;
  className?: string;
};

export function Nav({
  onPrimaryCta,
  primaryCtaLabel = "Find your people",
  primaryCtaDisabled = false,
  className,
}: NavProps) {
  return (
    <header
      className={cn(
        "border-hairline-b bg-background",
        className,
      )}
    >
      <div
        className={`${PAGE_CONTAINER} grid grid-cols-[1fr_auto] items-center gap-4 py-5 md:grid-cols-[1fr_auto_1fr]`}
      >
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight text-ink"
        >
          Outzy.
        </Link>

        <nav
          className="hidden items-center justify-center gap-10 md:flex"
          aria-label="Main"
        >
          {LANDING_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-ink transition-opacity hover:opacity-70"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex justify-end">
          {onPrimaryCta ? (
            <button
              type="button"
              onClick={onPrimaryCta}
              disabled={primaryCtaDisabled}
              className="text-sm font-medium text-ink underline-offset-4 hover:underline disabled:opacity-50"
            >
              {primaryCtaLabel} →
            </button>
          ) : (
            <Link
              href="/feed"
              className="text-sm font-medium text-ink underline-offset-4 hover:underline"
            >
              {primaryCtaLabel} →
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
