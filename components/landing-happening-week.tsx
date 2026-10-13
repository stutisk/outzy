"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, Clock, Plus } from "lucide-react";
import { RevealOnScroll } from "@/components/reveal-on-scroll";
import { getCategoryLabel } from "@/lib/categories";
import { getCategoryVisual } from "@/lib/category-visual";
import type { LandingPlan } from "@/lib/landing-plan-types";
import { LANDING_SECTION_PY, PAGE_CONTAINER } from "@/lib/layout";

type LandingHappeningWeekProps = {
  plans: LandingPlan[];
};

function planDateParts(iso: string) {
  const d = new Date(iso);
  return {
    weekday: d
      .toLocaleDateString("en-US", { weekday: "short" })
      .toUpperCase(),
    day: d.getDate(),
    time: d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

function PlanRow({ plan }: { plan: LandingPlan }) {
  const { weekday, day, time } = planDateParts(plan.activityDate);
  const { gradientSoft } = getCategoryVisual(plan.category);
  const categoryLabel = getCategoryLabel(plan.category);
  const almostFull = plan.spotsLeft > 0 && plan.spotsLeft <= 2;

  return (
    <Link
      href={plan.href}
      className="group flex min-h-[5.5rem] items-center gap-3 rounded-xl border border-black/10 bg-white px-3 py-3 transition duration-200 hover:-translate-y-0.5 hover:border-black/25 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:gap-4 sm:px-4"
    >
      <div
        className={`flex w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-linear-to-br py-2 sm:w-12 ${gradientSoft}`}
        aria-hidden
      >
        <span className="text-[9px] font-semibold leading-none tracking-wide text-stone-600 sm:text-[10px]">
          {weekday}
        </span>
        <span className="mt-0.5 text-xl font-bold leading-none tabular-nums text-navy sm:text-2xl">
          {day}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold text-navy sm:text-base">
          {plan.title}
        </h3>
        <p className="mt-0.5 truncate text-xs text-stone-500">
          {categoryLabel} · {plan.neighborhood}
        </p>
        <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-stone-600">
          <Clock className="size-3.5 shrink-0 text-stone-400" strokeWidth={1.5} />
          {time}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2 sm:hidden">
          <div className="flex min-w-0 items-center gap-1.5">
            {plan.hostAvatarUrl ? (
              <img
                src={plan.hostAvatarUrl}
                alt=""
                className="size-6 shrink-0 rounded-full object-cover"
                width={24}
                height={24}
              />
            ) : (
              <span
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[9px] font-semibold text-stone-600"
              >
                {plan.hostUsername.charAt(0).toUpperCase()}
              </span>
            )}
            <span className="truncate text-[11px] text-stone-600">
              @{plan.hostUsername}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {almostFull ? (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-900">
                Almost full
              </span>
            ) : null}
            <span className="text-[10px] font-semibold text-stone-600">
              {plan.spotsLeft} left
            </span>
          </div>
        </div>
      </div>

      <div className="hidden min-w-0 shrink-0 flex-col items-end gap-1 sm:flex">
        <div className="flex max-w-[8.5rem] items-center gap-1.5">
          {plan.hostAvatarUrl ? (
            <img
              src={plan.hostAvatarUrl}
              alt=""
              className="size-7 shrink-0 rounded-full object-cover"
              width={28}
              height={28}
            />
          ) : (
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[10px] font-semibold text-stone-600"
            >
              {plan.hostUsername.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="truncate text-xs text-stone-600">
            @{plan.hostUsername}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {almostFull ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
              Almost full
            </span>
          ) : null}
          <span className="text-xs font-semibold text-stone-700">
            {plan.spotsLeft} spot{plan.spotsLeft === 1 ? "" : "s"} left
          </span>
        </div>
      </div>

      <ChevronRight
        className="size-5 shrink-0 text-stone-400 transition-transform group-hover:translate-x-0.5"
        strokeWidth={1.5}
        aria-hidden
      />
    </Link>
  );
}

function HostNextCard() {
  return (
    <Link
      href="/create-activity"
      className="group flex min-h-[5.5rem] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-teal-600/40 bg-teal-50/30 px-4 py-5 text-center transition duration-200 hover:-translate-y-0.5 hover:border-teal-600/60 hover:bg-teal-50/50 motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:py-6"
    >
      <span
        className="flex size-9 items-center justify-center rounded-full border border-teal-200/80 bg-white text-teal-700"
        aria-hidden
      >
        <Plus className="size-5" strokeWidth={1.5} />
      </span>
      <span className="text-sm font-semibold text-navy">Host the next one</span>
    </Link>
  );
}

export function LandingHappeningWeek({ plans }: LandingHappeningWeekProps) {
  const items = plans.filter((p) => !p.isSample).slice(0, 3);

  if (items.length === 0) {
    return null;
  }

  const showHostCard = items.length < 3;

  return (
    <section
      className={`${PAGE_CONTAINER} ${LANDING_SECTION_PY} pt-4 md:pt-6`}
      aria-labelledby="happening-week-heading"
    >
      <RevealOnScroll>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            {/* <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              This week near you
            </p> */}
            <h2
              id="happening-week-heading"
              className="mt-2 text-2xl font-semibold tracking-tight text-navy md:text-3xl"
            >
              Happening this week
            </h2>
          </div>
          <Link
            href="/feed"
            className="group inline-flex items-center gap-1 text-sm font-semibold text-teal-700"
          >
            View all plans
            <ArrowRight
              className="size-4 transition-transform group-hover:translate-x-0.5"
              strokeWidth={1.5}
            />
          </Link>
        </div>
      </RevealOnScroll>

      <ul
        className="mt-6 flex list-none flex-col gap-3 lg:flex-row lg:gap-4"
      >
        {items.map((plan, i) => (
          <li key={plan.id} className="min-w-0 flex-1 lg:min-w-0">
            <RevealOnScroll delayMs={i * 50}>
              <PlanRow plan={plan} />
            </RevealOnScroll>
          </li>
        ))}
        {showHostCard ? (
          <li className="min-w-0 flex-1 lg:min-w-0">
            <RevealOnScroll delayMs={items.length * 50}>
              <HostNextCard />
            </RevealOnScroll>
          </li>
        ) : null}
      </ul>
    </section>
  );
}
