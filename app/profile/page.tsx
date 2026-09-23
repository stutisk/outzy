"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  id: string;
  username: string;
  bio: string;
  interests: string[];
  city: string;
  email: string;
  avatar_url: string;
  created_at: string;
}

interface Activity {
  id: string;
  title: string;
  activity_date: string;
  category: string;
  city: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  hiking: "🏔️ Hiking",
  coffee: "☕ Coffee",
  cycling: "🚴 Cycling",
  beaches: "🌊 Beaches",
  food: "🍜 Food Tours",
  photography: "📸 Photography",
  art: "🎨 Art & Culture",
  dance: "💃 Music & Dance",
  running: "🏃 Running",
  gaming: "🎮 Gaming",
  yoga: "🧘 Yoga",
  nightlife: "🥂 Nightlife",
};

function ProfileContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [viewingOwn, setViewingOwn] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);

      if (!user) {
        router.push("/");
        return;
      }

      // If userId param exists, view other user's profile
      // Otherwise, view own profile
      const targetUserId = userId || user.id;
      const isOwn = userId === null || userId === user.id;
      setViewingOwn(isOwn);

      // Fetch profile
      const { data: profileData } = await supabase
        .from("users")
        .select("*")
        .eq("id", targetUserId)
        .single();

      if (profileData) {
        setProfile(profileData);

        // Fetch activities created by this user
        const { data: activitiesData } = await supabase
          .from("activities")
          .select("id, title, activity_date, category, city")
          .eq("user_id", targetUserId)
          .order("activity_date", { ascending: false });

        setActivities(activitiesData || []);
      }
      setLoading(false);
    };

    fetchData();
  }, [router, userId]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const isUpcoming = (dateStr: string) => {
    const activityDate = new Date(dateStr);
    return activityDate > new Date();
  };

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 relative">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent animate-spin"></div>
          </div>
          <p className="text-slate-500 font-medium">Loading profile...</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-4xl mb-4">
            😕
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">
            Profile not found
          </h2>
          <p className="text-slate-600 mb-6">This user doesn't exist.</p>
          <button
            onClick={() => router.push("/")}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl"
          >
            Go Home
          </button>
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
        <div className="max-w-2xl mx-auto px-6 py-3 flex justify-between items-center">
          <button
            onClick={() => router.back()}
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

      {/* Profile Header */}
      <div className="max-w-2xl mx-auto px-6 pt-8">
        {/* Avatar */}
        <div className="flex flex-col items-center">
          <div className="w-28 h-28 rounded-full bg-linear-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-5xl font-bold shadow-xl">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              profile.username?.charAt(0).toUpperCase()
            )}
          </div>

          {/* Username */}
          <h1 className="text-2xl font-black text-slate-900 mt-4">
            @{profile.username}
          </h1>

          {/* Location */}
          {profile.city && (
            <div className="flex items-center gap-1 text-slate-600 mt-1">
              <span>📍</span>
              <span className="font-medium">{profile.city}</span>
            </div>
          )}

          {/* Bio */}
          {profile.bio && (
            <p className="text-slate-600 text-center mt-3 max-w-md">
              {profile.bio}
            </p>
          )}

          {/* Member since */}
          <p className="text-slate-400 text-sm mt-3">
            Member since {formatDate(profile.created_at)}
          </p>
        </div>

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">
              Interests
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest, idx) => (
                <span
                  key={idx}
                  className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Activities Section */}
        <div className="mt-8">
          <h2 className="text-lg font-bold text-slate-900 mb-4">
            {viewingOwn ? "My Activities" : `Activities by @${profile.username}`}
          </h2>

          {activities.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl">
              <div className="text-3xl mb-2">📭</div>
              <p className="text-slate-600">
                {viewingOwn
                  ? "No activities yet. Create your first one!"
                  : "No activities yet."}
              </p>
              {viewingOwn && (
                <button
                  onClick={() => router.push("/create-activity")}
                  className="mt-4 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-lg"
                >
                  Create Activity
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className={`bg-white border-2 rounded-xl p-4 ${
                    isUpcoming(activity.activity_date)
                      ? "border-slate-200"
                      : "border-slate-100 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                        {CATEGORY_LABELS[activity.category] || activity.category}
                      </span>
                      <h3 className="font-bold text-slate-900 mt-1">
                        {activity.title}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {formatDate(activity.activity_date)} • {activity.city}
                      </p>
                    </div>
                    {!isUpcoming(activity.activity_date) && (
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                        Past
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!viewingOwn && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => router.push(`/feed?userId=${profile.id}`)}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl"
            >
              View Activities
            </button>
          </div>
        )}
      </div>
    </main>
  );
}

// Wrapper with Suspense for useSearchParams
export default function ProfilePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 relative">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-500 border-r-transparent animate-spin"></div>
          </div>
          <p className="text-slate-500 font-medium">Loading...</p>
        </div>
      </main>
    }>
      <ProfileContent />
    </Suspense>
  );
}