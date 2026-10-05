"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppModal } from "@/components/app-modal";
import { AppShell } from "@/components/app-shell";
import { ChatModal } from "@/components/chat-modal";
import {
  ActivityCard,
  type JoinRequestStatus,
} from "@/components/activity-card";
import { Spinner } from "@/components/spinner";
import { getCategoryLabel } from "@/lib/categories";
import {
  ensureConversationOnAccept,
  openChatForAcceptedJoin,
} from "@/lib/chat";
import { fetchUserProfile, isProfileComplete } from "@/lib/profile";
import { supabase } from "@/lib/supabase";

const FeedActivitiesMap = dynamic(
  () =>
    import("@/components/feed-activities-map").then((m) => m.FeedActivitiesMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex h-[min(55vh,420px)] items-center justify-center rounded-3xl border border-stone-200 bg-stone-50 text-sm text-stone-500"
      >
        Loading map…
      </div>
    ),
  }
);

interface Activity {
  id: string;
  title: string;
  description: string;
  city: string;
  activity_date: string;
  max_people: number;
  category: string;
  created_at: string;
  user_id: string;
  latitude?: number | null;
  longitude?: number | null;
  host?: {
    id: string;
    username: string;
    avatar_url?: string | null;
  };
}

interface JoinRequest {
  id: string;
  activity_id: string;
  user_id: string;
  message: string;
  status: string;
  created_at: string;
  requester?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  activity?: {
    title: string;
  };
}

type MyJoinState = {
  status: JoinRequestStatus;
  message: string;
  requestId?: string;
  conversationId?: string;
};

type TabType = "others" | "mine";
type WhenFilter = "upcoming" | "past" | "all";
type ViewMode = "list" | "map";
type GeoStatus = "loading" | "success" | "denied" | "unavailable";

const FEED_PAGE_SIZE = 6;

type UserLocation = {
  latitude: number;
  longitude: number;
};

type CategoryChipId =
  | "all"
  | "food"
  | "fitness"
  | "gaming"
  | "creative"
  | "outdoors"
  | "movies"
  | "social";

const CATEGORY_CHIPS: {
  id: CategoryChipId;
  label: string;
  categories: string[];
}[] = [
  { id: "all", label: "All", categories: [] },
  { id: "food", label: "☕ Food", categories: ["food", "coffee"] },
  {
    id: "fitness",
    label: "🏋️ Fitness",
    categories: ["running", "yoga", "cycling"],
  },
  { id: "gaming", label: "🎮 Gaming", categories: ["gaming"] },
  {
    id: "creative",
    label: "🎨 Creative",
    categories: ["art", "photography", "dance"],
  },
  {
    id: "outdoors",
    label: "🌄 Outdoors",
    categories: ["hiking", "beaches", "cycling"],
  },
  { id: "movies", label: "🎬 Movies", categories: [] },
  {
    id: "social",
    label: "💬 Social",
    categories: ["nightlife", "coffee", "food"],
  },
];

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}

function isUpcoming(dateStr: string) {
  return new Date(dateStr) > new Date();
}

function activityDistanceKm(
  activity: Activity,
  userLocation: UserLocation | null
): number | null {
  if (
    !userLocation ||
    activity.latitude == null ||
    activity.longitude == null ||
    Number.isNaN(activity.latitude) ||
    Number.isNaN(activity.longitude)
  ) {
    return null;
  }
  return haversineKm(
    userLocation.latitude,
    userLocation.longitude,
    activity.latitude,
    activity.longitude
  );
}

