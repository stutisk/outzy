import { CATEGORIES } from "@/lib/categories";
import { CATEGORY_EMOJI, CATEGORY_LANE } from "@/lib/category-visual";

export const LANDING_CATEGORIES = CATEGORIES.map((c) => ({
  slug: c.value,
  name: c.label,
  emoji: CATEGORY_EMOJI[c.value] ?? "✨",
  lane: CATEGORY_LANE[c.value] ?? "from-stone-100 to-stone-50 ring-stone-200/50",
}));
