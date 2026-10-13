"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Calendar, Compass, MapPin, Users } from "lucide-react";
import { LandingRequestJoinButton } from "@/components/landing-request-join-button";
import { LandingIconBox } from "@/components/landing-icon-box";
import { RevealOnScroll } from "@/components/reveal-on-scroll";
import type { LandingPlan } from "@/lib/landing-plan-types";
import { LANDING_SECTION_PY, PAGE_CONTAINER } from "@/lib/layout";

type Step = {
  step: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  tint: string;
};

type LandingHowItWorksProps = {
  steps: Step[];
  featuredPlan: LandingPlan | null;
  previewLabel: string;
  userId: string | null;
};

function PlanPreview({
  plan,
  previewLabel,
  userId,
}: {
  plan: LandingPlan;
  previewLabel: string;
  userId: string | null;
}) {
  const description =
    plan.description ||
    "Small group, easy pace — request to join and the host will reply in chat.";

  return (
    <div
      className="mx-auto w-full max-w-[280px] rounded-[2rem] border border-black/10 bg-white p-3 shadow-[0_16px_48px_rgb(0_0_0/0.1)]"
    >
      <div className="rounded-[1.4rem] border border-black/5 bg-stone-50 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-700">
          {previewLabel}
        </p>
        <h3 className="mt-2 text-lg font-semibold text-navy">{plan.title}</h3>
        <div className="mt-3 space-y-2 text-sm text-stone-600">
          <p className="flex items-center gap-2">
            <Calendar className="size-4 shrink-0 text-teal-700" strokeWidth={1.5} />
            {plan.when}
          </p>
          <p className="flex items-center gap-2">
            <MapPin className="size-4 shrink-0 text-teal-700" strokeWidth={1.5} />
            {plan.neighborhood}
          </p>
          <p className="flex items-center gap-2">
            <Users className="size-4 shrink-0 text-teal-700" strokeWidth={1.5} />
            {plan.spotsLeft} spots left · small group
          </p>
        </div>
        <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-stone-500">
          {description}
        </p>
        <LandingRequestJoinButton plan={plan} userId={userId} />
      </div>
    </div>
  );
}

function BrowseActivitiesPreview() {
  return (
    <div
      className="mx-auto w-full max-w-[280px] rounded-[2rem] border border-black/10 bg-white p-3 shadow-[0_16px_48px_rgb(0_0_0/0.1)]"
    >
      <div className="rounded-[1.4rem] border border-black/5 bg-stone-50 p-4 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-teal-700">
          Upcoming near you
        </p>
        <div
          className="mx-auto mt-4 flex size-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-800"
          aria-hidden
        >
          <Compass className="size-7" strokeWidth={1.5} />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-navy">
          Browse upcoming activities
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">
          See what&apos;s on the feed — hikes, coffee, games, and more with a
          real time and neighborhood.
        </p>
        <Link
          href="/feed"
          className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-coral py-2.5 text-sm font-semibold text-white transition-colors hover:bg-coral-hover"
        >
          Browse activities
        </Link>
      </div>
    </div>
  );
}

export function LandingHowItWorks({
  steps,
  featuredPlan,
  previewLabel,
  userId,
}: LandingHowItWorksProps) {
  return (
    <section id="how-it-works" className={`${PAGE_CONTAINER} ${LANDING_SECTION_PY}`}>
      <RevealOnScroll>
        <div className="max-w-lg">
          <h2 className="text-2xl font-semibold tracking-tight text-navy md:text-3xl">
            From &ldquo;maybe someday&rdquo; to see you there.
          </h2>
          <p className="mt-3 text-stone-600">
            Four steps — most people are browsing plans in under two minutes.
          </p>
        </div>
      </RevealOnScroll>

      <div className="mt-10 grid gap-12 lg:grid-cols-2 lg:items-start">
        <ol className="relative list-none">
          {steps.map((item, i) => (
            <RevealOnScroll key={item.step} delayMs={i * 60}>
              <li className="relative flex items-start gap-3 pb-[28px] last:pb-0">
                {i < steps.length - 1 ? (
                  <span
                    className="absolute left-[1.125rem] top-9 bottom-0 w-px bg-black/10"
                    aria-hidden
                  />
                ) : null}
                <span
                  className="relative z-[1] flex size-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-white text-[11px] font-bold text-stone-500"
                >
                  {item.step}
                </span>
                <LandingIconBox
                  icon={item.icon}
                  className={`${item.tint} shrink-0`}
                />
                <div className="min-w-0 flex-1 pt-0.5">
                  <h3 className="font-semibold text-navy">{item.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-stone-600">
                    {item.desc}
                  </p>
                </div>
              </li>
            </RevealOnScroll>
          ))}
        </ol>

        <RevealOnScroll delayMs={120} className="lg:sticky lg:top-24">
          {featuredPlan && !featuredPlan.isSample ? (
            <PlanPreview
              plan={featuredPlan}
              previewLabel={previewLabel}
              userId={userId}
            />
          ) : (
            <BrowseActivitiesPreview />
          )}
        </RevealOnScroll>
      </div>
    </section>
  );
}
