"use client";

import { useState, useEffect, type SubmitEventHandler } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function OnboardingPage() {
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
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError(" ");
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

      // Check if user exists in users table
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .single();

      // Insert or update user
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
        console.error("DB Error:", dbError);
        setError("Failed to save. Try again.");
        setSubmitting(false);
        return;
      }

      // Success
      router.push("/");
    } catch (err) {
      console.error("Error:", err);
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 relative">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent animate-spin"></div>
          </div>
          <p className="text-slate-500 font-medium">Setting up...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-150 h-150 bg-blue-100/60 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-125 h-125 bg-sky-50 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
              O
            </div>
            <span className="text-xl font-bold text-slate-900">Outzy</span>
          </div>
        </div>
      </nav>

     
      <div className="max-w-xl mx-auto px-6 py-12">
  
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-3 h-3 bg-blue-600 rounded-full" />
          <div className="w-8 h-1 bg-blue-300 rounded-full" />
          <div className="w-3 h-3 bg-blue-600 rounded-full" />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-blue-400 to-indigo-400 text-3xl shadow-lg mb-4">
            👋
          </div>
          <h1 className="text-3xl font-black text-slate-900">
            Set up your profile
          </h1>
          <p className="text-slate-600 mt-2">
            Help others get to know you
          </p>
        </div>

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
              className="w-full border-2 border-slate-200 p-4 rounded-2xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 transition-all"
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
              className="w-full border-2 border-slate-200 p-4 rounded-2xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 transition-all resize-none"
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
              className="w-full border-2 border-slate-200 p-4 rounded-2xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 transition-all"
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
              placeholder="San Francisco"
              className="w-full border-2 border-slate-200 p-4 rounded-2xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 transition-all"
            />
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
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg py-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
    </main>
  );
}