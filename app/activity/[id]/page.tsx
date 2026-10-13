"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, type SubmitEventHandler } from "react";
import { AppModal } from "@/components/app-modal";
import {
  ActivityDetails,
  ActivityDetailsFooter,
} from "@/components/activity-details";
import type { JoinRequestStatus } from "@/components/feed-activity-card";
import { AppShell } from "@/components/app-shell";
import { ChatModal } from "@/components/chat-modal";
import { Spinner } from "@/components/spinner";
import { isActivityUpcoming } from "@/lib/activity-expiry";
import { openChatForAcceptedJoin } from "@/lib/chat";
import type { MapLocationConfirmPayload } from "@/components/map-location-picker";
import { geocodeLocation } from "@/lib/geocode-client";
import { getCategoryLabel } from "@/lib/categories";
import { CATEGORIES } from "@/lib/categories";
import {
  ActivityFormFields,
  isActivityFormValid,
} from "@/components/activity-form-fields";
import {
  activityDescriptionForSave,
  activityTitleForSave,
  validateActivityDescription,
  validateActivityTitle,
} from "@/lib/activity-validation";
import { supabase } from "@/lib/supabase";

const MapLocationPicker = dynamic(
  () =>
    import("@/components/map-location-picker").then((m) => m.MapLocationPicker),
  { ssr: false, loading: () => null }
);

type ActivityRow = {
  id: string;
  title: string;
  description: string;
  city: string;
  activity_date: string;
  max_people: number;
  category: string;
  user_id: string;
  latitude: number | null;
  longitude: number | null;
  created_at?: string;
};

type MapPinnedLocation = {
  latitude: number;
  longitude: number;
  primaryLine: string;
  secondaryLine: string;
};

function splitActivityDate(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { date, time };
}

