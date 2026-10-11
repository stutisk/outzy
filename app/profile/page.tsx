"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ActivityCard } from "@/components/activity-card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  EmptyState,
  PageLoadingScreen,
} from "@/components/ui/page-state";
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
    return <PageLoadingScreen label="Loading profile…" />;
  }

  if (!profile) {
    return (
      <AppShell title="Profile">
        <EmptyState
          title="Profile not found"
          description="This user may not exist or you may not have access."
          actionLabel="Back to feed"
          onAction={() => router.push("/feed")}
        />
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
            <Button
              variant="ghost"
              showArrow={false}
              onClick={() => router.push("/onboarding?edit=1&next=/profile")}
            >
              Edit
            </Button>
            <Button
              showArrow={false}
              onClick={() => router.push("/create-activity")}
            >
              Create plan
            </Button>
          </div>
        ) : (
          <Button variant="secondary" showArrow={false} onClick={() => router.push("/feed")}>
            Feed
          </Button>
        )
      }
    >
      <div className="space-y-8">
        <div className="flex flex-col items-center gap-4 border-hairline-b bg-surface p-6 text-center sm:flex-row sm:items-start sm:text-left">
          <Avatar
            src={profile.avatar_url}
            name={displayName}
            size="lg"
          />
          <div className="min-w-0">
            <p className="font-display text-2xl text-ink">@{displayName}</p>
            {profile.bio ? (
              <p className="type-body-sm mt-2 max-w-lg">{profile.bio}</p>
            ) : null}
            {profile.interests?.length > 0 ? (
              <p className="mt-3 text-sm text-muted">
                {profile.interests.join(" · ")}
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <h2 className="type-page-title text-xl">
            {viewingOwn ? "Your plans" : "Plans"}
          </h2>

          {activities.length === 0 ? (
            <EmptyState
              className="mt-6"
              title={viewingOwn ? "No plans yet" : "Nothing posted"}
              description={
                viewingOwn
                  ? "Create a plan and invite people from Discover."
                  : "This host hasn't posted a plan yet."
              }
              actionLabel={viewingOwn ? "Create plan" : undefined}
              onAction={viewingOwn ? () => router.push("/create-activity") : undefined}
            />
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
    <Suspense fallback={<PageLoadingScreen label="Loading profile…" />}>
      <ProfileContent />
    </Suspense>
  );
}
