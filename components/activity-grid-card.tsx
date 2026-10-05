"use client";

import {
  FeedActivityCard,
  type FeedActivityCardData,
  type JoinRequestStatus,
} from "@/components/feed-activity-card";

export type { FeedActivityCardData as ActivityGridCardActivity };

export interface ActivityGridCardProps {
  id: string;
  user_id: string;
  title: string;
  description: string;
  city: string;
  activity_date: string;
  max_people: number;
  category: string;
  created_at: string;
  upcoming: boolean;
  showHost?: boolean;
  host?: FeedActivityCardData["host"];
  distanceLabel?: string | null;
  joinStatus?: JoinRequestStatus;
  pendingRequestCount?: number;
  readOnly?: boolean;
  mode: "others" | "mine";
  onJoin: () => void;
  onHostClick: () => void;
  onRequests: () => void;
  onEdit: () => void;
  onOpenChat?: () => void;
}

/** @deprecated Prefer FeedActivityCard / ActivityCard directly */
export function ActivityGridCard({
  id,
  user_id,
  title,
  description,
  city,
  activity_date,
  max_people,
  category,
  created_at,
  upcoming,
  showHost = false,
  host,
  distanceLabel = null,
  joinStatus,
  pendingRequestCount,
  readOnly,
  mode,
  onJoin,
  onHostClick,
  onRequests,
  onEdit,
  onOpenChat,
}: ActivityGridCardProps) {
  const activity: FeedActivityCardData = {
    id,
    user_id,
    title,
    description,
    city,
    activity_date,
    max_people,
    category,
    created_at,
    host,
  };

  return (
    <FeedActivityCard
      activity={activity}
      upcoming={upcoming}
      showHost={showHost}
      distanceLabel={distanceLabel}
      joinStatus={joinStatus}
      pendingRequestCount={pendingRequestCount}
      readOnly={readOnly}
      mode={mode}
      onJoin={onJoin}
      onHostClick={onHostClick}
      onRequests={onRequests}
      onEdit={onEdit}
      onOpenChat={onOpenChat}
    />
  );
}
