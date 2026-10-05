"use client";

import { useRouter } from "next/navigation";
import { RevealOnScroll } from "@/components/reveal-on-scroll";
import {
  navigateToCreateWithCategory,
  signInWithGoogleNext,
} from "@/lib/auth-nav";
import { LANDING_CATEGORIES } from "@/lib/landing-categories";
import { PAGE_CONTAINER } from "@/lib/layout";
import { supabase } from "@/lib/supabase";

export function LandingCategoriesSection() {
  const router = useRouter();

  const goCreate = (slug: string) => {
    void navigateToCreateWithCategory(slug, router);
  };

  const goCreateGeneric = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      router.push("/create-activity");
      return;
    }
    await signInWithGoogleNext("/create-activity");
  };

  return (
    <section className="move-section relative overflow-hidden py-20 md:py-28">
      <div className={`${PAGE_CONTAINER} relative`}>
        <RevealOnScroll>
          <header className="mx-auto max-w-3xl text-center">
            <span
              className="inline-block rounded-full bg-teal-50 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-teal-800"
            >
              Pick your vibe
            </span>
            <h2 className="mt-5 text-4xl font-bold tracking-tight text-navy md:text-5xl md:leading-[1.08]">
              What&apos;s the{" "}
              <span className="relative inline-block text-coral">
                move?
                <span
                  className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-highlight/90"
                  aria-hidden
                />
              </span>
            </h2>
            <p className="mt-5 text-lg leading-relaxed text-stone-600">
              Tap a category to start hosting — we&apos;ll pre-fill it on the
              create page (you can change it anytime).
            </p>
          </header>
        </RevealOnScroll>

        <ul
          className="mt-14 grid list-none gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3"
          aria-label="Activity categories"
        >
          {LANDING_CATEGORIES.map((cat, i) => (
            <li key={cat.slug} className="min-h-[4.5rem]">
              <RevealOnScroll delayMs={Math.min(i * 45, 360)} className="h-full">
                <button
                  type="button"
                  onClick={() => goCreate(cat.slug)}
                  className={`group move-lane relative flex h-full w-full items-center gap-4 overflow-hidden rounded-2xl bg-linear-to-br px-5 py-4 text-left ring-1 ring-inset transition-[transform,box-shadow,ring-color] duration-300 hover:-translate-y-1 hover:shadow-lg active:translate-y-0 active:scale-[0.99] sm:rounded-[1.35rem] sm:py-[1.15rem] ${cat.lane}`}
                >
                  <span
                    className="pointer-events-none absolute -right-8 -top-8 size-24 rounded-full bg-white/30 blur-2xl opacity-60 transition-opacity duration-300 group-hover:opacity-100"
                    aria-hidden
                  />

                  <span
                    className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-white/70 text-2xl shadow-sm backdrop-blur-sm transition-transform duration-300 group-hover:scale-110 sm:size-12"
                    aria-hidden
                  >
                    {cat.emoji}
                  </span>

                  <span className="relative min-w-0 flex-1">
                    <span className="block truncate text-base font-bold tracking-tight text-stone-900 sm:text-[1.05rem]">
                      {cat.name}
                    </span>
                    <span
                      className="mt-0.5 block text-xs font-medium text-stone-600/80 transition-colors group-hover:text-coral"
                    >
                      Host this →
                    </span>
                  </span>

                  <span
                    className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-white/80 text-sm font-semibold text-stone-600 shadow-sm transition-all duration-300 group-hover:translate-x-0.5 group-hover:bg-navy group-hover:text-white"
                    aria-hidden
                  >
                    +
                  </span>
                </button>
              </RevealOnScroll>
            </li>
          ))}
        </ul>

        <RevealOnScroll delayMs={200}>
          <div
            className="mt-14 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6"
          >
            <button
              type="button"
              onClick={() => router.push("/feed")}
              className="pill-interactive inline-flex items-center gap-2 rounded-full bg-coral px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-900/15 hover:bg-coral-hover"
            >
              Browse the feed
              <span aria-hidden>→</span>
            </button>
            <button
              type="button"
              onClick={() => void goCreateGeneric()}
              className="text-sm font-semibold text-stone-600 underline-offset-4 transition-colors hover:text-coral hover:underline"
            >
              Or pick category later
            </button>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
