export type ActivityTiming = {
  activity_date: string;
  end_time?: string | null;
};

/** Effective end: optional end_time, else start (activity_date). */
export function getActivityEndIso(activity: ActivityTiming): string {
  return activity.end_time ?? activity.activity_date;
}

export function isActivityUpcoming(activity: ActivityTiming, now = new Date()): boolean {
  return new Date(getActivityEndIso(activity)).getTime() > now.getTime();
}

export function isActivityPast(activity: ActivityTiming, now = new Date()): boolean {
  return !isActivityUpcoming(activity, now);
}
