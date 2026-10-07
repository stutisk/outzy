import { CATEGORY_TINT, CATEGORY_TINT_SOFT } from "@/lib/category-tints";

export const CATEGORY_EMOJI: Record<string, string> = {
  hiking: "🏔️",
  coffee: "☕",
  cycling: "🚴",
  beaches: "🏖️",
  food: "🍜",
  photography: "📸",
  art: "🎨",
  dance: "💃",
  running: "🏃",
  gaming: "🎮",
  yoga: "🧘",
  nightlife: "🥂",
};

/** Landing lane chips — ring + soft gradient (shared with marketing section). */
export const CATEGORY_LANE: Record<string, string> = {
  hiking:
    "from-emerald-100/90 via-emerald-50 to-teal-50/40 ring-emerald-200/50 hover:ring-emerald-300/60",
  coffee:
    "from-amber-100/90 via-amber-50 to-orange-50/30 ring-amber-200/50 hover:ring-amber-300/60",
  cycling:
    "from-sky-100/90 via-sky-50 to-cyan-50/30 ring-sky-200/50 hover:ring-sky-300/60",
  beaches:
    "from-cyan-100/90 via-cyan-50 to-sky-50/30 ring-cyan-200/50 hover:ring-cyan-300/60",
  food:
    "from-orange-100/90 via-orange-50 to-amber-50/30 ring-orange-200/50 hover:ring-orange-300/60",
  photography:
    "from-violet-100/90 via-violet-50 to-purple-50/30 ring-violet-200/50 hover:ring-violet-300/60",
  art:
    "from-fuchsia-100/90 via-fuchsia-50 to-pink-50/30 ring-fuchsia-200/50 hover:ring-fuchsia-300/60",
  dance:
    "from-pink-100/90 via-pink-50 to-rose-50/30 ring-pink-200/50 hover:ring-rose-300/60",
  running:
    "from-rose-100/90 via-rose-50 to-red-50/20 ring-rose-200/50 hover:ring-rose-300/60",
  gaming:
    "from-indigo-100/90 via-indigo-50 to-violet-50/30 ring-indigo-200/50 hover:ring-indigo-300/60",
  yoga:
    "from-lime-100/90 via-lime-50 to-green-50/30 ring-lime-200/50 hover:ring-lime-300/60",
  nightlife:
    "from-stone-200/90 via-stone-100 to-stone-50/40 ring-stone-300/50 hover:ring-stone-400/50",
};

const DEFAULT_SOFT = "from-stone-50 to-stone-100";
const DEFAULT_ACCENT = "from-stone-400 to-stone-500";

export function getCategoryVisual(category: string) {
  return {
    emoji: CATEGORY_EMOJI[category] ?? "✨",
    gradientSoft: CATEGORY_TINT_SOFT[category] ?? DEFAULT_SOFT,
    gradientAccent: CATEGORY_TINT[category] ?? DEFAULT_ACCENT,
  };
}
