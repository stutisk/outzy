import type { LucideIcon } from "lucide-react";
import {
  Bike,
  Camera,
  Coffee,
  Footprints,
  Gamepad2,
  MapPin,
  Moon,
  Mountain,
  Music,
  Palette,
  UtensilsCrossed,
  Waves,
  Flower2,
} from "lucide-react";

export const LANDING_CATEGORY_ICON: Record<string, LucideIcon> = {
  hiking: Mountain,
  coffee: Coffee,
  cycling: Bike,
  beaches: Waves,
  food: UtensilsCrossed,
  photography: Camera,
  art: Palette,
  dance: Music,
  running: Footprints,
  gaming: Gamepad2,
  yoga: Flower2,
  nightlife: Moon,
};

export function getLandingCategoryIcon(slug: string): LucideIcon {
  return LANDING_CATEGORY_ICON[slug] ?? MapPin;
}
