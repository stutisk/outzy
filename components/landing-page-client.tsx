"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Hand,
  MapPin,
  MessageCircle,
  Search,
  Shield,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { LandingCategoriesSection } from "@/components/landing-categories-section";
import { LandingFooter } from "@/components/landing-footer";
import { LandingHappeningWeek } from "@/components/landing-happening-week";
import { LandingHeroVisual } from "@/components/landing-hero-visual";
import { LandingHowItWorks } from "@/components/landing-how-it-works";
import { LandingIconBox } from "@/components/landing-icon-box";
import { RevealOnScroll } from "@/components/reveal-on-scroll";
import { SiteNavbar } from "@/components/site-navbar";
import { Spinner } from "@/components/spinner";
import { LANDING_SECTION_PY, PAGE_CONTAINER } from "@/lib/layout";
import { signInWithGoogleNext } from "@/lib/auth-nav";
import type { LandingPlansPayload } from "@/lib/landing-plan-types";
import { fetchUserProfile, isProfileComplete } from "@/lib/profile";
import { supabase } from "@/lib/supabase";

const pillPrimary =
  "pill-interactive inline-flex items-center justify-center gap-2 rounded-full bg-coral px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-900/15 transition-colors hover:bg-coral-hover hover:shadow-xl disabled:opacity-70";

const pillOutline =
  "pill-interactive inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/40 bg-transparent px-8 py-3.5 text-base font-semibold text-white transition-colors hover:border-white hover:bg-white/10";

const HOW_STEPS = [
  {
    step: "01",
    title: "Create your profile",
    desc: "Sign in with Google and tell people what you're into.",
    icon: UserPlus,
    tint: "bg-teal-50 text-teal-800",
  },
  {
    step: "02",
    title: "Find your thing",
    desc: "Browse hikes, coffee, games, and plans with a real time and place.",
    icon: Search,
    tint: "bg-violet-50 text-violet-700",
  },
  {
    step: "03",
    title: "Save your spot",
    desc: "Request to join. Hosts reply in chat — small groups, no pressure.",
    icon: Hand,
    tint: "bg-sky-50 text-sky-700",
  },
  {
    step: "04",
    title: "Go do it together",
    desc: "Show up, meet people, and rate the vibe.",
    icon: Sparkles,
    tint: "bg-amber-50 text-amber-800",
  },
] as const;

type LandingPageClientProps = {
  landing: LandingPlansPayload;
  initialUserId: string | null;
};

