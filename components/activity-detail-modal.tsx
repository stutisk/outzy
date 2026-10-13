"use client";

import { AppModal } from "@/components/app-modal";
import {
  ActivityDetails,
  ActivityDetailsFooter,
  type ActivityDetailsProps,
} from "@/components/activity-details";
import type { FeedActivityCardData } from "@/components/feed-activity-card";

type ActivityDetailModalProps = Omit<
  ActivityDetailsProps,
  "showCloseButton" | "activity"
> & {
  open: boolean;
  onClose: () => void;
  activity: FeedActivityCardData | null;
};

export function ActivityDetailModal({
  open,
  onClose,
  activity,
  ...detailsProps
}: ActivityDetailModalProps) {
  if (!activity) return null;

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
      footer={
        <div className="px-4 sm:px-6">
          <ActivityDetailsFooter {...detailsProps} />
        </div>
      }
    >
      <ActivityDetails
        activity={activity}
        {...detailsProps}
        onClose={onClose}
        showCloseButton
      />
    </AppModal>
  );
}
