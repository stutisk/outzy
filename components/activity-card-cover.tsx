"use client";

import { useState } from "react";
import { CoverArt } from "@/components/cover-art";
import { getCategoryImageAlt, getCategoryImageUrl } from "@/lib/category-images";
import { cn } from "@/lib/cn";

function stackIndexForActivityId(activityId: string) {
  let h = 2166136261;
  for (let i = 0; i < activityId.length; i++) {
    h ^= activityId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) % 3;
}

type ActivityCardCoverProps = {
  activityId: string;
  category: string;
  upcoming?: boolean;
  className?: string;
};

/** Category photo when available; deterministic gradient cover on load failure. */
export function ActivityCardCover({
  activityId,
  category,
  upcoming = true,
  className,
}: ActivityCardCoverProps) {
  const [useGradient, setUseGradient] = useState(false);
  const faded = !upcoming;

  if (useGradient) {
    return (
      <CoverArt
        activityId={activityId}
        category={category}
        stackIndex={stackIndexForActivityId(activityId)}
        showCategoryTag={false}
        muted={faded}
        className={cn(faded && "grayscale", className)}
      />
    );
  }

  return (
    <img
      src={getCategoryImageUrl(category, 900)}
      alt={getCategoryImageAlt(category)}
      className={cn("size-full object-cover", faded && "grayscale", className)}
      loading="lazy"
      decoding="async"
      onError={() => setUseGradient(true)}
    />
  );
}
