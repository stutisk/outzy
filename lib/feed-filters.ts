export type WhenFilter = "upcoming" | "past" | "all";

export const WHEN_FILTER_LABEL: Record<WhenFilter, string> = {
  upcoming: "Upcoming",
  past: "Past",
  all: "All",
};

export type CategoryChipId =
  | "all"
  | "food"
  | "fitness"
  | "gaming"
  | "creative"
  | "outdoors"
  | "movies"
  | "social";
