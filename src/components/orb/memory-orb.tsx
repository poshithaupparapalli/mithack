"use client";

import { emotionSpec, glassOrbSurface, orbSurface } from "@/lib/emotions";
import type { Emotion } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * A memory, as a bead of liquid glass.
 *
 * Four stacked layers: a coloured halo bleeding out behind it, the glass body
 * refracting the mesh through it, a caustic where light pools at the bottom,
 * and an off-centre specular highlight. Colour comes entirely from the
 * emotion and glow from the intensity, so a screen of orbs reads as a
 * family's mood before you've read a single word.
 *
 * `variant="solid"` for anything under ~28px or anything with an icon on top —
 * glass that small just turns to mud.
 */
export function MemoryOrb({
  emotion,
  intensity = 0.8,
  size = 80,
  variant = "glass",
  drift = false,
  driftDelay = 0,
  halo = true,
  className,
  style,
}: {
  emotion?: Emotion;
  intensity?: number;
  size?: number;
  variant?: "glass" | "solid";
  drift?: boolean;
  driftDelay?: number;
  halo?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const spec = emotionSpec(emotion);
  const glass = variant === "glass";
  const surface = glass ? glassOrbSurface(emotion, intensity) : orbSurface(emotion, intensity);

  return (
    <span
      aria-hidden
      className={cn("pointer-events-none relative inline-block shrink-0", className)}
      style={{
        width: size,
        height: size,
        animation: drift ? `orb-drift ${16 + driftDelay * 3}s ease-in-out infinite` : undefined,
        animationDelay: drift ? `${-driftDelay * 2.4}s` : undefined,
        ...style,
      }}
    >
      {halo ? (
        <span
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${spec.core}, transparent 68%)`,
            filter: `blur(${Math.max(9, size * 0.24)}px)`,
            opacity: (glass ? 0.5 : 0.42) + intensity * 0.25,
            transform: "scale(1.2)",
          }}
        />
      ) : null}

      <span className="absolute inset-0 rounded-full" style={surface} />

      {glass ? (
        <>
          {/* Light pooling through the underside. */}
          <span
            className="absolute rounded-full"
            style={{
              left: "16%",
              right: "16%",
              bottom: "7%",
              height: `${size * 0.16}px`,
              background: `radial-gradient(ellipse at 50% 50%, ${spec.light}, transparent 70%)`,
              filter: `blur(${Math.max(3, size * 0.055)}px)`,
              opacity: 0.55 + intensity * 0.3,
            }}
          />
          {/* Specular highlight — deliberately off-centre. */}
          <span
            className="absolute rounded-full bg-white"
            style={{
              left: "21%",
              top: "15%",
              width: `${size * 0.28}px`,
              height: `${size * 0.2}px`,
              filter: `blur(${Math.max(2, size * 0.035)}px)`,
              opacity: 0.85,
              transform: "rotate(-24deg)",
            }}
          />
        </>
      ) : null}
    </span>
  );
}
