/** Deterministic generated covers (no static images). Pure ESM for tests. */

const CATEGORY_BASE_HUE = {
  hiking: 152,
  coffee: 32,
  cycling: 205,
  beaches: 192,
  food: 24,
  photography: 278,
  art: 310,
  dance: 330,
  running: 12,
  gaming: 258,
  yoga: 128,
  nightlife: 265,
};

const STACK_ANGLE = [132, 48, 215];
const STACK_PATTERN = ["dots", "diagonal", "orb"];
const MIN_NEIGHBOR_HUE = 28;

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function hsl(h, s, l) {
  const hue = ((h % 360) + 360) % 360;
  return `hsl(${hue} ${clamp(s, 0, 100)}% ${clamp(l, 0, 100)}%)`;
}

function baseHue(activityId, category) {
  const cat = CATEGORY_BASE_HUE[category] ?? 168;
  const jitter = hashString(activityId) % 14;
  return cat + jitter;
}

/**
 * @param {string} activityId
 * @param {string} category
 * @param {{ stackIndex?: number; sessionHueOffset?: number; muted?: boolean }} [options]
 */
export function getCover(activityId, category, options = {}) {
  const stackIndex = options.stackIndex ?? 0;
  const sessionHueOffset = options.sessionHueOffset ?? 0;
  const muted = options.muted ?? false;

  const hue =
    baseHue(activityId, category) +
    stackIndex * MIN_NEIGHBOR_HUE +
    sessionHueOffset;

  const angle =
    STACK_ANGLE[stackIndex % STACK_ANGLE.length] +
    (hashString(`${activityId}:angle`) % 18);

  const sat = muted ? 38 : 52;
  const lA = muted ? 68 : 58;
  const lB = muted ? 52 : 44;
  const lC = muted ? 62 : 50;

  const backgroundImage = `linear-gradient(${angle}deg, ${hsl(hue, sat, lA)}, ${hsl(
    hue + 22,
    sat - 4,
    lB,
  )}, ${hsl(hue + 44, sat - 2, lC)})`;

  const pattern = STACK_PATTERN[stackIndex % STACK_PATTERN.length];
  const patternLayers = buildPatternLayers(pattern, hue, muted);

  const signature = [
    activityId,
    category,
    stackIndex,
    sessionHueOffset,
    muted ? "m" : "f",
    angle,
    pattern,
    Math.round(hue),
  ].join("|");

  return {
    backgroundImage,
    patternLayers,
    pattern,
    angle,
    hue,
    iconColor: muted ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.92)",
    signature,
  };
}

function buildPatternLayers(pattern, hue, muted) {
  const alpha = muted ? 0.05 : 0.08;
  if (pattern === "dots") {
    return [
      {
        opacity: muted ? 0.35 : 0.45,
        style: {
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(0,0,0,0.07) 1px, transparent 0)",
          backgroundSize: "12px 12px",
        },
      },
    ];
  }
  if (pattern === "diagonal") {
    return [
      {
        opacity: muted ? 0.28 : 0.38,
        style: {
          backgroundImage: `repeating-linear-gradient(${((hue % 60) + 120) % 180}deg, transparent, transparent 10px, rgba(0,0,0,${alpha}) 10px, rgba(0,0,0,${alpha}) 11px)`,
        },
      },
    ];
  }
  return [
    {
      opacity: muted ? 0.4 : 0.55,
      style: {
        backgroundImage: `radial-gradient(ellipse 80% 60% at 20% 10%, ${hsl(hue + 30, 40, 72)} 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 85% 90%, ${hsl(hue - 20, 35, 68)} 0%, transparent 50%)`,
      },
    },
  ];
}

export function coverGradientSignature(
  activityId,
  category,
  stackIndex,
  sessionHueOffset = 0,
) {
  return getCover(activityId, category, {
    stackIndex,
    sessionHueOffset,
    muted: false,
  }).signature;
}
