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
        <p className="py-16 text-center text-sm text-stone-500">
          Profile not found.
        </p>
      </AppShell>
    );
  }

  const displayName = profile.username?.trim() || "user";

  return (
    <AppShell
      title={viewingOwn ? "Your profile" : `@${displayName}`}
      subtitle={profile.city || undefined}
      action={
        viewingOwn ? (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => router.push("/onboarding?edit=1&next=/profile")}
              className="rounded-full px-4 py-2 text-sm font-semibold text-stone-600 hover:text-coral"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => router.push("/create-activity")}
              className="rounded-full bg-coral px-4 py-2 text-sm font-bold text-white hover:bg-coral-hover"
            >
              + Create
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => router.push("/feed")}
            className="rounded-full px-4 py-2 text-sm font-semibold text-stone-600 hover:text-coral"
          >
            Feed
          </button>
        )
      }
    >
      <div className="space-y-8">
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-start sm:text-left">
          <div
            className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-coral to-coral-hover text-2xl font-bold text-white"
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xl font-extrabold text-navy">@{displayName}</p>
            {profile.bio ? (
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-stone-600">
                {profile.bio}
              </p>
            ) : null}
            {profile.interests?.length > 0 ? (
              <p className="mt-3 text-sm text-stone-500">
                {profile.interests.join(" · ")}
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-extrabold text-navy">
            {viewingOwn ? "Your plans" : "Plans"}
          </h2>

          {activities.length === 0 ? (
            <p className="mt-4 text-sm text-stone-500">
              {viewingOwn
                ? "Nothing here yet — create a plan from the feed."
                : "No plans yet."}
            </p>
          ) : (
            <div
              className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
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
