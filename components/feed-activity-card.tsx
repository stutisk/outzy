"use client";

import { useState } from "react";
import {
  ArrowUpRight,
  Clock,
  MapPin,
  MoreVertical,
  Navigation,
  Users,
} from "lucide-react";
import { getCategoryImageAlt, getCategoryImageUrl } from "@/lib/category-images";
import { getCategoryLabel } from "@/lib/categories";
import { getCategoryVisual } from "@/lib/category-visual";
import { neighborhoodLandmark } from "@/lib/activity-text";

const DETAILS_TOOLTIP = "Click here to view more details";

export type FeedActivityCardData = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  city: string;
  activity_date: string;
  end_time?: string | null;
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

export type JoinRequestStatus =
  | "none"
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled";

const STATUS = "rounded-full py-2.5 text-center text-sm font-semibold";

export function FeedActivityCard({
  activity,
  upcoming,
  showHost,
  distanceLabel,
  joinStatus = "none",
  pendingRequestCount = 0,
  spotsLeft,
  onJoin,
  onHostClick,
  onRequests,
  onEdit,
  onDelete,
  onOpenDetails = () => {},
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
  spotsLeft?: number;
  onJoin: () => void;
  onHostClick: () => void;
  onRequests: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  onOpenDetails?: () => void;
  onOpenChat?: () => void | Promise<void>;
  mode: "others" | "mine";
  readOnly?: boolean;
}) {
  const { month, day, weekday, time } = formatCardDate(activity.activity_date);
  const { gradientAccent } = getCategoryVisual(activity.category);
  const coverUrl = getCategoryImageUrl(activity.category, 900);
  const hostUsername = activity.host?.username;
  const hostInitial = hostUsername?.charAt(0).toUpperCase() ?? "?";
  const [menuOpen, setMenuOpen] = useState(false);

  const descTrimmed = activity.description.trim();
  const landmark = neighborhoodLandmark(activity.city);

  const badge = !upcoming
    ? "Ended"
    : isToday(activity.activity_date)
      ? "Today"
      : isNewActivity(activity.created_at)
        ? "New"
        : null;

  const openDetails = () => onOpenDetails();

  return (
    <article
      className={`group relative flex h-full flex-col overflow-hidden rounded-3xl border border-black/10 bg-white transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgb(0_0_0/0.08)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
        upcoming ? "" : "opacity-85"
      }`}
    >
      {mode === "mine" && onDelete ? (
        <div className="absolute right-2 top-2 z-10">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
            className="rounded-full bg-white/90 p-2 text-stone-700 shadow-sm backdrop-blur"
            aria-label="Plan actions"
            aria-expanded={menuOpen}
          >
            <MoreVertical className="size-4" strokeWidth={1.5} />
          </button>
          {menuOpen ? (
            <div
              className="absolute right-0 mt-1 min-w-[8rem] rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
              role="menu"
            >
              <button
                type="button"
                role="menuitem"
                className="block w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                  onDelete();
                }}
              >
                Delete
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      <div
        role="button"
        tabIndex={0}
        onClick={openDetails}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openDetails();
          }
        }}
        title={DETAILS_TOOLTIP}
        aria-label={`${activity.title}. ${DETAILS_TOOLTIP}`}
        className="cursor-pointer text-left"
      >
        <div className="relative h-44 overflow-hidden sm:h-48">
          <img
            src={coverUrl}
            alt={getCategoryImageAlt(activity.category)}
            className={`size-full object-cover ${upcoming ? "" : "grayscale"}`}
            loading="lazy"
            decoding="async"
          />
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

          {badge ? (
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
          ) : null}

          <h3
            className="absolute inset-x-4 bottom-3.5 line-clamp-2 text-lg font-extrabold leading-snug tracking-tight text-white [text-shadow:0_1px_10px_rgba(0,0,0,0.5)]"
          >
            {activity.title}
          </h3>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
          {descTrimmed ? (
            <p
              className="line-clamp-1 text-sm text-stone-600"
              title={DETAILS_TOOLTIP}
            >
              {descTrimmed}
            </p>
          ) : null}

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
                {distanceLabel ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-500">
                    <Navigation className="size-3 text-stone-400" aria-hidden />
                    {distanceLabel}
                  </span>
                ) : null}
              </div>

              {showHost ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onHostClick();
                  }}
                  className="flex w-fit max-w-full items-center gap-2 rounded-full text-xs text-stone-500 transition-colors hover:text-navy"
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
              ) : null}
            </div>
          </div>

          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex min-w-0 items-center gap-1.5 text-sm font-semibold text-navy">
              <MapPin className="size-4 shrink-0 text-coral" aria-hidden />
              <span className="truncate">{landmark}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-stone-500">
              <Users className="size-3.5 shrink-0 text-stone-400" aria-hidden />
              {spotsLeft != null ? `${spotsLeft} left` : `Up to ${activity.max_people}`}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-auto border-t border-stone-100 px-4 pb-4 pt-3 sm:px-5">
        {readOnly ? (
          <p className={`${STATUS} bg-stone-50 text-stone-500`}>
            {!upcoming ? "Ended" : mode === "mine" ? "Your plan" : "Upcoming"}
          </p>
        ) : mode === "others" ? (
          !upcoming ? (
            <p className={`${STATUS} bg-stone-50 text-stone-500`}>Ended</p>
          ) : joinStatus === "cancelled" ? (
            <p className={`${STATUS} bg-stone-50 text-stone-500`}>
              Cancelled: activity ended
            </p>
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
              className="w-full rounded-full bg-teal-600 py-3 text-sm font-bold text-white"
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
              className="w-full rounded-full bg-linear-to-r from-coral to-teal-600 py-3 text-sm font-bold text-white"
            >
              Request to join
            </button>
          )
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onRequests}
              className="relative flex-1 rounded-full bg-coral py-3 text-sm font-bold text-white"
            >
              Requests
              {pendingRequestCount > 0 ? (
                <span className="absolute -right-1 -top-2 flex min-w-5 items-center justify-center rounded-full bg-navy px-1.5 py-0.5 text-[11px] font-bold text-white ring-2 ring-white">
                  {pendingRequestCount}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="rounded-full bg-stone-100 px-5 py-3 text-sm font-semibold text-stone-800"
            >
              Edit
            </button>
          </div>
        )}
      </div>
    </article>
  );
}
