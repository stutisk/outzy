"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { UnreadCountBadge } from "@/components/unread-count-badge";
import { PAGE_CONTAINER } from "@/lib/layout";
import { cn } from "@/lib/cn";
import { useUnreadMessageCounts } from "@/lib/use-unread-messages";
import { supabase } from "@/lib/supabase";

const NAV_LINKS = [
  { href: "/feed", label: "Discover" },
  { href: "/messages", label: "Messages" },
  { href: "/create-activity", label: "Create" },
] as const;

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
      pathname === href ||
      (href === "/feed" && pathname === "/feed") ||
      (href === "/messages" && pathname === "/messages") ||
      (href === "/create-activity" && pathname === "/create-activity") ||
      (href === "/profile" && pathname === "/profile");
    return cn(
      "text-sm font-medium transition-opacity hover:opacity-70",
      active ? "text-ink underline underline-offset-4" : "text-muted",
    );
  };

  const onLanding = pathname === "/";

  return (
    <header className="border-hairline-b bg-background">
      <div
        className={`${PAGE_CONTAINER} grid grid-cols-[auto_1fr_auto] items-center gap-4 py-5 md:grid-cols-[1fr_auto_1fr]`}
      >
        <Link
          href="/"
          className="font-display text-xl tracking-tight text-ink"
        >
          Outzy.
        </Link>

        {!onLanding ? (
          <nav
            className="hidden items-center justify-center gap-8 md:flex"
            aria-label="App"
          >
            {NAV_LINKS.map(({ href, label }) => (
              <Link key={href} href={href} className={linkClass(href)}>
                <span className="inline-flex items-center gap-1.5">
                  {label}
                  {href === "/messages" && user ? (
                    <UnreadCountBadge count={unreadTotal} />
                  ) : null}
                </span>
              </Link>
            ))}
          </nav>
        ) : (
          <div className="hidden md:block" />
        )}

        <div className="flex items-center justify-end gap-3">
          {user ? (
            <>
              <Link href="/profile" className="flex items-center gap-2">
                <Avatar
                  src={user.user_metadata?.avatar_url}
                  name={user.user_metadata?.full_name}
                  size="sm"
                />
                <span className="hidden text-sm font-medium text-ink sm:inline">
                  {user.user_metadata?.full_name?.split(" ")[0]}
                </span>
              </Link>
              <button
                type="button"
                onClick={logout}
                className="text-sm text-muted hover:text-ink"
              >
                Sign out
              </button>
            </>
          ) : (
            <Button
              variant="secondary"
              showArrow
              onClick={login}
              disabled={authLoading}
              className="!px-0"
            >
              {authLoading ? "Connecting…" : "Sign in"}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
