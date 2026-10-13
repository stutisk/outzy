"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { LandingIconBox } from "@/components/landing-icon-box";
import { RevealOnScroll } from "@/components/reveal-on-scroll";
import {
  navigateToCreateWithCategory,
  signInWithGoogleNext,
} from "@/lib/auth-nav";
import { getLandingCategoryIcon } from "@/lib/landing-category-icons";
import { LANDING_CATEGORIES_FEATURED } from "@/lib/landing-categories";
import { LANDING_SECTION_PY, PAGE_CONTAINER } from "@/lib/layout";
import { supabase } from "@/lib/supabase";

const ICON_TINT: Record<string, string> = {
  hiking: "bg-emerald-50 text-emerald-700",
  coffee: "bg-amber-50 text-amber-800",
  gaming: "bg-indigo-50 text-indigo-700",
  food: "bg-orange-50 text-orange-800",
  running: "bg-rose-50 text-rose-700",
  photography: "bg-violet-50 text-violet-700",
};

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
    <section className={`move-section relative overflow-hidden ${LANDING_SECTION_PY}`}>
      <div className={`${PAGE_CONTAINER} relative`}>
        <RevealOnScroll>
          <header className="max-w-xl overflow-visible">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-600">
              Host something
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-navy md:text-3xl">
              What&apos;s the move?
            </h2>
            <p className="mt-3 text-base leading-relaxed text-stone-600">
              Pick a lane to start a plan — we pre-fill the form, you edit the
              details.
            </p>
          </header>
        </RevealOnScroll>

        <ul
          className="mt-8 grid list-none grid-cols-2 gap-3 md:grid-cols-3 md:gap-4"
          aria-label="Popular categories"
        >
          {LANDING_CATEGORIES_FEATURED.map((cat, i) => {
            const Icon = getLandingCategoryIcon(cat.slug);
            const tint = ICON_TINT[cat.slug] ?? "bg-stone-100 text-stone-700";

            return (
              <li key={cat.slug}>
                <RevealOnScroll delayMs={Math.min(i * 50, 250)} className="h-full">
                  <button
                    type="button"
                    onClick={() => goCreate(cat.slug)}
                    className="group flex h-full min-h-[4.75rem] w-full items-center gap-3 rounded-xl border border-black/10 bg-white px-4 py-4 text-left transition-all hover:-translate-y-0.5 hover:border-black/15 hover:bg-stone-50/80 hover:shadow-[0_8px_24px_rgb(0_0_0/0.05)] md:rounded-2xl"
                  >
                    <LandingIconBox icon={Icon} className={tint} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-stone-900">
                        {cat.name}
                      </span>
                      <span
                        className="mt-0.5 flex items-center gap-1 text-xs font-medium text-stone-500 group-hover:text-teal-800"
                      >
                        Host
                        <ArrowRight
                          className="size-3.5 transition-transform group-hover:translate-x-0.5"
                          strokeWidth={1.5}
                        />
                      </span>
                    </span>
                  </button>
                </RevealOnScroll>
              </li>
            );
          })}
        </ul>

        <RevealOnScroll delayMs={180}>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => router.push("/feed")}
              className="pill-interactive inline-flex items-center gap-2 rounded-full bg-coral px-6 py-3 text-sm font-semibold text-white hover:bg-coral-hover"
            >
              Browse the feed
              <ArrowRight className="size-4" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => void goCreateGeneric()}
              className="text-sm font-medium text-stone-600 hover:text-teal-800 hover:underline"
            >
              All categories on create →
            </button>
          </div>
        </RevealOnScroll>
      </div>
    </section>
  );
}
