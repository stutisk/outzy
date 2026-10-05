"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LandingHeroVisual } from "@/components/landing-hero-visual";
import { RevealOnScroll } from "@/components/reveal-on-scroll";
import { SiteNavbar } from "@/components/site-navbar";
import { Spinner } from "@/components/spinner";
import { LandingCategoriesSection } from "@/components/landing-categories-section";
import { PAGE_CONTAINER } from "@/lib/layout";
import { signInWithGoogleNext } from "@/lib/auth-nav";
import { fetchUserProfile, isProfileComplete } from "@/lib/profile";
import { supabase } from "@/lib/supabase";

const pillPrimary =
  "pill-interactive inline-flex items-center justify-center gap-2 rounded-full bg-coral px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-900/15 transition-colors hover:bg-coral-hover hover:shadow-xl disabled:opacity-70";

const pillOutline =
  "pill-interactive inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/40 bg-transparent px-8 py-3.5 text-base font-semibold text-white transition-colors hover:border-white hover:bg-white/10";

export default function Home() {
  const [user, setUser] = useState<{ id: string } | null>(null);
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

  const login = async (nextPath = "/feed") => {
    setAuthLoading(true);
    try {
      await signInWithGoogleNext(nextPath);
    } catch (error) {
      console.error("Auth error:", error);
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
    <main className="min-h-screen overflow-x-hidden bg-[#faf9f7] text-navy">
      <SiteNavbar />

      {/* Hero */}
      <section className="landing-mesh relative">
        <div className={`${PAGE_CONTAINER} py-14 md:py-24`}>
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="text-center lg:text-left">
              <p
                className="mb-4 inline-flex animate-fade-up items-center gap-2 rounded-full border border-teal-100 bg-white/80 px-4 py-1.5 text-sm font-medium text-stone-600 shadow-sm backdrop-blur-sm"
              >
                <span className="size-2 rounded-full bg-coral animate-pulse" />
                Your vibe, your people.
              </p>
              <h1
                className="animate-fade-up stagger-1 text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl"
              >
                Main character plans,{" "}
                <span className="bg-linear-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  zero group-chat chaos.
                </span>
              </h1>
              <p
                className="animate-fade-up stagger-2 mx-auto mt-6 max-w-lg text-lg leading-relaxed text-stone-600 lg:mx-0"
              >
                Share the struggle of meeting people IRL. Find curated hangs, small
                groups, and plans that actually happen — without the endless group
                chat spiral.
              </p>

              <div
                className="animate-fade-up stagger-3 mt-8 flex flex-col items-center gap-4 sm:flex-row lg:justify-start"
              >
                {user ? (
                  <>
                    <button
                      type="button"
                      onClick={() => router.push("/feed")}
                      className={pillPrimary}
                    >
                      Find your people
                      <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                        →
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollTo("how-it-works")}
                      className="pill-interactive text-sm font-semibold text-stone-600 transition-colors hover:text-coral"
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
                      {authLoading ? "Connecting…" : "Find your people"}
                      {!authLoading && <span aria-hidden>→</span>}
                    </button>
                    <button
                      type="button"
                      onClick={() => scrollTo("how-it-works")}
                      className="pill-interactive text-sm font-semibold text-stone-600 transition-colors hover:text-coral"
                    >
                      See how it works →
                    </button>
                  </>
                )}
              </div>
            </div>

            <LandingHeroVisual />
          </div>

          <ul
            className="animate-fade-up stagger-4 mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 rounded-2xl border border-stone-200/60 bg-white/60 py-6 text-sm text-stone-600 shadow-sm backdrop-blur-sm"
          >
            {[
              "Curated experiences",
              "Small, welcoming groups",
              "Verified local hosts",
              "No awkward swiping",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span
                  className="flex size-5 items-center justify-center rounded-full bg-coral-50 text-xs text-coral"
                  aria-hidden
                >
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className={`${PAGE_CONTAINER} py-16 md:py-24`}>
        <RevealOnScroll>
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
            From &ldquo;maybe someday&rdquo; to{" "}
            <span className="text-coral">see you there.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-stone-600">
            Simple by design — four steps and you&apos;re out the door.
          </p>
        </RevealOnScroll>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              step: "01",
              title: "Create your profile",
              desc: "Sign in with Google and tell people what you're into.",
              icon: "👤",
              tint: "bg-coral-50",
            },
            {
              step: "02",
              title: "Find your thing",
              desc: "Browse hikes, coffee, games, and everything in between.",
              icon: "🔍",
              tint: "bg-violet-50",
            },
            {
              step: "03",
              title: "Save your spot",
              desc: "Request to join. Small groups, no pressure.",
              icon: "✋",
              tint: "bg-sky-50",
            },
            {
              step: "04",
              title: "Go do it together",
              desc: "Show up, make friends, rate the vibe.",
              icon: "🌟",
              tint: "bg-amber-50",
            },
          ].map((item, i) => (
            <RevealOnScroll key={item.step} delayMs={i * 80}>
              <div
                className="card-lift relative h-full rounded-3xl border border-stone-200/80 bg-white p-6 shadow-sm hover:border-teal-100/80"
              >
                <span className="absolute right-5 top-5 text-sm font-bold text-stone-300">
                  {item.step}
                </span>
                <div
                  className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl text-xl ${item.tint}`}
                >
                  {item.icon}
                </div>
                <h3 className="font-bold text-stone-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">
                  {item.desc}
                </p>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </section>

      {/* Why Outzy — dark */}
      <section id="why-outzy" className={`${PAGE_CONTAINER} pb-16 md:pb-24`}>
        <RevealOnScroll>
          <div
            className="overflow-hidden rounded-[2rem] bg-linear-to-br from-navy via-[#1a2332] to-[#0f3d35] px-6 py-12 shadow-2xl shadow-navy/20 md:px-12 md:py-16"
          >
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-stone-400">
                  Why Outzy
                </p>
                <h2 className="mt-3 text-3xl font-bold leading-tight text-white md:text-4xl">
                  Log off.{" "}
                  <span className="bg-highlight px-1 text-navy">Go make lore.</span>
                </h2>
                <p className="mt-4 max-w-md text-stone-300">
                  Built for people who want real plans with real humans — not
                  another dead group chat.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    user ? router.push("/feed") : login("/feed")
                  }
                  className={`mt-8 ${pillOutline}`}
                >
                  Join the community →
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { icon: "🛡️", title: "Real people", desc: "Verified profiles" },
                  {
                    icon: "📍",
                    title: "Safe by default",
                    desc: "Landmarks, not exact addresses",
                  },
                  {
                    icon: "💬",
                    title: "Actually social",
                    desc: "Small groups that show up",
                  },
                  {
                    icon: "✨",
                    title: "No pressure",
                    desc: "Request, chat, then commit",
                  },
                ].map((item, i) => (
                  <div
                    key={item.title}
                    className="card-lift rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
                    style={{ transitionDelay: `${i * 50}ms` }}
                  >
                    <span className="text-2xl">{item.icon}</span>
                    <h3 className="mt-2 font-semibold text-white">{item.title}</h3>
                    <p className="mt-1 text-sm text-stone-400">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </RevealOnScroll>
      </section>

      <LandingCategoriesSection />

      {/* Footer CTA */}
      <section className={`${PAGE_CONTAINER} pb-12`}>
        <RevealOnScroll>
          <div
            className="relative overflow-hidden rounded-[2rem] bg-linear-to-br from-teal-600 via-teal-600 to-emerald-600 px-6 py-12 text-center text-white shadow-xl shadow-teal-900/20 md:px-12 md:py-16"
          >
            <div
              className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full bg-white/10 blur-3xl"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute -bottom-16 -left-16 size-48 rounded-full bg-emerald-400/20 blur-2xl"
              aria-hidden
            />
            <p className="relative text-sm font-medium uppercase tracking-widest text-white/80">
              Your outside era starts now
            </p>
            <h2 className="relative mt-3 text-2xl font-bold md:text-3xl">
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
              className="pill-interactive relative mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-base font-semibold text-navy shadow-md disabled:opacity-70"
            >
              {user ? "Plan something" : "Get early access"}
              <span aria-hidden>→</span>
            </button>
          </div>
        </RevealOnScroll>
      </section>

      <footer className="border-t border-stone-200/80 py-8">
        <div
          className={`${PAGE_CONTAINER} flex flex-col items-center justify-between gap-4 text-sm text-stone-500 sm:flex-row`}
        >
          <span className="font-bold text-coral">Outzy</span>
          <p>© {new Date().getFullYear()} Outzy. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="transition-colors hover:text-stone-800">
              Safety
            </a>
            <a href="#" className="transition-colors hover:text-stone-800">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
