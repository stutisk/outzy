"use client";

import Link from "next/link";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { CoverArt } from "@/components/cover-art";
import type { LandingPlan } from "@/lib/landing-plan-types";

const HERO_HUE_SESSION_KEY = "outzy_hero_hue_offset";

const BASE_LAYOUT = [
  { rotate: -6, x: -8, y: 0, scale: 0.94 },
  { rotate: 4, x: 36, y: 72, scale: 0.97 },
  { rotate: -2, x: 72, y: 144, scale: 1 },
] as const;

type LandingHeroVisualProps = {
  plans: LandingPlan[];
};

function floatTransition(delay: number, paused: boolean) {
  if (paused) return { duration: 0 };
  return {
    duration: 7.5,
    repeat: Infinity,
    repeatType: "mirror" as const,
    ease: "easeInOut" as const,
    delay,
  };
}

function StackCard({
  plan,
  index,
  isActive,
  motionEnabled,
  delay,
  paused,
  sessionHueOffset,
  onActivate,
  onCardClick,
}: {
  plan: LandingPlan;
  index: number;
  isActive: boolean;
  motionEnabled: boolean;
  delay: number;
  paused: boolean;
  sessionHueOffset: number;
  onActivate: () => void;
  onCardClick: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const layout = BASE_LAYOUT[index] ?? BASE_LAYOUT[0];

  const targetRotate = isActive ? 0 : layout.rotate;
  const targetX = isActive ? 24 : layout.x;
  const targetY = isActive ? 48 : layout.y;
  const targetScale = isActive ? 1.04 : layout.scale;
  const zIndex = isActive ? 20 : 10 - index;

  const cardInner = (
    <div
      className={`overflow-hidden rounded-2xl border bg-white transition-[border-color,box-shadow] duration-300 ${
        isActive
          ? "border-teal-200/80 shadow-[0_20px_50px_rgb(13_148_136/0.18)]"
          : "border-black/10 shadow-[0_10px_36px_rgb(0_0_0/0.08)]"
      }`}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <CoverArt
          activityId={plan.id}
          category={plan.category}
          stackIndex={index}
          sessionHueOffset={sessionHueOffset}
          muted={!isActive}
        />
      </div>
      <div className="p-4">
        <p className="text-sm leading-relaxed text-stone-600">
          <span className="font-semibold text-navy">{plan.title}</span>
          <span aria-hidden> · </span>
          {plan.whenShort}
          <span aria-hidden> · </span>
          {plan.neighborhood}
        </p>
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex -space-x-2" aria-hidden>
            {plan.participantAvatarUrls.slice(0, 4).map((url, idx) => (
              <img
                key={`${url}-${idx}`}
                src={url}
                alt=""
                className="size-8 rounded-full border-2 border-white object-cover"
                width={32}
                height={32}
              />
            ))}
          </div>
          <span
            className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              isActive ? "bg-coral text-white" : "bg-navy text-white"
            }`}
          >
            {plan.spotsLeft} left · Join
          </span>
        </div>
      </div>
    </div>
  );

  const link = (
    <Link
      href={plan.href}
      className="group block w-[300px] max-w-[min(300px,calc(100vw-2rem))] focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 rounded-2xl"
      onFocus={onActivate}
      onMouseEnter={onActivate}
      onClick={onCardClick}
    >
      {cardInner}
    </Link>
  );

  if (!motionEnabled) {
    return (
      <div
        className="absolute left-1/2 top-0 w-[300px] max-w-[min(300px,calc(100vw-2rem))]"
        style={{
          zIndex,
          transform: `translate(calc(-50% + ${targetX}px), ${targetY}px) rotate(${targetRotate}deg) scale(${targetScale})`,
        }}
      >
        {link}
      </div>
    );
  }

  return (
    <motion.div
      className="absolute left-1/2 top-0 w-[300px] max-w-[min(300px,calc(100vw-2rem))]"
      style={{ zIndex, x: `calc(-50% + ${layout.x}px)` }}
      animate={{
        x: `calc(-50% + ${targetX}px)`,
        y: paused
          ? targetY
          : [targetY, targetY - 5, targetY + 2, targetY],
        rotate: paused
          ? targetRotate
          : [
              targetRotate,
              targetRotate + 0.4,
              targetRotate - 0.2,
              targetRotate,
            ],
        scale: targetScale,
      }}
      transition={{
        x: { type: "spring", stiffness: 320, damping: 28 },
        y: floatTransition(delay, paused || isActive),
        rotate: floatTransition(delay + 0.2, paused || isActive),
        scale: { type: "spring", stiffness: 320, damping: 28 },
      }}
      layout={false}
    >
      {link}
    </motion.div>
  );
}

export function LandingHeroVisual({ plans }: LandingHeroVisualProps) {
  const reduceMotion = useReducedMotion();
  const motionEnabled = !reduceMotion;
  const stack = plans.filter((p) => !p.isSample).slice(0, 3);

  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [sessionHueOffset, setSessionHueOffset] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      let stored = sessionStorage.getItem(HERO_HUE_SESSION_KEY);
      if (stored == null) {
        stored = String(Math.floor(Math.random() * 21));
        sessionStorage.setItem(HERO_HUE_SESSION_KEY, stored);
      }
      const parsed = Number.parseInt(stored, 10);
      if (!Number.isNaN(parsed)) {
        setSessionHueOffset(Math.min(20, Math.max(0, parsed)));
      }
    } catch {
      /* private mode / blocked storage */
    }
  }, []);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springConfig = { stiffness: 120, damping: 18 };
  const rotateX = useSpring(
    useTransform(pointerY, [-0.5, 0.5], [6, -6]),
    springConfig,
  );
  const rotateY = useSpring(
    useTransform(pointerX, [-0.5, 0.5], [-8, 8]),
    springConfig,
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!motionEnabled || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      pointerX.set(x);
      pointerY.set(y);
    },
    [motionEnabled, pointerX, pointerY],
  );

  const resetTilt = useCallback(() => {
    pointerX.set(0);
    pointerY.set(0);
    setPaused(false);
  }, [pointerX, pointerY]);

  if (stack.length === 0) {
    return (
      <div
        className="flex min-h-[min(24rem,50vh)] w-full items-center justify-center rounded-2xl border border-dashed border-black/10 bg-white/60 px-6 py-12 text-center"
      >
        <p className="max-w-xs text-sm leading-relaxed text-stone-600">
          Upcoming activities show up here.{" "}
          <a href="/feed" className="font-semibold text-teal-700 hover:underline">
            Browse the feed
          </a>{" "}
          to see what&apos;s on.
        </p>
      </div>
    );
  }

  const safeActive = Math.min(activeIndex, stack.length - 1);

  return (
    <div
      className="flex min-h-[min(32rem,68vh)] w-full flex-col items-center justify-center overflow-visible py-2 lg:min-h-[34rem]"
    >
      <motion.div
        ref={containerRef}
        className="relative h-[26rem] w-full max-w-[26rem] overflow-visible sm:h-[28rem]"
        style={
          motionEnabled
            ? { rotateX, rotateY, transformPerspective: 1200 }
            : undefined
        }
        onPointerMove={onPointerMove}
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={resetTilt}
        aria-label="Upcoming plans on Outzy — hover or tap a card to focus it"
      >
        {stack.map((plan, i) => (
          <StackCard
            key={plan.id}
            plan={plan}
            index={i}
            isActive={i === safeActive}
            motionEnabled={motionEnabled}
            delay={i * 0.45}
            paused={paused}
            sessionHueOffset={sessionHueOffset}
            onActivate={() => setActiveIndex(i)}
            onCardClick={(e) => {
              if (i !== safeActive) {
                e.preventDefault();
                setActiveIndex(i);
              }
            }}
          />
        ))}
      </motion.div>

      {stack.length > 1 ? (
        <div
          className="mt-2 flex items-center gap-2"
          role="tablist"
          aria-label="Focus a plan card"
        >
          {stack.map((plan, i) => (
            <button
              key={plan.id}
              type="button"
              role="tab"
              aria-selected={i === safeActive}
              aria-label={`Show ${plan.title}`}
              onClick={() => setActiveIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === safeActive
                  ? "w-8 bg-teal-600"
                  : "w-2 bg-stone-300 hover:bg-stone-400"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
