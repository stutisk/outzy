import { CATEGORIES } from "@/lib/categories";

function unsplash(photoId: string, width = 800) {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&q=80`;
}

const URLS: Record<string, string> = {
  hiking: unsplash("photo-1551632811-561732d1e306"),
  coffee: unsplash("photo-1495474472287-4d71bcff2085"),
  cycling: unsplash("photo-1541625602330-2277a4c46182"),
  beaches: unsplash("photo-1507525428034-b723cf961d3e"),
  food: unsplash("photo-1414235077428-338989a2e8c0"),
  photography: unsplash("photo-1452587925148-ce544e77e70f"),
  art: unsplash("photo-1460661419201-fd4bcdf7d856"),
  dance: unsplash("photo-1470225620780-dba8ba36b745"),
  running: unsplash("photo-1476480862126-209bfaa8edc8"),
  gaming: unsplash("photo-1542751371-adc38448a05e"),
  yoga: unsplash("photo-1544367567-0f2fcb009e0b"),
  nightlife: unsplash("photo-1514525253161-7a46d19cd819"),
};

const DEFAULT = unsplash("photo-1529156069898-49953e39b3ac");

export function getCategoryImageUrl(category: string, width = 800): string {
  const url = URLS[category] ?? DEFAULT;
  if (width === 800) return url;
  return url.replace(/w=\d+/, `w=${width}`);
}

export function getCategoryImageAlt(category: string): string {
  const match = CATEGORIES.find((c) => c.value === category);
  return match ? `${match.label} plan` : "Activity";
}
