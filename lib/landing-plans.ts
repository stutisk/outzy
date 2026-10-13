import type { ActivityRow } from "@/lib/activities";
import { isTitleVisible } from "@/lib/activity-validation";
import { getCategoryLabel } from "@/lib/categories";
import { LANDING_PORTRAIT_SETS } from "@/lib/landing-portraits";

export type LandingActivity = ActivityRow & {
  host?: { username?: string | null; avatar_url?: string | null } | null;
};

export type HeroStackPlan = {
  title: string;
  when: string;
  neighborhood: string;
  spotsLeft: number;
  avatarUrls: string[];
  category: string;
  id?: string;
};

/** Fixed hero stack copy for marketing layout */
export const HERO_DISPLAY_PLANS: HeroStackPlan[] = [
  {
    title: "Sunrise hike",
    when: "Sat 6:30 AM",
    neighborhood: "Old Town",
    spotsLeft: 4,
    avatarUrls: [...LANDING_PORTRAIT_SETS[0]],
    category: "hiking",
  },
  {
    title: "Board games night",
    when: "Fri 8 PM",
    neighborhood: "Riverside",
    spotsLeft: 2,
    avatarUrls: [...LANDING_PORTRAIT_SETS[1]],
    category: "gaming",
  },
  {
    title: "Coffee & sketching",
    when: "Sun 11 AM",
    neighborhood: "Arts district",
    spotsLeft: 5,
    avatarUrls: [...LANDING_PORTRAIT_SETS[2]],
    category: "coffee",
  },
];

function normalizeTitle(title: string) {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

/** @deprecated Use isTitleVisible — kept for trust-line stats helper name. */
export function isQualityLandingTitle(title: string): boolean {
  return isTitleVisible(title);
}

export function filterUpcomingActivities(activities: ActivityRow[]) {
  const now = Date.now();
  return activities
    .filter((a) => new Date(a.activity_date).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.activity_date).getTime() -
        new Date(b.activity_date).getTime(),
    );
}

export function filterDisplayActivities(activities: LandingActivity[]) {
  const seen = new Set<string>();
  return filterUpcomingActivities(activities).filter((a) => {
    if (!isQualityLandingTitle(a.title)) return false;
    const key = normalizeTitle(a.title);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function formatPlanWhen(activity: ActivityRow) {
  const d = new Date(activity.activity_date);
  const day = d.toLocaleDateString("en-US", { weekday: "short" });
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${day} · ${time}`;
}

export function neighborhoodLabel(city: string) {
  const trimmed = city.trim();
  if (!trimmed) return "Nearby";
  return trimmed.split(",")[0]?.trim() || trimmed;
}

/** Real stats only; null → use fallback copy on the page */
export function landingTrustLine(activities: ActivityRow[]): string | null {
  if (activities.length === 0) return null;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const hostedThisMonth = activities.filter((a) => {
    const created = a.created_at ? new Date(a.created_at) : null;
    return created && created >= monthStart;
  }).length;

  const upcoming = filterUpcomingActivities(activities).length;

  if (hostedThisMonth > 0) {
    return `${hostedThisMonth} plan${hostedThisMonth === 1 ? "" : "s"} hosted this month`;
  }
  if (upcoming > 0) {
    return `${upcoming} upcoming plan${upcoming === 1 ? "" : "s"} on Outzy`;
  }
  return null;
}

export type HappeningWeekCard =
  | LandingActivity
  | {
      kind: "sample";
      key: string;
      title: string;
      category: string;
      when: string;
      neighborhood: string;
      hostName: string;
      hostAvatar: string;
      spotsLeft: number;
      href: string;
    };

export const HAPPENING_WEEK_SAMPLES: Extract<
  HappeningWeekCard,
  { kind: "sample" }
>[] = [
  {
    kind: "sample",
    key: "sample-hike",
    title: "Sunrise hike",
    category: "hiking",
    when: "Sat · 6:30 AM",
    neighborhood: "Old Town",
    hostName: "maya_runs",
    hostAvatar:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=96&h=96&q=80",
    spotsLeft: 4,
    href: "/feed",
  },
  {
    kind: "sample",
    key: "sample-games",
    title: "Board games night",
    category: "gaming",
    when: "Fri · 8:00 PM",
    neighborhood: "Riverside",
    hostName: "devon_plays",
    hostAvatar:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=96&h=96&q=80",
    spotsLeft: 2,
    href: "/feed",
  },
  {
    kind: "sample",
    key: "sample-coffee",
    title: "Coffee & sketching",
    category: "coffee",
    when: "Sun · 11:00 AM",
    neighborhood: "Arts district",
    hostName: "lena_sketches",
    hostAvatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=96&h=96&q=80",
    spotsLeft: 5,
    href: "/feed",
  },
];

export function buildHappeningWeekCards(
  activities: LandingActivity[],
): HappeningWeekCard[] {
  const real = filterDisplayActivities(activities).slice(0, 3);
  const cards: HappeningWeekCard[] = [...real];
  let i = 0;
  while (cards.length < 3 && i < HAPPENING_WEEK_SAMPLES.length) {
    cards.push(HAPPENING_WEEK_SAMPLES[i]);
    i += 1;
  }
  return cards.slice(0, 3);
}
