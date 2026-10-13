export type LandingJoinState =
  | "none"
  | "pending"
  | "accepted"
  | "rejected"
  | "host"
  | "full"
  | "sample";

export type LandingSortMode = "nearest" | "interests" | "soonest";

export type LandingPlan = {
  id: string;
  isSample: boolean;
  title: string;
  when: string;
  whenShort: string;
  neighborhood: string;
  category: string;
  spotsLeft: number;
  maxPeople: number;
  activityDate: string;
  hostUserId: string;
  hostUsername: string;
  hostAvatarUrl: string | null;
  participantAvatarUrls: string[];
  description: string;
  href: string;
  joinState: LandingJoinState;
  distanceKm: number | null;
};

export type LandingPlansPayload = {
  plans: LandingPlan[];
  heroPlans: LandingPlan[];
  happeningPlans: LandingPlan[];
  featuredPlan: LandingPlan | null;
  previewLabel: string;
  sortMode: LandingSortMode;
  trustLine: string | null;
  error: string | null;
};
