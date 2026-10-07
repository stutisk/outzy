"use client";

import { Suspense, useState, useEffect, type SubmitEventHandler } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Spinner } from "@/components/spinner";
import { safeNextPath } from "@/lib/auth-nav";
import { fetchUserProfile, isProfileComplete } from "@/lib/profile";
import { supabase } from "@/lib/supabase";

function OnboardingPageContent() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    username: "",
    bio: "",
    interests: "",
    city: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

 
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      const { profile, error: profileError } = await fetchUserProfile(user.id);

      if (profileError) {
        console.error("Could not load profile:", profileError.message);
        setError(
          "Could not load your profile. Run the users RLS migrations in Supabase."
        );
        setLoading(false);
        return;
      }

      const editMode = searchParams.get("edit") === "1";

      if (isProfileComplete(profile) && !editMode) {
        router.replace(safeNextPath(searchParams.get("next"), "/feed"));
        return;
      }

      if (profile) {
        setFormData({
          username: profile.username ?? "",
          bio: profile.bio ?? "",
          interests: Array.isArray(profile.interests)
            ? profile.interests.join(", ")
            : "",
          city: profile.city ?? "",
        });
      }

      setLoading(false);
    };

    checkAuth();
  }, [router, searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError("");
  };

  const handleSubmit: SubmitEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();

    if (!formData.username.trim()) {
      setError("Please add a username");
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

      // Convert interests to array
      const interestsArray = formData.interests
        .split(",")
        .map((i) => i.trim())
        .filter(Boolean);

      const { error: dbError } = await supabase.from("users").upsert({
        id: user.id,
        username: formData.username.trim(),
        bio: formData.bio.trim(),
        interests: interestsArray,
        city: formData.city.trim(),
        email: user.email,
        avatar_url: user.user_metadata?.avatar_url,
      }, { onConflict: "id" });

      if (dbError) {
        console.error("Profile save failed:", dbError);
        setError(
          dbError.code === "42501" || dbError.message.includes("policy")
            ? "Save blocked by database permissions. Run supabase/migrations/20260328150000_users_write_own_profile.sql"
            : "Failed to save. Try again."
        );
        setSubmitting(false);
        return;
      }

      router.push(safeNextPath(searchParams.get("next"), "/feed"));
    } catch (err) {
      console.error("Error:", err);
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  const editMode = searchParams.get("edit") === "1";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-50">
        <Spinner label="Setting up…" />
      </main>
    );
  }

  return (
    <AppShell
      headerAlign="center"
      title={editMode ? "Edit profile" : "Set up your profile"}
      subtitle={
        editMode ? "Update how you show up on Outzy" : "Help others get to know you"
      }
    >
      <div className="mx-auto max-w-xl">
        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* Username */}
          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-slate-900 mb-2">
              Username *
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              placeholder="@yourname"
              className="w-full border-2 border-slate-200 p-4 rounded-2xl focus:outline-none focus:border-coral focus:ring-4 focus:ring-coral-100/50 transition-all"
              autoFocus
            />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor=
            "bio" className="block text-sm font-semibold text-slate-900 mb-2">
              About You 
            </label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="What do you love doing? Any hobbies?"
              rows={3}
              className="w-full border-2 border-slate-200 p-4 rounded-2xl focus:outline-none focus:border-coral focus:ring-4 focus:ring-coral-100/50 transition-all resize-none"
            />
          </div>

          {/* Interests */}
          <div>
            <label htmlFor="interests" className="block text-sm font-semibold text-slate-900 mb-2">
              Interests
            </label>
            <input
              id="interests"
              name="interests"
              type="text"
              value={formData.interests}
              onChange={handleChange}
              placeholder="hiking, coffee, photography (comma separated)"
              className="w-full border-2 border-slate-200 p-4 rounded-2xl focus:outline-none focus:border-coral focus:ring-4 focus:ring-coral-100/50 transition-all"
            />
          </div>

          {/* City */}
          <div>
            <label htmlFor="city" className="block text-sm font-semibold text-slate-900 mb-2">
              City
            </label>
            <input
              id="city"
              name="city"
              type="text"
              value={formData.city}
              onChange={handleChange}
              placeholder="Kullu"
              className="w-full border-2 border-slate-200 p-4 rounded-2xl focus:outline-none focus:border-coral focus:ring-4 focus:ring-coral-100/50 transition-all"
            />
          </div>

     

    
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
                Saving...
              </>
            ) : (
              <>
                Continue
                <span>→</span>
              </>
            )}
          </button>

          <p className="text-center text-slate-400 text-xs">
            * Required
          </p>
        </form>
      </div>
    </AppShell>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-stone-50">
          <Spinner label="Setting up…" />
        </main>
      }
    >
      <OnboardingPageContent />
    </Suspense>
  );
}