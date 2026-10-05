export const CATEGORIES = [
  { value: "hiking", label: "Hiking" },
  { value: "coffee", label: "Coffee" },
  { value: "cycling", label: "Cycling" },
  { value: "beaches", label: "Beaches" },
  { value: "food", label: "Food" },
  { value: "photography", label: "Photography" },
  { value: "art", label: "Art & culture" },
  { value: "dance", label: "Music & dance" },
  { value: "running", label: "Running" },
  { value: "gaming", label: "Gaming" },
  { value: "yoga", label: "Yoga" },
  { value: "nightlife", label: "Nightlife" },
] as const;

export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
);

export function getCategoryLabel(value: string): string {
  return CATEGORY_LABELS[value] ?? value;
}
