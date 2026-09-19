"use client";

import { motion } from "framer-motion";
import { Mic } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

const HOLD_MS = 700;

/**
 * The only control on the screen.
 *
 * Works three ways on purpose: press and hold, a single tap to latch it on,
 * or the spacebar. Holding steadily is hard with a tremor, so tapping has to
 * work just as well — and the label always says what happens next.
 */
export function HoldToSpeak({
  recording,
  level,
  onStart,
  onStop,
  disabled,
}: {
  recording: boolean;
  level: number;
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

  return (
    <div className="relative flex flex-col items-center">
      {recording ? (
        <>
          <motion.span
            aria-hidden
            className="absolute inset-0 m-auto size-[17rem] rounded-full bg-ember/15"
            animate={{ scale: 1 + level * 0.55 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
          />
          <motion.span
            aria-hidden
            className="absolute inset-0 m-auto size-[17rem] rounded-full bg-ember/10"
            animate={{ scale: 1.12 + level * 0.9 }}
            transition={{ type: "spring", stiffness: 180, damping: 20 }}
          />
        </>
      ) : null}

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
          "relative flex size-[17rem] touch-none select-none flex-col items-center justify-center gap-3 rounded-full text-white transition-colors",
          "shadow-[0_12px_40px_rgba(194,65,12,0.28)] active:scale-[0.98]",
          recording ? "bg-ink shadow-[0_12px_40px_rgba(28,25,23,0.3)]" : "bg-ember",
          disabled && "opacity-50",
        )}
      >
        <Mic className="size-16" strokeWidth={1.6} />
        <span className="px-6 text-center text-[1.6rem] font-medium leading-tight">
          {recording ? "I'm finished" : "Hold to speak"}
        </span>
      </button>
    </div>
  );
}
