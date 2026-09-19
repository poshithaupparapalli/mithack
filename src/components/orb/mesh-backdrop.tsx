"use client";

import { EMOTIONS } from "@/lib/emotions";
import type { Emotion } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The warm mesh the whole app floats on. Four very large, very soft radial
 * washes over parchment — no image assets, cheap to animate, and tintable per
 * screen so a page can take on the colour of whatever it's showing.
 */
export function MeshBackdrop({
  tint,
  intensity = 1,
  className,
}: {
  tint?: Emotion;
  intensity?: number;
  className?: string;
}) {
  const accent = tint ? EMOTIONS[tint] : null;

  return (
    <div aria-hidden className={cn("pointer-events-none fixed inset-0 -z-10 overflow-hidden", className)}>
      <div className="absolute inset-0 bg-canvas" />

      {/* Warm constants — these are the "keep it warm" half of the brief. */}
      <Wash
        className="-left-[22%] -top-[18%] size-[75vmax]"
        color="rgba(245, 166, 35, 0.22)"
        delay={0}
        intensity={intensity}
      />
      <Wash
        className="-right-[28%] top-[8%] size-[68vmax]"
        color="rgba(238, 110, 142, 0.20)"
        delay={7}
        intensity={intensity}
      />
      <Wash
        className="-left-[18%] bottom-[-22%] size-[70vmax]"
        color="rgba(139, 107, 217, 0.16)"
        delay={13}
        intensity={intensity}
      />
      <Wash
        className="bottom-[-15%] right-[-15%] size-[60vmax]"
        color="rgba(63, 167, 149, 0.14)"
        delay={19}
        intensity={intensity}
      />

      {/* Optional per-screen tint, e.g. the emotion of the memory on screen. */}
      {accent ? (
        <Wash
          className="left-1/2 top-1/3 size-[80vmax] -translate-x-1/2 -translate-y-1/3"
          color={accent.wash}
          delay={3}
          intensity={intensity}
        />
      ) : null}

      {/* Lifts the parchment back up so text never sits on raw colour. */}
      <div className="absolute inset-0 bg-canvas/45" />
    </div>
  );
}

function Wash({
  className,
  color,
  delay,
  intensity,
}: {
  className: string;
  color: string;
  delay: number;
  intensity: number;
}) {
  return (
    <div
      className={cn("absolute rounded-full", className)}
      style={{
        background: `radial-gradient(circle, ${color} 0%, transparent 68%)`,
        opacity: intensity,
        animation: `mesh-breathe ${44 + delay * 2}s ease-in-out infinite`,
        animationDelay: `-${delay}s`,
        filter: "blur(28px)",
      }}
    />
  );
}
