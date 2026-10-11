"use client";

import { Suspense, useState, useEffect, type SubmitEventHandler } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Field, FormError, Input, Textarea } from "@/components/ui/field";
import { PageLoadingScreen } from "@/components/ui/page-state";
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
    return <PageLoadingScreen label="Setting up…" />;
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
        <form onSubmit={handleSubmit} className="space-y-6">
          <Field label="Username" htmlFor="username" required>
            <Input
              id="username"
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              placeholder="@yourname"
              autoFocus
            />
          </Field>

          <Field label="About you" htmlFor="bio">
            <Textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              placeholder="What do you love doing? Any hobbies?"
              rows={3}
            />
          </Field>

          <Field
            label="Interests"
            htmlFor="interests"
            hint="Comma separated"
          >
            <Input
              id="interests"
              name="interests"
              type="text"
              value={formData.interests}
              onChange={handleChange}
              placeholder="hiking, coffee, photography"
            />
          </Field>

          <Field label="City" htmlFor="city">
            <Input
              id="city"
              name="city"
              type="text"
              value={formData.city}
              onChange={handleChange}
              placeholder="Your city"
            />
          </Field>

          <FormError message={error} />

          <Button
            type="submit"
            fullWidth
            loading={submitting}
            disabled={submitting}
          >
            {submitting ? "Saving…" : "Continue"}
          </Button>

          <p className="text-center text-xs text-muted">* Required</p>
        </form>
      </div>
    </AppShell>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<PageLoadingScreen label="Setting up…" />}>
      <OnboardingPageContent />
    </Suspense>
  );
}