"use client";

import { ArrowUpRight, Clock, MapPin, Navigation, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getCategoryLabel } from "@/lib/categories";
import { cn } from "@/lib/cn";

export type FeedActivityCardData = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  city: string;
  activity_date: string;
  max_people: number;
  category: string;
  created_at: string;
  host?: {
    id: string;
    username: string;
    avatar_url?: string | null;
  };
};

function formatCardDate(dateStr: string) {
  const d = new Date(dateStr);
  return {
    month: d.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
    day: d.getDate(),
    weekday: d.toLocaleDateString("en-US", { weekday: "short" }),
    time: d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

function isToday(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isNewActivity(createdAt: string) {
  const created = new Date(createdAt).getTime();
  return Date.now() - created < 3 * 24 * 60 * 60 * 1000;
}

function mapsUrl(city: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(city)}`;
}

export type JoinRequestStatus = "none" | "pending" | "accepted" | "rejected";

export function FeedActivityCard({
  activity,
  upcoming,
  showHost,
  distanceLabel,
  joinStatus = "none",
  pendingRequestCount = 0,
  onJoin,
  onHostClick,
  onRequests,
  onEdit,
  onOpenChat,
  mode,
  readOnly = false,
}: {
  activity: FeedActivityCardData;
  upcoming: boolean;
  showHost: boolean;
  distanceLabel: string | null;
  joinStatus?: JoinRequestStatus;
  pendingRequestCount?: number;
  onJoin: () => void;
  onHostClick: () => void;
  onRequests: () => void;
  onEdit: () => void;
  onOpenChat?: () => void | Promise<void>;
  mode: "others" | "mine";
  readOnly?: boolean;
}) {
  const { month, day, weekday, time } = formatCardDate(activity.activity_date);
  const hostUsername = activity.host?.username;
  const badge = !upcoming
    ? "Ended"
    : isToday(activity.activity_date)
      ? "Today"
      : isNewActivity(activity.created_at)
        ? "New"
        : null;

  return (
    <article
      className={cn(
        "flex h-full flex-col border-hairline bg-surface",
        !upcoming && "opacity-80",
      )}
    >
      <div className="border-hairline-b px-4 py-3 sm:px-5">
        <div className="flex items-center justify-between gap-2">
          <span className="type-eyebrow text-accent">
            {getCategoryLabel(activity.category)}
          </span>
          {badge ? (
            <span
              className={cn(
                "text-[0.65rem] font-medium uppercase tracking-widest",
                badge === "Today" ? "text-ink" : "text-muted",
              )}
            >
              {badge}
            </span>
          ) : null}
        </div>
        <h3 className="mt-2 font-display text-xl leading-tight text-ink">
          {activity.title}
        </h3>
        {activity.description ? (
          <p className="mt-1 line-clamp-2 text-sm text-muted">
            {activity.description}
          </p>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        <div className="flex items-stretch gap-4">
          <div
            className={cn(
              "flex w-14 shrink-0 flex-col items-center justify-center border-hairline bg-background py-2",
              !upcoming && "grayscale",
            )}
          >
            <span className="text-[0.65rem] font-medium text-accent">
              {month}
            </span>
            <span className="text-2xl font-medium tabular-nums leading-none text-ink">
              {day}
            </span>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink">
              <Clock className="size-4 text-muted" aria-hidden />
              {weekday}, {time}
            </span>
            {distanceLabel ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted">
                <Navigation className="size-3" aria-hidden />
                {distanceLabel}
              </span>
            ) : null}
            {showHost ? (
              <button
                type="button"
                onClick={onHostClick}
                className="flex w-fit max-w-full items-center gap-2 text-left text-xs text-muted hover:text-ink"
              >
                <Avatar
                  src={activity.host?.avatar_url}
                  name={hostUsername}
                  size="sm"
                  className="!size-6 text-[10px]"
                />
                <span className="truncate">
                  {hostUsername ? `@${hostUsername}` : "View host"}
                </span>
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 text-sm">
          <a
            href={mapsUrl(activity.city)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-w-0 items-center gap-1.5 font-medium text-ink hover:text-accent"
          >
            <MapPin className="size-4 shrink-0 text-accent" aria-hidden />
            <span className="truncate">{activity.city}</span>
            <ArrowUpRight className="size-3.5 shrink-0 opacity-60" aria-hidden />
          </a>
          <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted">
            <Users className="size-3.5" aria-hidden />
            Up to {activity.max_people}
          </span>
        </div>

        <div className="mt-auto border-hairline-t pt-4">
          {readOnly ? (
            <p className="ui-status-pill">
              {!upcoming ? "Ended" : mode === "mine" ? "Your plan" : "Upcoming"}
            </p>
          ) : mode === "others" ? (
            !upcoming ? (
              <p className="ui-status-pill">Ended</p>
            ) : joinStatus === "pending" ? (
              <p className="ui-status-pill ui-status-pill--highlight">
                Request sent — waiting on host
              </p>
            ) : joinStatus === "accepted" ? (
              <Button fullWidth showArrow={false} onClick={() => onOpenChat?.()}>
                Open chat
              </Button>
            ) : joinStatus === "rejected" ? (
              <p className="ui-status-pill">Request declined</p>
            ) : (
              <Button fullWidth showArrow={false} onClick={onJoin}>
                Message host
              </Button>
            )
          ) : (
            <div className="flex gap-2">
              <Button
                fullWidth
                showArrow={false}
                onClick={onRequests}
                className="relative"
              >
                Requests
                {pendingRequestCount > 0 ? (
                  <span className="absolute -right-1 -top-2 bg-highlight px-1.5 text-[10px] font-bold text-ink">
                    {pendingRequestCount}
                  </span>
                ) : null}
              </Button>
              <Button variant="ghost" showArrow={false} onClick={onEdit}>
                Edit
              </Button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
