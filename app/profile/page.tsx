"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ActivityCard } from "@/components/activity-card";
import { Spinner } from "@/components/spinner";
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

interface ProfileActivity {
  id: string;
  title: string;
  description: string;
  activity_date: string;
  category: string;
  city: string;
  max_people: number;
  user_id: string;
  created_at: string;
}

function isUpcoming(dateStr: string) {
  return new Date(dateStr) > new Date();
}

function formatMemberSince(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ProfileContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activities, setActivities] = useState<ProfileActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingOwn, setViewingOwn] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/");
        return;
      }

      const targetUserId = userId || user.id;
      const isOwn = userId === null || userId === user.id;
      setViewingOwn(isOwn);

      const { data: profileData } = await supabase
        .from("users")
        .select("*")
        .eq("id", targetUserId)
        .maybeSingle();

      if (profileData) {
        setProfile(profileData);

        const { data: activitiesData } = await supabase
          .from("activities")
          .select(
            "id, title, description, activity_date, category, city, max_people, user_id, created_at"
          )
          .eq("user_id", targetUserId)
          .order("activity_date", { ascending: false });

        setActivities(activitiesData || []);
      }
      setLoading(false);
    };

    fetchData();
  }, [router, userId]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#faf9f7]">
        <Spinner label="Loading profile…" />
      </main>
    );
  }

  if (!profile) {
    return (
      <AppShell title="Profile">
        <div className="py-16 text-center">
          <h2 className="text-lg font-semibold text-stone-900">
            Profile not found
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            This user doesn&apos;t exist.
          </p>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-6 rounded-full bg-coral px-5 py-2.5 text-sm font-bold text-white hover:bg-coral-hover"
          >
            Go home
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={viewingOwn ? "Your profile" : `@${profile.username}`}
      subtitle={profile.city || undefined}
    >
      <div className="mx-auto max-w-6xl space-y-8">
        <div
          className="rounded-3xl border border-stone-200/90 bg-white p-6 shadow-sm sm:p-8"
        >
          <div className="flex flex-col items-center text-center">
            <div
              className="flex size-28 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-coral to-coral-hover text-5xl font-bold text-white shadow-md"
            >
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                profile.username?.charAt(0).toUpperCase()
              )}
            </div>

            <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-navy">
              @{profile.username}
            </h1>

            {profile.city && (
              <p className="mt-1 flex items-center gap-1 text-sm font-medium text-stone-600">
                <span aria-hidden>📍</span>
                {profile.city}
              </p>
            )}

            {profile.bio && (
              <p className="mt-3 max-w-md text-sm leading-relaxed text-stone-600">
                {profile.bio}
              </p>
            )}

            <p className="mt-3 text-xs text-stone-400">
              Member since {formatMemberSince(profile.created_at)}
            </p>
          </div>

          {profile.interests && profile.interests.length > 0 && (
            <div className="mt-6 border-t border-stone-100 pt-6">
              <h2 className="text-center text-xs font-bold uppercase tracking-wide text-stone-500">
                Interests
              </h2>
              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {profile.interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="rounded-full bg-coral-50 px-4 py-2 text-sm font-semibold text-coral"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-extrabold text-navy">
            {viewingOwn ? "Your plans" : `Plans by @${profile.username}`}
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Same cards as the feed — upcoming and past activities.
          </p>

          {activities.length === 0 ? (
            <div
              className="mt-6 rounded-3xl border border-dashed border-stone-200 bg-stone-50/80 px-6 py-12 text-center"
            >
              <p className="text-3xl" aria-hidden>📭</p>
              <p className="mt-2 font-semibold text-stone-800">
                {viewingOwn ? "No plans yet" : "No public plans yet"}
              </p>
              {viewingOwn && (
                <button
                  type="button"
                  onClick={() => router.push("/create-activity")}
                  className="mt-4 rounded-full bg-coral px-6 py-2.5 text-sm font-bold text-white hover:bg-coral-hover"
                >
                  Plan something
                </button>
              )}
            </div>
          ) : (
            <div
              className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {activities.map((activity) => {
                const upcoming = isUpcoming(activity.activity_date);
                return (
                  <ActivityCard
                    key={activity.id}
                    activity={{
                      ...activity,
                      host: viewingOwn
                        ? undefined
                        : {
                            id: profile.id,
                            username: profile.username,
                            avatar_url: profile.avatar_url,
                          },
                    }}
                    upcoming={upcoming}
                    showHost={!viewingOwn}
                    distanceLabel={null}
                    readOnly={!viewingOwn}
                    mode="mine"
                    onJoin={() => router.push("/feed")}
                    onHostClick={() =>
                      router.push(`/profile?userId=${profile.id}`)
                    }
                    onRequests={() => router.push("/feed")}
                    onEdit={() => router.push(`/activity/${activity.id}`)}
                    onOpenChat={undefined}
                  />
                );
              })}
            </div>
          )}
        </div>

        {!viewingOwn && (
          <button
            type="button"
            onClick={() => router.push("/feed")}
            className="w-full rounded-full border border-stone-200 bg-white py-3 text-sm font-bold text-stone-800 shadow-sm hover:border-coral-100 hover:text-coral"
          >
            Back to feed
          </button>
        )}
      </div>
    </AppShell>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#faf9f7]">
          <Spinner />
        </main>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
