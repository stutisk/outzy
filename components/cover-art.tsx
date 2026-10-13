"use client";

import { MapPin } from "lucide-react";
import { getCategoryImageAlt } from "@/lib/category-images";
import { getCategoryLabel } from "@/lib/categories";
import { cn } from "@/lib/cn";
import { getCover } from "@/lib/cover";
import { LANDING_CATEGORY_ICON } from "@/lib/landing-category-icons";

export type CoverArtProps = {
  activityId: string;
  category: string;
  stackIndex: number;
  sessionHueOffset?: number;
  muted?: boolean;
  className?: string;
  showCategoryTag?: boolean;
};

export function CoverArt({
  activityId,
  category,
  stackIndex,
  sessionHueOffset = 0,
  muted = false,
  className,
  showCategoryTag = true,
}: CoverArtProps) {
  const spec = getCover(activityId, category, {
    stackIndex,
    sessionHueOffset,
    muted,
  });
  const Icon = LANDING_CATEGORY_ICON[category] ?? MapPin;
  const label = getCategoryLabel(category);

  return (
    <div
      className={cn("relative size-full overflow-hidden", className)}
      role="img"
      aria-label={getCategoryImageAlt(category)}
    >
      <div
        className="absolute inset-0"
        style={{ backgroundImage: spec.backgroundImage }}
        aria-hidden
      />
      {spec.patternLayers.map((layer, i) => (
        <div
          key={i}
          className="pointer-events-none absolute inset-0"
          style={{ ...layer.style, opacity: layer.opacity }}
          aria-hidden
        />
      ))}
      <div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        aria-hidden
      >
        <Icon
          className="size-16 drop-shadow-[0_2px_12px_rgba(0,0,0,0.25)]"
          style={{ color: spec.iconColor }}
          strokeWidth={1.25}
        />
      </div>
      <div
        className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-transparent"
        aria-hidden
      />
      {showCategoryTag ? (
        <span
          className="absolute bottom-2 left-2 rounded-full bg-white/92 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-800 shadow-sm backdrop-blur-sm"
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}
