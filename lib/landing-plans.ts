import type { ActivityRow } from "@/lib/activities";
import { getCategoryLabel } from "@/lib/categories";

export type LandingActivity = ActivityRow & {
  host?: { username?: string | null } | null;
};

export function formatPlanListMeta(activity: ActivityRow) {
  const d = new Date(activity.activity_date);
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const category = getCategoryLabel(activity.category);
  return { weekday, time, category, city: activity.city };
}

export function formatPlanHeroSchedule(activity: ActivityRow) {
  const d = new Date(activity.activity_date);
  const day = d
    .toLocaleDateString("en-US", { weekday: "long" })
    .toUpperCase();
  const time = d
    .toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
    .toUpperCase();
  return `${day} • ${time}`;
}

export function formatPlanFeaturedMeta(activity: ActivityRow) {
  const { category, time } = formatPlanListMeta(activity);
  return `${category} · ${time}`;
}

export function planRefCode(id: string) {
  return id.replace(/-/g, "").slice(0, 6).toUpperCase();
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

export type LandingStat = { value: number; label: string };

/** Returns stats only when at least one value is a positive real count. */
export function computeLandingStats(
  activities: ActivityRow[],
): LandingStat[] | null {
  if (activities.length === 0) {
    return null;
  }

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );

  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const plansThisMonth = activities.filter((a) => {
    const d = new Date(a.activity_date);
    return d >= monthStart && d <= monthEnd;
  }).length;

  const activeCities = new Set(
    activities.map((a) => a.city.trim().toLowerCase()).filter(Boolean),
  ).size;

  const hostsThisWeek = new Set(
    activities
      .filter((a) => {
        const d = new Date(a.activity_date);
        return d >= now && d <= weekEnd;
      })
      .map((a) => a.user_id),
  ).size;

  const stats: LandingStat[] = [
    { value: plansThisMonth, label: "plans this month" },
    { value: activeCities, label: "active cities" },
    { value: hostsThisWeek, label: "hosts planning this week" },
  ].filter((s) => s.value > 0);

  return stats.length > 0 ? stats : null;
}
