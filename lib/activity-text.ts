/** First segment of city string — no exact address. */
export function neighborhoodLandmark(city: string): string {
  const trimmed = city.trim();
  if (!trimmed) return "Meetup area TBD";
  return trimmed.split(",")[0]?.trim() || trimmed;
}

export function truncateWords(text: string, maxWords = 100): {
  text: string;
  truncated: boolean;
} {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (!normalized) return { text: "", truncated: false };
  const words = normalized.split(" ");
  if (words.length <= maxWords) {
    return { text: normalized, truncated: false };
  }
  return {
    text: `${words.slice(0, maxWords).join(" ")}…`,
    truncated: true,
  };
}
