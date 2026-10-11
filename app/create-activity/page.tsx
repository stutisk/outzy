"use client";

import dynamic from "next/dynamic";
import { Suspense, useState, useEffect, type SubmitEventHandler } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import {
  Field,
  FormError,
  Input,
  Select,
  Textarea,
} from "@/components/ui/field";
import { PageLoadingScreen } from "@/components/ui/page-state";
import type { MapLocationConfirmPayload } from "@/components/map-location-picker";
import type { ActivityInsert } from "@/lib/activities";
import { safeNextPath, signInWithGoogleNext } from "@/lib/auth-nav";
import { fetchUserProfile, isProfileComplete } from "@/lib/profile";
import { CATEGORIES } from "@/lib/categories";
import { supabase } from "@/lib/supabase";

const MapLocationPicker = dynamic(
  () =>
    import("@/components/map-location-picker").then((m) => m.MapLocationPicker),
  {
    ssr: false,
    loading: () => null,
  }
);

type MapPinnedLocation = {
  latitude: number;
  longitude: number;
  primaryLine: string;
  secondaryLine: string;
};

async function geocodeLocation(
  locationText: string
): Promise<{ latitude: number | null; longitude: number | null }> {
  try {
    const res = await fetch(
      `/api/geocode?q=${encodeURIComponent(locationText)}`
    );
    if (!res.ok) {
      return { latitude: null, longitude: null };
    }
    const data = (await res.json()) as {
      latitude?: number | null;
      longitude?: number | null;
    };
    return {
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
    };
  } catch {
    return { latitude: null, longitude: null };
  }
}

function CreateActivityPageContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    date: "",
    time: "",
    maxPeople: "8",
    category: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [mapPinned, setMapPinned] = useState<MapPinnedLocation | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!categoryParam) return;
    const valid = CATEGORIES.some((c) => c.value === categoryParam);
    if (valid) {
      setFormData((prev) => ({ ...prev, category: categoryParam }));
    }
  }, [categoryParam]);

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        const next = `/create-activity${window.location.search}`;
        await signInWithGoogleNext(next);
        return;
      }

      const { profile, error: profileError } = await fetchUserProfile(user.id);

      if (profileError) {

        setError("Could not verify your profile. Try again or check Supabase RLS.");
        setLoading(false);
        return;
      }

      if (!isProfileComplete(profile)) {
        const next = safeNextPath(
          `/create-activity${window.location.search}`,
          "/create-activity"
        );
        router.push(`/onboarding?next=${encodeURIComponent(next)}`);
        return;
      }

      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "location") {
      setMapPinned(null);
    }
    setError("");
  };

  const handleMapConfirm = (result: MapLocationConfirmPayload) => {
    setMapPinned({
      latitude: result.latitude,
      longitude: result.longitude,
      primaryLine: result.primaryLine,
      secondaryLine: result.secondaryLine,
    });
    setFormData((prev) => ({
      ...prev,
      location: result.locationText,
    }));
    setError("");
  };

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

 
    if (!formData.title.trim()) {
      setError("Please add an activity title");
      return;
    }
    if (!formData.description.trim()) {
      setError("Please add a description");
      return;
    }
    if (!formData.location.trim()) {
      setError("Please add a location");
      return;
    }
    if (!formData.date) {
      setError("Please select a date");
      return;
    }
    if (!formData.time) {
      setError("Please select a time");
      return;
    }
    if (!formData.category) {
      setError("Please select a category");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      const locationText = formData.location.trim();
      let latitude: number | null = null;
      let longitude: number | null = null;

      if (mapPinned) {
        latitude = mapPinned.latitude;
        longitude = mapPinned.longitude;
      } else {
        const geocoded = await geocodeLocation(locationText);
        latitude = geocoded.latitude;
        longitude = geocoded.longitude;
      }

      const payload: ActivityInsert = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        city: locationText,
        activity_date: `${formData.date}T${formData.time}:00`,
        max_people: parseInt(formData.maxPeople, 10),
        category: formData.category,
        user_id: user.id,
        latitude,
        longitude,
      };

      const { error: dbError } = await supabase.from("activities").insert(payload);

      if (dbError) {
        
        setError("Failed to create activity. Try again.");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/feed");
      }, 1500);
    } catch (err) {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <PageLoadingScreen label="Loading…" />;
  }

  if (success) {
    return (
      <AppShell title="Create activity">
        <div className="max-w-xl border-hairline bg-surface py-16 text-center">
          <h2 className="font-display text-xl text-ink">Plan created</h2>
          <p className="type-body-sm mt-2">Redirecting…</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      headerAlign="center"
      title="Create activity"
      subtitle="Post something for others to join"
    >
      <div className="mx-auto max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Field label="Plan title" htmlFor="title" required>
            <Input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              autoFocus
            />
          </Field>

          <Field label="Description" htmlFor="description" required>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="What's the plan?"
              rows={3}
            />
          </Field>

          <Field
            label="Location"
            htmlFor="location"
            required
            hint="Landmark or area — exact address shared after confirmation"
          >
            <Input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
            />
            <Button
              type="button"
              variant="ghost"
              fullWidth
              showArrow={false}
              className="mt-2"
              onClick={() => setMapPickerOpen(true)}
            >
              Select on map
            </Button>
            {mapPinned ? (
              <div className="mt-3 border-hairline bg-highlight/30 px-4 py-3 text-sm text-ink">
                <p className="font-medium">Selected location</p>
                <p className="mt-1 font-semibold">{mapPinned.primaryLine}</p>
                <p className="text-muted">{mapPinned.secondaryLine}</p>
              </div>
            ) : null}
          </Field>

          <MapLocationPicker
            open={mapPickerOpen}
            onClose={() => setMapPickerOpen(false)}
            onConfirm={handleMapConfirm}
          />

          <div className="grid grid-cols-2 gap-4">
            <Field label="Date" htmlFor="date" required>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
              />
            </Field>
            <Field label="Time" htmlFor="time" required>
              <Input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleChange}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Max people" htmlFor="maxPeople">
              <Select
                id="maxPeople"
                name="maxPeople"
                value={formData.maxPeople}
                onChange={handleChange}
              >
                {[2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20].map((num) => (
                  <option key={num} value={num}>
                    {num} people
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Category" htmlFor="category" required>
              <Select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
              >
                <option value="">Select</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <FormError message={error} />

          <Button type="submit" fullWidth loading={submitting} disabled={submitting}>
            {submitting ? "Creating…" : "Create plan"}
          </Button>

          <p className="text-center text-xs text-muted">* Required fields</p>
        </form>
      </div>
    </AppShell>
  );
}

export default function CreateActivityPage() {
  return (
    <Suspense fallback={<PageLoadingScreen />}>
      <CreateActivityPageContent />
    </Suspense>
  );
}
