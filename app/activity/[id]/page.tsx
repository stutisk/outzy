"use client";

import dynamic from "next/dynamic";
import { useParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState, type SubmitEventHandler } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Field,
  FormError,
  Input,
  Select,
  Textarea,
  fieldInputClass,
} from "@/components/ui/field";
import {
  EmptyState,
  PageLoadingScreen,
} from "@/components/ui/page-state";
import type { MapLocationConfirmPayload } from "@/components/map-location-picker";
import { geocodeLocation } from "@/lib/geocode-client";
import { getCategoryLabel } from "@/lib/categories";
import { CATEGORIES } from "@/lib/categories";
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
      setIsHost(row.user_id === user.id);
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
          title: formData.title.trim(),
          description: formData.description.trim(),
          city: locationText,
          activity_date: `${formData.date}T${formData.time}:00`,
          max_people: parseInt(formData.maxPeople, 10),
          category: formData.category,
          latitude,
          longitude,
        })
        .eq("id", activity.id);

      if (updateError) {
        console.error(updateError);
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
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageLoadingScreen label="Loading plan…" />;
  }

  if (!activity) {
    return (
      <AppShell title="Plan not found">
        <EmptyState
          title="Plan not found"
          description="This activity doesn't exist or you can't view it."
          actionLabel="Back to feed"
          onAction={() => router.push("/feed")}
        />
      </AppShell>
    );
  }

  const mapsUrl =
    activity.latitude != null && activity.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${activity.latitude},${activity.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.city)}`;

  const when = new Date(activity.activity_date).toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <AppShell
      title={editing ? "Edit plan" : activity.title}
      subtitle={editing ? undefined : getCategoryLabel(activity.category)}
      action={
        isHost && !editing ? (
          <Button showArrow={false} onClick={() => setEditing(true)}>
            Edit
          </Button>
        ) : undefined
      }
    >
      <div className="mx-auto max-w-xl">
        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <Field label="Title" htmlFor="edit-title">
              <Input
                id="edit-title"
                name="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, title: e.target.value }))
                }
              />
            </Field>
            <Field label="Description" htmlFor="edit-description">
              <Textarea
                id="edit-description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, description: e.target.value }))
                }
              />
            </Field>
            <Field label="Location" htmlFor="edit-location">
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => {
                  setMapPinned(null);
                  setFormData((p) => ({ ...p, location: e.target.value }));
                }}
              />
              <Button
                type="button"
                variant="secondary"
                className="mt-2 !px-0"
                showArrow={false}
                onClick={() => setMapPickerOpen(true)}
              >
                Select on map
              </Button>
            </Field>
            <MapLocationPicker
              open={mapPickerOpen}
              onClose={() => setMapPickerOpen(false)}
              onConfirm={handleMapConfirm}
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, date: e.target.value }))
                }
                className={fieldInputClass}
              />
              <input
                type="time"
                value={formData.time}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, time: e.target.value }))
                }
                className={fieldInputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                value={formData.maxPeople}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, maxPeople: e.target.value }))
                }
              >
                {[2, 4, 6, 8, 10, 12, 15, 20].map((n) => (
                  <option key={n} value={n}>{n} people</option>
                ))}
              </Select>
              <Select
                value={formData.category}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, category: e.target.value }))
                }
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </Select>
            </div>
            <FormError message={error} />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                fullWidth
                showArrow={false}
                onClick={() => {
                  setEditing(false);
                  setError("");
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                fullWidth
                showArrow={false}
                loading={submitting}
                disabled={submitting}
              >
                {submitting ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-5 border-hairline bg-surface p-6">
            <p className="type-eyebrow text-accent">{when}</p>
            <p className="type-body text-ink">{activity.description}</p>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-accent underline underline-offset-4"
            >
              {activity.city} — open in maps
            </a>
            <p className="text-sm text-muted">
              Up to {activity.max_people} people
            </p>
            <Button
              variant="ghost"
              fullWidth
              showArrow={false}
              onClick={() => router.push("/feed")}
            >
              Back to feed
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}

export default function ActivityDetailPage() {
  return (
    <Suspense fallback={<PageLoadingScreen label="Loading plan…" />}>
      <ActivityDetailContent />
    </Suspense>
  );
}
