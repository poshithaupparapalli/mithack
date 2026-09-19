"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Mic, Square } from "lucide-react";
import { formatElapsed, useVoiceCapture, type VoiceResult } from "@/lib/use-voice-capture";
import { cn } from "@/lib/utils";

/** Standard-mode recorder: tap to start, tap to stop. Elder mode has its own. */
export function RecordControl({
  onTranscript,
  className,
}: {
  onTranscript: (result: VoiceResult) => void;
  className?: string;
}) {
  const { status, elapsedMs, partial, level, simulated, start, stop } = useVoiceCapture({
    onComplete: onTranscript,
  });

  const recording = status === "recording";
  const busy = status === "transcribing";

  return (
    <div className={cn("glass-solid rounded-2xl p-4", className)}>
      <div className="flex items-center gap-3.5">
        <button
          type="button"
          onClick={() => (recording ? void stop() : void start())}
          disabled={busy}
          aria-label={recording ? "Stop recording" : "Start recording"}
          className={cn(
            "relative flex size-12 shrink-0 items-center justify-center rounded-full text-white transition-colors",
            recording ? "bg-ink" : "bg-ember",
            busy && "opacity-60",
          )}
        >
          {recording ? (
            <motion.span
              aria-hidden
              className="absolute inset-0 rounded-full bg-ember/25"
              animate={{ scale: 1 + level * 0.9, opacity: 0.55 - level * 0.2 }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
            />
          ) : null}
          {busy ? (
            <Loader2 className="size-5 animate-spin" />
          ) : recording ? (
            <Square className="relative size-4" fill="currentColor" />
          ) : (
            <Mic className="relative size-5" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <p className="text-[0.95rem] font-medium text-ink">
            {busy
              ? "Writing it down…"
              : recording
                ? `Listening · ${formatElapsed(elapsedMs)}`
                : "Tell it out loud instead"}
          </p>
          <p className="text-xs text-ink-faint">
            {recording
              ? simulated
                ? "No microphone found — running in demo mode"
                : "Tap the square when you're finished"
              : "Keepsake will write down what you say."}
          </p>
        </div>
      </div>

      <AnimatePresence>
        {recording && partial ? (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden border-l-2 border-ember/40 pl-3 text-[0.94rem] italic leading-relaxed text-ink-soft"
          >
            {partial}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
