"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { UnreadCountBadge } from "@/components/unread-count-badge";
import { PAGE_CONTAINER } from "@/lib/layout";
import { useUnreadMessageCounts } from "@/lib/use-unread-messages";
import { supabase } from "@/lib/supabase";

const NAV_LINKS = [
  { href: "/feed", label: "Discover" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#why-outzy", label: "Why Outzy" },
] as const;

const pillPrimary =
  "rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-900/10 transition-colors hover:bg-coral-hover disabled:opacity-70";

function Logo() {
  return (
    <Link href="/" className="text-xl font-bold tracking-tight text-coral">
      Outzy
    </Link>
  );
}

export function SiteNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const { total: unreadTotal } = useUnreadMessageCounts();

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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async () => {
    setAuthLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/feed`,
        },
      });
    } catch (error) {
      console.error("Auth error:", error);
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
  };

  const linkClass = (href: string) => {
    const active =
      (href === "/feed" && pathname === "/feed") ||
      (href === "/messages" && pathname === "/messages") ||
      (href === "/create-activity" && pathname === "/create-activity") ||
      (href === "/profile" && pathname === "/profile");
    return `text-sm font-medium transition-colors ${
      active ? "text-coral" : "text-stone-500 hover:text-stone-900"
    }`;
  };

  return (
    <nav className="sticky top-0 z-50 animate-fade-up border-b border-stone-200/80 bg-[#faf9f7]/85 backdrop-blur-xl">
      <div
        className={`${PAGE_CONTAINER} grid grid-cols-[auto_1fr_auto] items-center gap-4 py-4 md:grid-cols-[1fr_auto_1fr]`}
      >
        <Logo />

        <div className="hidden items-center justify-center gap-8 md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <Link key={href} href={href} className={linkClass(href)}>
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-end gap-2 sm:gap-3">
          {user ? (
            <>
              <Link
                href="/messages"
                className={`hidden md:inline-flex items-center gap-1.5 ${linkClass("/messages")}`}
              >
                Messages
                <UnreadCountBadge count={user ? unreadTotal : 0} />
              </Link>
              <Link
                href="/create-activity"
                className={`hidden sm:inline-flex ${pillPrimary}`}
              >
                + Create
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-2 py-1.5 sm:px-3 sm:py-2"
              >
                {user.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt=""
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-coral text-sm font-bold text-white"
                  >
                    {user.user_metadata?.full_name?.charAt(0) ?? "?"}
                  </div>
                )}
                <span className="hidden text-sm font-semibold text-stone-900 sm:inline">
                  {user.user_metadata?.full_name?.split(" ")[0]}
                </span>
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-full px-3 py-2 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
              >
                Sign out
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={login}
              disabled={authLoading}
              className={pillPrimary}
            >
              {authLoading ? "…" : "Get early access"}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
