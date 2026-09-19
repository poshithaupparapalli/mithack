/**
 * Phyllotaxis scatter — the same spiral a sunflower uses. It spaces points
 * evenly without any collision pass, and because it's driven by the index it
 * lays out identically on every render and on the server.
 */

const GOLDEN_ANGLE = 2.399963229728653;

/** Small stable jitter so the spiral doesn't read as a machine-made pattern. */
function jitter(seed: string, salt: number) {
  let h = salt;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) % 9973;
  return (h / 9973) * 2 - 1;
}

export interface OrbPlacement {
  /** Percentages, for absolute positioning inside the constellation box. */
  left: number;
  top: number;
  size: number;
  driftDelay: number;
}

export function placeOrbs(
  ids: string[],
  intensities: number[],
  { minSize = 52, maxSize = 132 } = {},
): OrbPlacement[] {
  const count = Math.max(ids.length, 1);

  return ids.map((id, i) => {
    const angle = i * GOLDEN_ANGLE;
    const radius = Math.sqrt((i + 0.45) / count);
    const intensity = intensities[i] ?? 0.7;

    return {
      left: 50 + Math.cos(angle) * radius * 33 + jitter(id, 7) * 4,
      top: 50 + Math.sin(angle) * radius * 36 + jitter(id, 13) * 4,
      size: minSize + (maxSize - minSize) * intensity,
      driftDelay: i,
    };
  });
}
