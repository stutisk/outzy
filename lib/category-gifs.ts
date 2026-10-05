import { CATEGORIES } from "@/lib/categories";

/** One Bollywood-style GIF pool per app category — IDs do not repeat across categories. */
const CATEGORY_GIF_IDS: Record<string, string[]> = {
  hiking: [
    "I2muyEa1AYyPjZjbIo", // DDLJ / outdoors
    "xT9IgG50Fb7Mi0prBC", // 3 Idiots trek energy
    "3o7abKhOpu0NwenH3O",
  ],
  coffee: [
    "eGAsLgWVQq4bO6J8rB", // SRK “copy that”
    "l0HlBO7eyXzSZkJri",
    "26gsjCZpPolPr3sZ6",
  ],
  cycling: [
    "xT5LMHxhMv13NKbhFu", // Dhoom-style ride
    "O3K8WSBThjwpO",
    "3bPjBVnRQOpVe",
  ],
  beaches: [
    "10hef15pceXFT3",
    "YTbZzCkMQWKRW", // open arms / beach filmy
    "l4hiZKPZz0yGY",
  ],
  food: [
    "4fTaKEafShRAw",
    "11sBLCDJsEhRF2",
    "13GIgrGDSLULWw",
  ],
  photography: [
    "l0HlNQ03J5JxXddla",
    "xUPMpVLQIspfW",
    "7pOneRsizeeFG",
  ],
  art: [
    "13HgwGsXF0ajPY",
    "wR8YbK8WXvK0",
    "Mb0EuAKnokdaO",
  ],
  dance: [
    "26BRuo6sKn2T3BXkA",
    "l0MYt5qjP48NKFHgu",
    "12COQu9NqmFwC",
  ],
  running: [
    "3o6Zt4HU9qGRF5VQd2",
    "l3q2K5ar5xXIY",
    "8EpHZKiOKUYFO",
  ],
  gaming: ["4aJwHFOoHd73O", "8EpHZKiOKUYFO"],
  yoga: ["3o7aD2saQ1rA0d26Bi", "l0MWRoxatroCF"],
  nightlife: [
    "26ufdipYqZ2p9lwCWY",
    "13GIgrGDSLULWw",
    "l0MYt5qjP48NKFHgu",
  ],
};

const FALLBACK_ID = "YTbZzCkMQWKRW";

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** GIF URL from activity category only (variety within that category’s pool). */
export function getCategoryGifUrl(category: string, activityId: string): string {
  const pool = CATEGORY_GIF_IDS[category];
  const id =
    pool?.[hashSeed(activityId) % pool.length] ??
    CATEGORY_GIF_IDS[CATEGORIES[0]?.value]?.[0] ??
    FALLBACK_ID;
  return `https://media.giphy.com/media/${id}/giphy.gif`;
}
