"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import { MemoryOrb } from "@/components/orb/memory-orb";
import type { Emotion } from "@/lib/types";
import { cn } from "@/lib/utils";

const HOLD_MS = 700;
const SIZE = 272;

/**
 * The only control on the screen — and the memory it is about to become.
 *
 * At rest it is clear, unlit glass. As she speaks, her own voice warms it:
 * the amplitude feeds the orb's intensity, so the thing she is making glows
 * brighter the more she gives it. Nothing here says "recording".
 *
 * Works three ways on purpose: press and hold, a single tap to latch it on,
 * or the spacebar. Holding steadily is hard with a tremor, so tapping has to
 * work just as well — and the label always says what happens next.
 */
export function HoldToSpeak({
  recording,
  level,
  emotion,
  onStart,
  onStop,
  disabled,
}: {
  recording: boolean;
  level: number;
  emotion?: Emotion;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}) {
  const pressedAt = useRef(0);
  const stopOnRelease = useRef(false);

  function press() {
    if (disabled) return;
    pressedAt.current = Date.now();
    if (recording) {
      // Second press on a latched recording — end it when they let go.
      stopOnRelease.current = true;
    } else {
      onStart();
    }
  }

  function release() {
    if (disabled) return;

    if (stopOnRelease.current) {
      stopOnRelease.current = false;
      onStop();
      return;
    }

    // A real hold ends on release; a quick tap leaves it running.
    if (recording && Date.now() - pressedAt.current > HOLD_MS) onStop();
  }

  // Her voice, mapped onto how brightly the glass burns.
  const intensity = recording ? Math.min(1, 0.34 + level * 1.5) : 0.16;

  return (
    <div className="relative flex flex-col items-center">
      {/* Breath. Slow at rest, quickened by speech. */}
      <motion.span
        aria-hidden
        className="absolute inset-0 m-auto rounded-full"
        style={{ width: SIZE, height: SIZE }}
        animate={{ scale: recording ? 1.06 + level * 0.22 : [1, 1.035, 1] }}
        transition={
          recording
            ? { type: "spring", stiffness: 240, damping: 18 }
            : { duration: 5.5, repeat: Infinity, ease: "easeInOut" }
        }
      >
        <MemoryOrb
          emotion={recording ? (emotion ?? "joy") : emotion}
          intensity={intensity}
          size={SIZE}
          halo
        />
      </motion.span>

      <button
        type="button"
        disabled={disabled}
        onPointerDown={press}
        onPointerUp={release}
        onPointerCancel={release}
        onKeyDown={(event) => {
          if (event.repeat) return;
          if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            press();
          }
        }}
        onKeyUp={(event) => {
          if (event.key === " " || event.key === "Enter") {
            event.preventDefault();
            release();
          }
        }}
        aria-pressed={recording}
        aria-label={recording ? "Stop recording" : "Hold to speak"}
        className={cn(
          "relative flex touch-none select-none items-center justify-center rounded-full transition-transform active:scale-[0.98]",
          disabled && "opacity-50",
        )}
        style={{ width: SIZE, height: SIZE }}
      >
        <span
          className="px-10 text-center font-serif text-[1.75rem] leading-tight text-ink"
          style={{ textShadow: "0 1px 2px rgba(255,255,255,0.9)" }}
        >
          {recording ? "I'm finished" : "Hold to speak"}
        </span>
      </button>
    </div>
  );
}
