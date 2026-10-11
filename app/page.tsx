"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Footer } from "@/components/footer";
import { Nav } from "@/components/nav";
import { Spinner } from "@/components/spinner";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { PlanCard, PlanListItem } from "@/components/ui/plan-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatRow } from "@/components/ui/stat-row";
import { signInWithGoogleNext } from "@/lib/auth-nav";
import {
  computeLandingStats,
  filterUpcomingActivities,
  formatPlanHeroSchedule,
  formatPlanListMeta,
  planRefCode,
  type LandingActivity,
} from "@/lib/landing-plans";
import { getCategoryLabel } from "@/lib/categories";
import { PAGE_CONTAINER } from "@/lib/layout";
import { fetchUserProfile, isProfileComplete } from "@/lib/profile";
import { supabase } from "@/lib/supabase";

function padIndex(n: number) {
  return String(n).padStart(2, "0");
}

function hostFromRow(row: LandingActivity) {
  const embedded = row.host;
  if (embedded && typeof embedded === "object" && "username" in embedded) {
    return embedded.username ?? null;
  }
  return null;
}

export default function Home() {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [activities, setActivities] = useState<LandingActivity[]>([]);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user: u },
        } = await supabase.auth.getUser();

        if (!u) {
          return;
        }

        setUser(u);
        const { profile, error: profileError } = await fetchUserProfile(u.id);

        if (profileError) {
          console.error("Could not load profile:", profileError.message);
        } else if (!isProfileComplete(profile)) {
          router.push("/onboarding");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, [router]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const loadPlans = async () => {
      const withHosts = await supabase
        .from("activities")
        .select(
          "id, title, city, activity_date, max_people, category, created_at, description, user_id, latitude, longitude, users(username)",
        )
        .order("activity_date", { ascending: true })
        .limit(24);

      if (!withHosts.error && withHosts.data) {
        setActivities(
          (withHosts.data as Record<string, unknown>[]).map((row) => {
            const users = row.users as
              | { username?: string | null }
              | { username?: string | null }[]
              | null
              | undefined;
            const host = Array.isArray(users) ? users[0] : users;
            const { users: _users, ...rest } = row;
            return { ...(rest as LandingActivity), host };
          }),
        );
        return;
      }

      const plain = await supabase
        .from("activities")
        .select(
          "id, title, city, activity_date, max_people, category, created_at, description, user_id, latitude, longitude",
        )
        .order("activity_date", { ascending: true })
        .limit(24);

      if (plain.error) {
        console.error("Could not load plans for landing:", plain.error.message);
        return;
      }

      setActivities((plain.data ?? []) as LandingActivity[]);
    };

    void loadPlans();
  }, [loading, user?.id]);

  const upcoming = useMemo(
    () => filterUpcomingActivities(activities),
    [activities],
  );

  const stats = useMemo(() => computeLandingStats(activities), [activities]);

  const featured = upcoming[0];
  const listPlans = upcoming.slice(0, 6);
  const spotlight = upcoming[0];

  const login = async (nextPath = "/feed") => {
    setAuthLoading(true);
    try {
      await signInWithGoogleNext(nextPath);
    } catch (error) {
      console.error("Auth error:", error);
      setAuthLoading(false);
    }
  };

  const goFeed = () => router.push("/feed");

  const primaryCta = () => {
    if (user) {
      goFeed();
      return;
    }
    void login();
  };

  const scrollToPlans = () => {
    document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Spinner label="Loading Outzy…" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-ink">
      <Nav
        onPrimaryCta={primaryCta}
        primaryCtaDisabled={authLoading}
        primaryCtaLabel={
          authLoading ? "Connecting…" : "Find your people"
        }
      />

      {/* Hero */}
      <section className="border-hairline-b bg-background">
        <div className={`${PAGE_CONTAINER} py-14 md:py-20 lg:py-24`}>
          <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="max-w-xl">
              <Eyebrow className="mb-8">Plans for actual people</Eyebrow>
              <SectionHeading
                as="h1"
                title="Get off the group chat."
                accentWord="group chat"
              />
              <p className="type-body mt-6 max-w-md">
                Outzy helps you find small, welcoming hangs nearby — coffee,
                walks, games, and everything in between — without the endless
                maybe thread.
              </p>
              <div className="mt-10">
                <Button
                  variant="primary"
                  onClick={user ? goFeed : scrollToPlans}
                  disabled={authLoading}
                >
                  See plans nearby
                </Button>
              </div>
            </div>

            <div className="w-full max-w-md lg:max-w-none lg:justify-self-end">
              {featured ? (
                <PlanCard
                  variant="hero"
                  index={padIndex(1)}
                  categoryLabel={getCategoryLabel(featured.category).toUpperCase()}
                  refCode={planRefCode(featured.id)}
                  schedule={formatPlanHeroSchedule(featured)}
                  title={featured.title}
                  hostLabel={
                    hostFromRow(featured)
                      ? `Hosted by ${hostFromRow(featured)}`
                      : undefined
                  }
                  spotsLabel={`${featured.max_people} spots`}
                  href={`/activity/${featured.id}`}
                />
              ) : (
                <div className="border-hairline bg-surface p-8">
                  <Eyebrow className="mb-4 text-accent">Meet up</Eyebrow>
                  <p className="font-display text-2xl text-ink">
                    {user
                      ? "No upcoming plans yet."
                      : "Sign in to see plans near you."}
                  </p>
                  <p className="type-body-sm mt-3">
                    Real hosts publish here when they&apos;re ready to meet IRL.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {stats ? (
        <section className="border-hairline-b bg-surface" aria-label="Community stats">
          <div className={PAGE_CONTAINER}>
            <StatRow stats={stats} />
          </div>
        </section>
      ) : null}

      {/* Plans */}
      <section id="plans" className="border-hairline-b bg-background">
        <div className={`${PAGE_CONTAINER} py-16 md:py-24`}>
          <div className="flex flex-col gap-6 border-hairline-b pb-10 md:flex-row md:items-end md:justify-between">
            <Eyebrow>Around you</Eyebrow>
            <SectionHeading
              title="A plan for this week."
              accentWord="plan"
              className="md:text-right"
            />
          </div>

          <div className="mt-10 grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <div className="border-hairline-t">
                {listPlans.length > 0 ? (
                  listPlans.map((plan, i) => {
                    const { weekday, time } = formatPlanListMeta(plan);
                    return (
                      <PlanListItem
                        key={plan.id}
                        index={padIndex(i + 1)}
                        timeLabel={`${weekday} · ${time}`}
                        title={plan.title}
                        href={`/activity/${plan.id}`}
                      />
                    );
                  })
                ) : (
                  <p className="border-hairline-b py-10 text-sm text-muted">
                    {user
                      ? "Nothing on the calendar yet — check Discover or post the first plan."
                      : "Sign in to browse upcoming plans in your area."}
                  </p>
                )}
              </div>
            </div>

            <div className="lg:pt-2">
              {spotlight ? (
                <PlanCard
                  variant="featured"
                  index={padIndex(1)}
                  eyebrow="Happening nearby"
                  title={spotlight.title}
                  href={`/activity/${spotlight.id}`}
                />
              ) : (
                <div className="flex min-h-[18rem] flex-col justify-center border-hairline bg-highlight/40 p-8">
                  <p className="font-display text-2xl text-ink">
                    Your next hang starts here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="bg-ink text-surface">
        <div
          className={`${PAGE_CONTAINER} py-20 text-center md:py-28`}
        >
          <Eyebrow onDark centered className="mb-8">
            Why Outzy?
          </Eyebrow>
          <SectionHeading
            onDark
            title="Less scrolling. More stories."
            accentWord="stories"
            className="mx-auto max-w-3xl"
          />
          <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-surface/70">
            We built Outzy for people who want real plans with real humans —
            small groups, clear times, and hosts who actually reply.
          </p>
          <Button
            variant="secondary"
            onDark
            className="mt-10"
            onClick={() => (user ? goFeed() : login("/feed"))}
            disabled={authLoading}
          >
            Join the community
          </Button>
        </div>
      </section>

      <Footer />
    </main>
  );
}
