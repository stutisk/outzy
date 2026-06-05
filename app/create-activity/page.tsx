"use client";

import { useState, useEffect, type SubmitEventHandler } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const CATEGORIES = [
  { value: "hiking", label: "🏔️ Hiking" },
  { value: "coffee", label: "☕ Coffee" },
  { value: "cycling", label: "🚴 Cycling" },
  { value: "beaches", label: "🌊 Beaches" },
  { value: "food", label: "🍜 Food Tours" },
  { value: "photography", label: "📸 Photography" },
  { value: "art", label: "🎨 Art & Culture" },
  { value: "dance", label: "💃 Music & Dance" },
  { value: "running", label: "🏃 Running" },
  { value: "gaming", label: "🎮 Gaming" },
  { value: "yoga", label: "🧘 Yoga" },
  { value: "nightlife", label: "🥂 Nightlife" },
];

export default function CreateActivityPage() {
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
  const router = useRouter();

  // Check auth
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

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

      // Create activity
      const { error: dbError } = await supabase.from("activities").insert({
        title: formData.title.trim(),
        description: formData.description.trim(),
        city: formData.location.trim(),
       activity_date: `${formData.date}T${formData.time}:00`,
        max_people: parseInt(formData.maxPeople),
        category: formData.category,
        user_id: user.id,
      });

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
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 relative">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent animate-spin"></div>
          </div>
          <p className="text-slate-500 font-medium">Loading...</p>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-4xl">
            ✅
          </div>
          <h2 className="text-2xl font-bold text-slate-900">
            Activity Created!
          </h2>
          <p className="text-slate-600">Redirecting you home...</p>
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
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="font-medium">Back</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-linear-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg">
              O
            </div>
            <span className="text-lg font-bold text-slate-900">Outzy</span>
          </div>

          <div className="w-16"></div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-xl mx-auto px-6 pt-12 pb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-blue-400 to-indigo-400 text-3xl shadow-lg mb-4">
          ✨
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">
          Create an Activity
        </h1>
        <p className="text-slate-600">
          Bring people together through shared experiences
        </p>
      </div>

      {/* Form - Matching Onboarding Style */}
      <div className="max-w-xl mx-auto px-6 pb-12">
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
              placeholder="e.g., Sunrise Hike at Twin Peaks"
              className="w-full border-2 border-slate-200 p-4 rounded-2xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 transition-all placeholder:text-slate-400 text-black"
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
              placeholder="What can people expect? What's the plan?"
              rows={3}
              className="w-full border-2 border-slate-200 p-4 rounded-2xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 transition-all resize-none"
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
              placeholder="e.g., Twin Peaks, San Francisco"
              className="w-full border-2 border-slate-200 p-4 rounded-2xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 transition-all"
            />
            <p className="text-xs text-slate-500 mt-1">
              Enter a landmark - exact address shared after confirmation
            </p>
          </div>

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
                className="w-full border-2 border-slate-200 p-4 rounded-2xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 transition-all"
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
                className="w-full border-2 border-slate-200 p-4 rounded-2xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 transition-all"
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
                className="w-full border-2 border-slate-200 p-4 rounded-2xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 transition-all bg-white"
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
                className="w-full border-2 border-slate-200 p-4 rounded-2xl focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 transition-all bg-white"
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
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg py-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
    </main>
  );
}