function NearYouChip({ status }: { status: GeoStatus }) {
  const base =
    "inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset";

  if (status === "loading") {
    return (
      <span
        className={`${base} bg-stone-50 text-stone-600 ring-stone-200`}
        role="status"
        aria-live="polite"
      >
        <span
          className="size-3 shrink-0 animate-spin rounded-full border-2 border-stone-200 border-t-coral"
          aria-hidden
        />
        Locating…
      </span>
    );
  }

  if (status === "denied") {
    return (
      <span
        className={`${base} bg-amber-50 text-amber-900 ring-amber-200/80`}
        role="status"
        title="Enable location in browser settings for distance sorting"
      >
        📍 Location off
      </span>
    );
  }

  if (status === "unavailable") {
    return (
      <span className={`${base} bg-amber-50 text-amber-900 ring-amber-200/80`} role="status">
        📍 Location unavailable
      </span>
    );
  }

  return (
    <span
      className={`${base} bg-teal-50 text-teal-900 ring-teal-200/70`}
      role="status"
    >
      📍 Near you first
    </span>
  );
}

function FeedPageContent() {
  const searchParams = useSearchParams();
  const categoryFromUrl = searchParams.get("category");

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("others");
  const [whenFilter, setWhenFilter] = useState<WhenFilter>("upcoming");
  const [categoryChip, setCategoryChip] = useState<CategoryChipId>("all");
  const [categorySlug, setCategorySlug] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [listPage, setListPage] = useState(1);
  const router = useRouter();

  useEffect(() => {
    setCategorySlug(categoryFromUrl);
    if (categoryFromUrl) {
      setCategoryChip("all");
    }
  }, [categoryFromUrl]);

  useEffect(() => {
    setListPage(1);
  }, [activeTab, whenFilter, categoryChip, categorySlug, categoryFromUrl]);

  const [showModal, setShowModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null
  );
  const [requestMessage, setRequestMessage] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);

  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [requestsActivityFilter, setRequestsActivityFilter] = useState<
    string | null
  >(null);
  const [processingRequest, setProcessingRequest] = useState<string | null>(
    null
  );
  const [myJoinByActivity, setMyJoinByActivity] = useState<
    Record<string, MyJoinState>
  >({});
  const [pendingCountByActivity, setPendingCountByActivity] = useState<
    Record<string, number>
  >({});

  const [chatOpen, setChatOpen] = useState(false);
  const [chatConversationId, setChatConversationId] = useState<string | null>(
    null
  );
  const openChatModal = (conversationId: string) => {
    setChatConversationId(conversationId);
    setChatOpen(true);
  };

  const [geoStatus, setGeoStatus] = useState<GeoStatus>("loading");
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setGeoStatus("unavailable");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
        setGeoStatus("success");
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGeoStatus("denied");
        } else {
          setGeoStatus("unavailable");
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 15_000,
        maximumAge: 0,
      }
    );
  }, []);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      setUser(authUser);

      if (!authUser) {
        router.push("/");
        return;
      }

      const { profile, error: profileError } = await fetchUserProfile(
        authUser.id
      );
      if (profileError) {
        console.error("Could not load profile:", profileError.message);
      } else if (!isProfileComplete(profile)) {
        router.push("/onboarding?next=/feed");
        return;
      }

      type ActivityRow = Activity & {
        users?: Activity["host"] | Activity["host"][] | null;
      };

      let activitiesData: ActivityRow[] | null = null;

      const withHosts = await supabase
        .from("activities")
        .select("*, users(id, username, avatar_url)")
        .order("activity_date", { ascending: true });

      if (withHosts.error) {
        const plain = await supabase
          .from("activities")
          .select("*")
          .order("activity_date", { ascending: true });
        if (plain.error) {
          console.error("Error fetching activities:", plain.error);
          setActivities([]);
          setLoading(false);
          return;
        }
        activitiesData = (plain.data ?? []) as ActivityRow[];
      } else {
        activitiesData = (withHosts.data ?? []) as ActivityRow[];
      }

      if (activitiesData.length > 0) {
        const hostFromRow = (row: ActivityRow) => {
          const embedded = row.users;
          return Array.isArray(embedded) ? embedded[0] : embedded;
        };

        const userIds = [...new Set(activitiesData.map((a) => a.user_id))];
        const needsProfileFetch = activitiesData.some(
          (a) => !hostFromRow(a)?.username
        );

        let profileMap = new Map<string, NonNullable<Activity["host"]>>();

        if (needsProfileFetch) {
          const { data: profiles } = await supabase
            .from("users")
            .select("id, username, avatar_url")
            .in("id", userIds);

          profileMap = new Map(
            (profiles ?? []).map((p) => [p.id, p as NonNullable<Activity["host"]>])
          );
        }

        setActivities(
          activitiesData.map((row) => {
            const hostFromJoin = hostFromRow(row);
            const { users: _users, ...activity } = row;
            return {
              ...activity,
              host: hostFromJoin ?? profileMap.get(activity.user_id),
            };
          })
        );
      } else {
        setActivities([]);
      }
      setLoading(false);
    };

    checkAuthAndFetch();
  }, [router]);

  useEffect(() => {
    const loadJoinRequestMeta = async () => {
      if (!user || activities.length === 0) {
        setMyJoinByActivity({});
        setPendingCountByActivity({});
        return;
      }

      const myActivityIds = activities
        .filter((a) => a.user_id === user.id)
        .map((a) => a.id);
      const otherActivityIds = activities
        .filter((a) => a.user_id !== user.id)
        .map((a) => a.id);

      if (otherActivityIds.length > 0) {
        const { data: mine } = await supabase
          .from("activity_requests")
          .select("id, activity_id, status, message")
          .eq("user_id", user.id)
          .in("activity_id", otherActivityIds);

        const joinMap: Record<string, MyJoinState> = {};
        for (const row of mine ?? []) {
          const status = row.status as JoinRequestStatus;
          if (
            status === "pending" ||
            status === "accepted" ||
            status === "rejected"
          ) {
            joinMap[row.activity_id] = {
              status,
              message: row.message ?? "",
              requestId: row.id,
            };
          }
        }
        const acceptedIds = Object.entries(joinMap)
          .filter(([, v]) => v.status === "accepted")
          .map(([activityId]) => activityId);

        if (acceptedIds.length > 0) {
          const { data: convs } = await supabase
            .from("conversations")
            .select("id, activity_id")
            .eq("guest_id", user.id)
            .in("activity_id", acceptedIds);

          for (const c of convs ?? []) {
            if (joinMap[c.activity_id]) {
              joinMap[c.activity_id].conversationId = c.id;
            }
          }
        }

        setMyJoinByActivity(joinMap);
      } else {
        setMyJoinByActivity({});
      }

      if (myActivityIds.length > 0) {
        const { data: pending } = await supabase
          .from("activity_requests")
          .select("activity_id")
          .in("activity_id", myActivityIds)
          .eq("status", "pending");

        const counts: Record<string, number> = {};
        for (const row of pending ?? []) {
          counts[row.activity_id] = (counts[row.activity_id] ?? 0) + 1;
        }
        setPendingCountByActivity(counts);
      } else {
        setPendingCountByActivity({});
      }
    };

    loadJoinRequestMeta();
  }, [user, activities]);

  const isOwnActivity = (activityUserId: string) =>
    user?.id === activityUserId;

  const chipCategories = useMemo(() => {
    const chip = CATEGORY_CHIPS.find((c) => c.id === categoryChip);
    return chip?.categories ?? [];
  }, [categoryChip]);

  const { flatList, counts } = useMemo(() => {
    const mine = activities.filter((a) => isOwnActivity(a.user_id));
    const others = activities.filter((a) => !isOwnActivity(a.user_id));
    const pool = activeTab === "mine" ? mine : others;

    const filtered = pool.filter((a) => {
      const upcoming = isUpcoming(a.activity_date);
      if (whenFilter === "upcoming" && !upcoming) return false;
      if (whenFilter === "past" && upcoming) return false;
      if (
        categoryChip !== "all" &&
        chipCategories.length > 0 &&
        !chipCategories.includes(a.category)
      ) {
        return false;
      }
      if (categoryChip !== "all" && chipCategories.length === 0) {
        return false;
      }
      if (categorySlug && a.category !== categorySlug) {
        return false;
      }
      return true;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (activeTab === "others" && whenFilter !== "past" && userLocation) {
        const da = activityDistanceKm(a, userLocation);
        const db = activityDistanceKm(b, userLocation);
        if (da != null && db != null && da !== db) return da - db;
        if (da != null && db == null) return -1;
        if (da == null && db != null) return 1;
      }
      const ta = new Date(a.activity_date).getTime();
      const tb = new Date(b.activity_date).getTime();
      if (whenFilter === "past") return tb - ta;
      return ta - tb;
    });

    const upcomingCount = pool.filter((a) =>
      isUpcoming(a.activity_date)
    ).length;
    const pastCount = pool.length - upcomingCount;

    return {
      flatList: sorted,
      counts: {
        mine: mine.length,
        others: others.length,
        upcoming: upcomingCount,
        past: pastCount,
        showing: sorted.length,
      },
    };
  }, [
    activities,
    activeTab,
    whenFilter,
    categoryChip,
    chipCategories,
    categorySlug,
    user?.id,
    userLocation,
  ]);

  const mapActivities = useMemo(() => {
    return flatList
      .filter(
        (a) =>
          isUpcoming(a.activity_date) &&
          a.latitude != null &&
          a.longitude != null &&
          !Number.isNaN(a.latitude) &&
          !Number.isNaN(a.longitude)
      )
      .map((a) => ({
        id: a.id,
        title: a.title,
        city: a.city,
        category: a.category,
        activity_date: a.activity_date,
        latitude: a.latitude as number,
        longitude: a.longitude as number,
      }));
  }, [flatList]);

  const visibleList = useMemo(
    () => flatList.slice(0, listPage * FEED_PAGE_SIZE),
    [flatList, listPage]
  );
  const hasMoreActivities = visibleList.length < flatList.length;
  const remainingCount = flatList.length - visibleList.length;

  const openRequestModal = (activity: Activity) => {
    const existing = myJoinByActivity[activity.id];
    if (existing?.status === "pending" || existing?.status === "accepted") {
      return;
    }
    setSelectedActivity(activity);
    setShowModal(true);
    setRequestMessage("");
  };

  const totalPendingRequests = useMemo(
    () =>
      Object.values(pendingCountByActivity).reduce((sum, n) => sum + n, 0),
    [pendingCountByActivity]
  );

  const handleSendRequest = async () => {
    if (!user || !selectedActivity) return;

    if (!requestMessage.trim()) {
      alert("Please add a message explaining why you want to join");
      return;
    }

    setSendingRequest(true);

    try {
      const { data: existingRequest } = await supabase
        .from("activity_requests")
        .select("id, status")
        .eq("activity_id", selectedActivity.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingRequest) {
        alert("You've already sent a request for this plan.");
        setSendingRequest(false);
        return;
      }

      const { error } = await supabase.from("activity_requests").insert({
        activity_id: selectedActivity.id,
        user_id: user.id,
        message: requestMessage.trim(),
        status: "pending",
      });

      if (error) {
        console.error("Error requesting to join:", error);
        alert(
          error.message.includes("activity_requests")
            ? "Could not send — make sure join requests are set up in Supabase (run the latest migration)."
            : "Failed to send request. Please try again."
        );
      } else {
        setMyJoinByActivity((prev) => ({
          ...prev,
          [selectedActivity.id]: {
            status: "pending",
            message: requestMessage.trim(),
          },
        }));
        setShowModal(false);
        setRequestMessage("");
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setSendingRequest(false);
    }
  };

  const fetchRequests = async () => {
    if (!user) return;

    const myActivityIds = activities
      .filter((a) => isOwnActivity(a.user_id))
      .map((a) => a.id);

    if (myActivityIds.length === 0) {
      setRequests([]);
      return;
    }

    const { data: requestsData } = await supabase
      .from("activity_requests")
      .select("*, activities(title)")
      .in("activity_id", myActivityIds)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (requestsData && requestsData.length > 0) {
      const requesterIds = [...new Set(requestsData.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("users")
        .select("id, username, avatar_url")
        .in("id", requesterIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      setRequests(
        requestsData.map((r) => {
          const row = r as JoinRequest & {
            activities?: { title: string } | { title: string }[] | null;
          };
          const act = row.activities;
          const activityTitle = Array.isArray(act)
            ? act[0]?.title
            : act?.title;
          const { activities: _a, ...rest } = row;
          return {
            ...rest,
            requester: profileMap.get(r.user_id),
            activity: activityTitle ? { title: activityTitle } : undefined,
          };
        })
      );
    } else {
      setRequests([]);
    }
  };

  const openRequestsModal = async (activityId?: string) => {
    setRequestsActivityFilter(activityId ?? null);
    await fetchRequests();
    setShowRequestsModal(true);
  };

  const visibleHostRequests = useMemo(() => {
    if (!requestsActivityFilter) return requests;
    return requests.filter((r) => r.activity_id === requestsActivityFilter);
  }, [requests, requestsActivityFilter]);

  const handleRequest = async (
    requestId: string,
    action: "accepted" | "rejected"
  ) => {
    setProcessingRequest(requestId);

    try {
      const requestRow = requests.find((r) => r.id === requestId);
      const activityRow = requestRow
        ? activities.find((a) => a.id === requestRow.activity_id)
        : undefined;

      const { error } = await supabase
        .from("activity_requests")
        .update({ status: action })
        .eq("id", requestId);

      if (error) {
        console.error("Error updating request:", error);
        alert("Failed to update request. Please try again.");
      } else {
        if (
          action === "accepted" &&
          requestRow &&
          activityRow &&
          user
        ) {
          const hostId = user.id;
          let conversationId: string | null = null;
          let chatError: Error | null = null;

          const created = await ensureConversationOnAccept(
            requestId,
            requestRow.activity_id,
            hostId,
            requestRow.user_id
          );
          conversationId = created.conversationId;
          chatError = created.error;

          if (!conversationId) {
            const backfill = await openChatForAcceptedJoin(
              requestRow.activity_id,
              requestRow.user_id,
              requestId
            );
            conversationId = backfill.conversationId;
            chatError = backfill.error ?? chatError;
          }

          if (chatError) {
            console.error(chatError);
            alert(
              "Request accepted, but chat could not start. Run supabase/migrations/20260328170000_conversations_messages.sql and 20260328180000_chat_grants_and_backfill_rpc.sql in Supabase, then try Open chat on the card."
            );
          }
          if (conversationId) {
            setShowRequestsModal(false);
            setRequestsActivityFilter(null);
            openChatModal(conversationId);
            return;
          }
        }

        await fetchRequests();
        setPendingCountByActivity((prev) => {
          const accepted = requests.find((r) => r.id === requestId);
          if (!accepted) return prev;
          const next = { ...prev };
          const n = (next[accepted.activity_id] ?? 1) - 1;
          if (n <= 0) delete next[accepted.activity_id];
          else next[accepted.activity_id] = n;
          return next;
        });
      }
    } catch (err) {
      console.error("Error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setProcessingRequest(null);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-linear-to-b from-coral-50/80 to-[#faf9f7]">
        <Spinner label="Loading the vibe…" />
      </main>
    );
  }

  const showEmptyNearby =
    activeTab === "others" &&
    whenFilter === "upcoming" &&
    flatList.length === 0;

  return (
    <AppShell>
      <div className="space-y-5 pb-4">
        <header className="space-y-2 pt-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-coral">
                Feed
              </p>
              <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-navy sm:text-[2rem] sm:leading-tight">
                Plans happening near you
              </h1>
              <p className="mt-2 max-w-lg text-sm font-medium leading-relaxed text-stone-600 sm:text-base">
                Browse activities, filter by vibe, and join something filmy IRL.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push("/create-activity")}
              className="shrink-0 rounded-full bg-coral px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-coral/25 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              + Plan something
            </button>
          </div>
        </header>

        <div>
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-stone-800">
            Filters
          </h2>
          <p className="mt-0.5 text-xs text-stone-500">
            Who you see, list or map, and category
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-2xl border border-stone-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveTab("others")}
              className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                activeTab === "others"
                  ? "bg-stone-900 text-white shadow-sm"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Nearby {counts.others > 0 && `(${counts.others})`}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("mine")}
              className={`relative rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                activeTab === "mine"
                  ? "bg-stone-900 text-white shadow-sm"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Yours {counts.mine > 0 && `(${counts.mine})`}
              {totalPendingRequests > 0 && activeTab !== "mine" && (
                <span
                  className="absolute -right-1 -top-1 size-2.5 rounded-full bg-coral ring-2 ring-white"
                  aria-hidden
                />
              )}
            </button>
          </div>

          <div className="flex rounded-2xl border border-stone-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                viewMode === "list"
                  ? "bg-coral-50 text-coral"
                  : "text-stone-500"
              }`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode("map")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                viewMode === "map"
                  ? "bg-coral-50 text-coral"
                  : "text-stone-500"
              }`}
            >
              Map
            </button>
          </div>
        </div>

        {activeTab === "mine" && totalPendingRequests > 0 && (
          <button
            type="button"
            onClick={() => openRequestsModal()}
            className="flex w-full items-center justify-between rounded-2xl border border-coral-100 bg-coral-50 px-4 py-3 text-left transition-colors hover:bg-coral-50/80"
          >
            <span className="text-sm font-semibold text-stone-800">
              {totalPendingRequests} join request
              {totalPendingRequests === 1 ? "" : "s"} waiting
            </span>
            <span className="text-sm font-bold text-coral">Review →</span>
          </button>
        )}

        <div>
          <h2 className="text-sm font-extrabold text-stone-800">Category</h2>
        </div>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
          {CATEGORY_CHIPS.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setCategoryChip(chip.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                categoryChip === chip.id
                  ? "bg-stone-900 text-white shadow-md"
                  : "bg-white text-stone-600 ring-1 ring-stone-200 hover:ring-coral-100 hover:text-coral"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        <div>
          <h2 className="text-sm font-extrabold text-stone-800">When</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "upcoming" as const, label: "Upcoming", n: counts.upcoming },
              { id: "past" as const, label: "Past", n: counts.past },
              { id: "all" as const, label: "All", n: counts.upcoming + counts.past },
            ] as const
          ).map(({ id, label, n }) => (
            <button
              key={id}
              type="button"
              onClick={() => setWhenFilter(id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                whenFilter === id
                  ? "bg-coral text-white"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {label} · {n}
            </button>
          ))}
        </div>

        <div
          className="flex flex-wrap items-center justify-between gap-2 rounded-2xl  px-3 py-2.5 "
        >
          <NearYouChip status={geoStatus} />
          <p className="text-xs text-stone-500">
            {geoStatus === "success" && activeTab === "others" && whenFilter !== "past"
              ? "Sorted closest first"
              : viewMode === "map"
                ? "Map: upcoming with a pin only"
                : `${counts.showing} showing`}
          </p>
        </div>

        {categorySlug ? (
          <div
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-100 bg-coral-50 px-3 py-2 text-sm"
          >
            <p className="text-stone-800">
              Filter:{" "}
              <span className="font-bold text-coral">
                {getCategoryLabel(categorySlug)}
              </span>
            </p>
            <button
              type="button"
              onClick={() => {
                setCategorySlug(null);
                router.replace("/feed");
              }}
              className="text-xs font-semibold text-coral hover:text-coral-hover"
            >
              Clear ×
            </button>
          </div>
        ) : null}

        {viewMode === "map" ? (
          <div className="space-y-2">
            <p className="text-center text-xs text-stone-500">
              Upcoming activities with a location — tap a pin for details.
            </p>
            <FeedActivitiesMap
              activities={mapActivities}
              userLocation={userLocation}
            />
          </div>
        ) : flatList.length === 0 ? (
          <div
            className="rounded-3xl border border-dashed border-coral-100 bg-white px-6 py-16 text-center shadow-sm"
          >
            <p className="text-3xl" aria-hidden>👀</p>
            <p className="mt-3 text-lg font-bold text-stone-900">
              {showEmptyNearby
                ? "No plans nearby... yet 👀"
                : "Nothing here right now"}
            </p>
            <p className="mt-2 text-sm text-stone-500">
              {showEmptyNearby
                ? "Be the first to drop a plan — your friends might join."
                : "Try another filter or check Past / All."}
            </p>
            <button
              type="button"
              onClick={() => router.push("/create-activity")}
              className="mt-6 rounded-full bg-coral px-6 py-3 text-sm font-bold text-white shadow-lg shadow-coral/25 transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Create Activity
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-end justify-between gap-2">
              <div>
                <h2 className="text-lg font-extrabold text-navy">Activities</h2>
                <p className="text-sm text-stone-600">
                  Tap <span className="font-semibold">I&apos;m in</span> to request a spot
                </p>
              </div>
            </div>
            <div
              className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {visibleList.map((activity) => {
                const upcoming = isUpcoming(activity.activity_date);
                const km = activityDistanceKm(activity, userLocation);
                const distanceLabel = km != null ? formatDistance(km) : null;

                return (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    upcoming={upcoming}
                    showHost={activeTab === "others"}
                    distanceLabel={distanceLabel}
                    joinStatus={
                      myJoinByActivity[activity.id]?.status ?? "none"
                    }
                    pendingRequestCount={
                      pendingCountByActivity[activity.id] ?? 0
                    }
                    mode={activeTab}
                    onJoin={() => openRequestModal(activity)}
                    onHostClick={() =>
                      router.push(`/profile?userId=${activity.user_id}`)
                    }
                    onRequests={() => openRequestsModal(activity.id)}
                    onEdit={() => router.push(`/activity/${activity.id}`)}
                    onOpenChat={
                      myJoinByActivity[activity.id]?.status === "accepted"
                        ? async () => {
                            if (!user) return;
                            const join = myJoinByActivity[activity.id];
                            const { conversationId, error: chatErr } =
                              await openChatForAcceptedJoin(
                                activity.id,
                                user.id,
                                join?.requestId
                              );
                            if (conversationId) {
                              setMyJoinByActivity((prev) => ({
                                ...prev,
                                [activity.id]: {
                                  ...join,
                                  status: "accepted",
                                  message: join?.message ?? "",
                                  requestId: join?.requestId,
                                  conversationId,
                                },
                              }));
                              openChatModal(conversationId);
                            } else {
                              console.error(chatErr);
                              alert(
                                chatErr?.message ??
                                  "Chat is not available yet. Make sure the host accepted your request and chat migrations are applied in Supabase."
                              );
                            }
                          }
                        : undefined
                    }
                  />
                );
              })}
            </div>

            <div
              className="flex flex-col items-center gap-3 border-t border-stone-200/80 pt-6"
            >
              <p className="text-sm text-stone-500">
                Showing{" "}
                <span className="font-semibold text-stone-800">
                  {visibleList.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-stone-800">
                  {flatList.length}
                </span>{" "}
                activities
              </p>
              {hasMoreActivities ? (
                <button
                  type="button"
                  onClick={() => setListPage((p) => p + 1)}
                  className="pill-interactive rounded-full border border-stone-200 bg-white px-8 py-3 text-sm font-bold text-stone-800 shadow-sm transition-colors hover:border-coral-100 hover:text-coral"
                >
                  Load more
                  {remainingCount > 0 && (
                    <span className="ml-1.5 font-medium text-stone-500">
                      (+{Math.min(remainingCount, FEED_PAGE_SIZE)} more)
                    </span>
                  )}
                </button>
              ) : flatList.length > FEED_PAGE_SIZE ? (
                <button
                  type="button"
                  onClick={() => setListPage(1)}
                  className="text-sm font-semibold text-coral hover:text-coral-hover"
                >
                  Back to top ↑
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>

      <AppModal
        open={showModal && !!selectedActivity}
        onClose={() => setShowModal(false)}
        title="Message the host"
        subtitle={
          selectedActivity
            ? `@${selectedActivity.host?.username ?? "host"} will see your note and can accept or decline.`
            : undefined
        }
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 rounded-2xl border border-stone-200 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSendRequest}
              disabled={sendingRequest || !requestMessage.trim()}
              className="flex-1 rounded-full bg-coral py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {sendingRequest ? "Sending…" : "Send request"}
            </button>
          </div>
        }
      >
        <label className="mb-2 block text-sm font-semibold text-stone-700">
          Your message
        </label>
        <textarea
          value={requestMessage}
          onChange={(e) => setRequestMessage(e.target.value)}
          placeholder="Hey! I'd love to join — …"
          rows={4}
          className="w-full rounded-2xl border border-stone-200 p-3 text-sm focus:border-coral focus:outline-none focus:ring-2 focus:ring-coral-100"
        />
      </AppModal>

      <AppModal
        open={showRequestsModal}
        onClose={() => {
          setShowRequestsModal(false);
          setRequestsActivityFilter(null);
        }}
        title="Join requests"
        subtitle={
          requestsActivityFilter ? "For this plan only" : "Review messages and accept or decline"
        }
        footer={
          <button
            type="button"
            onClick={() => {
              setShowRequestsModal(false);
              setRequestsActivityFilter(null);
            }}
            className="w-full rounded-2xl border border-stone-200 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
          >
            Close
          </button>
        }
      >
        {visibleHostRequests.length === 0 ? (
          <p className="py-8 text-center text-sm text-stone-500">
            No pending requests
          </p>
        ) : (
          <div className="space-y-3">
            {visibleHostRequests.map((request) => (
              <div
                key={request.id}
                className="rounded-2xl border border-stone-200/80 bg-stone-50 p-4"
              >
                {request.activity?.title && (
                  <p className="mb-2 text-xs font-bold uppercase tracking-wide text-coral">
                    {request.activity.title}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (request.requester?.id) {
                      setShowRequestsModal(false);
                      setRequestsActivityFilter(null);
                      router.push(
                        `/profile?userId=${request.requester.id}`
                      );
                    }
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-white bg-white p-2.5 text-left transition-colors hover:border-coral-100 hover:bg-coral-50/40"
                >
                  <span
                    className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-coral to-coral-hover text-sm font-bold text-white"
                  >
                    {request.requester?.avatar_url ? (
                      <img
                        src={request.requester.avatar_url}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      request.requester?.username?.charAt(0).toUpperCase() ??
                      "?"
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold text-navy">
                      @{request.requester?.username || "unknown"}
                    </span>
                    <span className="block text-xs font-semibold text-coral">
                      View profile →
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-stone-400">
                    {new Date(request.created_at).toLocaleDateString()}
                  </span>
                </button>
                <p className="mt-3 text-xs font-bold uppercase tracking-wide text-stone-500">
                  Their message
                </p>
                <p className="mt-1 text-sm leading-relaxed text-stone-800">
                  {request.message}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleRequest(request.id, "accepted")}
                    disabled={processingRequest === request.id}
                    className="flex-1 rounded-full bg-coral py-2.5 text-sm font-bold text-white disabled:opacity-60"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRequest(request.id, "rejected")}
                    disabled={processingRequest === request.id}
                    className="flex-1 rounded-full border border-stone-200 py-2.5 text-sm font-semibold text-stone-600 disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </AppModal>

      <ChatModal
        open={chatOpen}
        conversationId={chatConversationId}
        onClose={() => {
          setChatOpen(false);
          setChatConversationId(null);
        }}
      />
    </AppShell>
  );
}

export default function FeedPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#faf9f7]">
          <Spinner />
        </main>
      }
    >
      <FeedPageContent />
    </Suspense>
  );
}
