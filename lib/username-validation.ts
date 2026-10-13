export const USERNAME_MIN = 2;
export const USERNAME_MAX = 12;

export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/\s+/g, "");
}

export function validateUsername(raw: string): string | null {
  const username = normalizeUsername(raw);
  if (username.length < USERNAME_MIN) {
    return `Username must be at least ${USERNAME_MIN} characters.`;
  }
  if (username.length > USERNAME_MAX) {
    return `Username must be at most ${USERNAME_MAX} characters.`;
  }
  return null;
}

export function usernameForSave(raw: string): string {
  return normalizeUsername(raw).slice(0, USERNAME_MAX);
}

/** Slice OAuth/email-derived defaults to DB limit. */
export function defaultUsernameFromEmail(email: string | null | undefined): string {
  if (!email?.includes("@")) return "";
  const local = email.split("@")[0]?.replace(/[^a-zA-Z0-9_]/g, "") ?? "";
  return local.slice(0, USERNAME_MAX);
}
