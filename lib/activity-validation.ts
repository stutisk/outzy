export const ACTIVITY_TITLE_MIN = 4;
export const ACTIVITY_TITLE_MAX = 60;
export const ACTIVITY_DESCRIPTION_MAX = 1000;

export function normalizeActivityTitle(title: string): string {
  return title.trim().replace(/\s+/g, " ");
}

export function normalizeActivityDescription(description: string): string {
  return description.trim().replace(/\s+/g, " ");
}

/** Landing + feed visibility (no other junk rules). */
export function isTitleVisible(title: string): boolean {
  return title.trim().length >= ACTIVITY_TITLE_MIN;
}

export function validateActivityTitle(title: string): string | null {
  const t = normalizeActivityTitle(title);
  if (t.length < ACTIVITY_TITLE_MIN) {
    return `Title must be at least ${ACTIVITY_TITLE_MIN} characters.`;
  }
  if (t.length > ACTIVITY_TITLE_MAX) {
    return `Title must be at most ${ACTIVITY_TITLE_MAX} characters.`;
  }
  return null;
}

export function validateActivityDescription(description: string): string | null {
  const d = normalizeActivityDescription(description);
  if (d.length > ACTIVITY_DESCRIPTION_MAX) {
    return `Description must be at most ${ACTIVITY_DESCRIPTION_MAX} characters.`;
  }
  return null;
}

export function activityTitleForSave(title: string): string {
  return normalizeActivityTitle(title);
}

export function activityDescriptionForSave(description: string): string {
  return normalizeActivityDescription(description);
}
