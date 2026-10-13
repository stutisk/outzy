/** Trim, collapse whitespace, capitalize first character. */
export function normalizeLandingText(text: string): string {
  const collapsed = text.trim().replace(/\s+/g, " ");
  if (!collapsed) return "";
  return collapsed.charAt(0).toUpperCase() + collapsed.slice(1);
}

export function truncateLandingDescription(text: string, max = 80): string {
  const normalized = normalizeLandingText(text);
  if (!normalized) return "";
  if (normalized.length <= max) return normalized;
  const slice = normalized.slice(0, max - 1).trimEnd();
  return `${slice}…`;
}
