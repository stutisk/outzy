"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UnreadCountBadge } from "@/components/unread-count-badge";
import { PAGE_CONTAINER } from "@/lib/layout";
import { SiteNavbar } from "@/components/site-navbar";
import { useUnreadMessageCounts } from "@/lib/use-unread-messages";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";

const MOBILE_NAV = [
  { href: "/feed", label: "Feed" },
  { href: "/messages", label: "Messages" },
  { href: "/create-activity", label: "Create" },
  { href: "/profile", label: "Profile" },
] as const;

export function AppShell({
  children,
  title,
  subtitle,
  action,
  headerAlign = "start",
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  /** Center title/subtitle on md+ (e.g. narrow forms below) */
  headerAlign?: "start" | "center";
}) {
  const pathname = usePathname();
  const { total: unreadTotal } = useUnreadMessageCounts();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const load = async () => {
      const {
        data: { user: u },
      } = await supabase.auth.getUser();
      setUser(u);
    };
    load();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#faf9f7] text-navy">
      <SiteNavbar />

      {(title || subtitle || action) && (
        <div
          className={`${PAGE_CONTAINER} flex flex-wrap items-end gap-4 pt-8 pb-2 ${
            headerAlign === "center" && !action
              ? "md:justify-center"
              : "justify-between"
          }`}
        >
          <div
            className={
              headerAlign === "center" ? "md:mx-auto md:max-w-xl md:text-center" : undefined
            }
          >
            {title ? (
              <h1 className="text-xl font-semibold tracking-tight text-stone-900">
                {title}
              </h1>
            ) : null}
            {subtitle ? (
              <p className="mt-1 text-sm text-stone-500">{subtitle}</p>
            ) : null}
          </div>
          {action}
        </div>
      )}

      <div className={`${PAGE_CONTAINER} animate-fade-up pb-24 sm:pb-12`}>
        {children}
      </div>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-white md:hidden"
        aria-label="Main"
      >
        <div className={`${PAGE_CONTAINER} flex justify-around py-2`}>
          {MOBILE_NAV.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`relative px-4 py-1 text-xs font-medium ${
                  active ? "text-coral" : "text-stone-400"
                }`}
              >
                {label}
                {href === "/messages" && user ? (
                  <span className="absolute -right-0.5 -top-1">
                    <UnreadCountBadge count={unreadTotal} />
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
