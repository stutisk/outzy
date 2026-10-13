import type { SupabaseClient } from "@supabase/supabase-js";
import type { ActivityRow } from "@/lib/activities";
import { getCategoryImageUrl } from "@/lib/category-images";
import { isTitleVisible } from "@/lib/activity-validation";
import { isActivityUpcoming } from "@/lib/activity-expiry";
import {
  formatPlanWhen,
  landingTrustLine,
  neighborhoodLabel,
} from "@/lib/landing-plans";
import type {
  LandingJoinState,
  LandingPlan,
  LandingPlansPayload,
  LandingSortMode,
} from "@/lib/landing-plan-types";
import { haversineKm, NEARBY_PLAN_KM } from "@/lib/geo";
import {
  normalizeLandingText,
  truncateLandingDescription,
} from "@/lib/landing-text";
import { createSupabaseServerClient } from "@/lib/supabase-server";

type RawActivity = ActivityRow & {
  host?: { username?: string | null; avatar_url?: string | null } | null;
};

export type GetLandingPlansInput = {
  userId: string | null;
  limit: number;
  userLocation?: { latitude: number; longitude: number } | null;
  interests?: string[] | null;
};

function formatWhenShort(activity: ActivityRow) {
  const d = new Date(activity.activity_date);
  const day = d.toLocaleDateString("en-US", { weekday: "short" });
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${day} ${time}`;
}

function interestMatches(
  category: string,
  interests: string[] | null | undefined,
): boolean {
  if (!interests?.length) return false;
  const cat = category.toLowerCase();
  return interests.some((raw) => {
    const i = raw.trim().toLowerCase();
    if (!i) return false;
    return i === cat || i.includes(cat) || cat.includes(i);
  });
}

function previewLabelForMode(
  mode: LandingSortMode,
  hasFeatured: boolean,
): string {
  if (!hasFeatured) return "Browse activities";
  if (mode === "nearest") return "Nearest to you";
  if (mode === "interests") return "Picked for your interests";
  return "Coming up soon";
}

async function loadUpcomingActivities(
  supabase: SupabaseClient,
): Promise<RawActivity[]> {
  const nowIso = new Date().toISOString();

  const withHosts = await supabase
    .from("activities")
    .select(
      "id, title, city, activity_date, max_people, category, created_at, description, user_id, latitude, longitude, users(id, username, avatar_url)",
    )
    .gte("activity_date", nowIso)
    .order("activity_date", { ascending: true })
    .limit(48);

  let rows: Record<string, unknown>[] | null = null;

  if (!withHosts.error && withHosts.data) {
    rows = withHosts.data as Record<string, unknown>[];
  } else {
    if (withHosts.error) {
      console.error("getLandingPlans activities (join):", withHosts.error.message);
    }
    const plain = await supabase
      .from("activities")
      .select(
        "id, title, city, activity_date, max_people, category, created_at, description, user_id, latitude, longitude",
      )
      .gte("activity_date", nowIso)
      .order("activity_date", { ascending: true })
      .limit(48);

    if (plain.error) {
      console.error("getLandingPlans activities:", plain.error.message);
      return [];
    }
    rows = (plain.data ?? []) as Record<string, unknown>[];
  }

  const activities: RawActivity[] = rows.map((row) => {
    const users = row.users as
      | { username?: string | null; avatar_url?: string | null }
      | { username?: string | null; avatar_url?: string | null }[]
      | null;
    const host = Array.isArray(users) ? users[0] : users;
    const { users: _u, ...rest } = row;
    return { ...(rest as ActivityRow), host };
  });

  const needsHosts = activities.some((a) => !a.host?.username);
  if (!needsHosts) return activities;

  const userIds = [...new Set(activities.map((a) => a.user_id))];
  const { data: profiles } = await supabase
    .from("users")
    .select("id, username, avatar_url")
    .in("id", userIds);

  const byId = new Map(
    (profiles ?? []).map((p) => [
      p.id as string,
      {
        username: p.username as string | null,
        avatar_url: p.avatar_url as string | null,
      },
    ]),
  );

  return activities.map((a) => {
    if (a.host?.username) return a;
    const p = byId.get(a.user_id);
    return {
      ...a,
      host: p
        ? { username: p.username, avatar_url: p.avatar_url }
        : a.host,
    };
  });
}

function toLandingPlan(
  p: {
    raw: RawActivity;
    spotsLeft: number;
    distanceKm: number | null;
    participantAvatarUrls: string[];
    joinState: LandingJoinState;
  },
): LandingPlan {
  const a = p.raw;
  const rawDescription = a.description?.trim() ?? "";
  return {
    id: a.id,
    isSample: false,
    title: normalizeLandingText(a.title),
    when: formatPlanWhen(a),
    whenShort: formatWhenShort(a),
    neighborhood: normalizeLandingText(neighborhoodLabel(a.city)),
    category: a.category,
    spotsLeft: p.spotsLeft,
    maxPeople: a.max_people,
    activityDate: a.activity_date,
    hostUserId: a.user_id,
    hostUsername: normalizeLandingText(a.host?.username?.trim() || "host"),
    hostAvatarUrl: a.host?.avatar_url ?? null,
    participantAvatarUrls:
      p.participantAvatarUrls.length > 0
        ? p.participantAvatarUrls
        : [getCategoryImageUrl(a.category, 96)],
    description: truncateLandingDescription(rawDescription),
    href: `/activity/${a.id}`,
    joinState: p.joinState,
    distanceKm: p.distanceKm,
  };
}

async function fetchLandingPlansUncached(
  input: GetLandingPlansInput,
): Promise<LandingPlansPayload> {
  const { userId, limit, userLocation, interests } = input;

  const supabase = await createSupabaseServerClient();
  const activities = await loadUpcomingActivities(supabase);

  const activityIds = activities.map((a) => a.id);

  const acceptedByActivity: Record<string, number> = {};
  const guestAvatarsByActivity: Record<string, string[]> = {};

  if (activityIds.length > 0) {
    const { data: accepted, error: acceptedError } = await supabase
      .from("activity_requests")
      .select("activity_id, user_id, users(avatar_url)")
      .in("activity_id", activityIds)
      .eq("status", "accepted");

    if (acceptedError) {
      console.error("getLandingPlans accepted counts:", acceptedError.message);
    } else {
      for (const row of accepted ?? []) {
        const aid = row.activity_id as string;
        acceptedByActivity[aid] = (acceptedByActivity[aid] ?? 0) + 1;
        const users = row.users as
          | { avatar_url?: string | null }
          | { avatar_url?: string | null }[]
          | null;
        const u = Array.isArray(users) ? users[0] : users;
        const url = u?.avatar_url;
        if (url) {
          if (!guestAvatarsByActivity[aid]) guestAvatarsByActivity[aid] = [];
          if (guestAvatarsByActivity[aid].length < 4) {
            guestAvatarsByActivity[aid].push(url);
          }
        }
      }
    }
  }

  const myJoinByActivity: Record<
    string,
    "pending" | "accepted" | "rejected"
  > = {};
  if (userId && activityIds.length > 0) {
    const { data: mine } = await supabase
      .from("activity_requests")
      .select("activity_id, status")
      .eq("user_id", userId)
      .in("activity_id", activityIds);

    for (const row of mine ?? []) {
      const st = row.status as "pending" | "accepted" | "rejected";
      if (st === "pending" || st === "accepted" || st === "rejected") {
        myJoinByActivity[row.activity_id as string] = st;
      }
    }
  }

  const eligible = activities.filter((a) => {
    if (userId && a.user_id === userId) return false;
    if (!isTitleVisible(a.title)) return false;
    if (!isActivityUpcoming(a)) return false;
    const accepted = acceptedByActivity[a.id] ?? 0;
    return accepted < a.max_people;
  });

  const withMeta = eligible.map((a) => {
    const accepted = acceptedByActivity[a.id] ?? 0;
    const spotsLeft = Math.max(0, a.max_people - accepted);
    let distanceKm: number | null = null;
    if (
      userLocation &&
      a.latitude != null &&
      a.longitude != null &&
      !Number.isNaN(a.latitude) &&
      !Number.isNaN(a.longitude)
    ) {
      distanceKm = haversineKm(
        userLocation.latitude,
        userLocation.longitude,
        a.latitude,
        a.longitude,
      );
    }

    const hostAvatar = a.host?.avatar_url ?? null;
    const guests = guestAvatarsByActivity[a.id] ?? [];
    const participantAvatarUrls = [
      ...(hostAvatar ? [hostAvatar] : []),
      ...guests,
    ].slice(0, 4);

    let joinState: LandingJoinState = "none";
    if (userId && a.user_id === userId) joinState = "host";
    else if (spotsLeft <= 0) joinState = "full";
    else {
      const mine = myJoinByActivity[a.id];
      if (mine === "pending") joinState = "pending";
      else if (mine === "accepted") joinState = "accepted";
      else if (mine === "rejected") joinState = "rejected";
    }

    return {
      raw: a,
      spotsLeft,
      distanceKm,
      participantAvatarUrls,
      joinState,
      interestHit: interestMatches(a.category, interests),
    };
  });

  let sortMode: LandingSortMode = "soonest";
  const hasNearby =
    userLocation != null &&
    withMeta.some(
      (p) => p.distanceKm != null && p.distanceKm <= NEARBY_PLAN_KM,
    );

  if (hasNearby) {
    sortMode = "nearest";
    withMeta.sort((a, b) => {
      const da = a.distanceKm ?? Infinity;
      const db = b.distanceKm ?? Infinity;
      if (da !== db) return da - db;
      return (
        new Date(a.raw.activity_date).getTime() -
        new Date(b.raw.activity_date).getTime()
      );
    });
  } else if (interests?.length && withMeta.some((p) => p.interestHit)) {
    sortMode = "interests";
    withMeta.sort((a, b) => {
      if (a.interestHit !== b.interestHit) return a.interestHit ? -1 : 1;
      return (
        new Date(a.raw.activity_date).getTime() -
        new Date(b.raw.activity_date).getTime()
      );
    });
  } else {
    withMeta.sort(
      (a, b) =>
        new Date(a.raw.activity_date).getTime() -
        new Date(b.raw.activity_date).getTime(),
    );
  }

  const realPlans: LandingPlan[] = withMeta
    .slice(0, limit)
    .map((p) => toLandingPlan(p));

  const heroPlans = realPlans.slice(0, 3);
  const happeningPlans = realPlans.slice(0, 3);
  const featuredPlan = realPlans[0] ?? null;

  const allForTrust = activities.filter((a) => isTitleVisible(a.title));

  return {
    plans: realPlans,
    heroPlans,
    happeningPlans,
    featuredPlan,
    previewLabel: previewLabelForMode(sortMode, featuredPlan != null),
    sortMode,
    trustLine: landingTrustLine(allForTrust),
    error: null,
  };
}

export async function getLandingPlans(
  input: GetLandingPlansInput,
): Promise<LandingPlansPayload> {
  try {
    return await fetchLandingPlansUncached(input);
  } catch (e) {
    console.error("getLandingPlans:", e);
    return {
      plans: [],
      heroPlans: [],
      happeningPlans: [],
      featuredPlan: null,
      previewLabel: "Browse activities",
      sortMode: "soonest",
      trustLine: null,
      error: null,
    };
  }
}
