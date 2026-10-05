"use client";

import dynamic from "next/dynamic";
import { Suspense, useState, useEffect, type SubmitEventHandler } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Spinner } from "@/components/spinner";
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
        console.error("Could not load profile:", profileError.message);
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

    // Validation
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
        console.error("DB Error:", dbError);
        setError("Failed to create activity. Try again.");
        setSubmitting(false);
        return;
      }

      setSuccess(true);
      // Redirect after short delay
      setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err) {
      console.error("Error:", err);
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50">
        <Spinner />
      </main>
    );
  }

  if (success) {
    return (
      <AppShell title="Create activity">
        <div className="max-w-xl py-16 text-center">
          <h2 className="text-lg font-semibold text-stone-900">
            Activity created
          </h2>
          <p className="mt-1 text-sm text-stone-500">Redirecting…</p>
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
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-semibold text-slate-900 mb-2"
            >
              Activity Title *
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              // placeholder="e.g., "
              className="w-full border-2 border-slate-200 p-4 rounded-2xl focus:outline-none focus:border-coral focus:ring-4 focus:ring-coral-100/50 transition-all placeholder:text-slate-400 text-black"
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-semibold text-slate-900 mb-2"
            >
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Yoo brooo? What's the plan?"
              rows={3}
              className="w-full border-2 border-slate-200 p-4 rounded-2xl focus:outline-none focus:border-coral focus:ring-4 focus:ring-coral-100/50 transition-all resize-none"
            />
          </div>

          {/* Location */}
          <div>
            <label
              htmlFor="location"
              className="block text-sm font-semibold text-slate-900 mb-2"
            >
              Location *
            </label>
            <input
              id="location"
              name="location"
              type="text"
              value={formData.location}
              onChange={handleChange}
              // placeholder="e.g., Twin Peaks, San Francisco"
              className="w-full border-2 border-slate-200 p-4 rounded-2xl focus:outline-none focus:border-coral focus:ring-4 focus:ring-coral-100/50 transition-all"
            />
            <button
              type="button"
              onClick={() => setMapPickerOpen(true)}
              className="mt-2 w-full rounded-full border border-stone-200 bg-white py-2.5 text-sm font-medium text-coral transition-colors hover:border-coral-100 hover:bg-coral-50"
            >
              Select on map
            </button>
            {mapPinned && (
              <div
                className="mt-3 rounded-2xl border border-coral-100 bg-coral-50 px-4 py-3 text-sm text-navy"
              >
                <p className="font-medium">📍 Selected location</p>
                <p className="mt-1 font-semibold">{mapPinned.primaryLine}</p>
                <p className="text-stone-600">{mapPinned.secondaryLine}</p>
              </div>
            )}
            <p className="text-xs text-slate-500 mt-1">
              Type a landmark or use the map — exact address shared after
              confirmation
            </p>
          </div>

          <MapLocationPicker
            open={mapPickerOpen}
            onClose={() => setMapPickerOpen(false)}
            onConfirm={handleMapConfirm}
          />

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="date"
                className="block text-sm font-semibold text-slate-900 mb-2"
              >
                Date *
              </label>
              <input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full border-2 border-slate-200 p-4 rounded-2xl focus:outline-none focus:border-coral focus:ring-4 focus:ring-coral-100/50 transition-all"
              />
            </div>
            <div>
              <label
                htmlFor="time"
                className="block text-sm font-semibold text-slate-900 mb-2"
              >
                Time *
              </label>
              <input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleChange}
                className="w-full border-2 border-slate-200 p-4 rounded-2xl focus:outline-none focus:border-coral focus:ring-4 focus:ring-coral-100/50 transition-all"
              />
            </div>
          </div>

          {/* Max People & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="maxPeople"
                className="block text-sm font-semibold text-slate-900 mb-2"
              >
                Max People
              </label>
              <select
                id="maxPeople"
                name="maxPeople"
                value={formData.maxPeople}
                onChange={handleChange}
                className="w-full border-2 border-slate-200 p-4 rounded-2xl focus:outline-none focus:border-coral focus:ring-4 focus:ring-coral-100/50 transition-all bg-white"
              >
                {[2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 20].map((num) => (
                  <option key={num} value={num}>
                    {num} people
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-semibold text-slate-900 mb-2"
              >
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full border-2 border-slate-200 p-4 rounded-2xl focus:outline-none focus:border-coral focus:ring-4 focus:ring-coral-100/50 transition-all bg-white"
              >
                <option value="">Select</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-600 px-4 py-3 rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-coral py-4 text-lg font-semibold text-white transition-colors hover:bg-coral-hover disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                Create Activity
                <span>→</span>
              </>
            )}
          </button>

          <p className="text-center text-slate-400 text-xs">
            * Required fields
          </p>
        </form>
      </div>
    </AppShell>
  );
}

export default function CreateActivityPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-stone-50">
          <Spinner />
        </main>
      }
    >
      <CreateActivityPageContent />
    </Suspense>
  );
}
