"use client";

import { MapPin } from "lucide-react";
import { useState } from "react";
import { getCategoryImageAlt, getCategoryImageUrl } from "@/lib/category-images";
import { LANDING_CATEGORY_ICON } from "@/lib/landing-category-icons";
import { cn } from "@/lib/cn";

const SOFT_GRADIENT: Record<string, string> = {
  hiking: "from-emerald-100 via-teal-50 to-emerald-200/80",
  coffee: "from-amber-100 via-orange-50 to-amber-200/70",
  gaming: "from-violet-100 via-indigo-50 to-violet-200/80",
  food: "from-orange-100 via-rose-50 to-orange-200/70",
  running: "from-sky-100 via-blue-50 to-sky-200/80",
  photography: "from-fuchsia-100 via-purple-50 to-fuchsia-200/70",
  cycling: "from-lime-100 via-green-50 to-lime-200/80",
  beaches: "from-cyan-100 via-sky-50 to-cyan-200/80",
  art: "from-pink-100 via-rose-50 to-pink-200/70",
  dance: "from-red-100 via-fuchsia-50 to-red-200/70",
  yoga: "from-teal-100 via-emerald-50 to-teal-200/80",
  nightlife: "from-slate-200 via-violet-100 to-slate-300/80",
};

const ICON_TINT: Record<string, string> = {
  hiking: "text-emerald-800/40",
  coffee: "text-amber-900/40",
  gaming: "text-violet-800/40",
  food: "text-orange-900/40",
  running: "text-sky-800/40",
  photography: "text-fuchsia-800/40",
  cycling: "text-lime-800/40",
  beaches: "text-cyan-800/40",
  art: "text-pink-800/40",
  dance: "text-red-800/40",
  yoga: "text-teal-800/40",
  nightlife: "text-slate-800/40",
};

type LandingPlanCoverProps = {
  category: string;
  width?: number;
  className?: string;
};

function CategoryFallbackArt({ category }: { category: string }) {
  const gradient = SOFT_GRADIENT[category] ?? "from-teal-100 via-teal-50 to-teal-200/80";
  const iconTint = ICON_TINT[category] ?? "text-teal-900/40";
  const Icon = LANDING_CATEGORY_ICON[category] ?? MapPin;

  return (
    <div
      className={cn("relative size-full overflow-hidden bg-linear-to-br", gradient)}
      role="img"
      aria-label={getCategoryImageAlt(category)}
    >
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgb(0 0 0 / 0.06) 1px, transparent 0)",
          backgroundSize: "14px 14px",
        }}
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, transparent, transparent 8px, rgb(0 0 0 / 0.03) 8px, rgb(0 0 0 / 0.03) 9px)",
        }}
        aria-hidden
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <Icon className={cn("size-16", iconTint)} strokeWidth={1.25} aria-hidden />
      </div>
    </div>
  );
}

export function LandingPlanCover({
  category,
  width = 800,
  className,
}: LandingPlanCoverProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className={cn("size-full", className)}>
        <CategoryFallbackArt category={category} />
      </div>
    );
  }

  return (
    <img
      src={getCategoryImageUrl(category, width)}
      alt={getCategoryImageAlt(category)}
      className={cn("size-full object-cover", className)}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
