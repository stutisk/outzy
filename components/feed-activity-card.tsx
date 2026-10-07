"use client";

import { ArrowUpRight, Clock, MapPin, Navigation, Users } from "lucide-react";
import { getCategoryLabel } from "@/lib/categories";
import { getCategoryVisual } from "@/lib/category-visual";

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
    month: d.toLocaleDateString("en-US", { month: "short" }),
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

const STATUS = "rounded-full py-2.5 text-center text-sm font-semibold";

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
  const { emoji, gradientSoft, gradientAccent } = getCategoryVisual(
    activity.category
  );
  const hostUsername = activity.host?.username;
  const hostInitial = hostUsername?.charAt(0).toUpperCase() ?? "?";
  const badge = !upcoming
    ? "Ended"
    : isToday(activity.activity_date)
      ? "Today"
      : isNewActivity(activity.created_at)
        ? "New"
        : null;

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-14px_rgba(0,0,0,0.22)] ring-1 ring-stone-900/5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_44px_-18px_rgba(0,0,0,0.32)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
        upcoming ? "" : "opacity-85"
      }`}
    >
      {/* Category cover with title overlay */}
      <div className="relative h-44 overflow-hidden sm:h-48">
        <div
          aria-hidden
          className={`landing-mesh flex size-full items-center justify-center bg-linear-to-br ${gradientSoft} ${
            upcoming ? "" : "grayscale opacity-80"
          }`}
        >
          <span className="text-5xl opacity-90 select-none sm:text-6xl">
            {emoji}
          </span>
        </div>
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-black/80 via-black/15 to-transparent"
        />
        <div
          aria-hidden
          className={`absolute inset-x-0 top-0 h-1.5 bg-linear-to-r ${gradientAccent}`}
        />

        <span className="absolute left-3.5 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 py-1 pl-2.5 pr-3 text-xs font-bold text-stone-800 shadow-sm backdrop-blur">
          <span
            aria-hidden
            className={`size-2.5 rounded-full bg-linear-to-br ${gradientAccent}`}
          />
          {getCategoryLabel(activity.category)}
        </span>

        {badge && (
          <span
            className={`absolute right-3.5 top-4 rounded-full px-3 py-1 text-xs font-bold shadow-sm ${
              badge === "Today"
                ? "bg-navy text-white"
                : badge === "New"
                  ? "bg-coral text-white"
                  : "bg-black/60 text-white backdrop-blur"
            }`}
          >
            {badge}
          </span>
        )}

        {/* Title + subtitle on one line */}
        <h3 className="absolute inset-x-4 bottom-3.5 truncate leading-snug tracking-tight text-white [text-shadow:0_1px_10px_rgba(0,0,0,0.5)]">
          <span className="text-xl font-extrabold">{activity.title}</span>
          {activity.description ? (
            <span className="ml-2 text-sm font-medium text-white/80">
              {activity.description}
            </span>
          ) : null}
        </h3>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 p-4 sm:p-5">
        {/* Time, day, distance and host */}
        <div className="flex items-center gap-3.5">
          <div
            className={`flex w-14 shrink-0 flex-col items-center justify-center self-stretch rounded-xl py-2 ring-1 ring-stone-200 ${
              upcoming ? "" : "grayscale"
            }`}
          >
            <span className="text-xs font-bold leading-none text-coral">
              {month}
            </span>
            <span className="mt-1 text-[28px] font-extrabold leading-none tabular-nums text-navy">
              {day}
            </span>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="inline-flex items-center gap-1.5 text-base font-extrabold text-navy">
                <Clock className="size-4 text-stone-400" aria-hidden />
                {weekday}, {time}
              </span>
              {distanceLabel && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-500">
                  <Navigation className="size-3 text-stone-400" aria-hidden />
                  {distanceLabel}
                </span>
              )}
            </div>

            {showHost && (
              <button
                type="button"
                onClick={onHostClick}
                className="flex w-fit max-w-full items-center gap-2 rounded-full text-xs text-stone-500 transition-colors hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
              >
                <span className="flex size-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-coral to-coral-hover text-[10px] font-bold text-white">
                  {activity.host?.avatar_url ? (
                    <img
                      src={activity.host.avatar_url}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    hostInitial
                  )}
                </span>
                <span className="truncate">
                  {hostUsername ? (
                    <>
                      Hosted by{" "}
                      <span className="font-semibold text-stone-700">
                        @{hostUsername}
                      </span>
                    </>
                  ) : (
                    "View host profile"
                  )}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Location (opens map in new tab) + capacity */}
        <div className="flex items-center justify-between gap-3">
          <a
            href={mapsUrl(activity.city)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${activity.city} in maps (opens in a new tab)`}
            className="group/loc inline-flex min-w-0 items-center gap-1.5 text-sm font-semibold text-navy transition-colors hover:text-coral focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
          >
            <MapPin className="size-4 shrink-0 text-coral" aria-hidden />
            <span className="truncate">{activity.city}</span>
            <ArrowUpRight
              className="size-3.5 shrink-0 opacity-50 transition-opacity group-hover/loc:opacity-100"
              aria-hidden
            />
          </a>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-stone-500">
            <Users className="size-3.5 shrink-0 text-stone-400" aria-hidden />
            Up to {activity.max_people}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-auto border-t border-stone-100 pt-4">
          {readOnly ? (
            <p className={`${STATUS} bg-stone-50 text-stone-500`}>
              {!upcoming ? "Ended" : mode === "mine" ? "Your plan" : "Upcoming"}
            </p>
          ) : mode === "others" ? (
            !upcoming ? (
              <p className={`${STATUS} bg-stone-50 text-stone-500`}>Ended</p>
            ) : joinStatus === "pending" ? (
              <p
                className={`${STATUS} bg-amber-50 text-amber-800 ring-1 ring-amber-200`}
              >
                Request sent — waiting on host
              </p>
            ) : joinStatus === "accepted" ? (
              <button
                type="button"
                onClick={() => onOpenChat?.()}
                className="w-full rounded-full bg-teal-600 py-3 text-sm font-bold text-white shadow-lg shadow-teal-900/15 transition hover:brightness-105 active:scale-[0.98]"
              >
                Open chat
              </button>
            ) : joinStatus === "rejected" ? (
              <p className={`${STATUS} bg-stone-50 text-stone-500`}>
                Request declined
              </p>
            ) : (
              <button
                type="button"
                onClick={onJoin}
                className="w-full rounded-full bg-linear-to-r from-coral to-teal-600 py-3 text-sm font-bold text-white shadow-lg shadow-teal-900/20 transition hover:brightness-105 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
              >
                Message host
              </button>
            )
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onRequests}
                className="relative flex-1 rounded-full bg-coral py-3 text-sm font-bold text-white shadow-lg shadow-coral/30 transition hover:brightness-105 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
              >
                Requests
                {pendingRequestCount > 0 && (
                  <span className="absolute -right-1 -top-2 flex min-w-5 items-center justify-center rounded-full bg-navy px-1.5 py-0.5 text-[11px] font-bold text-white ring-2 ring-white">
                    {pendingRequestCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={onEdit}
                className="rounded-full bg-stone-100 px-5 py-3 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral"
              >
                Edit
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}