export function LandingPageClient({
  landing,
  initialUserId,
}: LandingPageClientProps) {
  const [user, setUser] = useState<{ id: string } | null>(
    initialUserId ? { id: initialUserId } : null,
  );
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user: u },
        } = await supabase.auth.getUser();

        if (!u) {
          setUser(null);
          return;
        }

        setUser(u);
        const { profile, error: profileError } = await fetchUserProfile(u.id);

        if (profileError) {
        } else if (!isProfileComplete(profile)) {
          router.push("/onboarding");
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    void getUser();
  }, [router]);

  const trustCopy =
    landing.trustLine ?? "Free to join. Hosted by people in your city.";

  const userId = user?.id ?? initialUserId;

  const login = async (nextPath = "/feed") => {
    setAuthLoading(true);
    try {
      await signInWithGoogleNext(nextPath);
    } catch (error) {
      
      setAuthLoading(false);
    }
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f7]">
        <Spinner label="Loading Outzy…" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf9f7] text-navy">
      <SiteNavbar />

      <section className="landing-mesh relative overflow-visible">
        <div
          className={`${PAGE_CONTAINER} overflow-visible ${LANDING_SECTION_PY} pb-6 md:pb-8`}
        >
          <div className="grid items-center gap-12 overflow-visible lg:grid-cols-2 lg:gap-16">
            <div className="text-center lg:text-left">
              <p className="mb-4 inline-flex animate-fade-up items-center gap-2 rounded-full border border-teal-100 bg-white/80 px-4 py-1.5 text-sm font-medium text-stone-600 shadow-sm backdrop-blur-sm">
                <span className="size-2 rounded-full bg-coral animate-pulse" />
                Your vibe, your people.
              </p>
              <h1 className="animate-fade-up stagger-1 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
                Main character plans,{" "}
                <span className="bg-linear-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  zero group-chat chaos.
                </span>
              </h1>
              <p className="animate-fade-up stagger-2 mx-auto mt-6 max-w-lg text-lg leading-relaxed text-stone-600 lg:mx-0">
                Find curated hangs, small groups, and plans that actually happen
                without the endless group chat spiral.
              </p>

              <div className="animate-fade-up stagger-3 mt-8 flex flex-col items-center gap-4 sm:flex-row lg:justify-start">
                {user ? (
                  <>
                    <button
                      type="button"
                      onClick={() => router.push("/feed")}
                      className={pillPrimary}
                    >
                      Find your people →
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollTo("how-it-works")}
                      className="text-sm font-semibold text-stone-600 transition-colors hover:text-coral"
                    >
                      See how it works →
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => login()}
                      disabled={authLoading}
                      className={pillPrimary}
                    >
                      {authLoading ? "Connecting…" : "Find your people →"}
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollTo("how-it-works")}
                      className="text-sm font-semibold text-stone-600 transition-colors hover:text-coral"
                    >
                      See how it works →
                    </button>
                  </>
                )}
              </div>
              {/* <p
                className="animate-fade-up stagger-4 mt-8 text-center text-sm font-medium text-stone-600 lg:text-left"
              >
                {trustCopy}
              </p> */}
            </div>

            <div className="flex overflow-visible lg:min-h-[38rem] lg:items-center">
              <LandingHeroVisual plans={landing.heroPlans} />
            </div>
          </div>
        </div>
      </section>

      <LandingHappeningWeek plans={landing.happeningPlans} />

      <LandingHowItWorks
        steps={[...HOW_STEPS]}
        featuredPlan={landing.featuredPlan}
        previewLabel={landing.previewLabel}
        userId={userId}
      />

      <section
        id="why-outzy"
        className={`${PAGE_CONTAINER} ${LANDING_SECTION_PY}`}
      >
        <RevealOnScroll>
          <div className="overflow-hidden rounded-3xl border border-black/10 bg-linear-to-br from-navy via-[#1a2332] to-[#0f3d35] px-6 py-10 md:px-10 md:py-12">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">
                  Why Outzy
                </p>
                <h2 className="mt-3 text-3xl font-bold leading-tight text-white md:text-4xl">
                  Log off.{" "}
                  <span className="bg-highlight px-1 text-navy">
                    Go make lore.
                  </span>
                </h2>
                <p className="mt-4 max-w-md text-stone-300">
                  Built for people who want real plans with real humans , not
                  another dead group chat.
                </p>
                <button
                  type="button"
                  onClick={() => (user ? router.push("/feed") : login("/feed"))}
                  className={`mt-8 ${pillOutline}`}
                >
                  Join the community →
                </button>
              </div>

              <ul className="grid list-none gap-3 sm:grid-cols-2">
                {[
                  {
                    icon: Shield,
                    title: "Signed-in humans",
                    desc: "Google sign-in no throwaway accounts.",
                    tint: "bg-teal-500/15 text-teal-100",
                  },
                  {
                    icon: MapPin,
                    title: "Neighborhood-first",
                    desc: "City and meetup spot, not your door number.",
                    tint: "bg-white/10 text-stone-100",
                  },
                  {
                    icon: MessageCircle,
                    title: "Host in the loop",
                    desc: "One thread per guest after you accept.",
                    tint: "bg-white/10 text-stone-100",
                  },
                  {
                    icon: Sparkles,
                    title: "Low stakes",
                    desc: "Request, chat, show up when it feels right.",
                    tint: "bg-amber-400/15 text-amber-100",
                  },
                ].map((item) => (
                  <li
                    key={item.title}
                    className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <LandingIconBox icon={item.icon} className={item.tint} />
                    <h3 className="mt-3 text-sm font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-stone-400">{item.desc}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      <LandingCategoriesSection />

      <section className={`${PAGE_CONTAINER} ${LANDING_SECTION_PY}`}>
        <RevealOnScroll>
          <div className="rounded-3xl border border-black/10 bg-linear-to-br from-teal-600 via-teal-600 to-emerald-600 px-6 py-10 text-center text-white md:px-10 md:py-12">
            <p className="text-sm font-medium uppercase tracking-widest text-white/80">
              Your outside era starts now
            </p>
            <h2 className="mt-3 text-2xl font-bold md:text-3xl">
              We&apos;ll duck out. You don&apos;t have to.
            </h2>
            <button
              type="button"
              onClick={() =>
                user
                  ? router.push("/create-activity")
                  : login("/create-activity")
              }
              disabled={authLoading}
              className="pill-interactive mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-base font-semibold text-navy disabled:opacity-70"
            >
              {user ? "Plan something" : "Get early access"} →
            </button>
            <p className="mt-4 text-sm text-white/85">
              Takes 30 seconds. No swiping.
            </p>
          </div>
        </RevealOnScroll>
      </section>

      <LandingFooter />
    </main>
  );
}
