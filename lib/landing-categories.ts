import { CATEGORIES } from "@/lib/categories";
import { CATEGORY_LANE } from "@/lib/category-visual";

/** Shown on landing — not the full catalog */
export const LANDING_FEATURED_SLUGS = [
  "hiking",
  "coffee",
  "gaming",
  "food",
  "running",
  "photography",
] as const;

export const LANDING_CATEGORIES = CATEGORIES.map((c) => ({
  slug: c.value,
  name: c.label,
  lane: CATEGORY_LANE[c.value] ?? "from-stone-100 to-stone-50 ring-stone-200/50",
}));

export const LANDING_CATEGORIES_FEATURED = LANDING_CATEGORIES.filter((c) =>
  (LANDING_FEATURED_SLUGS as readonly string[]).includes(c.slug),
);
