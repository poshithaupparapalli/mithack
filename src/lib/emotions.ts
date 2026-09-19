import type { Emotion } from "@/lib/types";

/**
 * The orb palette.
 *
 * Every saturated colour in Keepsake comes from here and nowhere else. The
 * chrome — parchment, ink, warm neutrals — stays deliberately quiet so that
 * colour only ever means "this is a memory, and this is how it felt."
 *
 * Warm-leaning on purpose: joy, love and pride carry the family's ordinary
 * days, and the two cool emotions are rare enough to land when they appear.
 */

export interface EmotionSpec {
  /** Specular highlight, top-left of the sphere. */
  light: string;
  /** The body of the orb. */
  core: string;
  /** Shaded underside. */
  deep: string;
  /** Halo bled out behind the orb. */
  glow: string;
  /** Text/ink tint for labels on parchment — all pass AA on the warm ground. */
  ink: string;
  /** Wash used for large soft areas (elder mode, card bleeds). */
  wash: string;
  label: string;
  /** Shown to the family, never the word "sentiment". */
  phrase: string;
}

export const EMOTIONS: Record<Emotion, EmotionSpec> = {
  joy: {
    light: "#FFE9BC",
    core: "#F5A623",
    deep: "#B8610F",
    glow: "rgba(245, 166, 35, 0.55)",
    ink: "#96530D",
    wash: "rgba(245, 166, 35, 0.16)",
    label: "joy",
    phrase: "a happy one",
  },
  love: {
    light: "#FFDAE3",
    core: "#EE6E8E",
    deep: "#A8365A",
    glow: "rgba(238, 110, 142, 0.5)",
    ink: "#A33255",
    wash: "rgba(238, 110, 142, 0.15)",
    label: "love",
    phrase: "a tender one",
  },
  pride: {
    light: "#E6DAFF",
    core: "#8B6BD9",
    deep: "#513697",
    glow: "rgba(139, 107, 217, 0.5)",
    ink: "#5B3FA0",
    wash: "rgba(139, 107, 217, 0.15)",
    label: "pride",
    phrase: "one they were proud of",
  },
  longing: {
    light: "#CDEFE8",
    core: "#3FA795",
    deep: "#1F6555",
    glow: "rgba(63, 167, 149, 0.45)",
    ink: "#216B5C",
    wash: "rgba(63, 167, 149, 0.14)",
    label: "longing",
    phrase: "one they still miss",
  },
  grief: {
    light: "#CFDAF7",
    core: "#4A63B0",
    deep: "#25376E",
    glow: "rgba(74, 99, 176, 0.45)",
    ink: "#324b96",
    wash: "rgba(74, 99, 176, 0.14)",
    label: "grief",
    phrase: "a heavy one",
  },
};

export const EMOTION_ORDER: Emotion[] = ["joy", "love", "pride", "longing", "grief"];

/** Falls back to joy so an un-classified memory still renders as an orb. */
export function emotionSpec(emotion?: Emotion): EmotionSpec {
  return EMOTIONS[emotion ?? "joy"];
}

/**
 * Solid sphere. Used only where an orb is small enough that glass would turn
 * to mud, or where an icon has to stay legible on top of it.
 */
export function orbSurface(emotion: Emotion | undefined, intensity = 0.8) {
  const spec = emotionSpec(emotion);
  const strength = 0.45 + intensity * 0.55;

  return {
    backgroundImage: [
      `radial-gradient(circle at 30% 24%, rgba(255,255,255,${0.92 * strength}) 0%, rgba(255,255,255,0) 42%)`,
      `radial-gradient(circle at 50% 42%, ${spec.light} 0%, ${spec.core} 52%, ${spec.deep} 100%)`,
    ].join(", "),
    boxShadow: [
      `inset 0 -10px 26px -8px rgba(0,0,0,${0.3 * strength})`,
      `inset 0 6px 18px -6px rgba(255,255,255,${0.5 * strength})`,
      `0 14px 44px -10px ${spec.glow}`,
    ].join(", "),
  } satisfies React.CSSProperties;
}

/**
 * Liquid glass.
 *
 * A memory you can see through: the mesh behind it refracts, the rim catches
 * light, and the colour sits *in* the glass rather than painted on it. Four
 * things make it read as glass rather than a tinted circle —
 *
 *   1. `backdropFilter` actually bending what's behind it
 *   2. a bright inset rim along the top-left where light enters
 *   3. a saturated inset bloom along the bottom-right where it pools
 *   4. a specular highlight that is *not* concentric with the sphere
 */
export function glassOrbSurface(emotion: Emotion | undefined, intensity = 0.8) {
  const spec = emotionSpec(emotion);
  const strength = 0.4 + intensity * 0.6;

  return {
    backgroundImage: [
      `radial-gradient(circle at 30% 24%, rgba(255,255,255,${0.55 * strength}) 0%, rgba(255,255,255,0.04) 46%)`,
      `radial-gradient(circle at 70% 76%, ${spec.core}${alpha(0.5 * strength)} 0%, transparent 62%)`,
      `radial-gradient(circle at 50% 50%, ${spec.light}${alpha(0.3 * strength)} 0%, ${spec.core}${alpha(0.34 * strength)} 100%)`,
    ].join(", "),
    backdropFilter: "blur(7px) saturate(190%) brightness(1.06)",
    WebkitBackdropFilter: "blur(7px) saturate(190%) brightness(1.06)",
    border: "1px solid rgba(255,255,255,0.55)",
    boxShadow: [
      `inset 0 2px 5px rgba(255,255,255,${0.9 * strength})`,
      `inset 6px 8px 18px -10px rgba(255,255,255,0.95)`,
      `inset -10px -14px 30px -12px ${spec.deep}${alpha(0.75 * strength)}`,
      `inset 0 -2px 4px ${spec.core}${alpha(0.45 * strength)}`,
      `0 16px 44px -14px ${spec.glow}`,
    ].join(", "),
  } satisfies React.CSSProperties;
}

/** Hex alpha suffix, so the palette can stay as plain hex. */
function alpha(value: number) {
  return Math.round(Math.min(1, Math.max(0, value)) * 255)
    .toString(16)
    .padStart(2, "0");
}