function ActivityDetailContent() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const router = useRouter();

  const [activity, setActivity] = useState<ActivityRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [isHost, setIsHost] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    date: "",
    time: "",
    maxPeople: "8",
    category: "",
  });
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [mapPinned, setMapPinned] = useState<MapPinnedLocation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [host, setHost] = useState<{
    id: string;
    username: string;
    avatar_url?: string | null;
  } | null>(null);
  const [joinStatus, setJoinStatus] = useState<JoinRequestStatus>("none");
  const [requestId, setRequestId] = useState<string | undefined>();
  const [spotsLeft, setSpotsLeft] = useState(0);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestMessage, setRequestMessage] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/");
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("activities")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (fetchError || !data) {
        setActivity(null);
        setLoading(false);
        return;
      }

      const row = data as ActivityRow;
      setActivity(row);
      const hostIsViewer = row.user_id === user.id;
      setIsHost(hostIsViewer);

      const { data: hostProfile } = await supabase
        .from("users")
        .select("id, username, avatar_url")
        .eq("id", row.user_id)
        .maybeSingle();
      if (hostProfile) {
        setHost(hostProfile);
      }

      const { count: acceptedCount } = await supabase
        .from("activity_requests")
        .select("id", { count: "exact", head: true })
        .eq("activity_id", row.id)
        .eq("status", "accepted");
      setSpotsLeft(
        Math.max(0, row.max_people - (acceptedCount ?? 0)),
      );

      if (!hostIsViewer) {
        const { data: mine } = await supabase
          .from("activity_requests")
          .select("id, status")
          .eq("activity_id", row.id)
          .eq("user_id", user.id)
          .maybeSingle();
        if (mine?.status) {
          const st = mine.status as JoinRequestStatus;
          if (
            st === "pending" ||
            st === "accepted" ||
            st === "rejected" ||
            st === "cancelled"
          ) {
            setJoinStatus(st);
            setRequestId(mine.id);
          }
        }
      } else {
        setJoinStatus("none");
      }

      const { date, time } = splitActivityDate(row.activity_date);
      setFormData({
        title: row.title,
        description: row.description,
        location: row.city,
        date,
        time,
        maxPeople: String(row.max_people),
        category: row.category,
      });
      setLoading(false);
    };

    if (id) load();
  }, [id, router]);

  const handleMapConfirm = (result: MapLocationConfirmPayload) => {
    setMapPinned({
      latitude: result.latitude,
      longitude: result.longitude,
      primaryLine: result.primaryLine,
      secondaryLine: result.secondaryLine,
    });
    setFormData((prev) => ({ ...prev, location: result.locationText }));
    setError("");
  };

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    if (!activity || !isHost) return;

    if (!formData.title.trim() || !formData.description.trim()) {
      setError("Title and description are required.");
      return;
    }
    if (!formData.location.trim() || !formData.date || !formData.time) {
      setError("Location, date, and time are required.");
      return;
    }
    if (!formData.category) {
      setError("Please select a category.");
      return;
    }

    const titleError = validateActivityTitle(formData.title);
    const descError = validateActivityDescription(formData.description);
    if (titleError || descError) {
      setError(titleError ?? descError ?? "Fix the form errors.");
      return;
    }
    if (!isActivityFormValid(formData.title, formData.description)) {
      setError("Please complete title and description.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const locationText = formData.location.trim();
      let latitude = activity.latitude;
      let longitude = activity.longitude;

      if (mapPinned) {
        latitude = mapPinned.latitude;
        longitude = mapPinned.longitude;
      } else if (locationText !== activity.city) {
        const geocoded = await geocodeLocation(locationText);
        latitude = geocoded.latitude;
        longitude = geocoded.longitude;
      }

      const { error: updateError } = await supabase
        .from("activities")
        .update({
          title: activityTitleForSave(formData.title),
          description: activityDescriptionForSave(formData.description),
          city: locationText,
          activity_date: `${formData.date}T${formData.time}:00`,
          max_people: parseInt(formData.maxPeople, 10),
          category: formData.category,
          latitude,
          longitude,
        })
        .eq("id", activity.id);

      if (updateError) {
        setError("Could not save changes. Check Supabase RLS for activities.");
        return;
      }

      setEditing(false);
      setMapPinned(null);
      const { data: refreshed } = await supabase
        .from("activities")
        .select("*")
        .eq("id", activity.id)
        .single();
      if (refreshed) setActivity(refreshed as ActivityRow);
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendRequest = async () => {
    if (!activity) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/");
      return;
    }
    if (!requestMessage.trim()) {
      setPageError("Please add a message for the host.");
      return;
    }
    setSendingRequest(true);
    setPageError("");
    const { error: insertError } = await supabase.from("activity_requests").insert({
      activity_id: activity.id,
      user_id: user.id,
      message: requestMessage.trim(),
      status: "pending",
    });
    setSendingRequest(false);
    if (insertError) {
      setPageError("Could not send request. Try again.");
      return;
    }
    setJoinStatus("pending");
    setShowRequestModal(false);
    setRequestMessage("");
  };

  const confirmDelete = async () => {
    if (!activity) return;
    setDeleting(true);
    const { error: deleteError } = await supabase
      .from("activities")
      .delete()
      .eq("id", activity.id)
      .eq("user_id", activity.user_id);
    setDeleting(false);
    if (deleteError) {
      setPageError("Could not delete this plan.");
      setShowDeleteModal(false);
      return;
    }
    router.push("/feed");
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f7]">
        <Spinner label="Loading plan…" />
      </main>
    );
  }

  if (!activity) {
    return (
      <AppShell title="Plan not found">
        <div className="py-16 text-center">
          <p className="text-stone-600">This activity doesn&apos;t exist or you can&apos;t view it.</p>
          <button
            type="button"
            onClick={() => router.push("/feed")}
            className="mt-6 rounded-full bg-coral px-5 py-2.5 text-sm font-bold text-white"
          >
            Back to feed
          </button>
        </div>
      </AppShell>
    );
  }

  const upcoming = isActivityUpcoming({
    activity_date: activity.activity_date,
  });

  const cardActivity = {
    id: activity.id,
    user_id: activity.user_id,
    title: activity.title,
    description: activity.description,
    city: activity.city,
    activity_date: activity.activity_date,
    max_people: activity.max_people,
    category: activity.category,
    created_at: activity.created_at ?? new Date().toISOString(),
    host: host
      ? {
          id: host.id,
          username: host.username,
          avatar_url: host.avatar_url,
        }
      : undefined,
  };

  return (
    <AppShell
      action={
        isHost && !editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-full bg-coral px-4 py-2 text-sm font-bold text-white"
          >
            Edit
          </button>
        ) : undefined
      }
    >
      <div className="mx-auto w-full max-w-xl">
        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <ActivityFormFields
              title={formData.title}
              description={formData.description}
              onTitleChange={(v) =>
                setFormData((p) => ({ ...p, title: v }))
              }
              onDescriptionChange={(v) =>
                setFormData((p) => ({ ...p, description: v }))
              }
            />
            <div>
              <label className="mb-1 block text-sm font-semibold text-stone-800">
                Location
              </label>
              <input
                value={formData.location}
                onChange={(e) => {
                  setMapPinned(null);
                  setFormData((p) => ({ ...p, location: e.target.value }));
                }}
                className="w-full rounded-2xl border border-stone-200 p-3 text-sm"
              />
              <button
                type="button"
                onClick={() => setMapPickerOpen(true)}
                className="mt-2 text-sm font-semibold text-coral"
              >
                Select on map
              </button>
            </div>
            <MapLocationPicker
              open={mapPickerOpen}
              onClose={() => setMapPickerOpen(false)}
              onConfirm={handleMapConfirm}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, date: e.target.value }))
                }
                className="rounded-2xl border border-stone-200 p-3 text-sm"
              />
              <input
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, time: e.target.value }))
                }
                className="rounded-2xl border border-stone-200 p-3 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={formData.maxPeople}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, maxPeople: e.target.value }))
                }
                className="rounded-2xl border border-stone-200 p-3 text-sm"
              >
                {[2, 4, 6, 8, 10, 12, 15, 20].map((n) => (
                  <option key={n} value={n}>{n} people</option>
                ))}
              </select>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, category: e.target.value }))
                }
                className="rounded-2xl border border-stone-200 p-3 text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setError("");
                }}
                className="flex-1 rounded-2xl border border-stone-200 py-3 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 rounded-full bg-coral py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                {submitting ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        ) : (
          <>
            {pageError ? (
              <p
                className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                {pageError}
              </p>
            ) : null}
            <div className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
              <ActivityDetails
                activity={cardActivity}
                upcoming={upcoming}
                spotsLeft={spotsLeft}
                joinStatus={isHost ? "none" : joinStatus}
                isHost={isHost}
                onJoin={() => setShowRequestModal(true)}
                onEdit={() => setEditing(true)}
                onDelete={() => setShowDeleteModal(true)}
                onHostClick={() =>
                  router.push(`/profile?userId=${activity.user_id}`)
                }
                onOpenChat={async () => {
                  const {
                    data: { user },
                  } = await supabase.auth.getUser();
                  if (!user) return;
                  const { conversationId, error: chatError } =
                    await openChatForAcceptedJoin(
                      activity.id,
                      user.id,
                      requestId,
                    );
                  if (conversationId) {
                    setChatId(conversationId);
                    setChatOpen(true);
                  } else if (chatError) {
                    setPageError(chatError.message);
                  }
                }}
              />
              <div className="border-t border-stone-100 px-3 pb-4 pt-3 sm:px-6 sm:pb-5">
                <ActivityDetailsFooter
                  upcoming={upcoming}
                  isHost={isHost}
                  joinStatus={isHost ? "none" : joinStatus}
                  onJoin={() => setShowRequestModal(true)}
                  onEdit={() => setEditing(true)}
                  onDelete={() => setShowDeleteModal(true)}
                  onOpenChat={async () => {
                    const {
                      data: { user },
                    } = await supabase.auth.getUser();
                    if (!user) return;
                    const { conversationId, error: chatError } =
                      await openChatForAcceptedJoin(
                        activity.id,
                        user.id,
                        requestId,
                      );
                    if (conversationId) {
                      setChatId(conversationId);
                      setChatOpen(true);
                    } else if (chatError) {
                      setPageError(chatError.message);
                    }
                  }}
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push("/feed")}
              className="mt-4 w-full rounded-full border border-stone-200 py-3 text-sm font-semibold text-stone-800"
            >
              ← Back to feed
            </button>
          </>
        )}
      </div>

      <AppModal
        open={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="Message the host"
        subtitle={
          host
            ? `@${host.username} will see your note and can accept or decline.`
            : undefined
        }
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowRequestModal(false)}
              className="flex-1 rounded-2xl border border-stone-200 py-2.5 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSendRequest()}
              disabled={sendingRequest || !requestMessage.trim()}
              className="flex-1 rounded-full bg-coral py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {sendingRequest ? "Sending…" : "Send request"}
            </button>
          </div>
        }
      >
        <textarea
          value={requestMessage}
          onChange={(e) => setRequestMessage(e.target.value)}
          rows={4}
          className="w-full rounded-2xl border border-stone-200 p-3 text-sm"
          placeholder="Why do you want to join?"
        />
      </AppModal>

      <AppModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete this activity?"
        footer={
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="flex-1 rounded-2xl border border-stone-200 py-2.5 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void confirmDelete()}
              disabled={deleting}
              className="flex-1 rounded-full bg-red-600 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {deleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        }
      >
        <p className="text-sm text-stone-600">
          This cannot be undone. Chats tied to this plan will be removed.
        </p>
      </AppModal>

      <ChatModal
        open={chatOpen}
        conversationId={chatId}
        onClose={() => {
          setChatOpen(false);
          setChatId(null);
        }}
      />
    </AppShell>
  );
}

export default function ActivityDetailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#faf9f7]">
          <Spinner />
        </main>
      }
    >
      <ActivityDetailContent />
    </Suspense>
  );
}
