"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Calendar,
  MapPin,
  MessageCircle,
  Navigation,
  Users,
  X,
} from "lucide-react";
import { AppModal } from "@/components/app-modal";
import { LandingPlanCover } from "@/components/landing-plan-cover";
import type { FeedActivityCardData, JoinRequestStatus } from "@/components/feed-activity-card";
import { getCategoryLabel } from "@/lib/categories";
import { getCategoryVisual } from "@/lib/category-visual";
import { neighborhoodLandmark } from "@/lib/activity-text";

type ActivityDetailModalProps = {
  open: boolean;
  onClose: () => void;
  activity: FeedActivityCardData | null;
  upcoming: boolean;
  spotsLeft: number;
  joinStatus: JoinRequestStatus;
  isHost: boolean;
  distanceLabel?: string | null;
  onJoin: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onOpenChat?: () => void;
  onHostClick?: () => void;
};

function mapsSearchUrl(city: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(city)}`;
}

export function ActivityDetailModal({
  open,
  onClose,
  activity,
  upcoming,
  spotsLeft,
  joinStatus,
  isHost,
  distanceLabel,
  onJoin,
  onDelete,
  onEdit,
  onOpenChat,
  onHostClick,
}: ActivityDetailModalProps) {
  if (!activity) return null;

  const d = new Date(activity.activity_date);
  const dateLine = d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const timeLine = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  const landmark = neighborhoodLandmark(activity.city);
  const hostName = activity.host?.username;
  const hostInitial = hostName?.charAt(0).toUpperCase() ?? "?";
  const { gradientAccent } = getCategoryVisual(activity.category);
  const fillPercent = Math.min(
    100,
    Math.round(
      ((activity.max_people - spotsLeft) / Math.max(activity.max_people, 1)) *
        100,
    ),
  );

  let action: React.ReactNode;
  if (!upcoming) {
    action = (
      <p className="rounded-full bg-stone-100 py-3.5 text-center text-sm font-semibold text-stone-600">
        This plan has ended
      </p>
    );
  } else if (isHost) {
    action = (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="flex-1 rounded-full border border-stone-200 bg-white py-3.5 text-sm font-semibold text-stone-800 transition hover:bg-stone-50"
        >
          Edit plan
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-full border border-red-200 px-5 py-3.5 text-sm font-semibold text-red-700 transition hover:bg-red-50"
        >
          Delete
        </button>
      </div>
    );
  } else if (joinStatus === "cancelled") {
    action = (
      <p className="rounded-full bg-stone-100 py-3.5 text-center text-sm font-semibold text-stone-600">
        Cancelled: activity ended
      </p>
    );
  } else if (joinStatus === "pending") {
    action = (
      <p className="rounded-full bg-amber-50 py-3.5 text-center text-sm font-semibold text-amber-900 ring-1 ring-amber-200">
        Request sent — host will reply in chat
      </p>
    );
  } else if (joinStatus === "accepted") {
    action = (
      <button
        type="button"
        onClick={onOpenChat}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-teal-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-900/15 transition hover:brightness-105"
      >
        <MessageCircle className="size-4" strokeWidth={1.5} />
        Open chat
      </button>
    );
  } else if (joinStatus === "rejected") {
    action = (
      <p className="rounded-full bg-stone-100 py-3.5 text-center text-sm font-semibold text-stone-600">
        Request declined
      </p>
    );
  } else {
    action = (
      <button
        type="button"
        onClick={onJoin}
        className="w-full rounded-full bg-linear-to-r from-coral to-teal-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-teal-900/20 transition hover:brightness-105 active:scale-[0.99]"
      >
        Request to join
      </button>
    );
  }

  return (
    <AppModal
      open={open}
      onClose={onClose}
      title=""
      size="lg"
      fullScreenMobile
      hideHeader
      ariaLabelledBy="activity-detail-title"
      contentClassName="p-0"
      footer={<div className="px-4 sm:px-6">{action}</div>}
    >
      <div className="relative h-44 shrink-0 overflow-hidden sm:h-52">
        <LandingPlanCover category={activity.category} width={900} />
        <div
          className="absolute inset-0 bg-linear-to-t from-black/85 via-black/30 to-black/10"
          aria-hidden
        />
        <div
          className={`absolute inset-x-0 top-0 h-1 bg-linear-to-r ${gradientAccent}`}
          aria-hidden
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full bg-black/35 p-2 text-white backdrop-blur-sm transition hover:bg-black/50"
          aria-label="Close plan details"
        >
          <X className="size-5" strokeWidth={2} />
        </button>
        <span
          className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-stone-800"
        >
          {getCategoryLabel(activity.category)}
        </span>
        {!upcoming ? (
          <span className="absolute right-14 top-3 rounded-full bg-stone-800/90 px-2.5 py-1 text-[11px] font-bold text-white">
            Ended
          </span>
        ) : null}
        <div className="absolute inset-x-4 bottom-4">
          <h2
            id="activity-detail-title"
            className="text-2xl font-extrabold leading-tight tracking-tight text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.4)]"
          >
            {activity.title}
          </h2>
        </div>
      </div>

      <div className="space-y-5 px-4 py-5 sm:px-6">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div className="rounded-2xl border border-stone-100 bg-stone-50/80 p-3">
            <Calendar className="size-4 text-teal-700" strokeWidth={1.5} />
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
              When
            </p>
            <p className="mt-0.5 text-sm font-semibold text-navy">{dateLine}</p>
            <p className="text-sm text-stone-600">{timeLine}</p>
          </div>
          <div className="rounded-2xl border border-stone-100 bg-stone-50/80 p-3">
            <MapPin className="size-4 text-teal-700" strokeWidth={1.5} />
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
              Meetup
            </p>
            <p className="mt-0.5 text-sm font-semibold text-navy">{landmark}</p>
            <a
              href={mapsSearchUrl(activity.city)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-0.5 text-xs font-semibold text-teal-700 hover:underline"
            >
              Open maps
              <ArrowUpRight className="size-3" />
            </a>
          </div>
          <div className="col-span-2 rounded-2xl border border-stone-100 bg-stone-50/80 p-3 sm:col-span-1">
            <Users className="size-4 text-teal-700" strokeWidth={1.5} />
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-stone-500">
              Spots
            </p>
            <p className="mt-0.5 text-sm font-semibold text-navy">
              {spotsLeft} left of {activity.max_people}
            </p>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-200"
              role="progressbar"
              aria-valuenow={fillPercent}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={`h-full rounded-full bg-linear-to-r ${gradientAccent} transition-all`}
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </div>
        </div>

        {distanceLabel ? (
          <p className="flex items-center gap-2 text-sm text-stone-600">
            <Navigation className="size-4 text-stone-400" strokeWidth={1.5} />
            {distanceLabel}
          </p>
        ) : null}

        {hostName ? (
          <button
            type="button"
            onClick={onHostClick}
            className="flex w-full items-center gap-3 rounded-2xl border border-stone-100 bg-white p-3 text-left transition hover:border-teal-100 hover:bg-teal-50/40"
          >
            <span className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-linear-to-br from-coral to-teal-600 text-sm font-bold text-white">
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
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold uppercase tracking-wide text-stone-500">
                Host
              </span>
              <span className="block text-sm font-bold text-navy">
                @{hostName}
              </span>
            </span>
            <span className="text-xs font-semibold text-teal-700">Profile →</span>
          </button>
        ) : null}

        <section aria-labelledby="activity-detail-about">
          <h3
            id="activity-detail-about"
            className="text-xs font-semibold uppercase tracking-wide text-stone-500"
          >
            About this plan
          </h3>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-stone-800">
            {activity.description?.trim() || "No description yet — say hi when you request to join."}
          </p>
        </section>

        <Link
          href={`/activity/${activity.id}`}
          className="block text-center text-sm font-semibold text-teal-700 hover:underline"
          onClick={onClose}
        >
          Open full plan page
        </Link>
      </div>
    </AppModal>
  );
}
