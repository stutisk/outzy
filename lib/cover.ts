import type { CSSProperties } from "react";
import {
  coverGradientSignature as coverGradientSignatureImpl,
  getCover as getCoverImpl,
} from "./cover.mjs";

export type CoverPatternLayer = {
  opacity: number;
  style: CSSProperties;
};

export type CoverSpec = {
  backgroundImage: string;
  patternLayers: CoverPatternLayer[];
  pattern: string;
  angle: number;
  hue: number;
  iconColor: string;
  signature: string;
};

export type CoverOptions = {
  stackIndex?: number;
  sessionHueOffset?: number;
  muted?: boolean;
};

export function getCover(
  activityId: string,
  category: string,
  options: CoverOptions = {},
): CoverSpec {
  return getCoverImpl(activityId, category, options) as CoverSpec;
}

export const coverGradientSignature = coverGradientSignatureImpl;
