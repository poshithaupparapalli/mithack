"use client";

import { motion } from "framer-motion";
import { FileText, ImageIcon, Loader2, Mic, Play } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { MemoryOrb } from "@/components/orb/memory-orb";
import { emotionSpec } from "@/lib/emotions";
import { Badge } from "@/components/ui/badge";
import { useFamily } from "@/lib/family-context";
import type { Memory } from "@/lib/types";
import { cn, relativeTime } from "@/lib/utils";

const KIND_ICON = { voice: Mic, photo: ImageIcon, text: FileText } as const;

function duration(seconds?: number) {
  if (!seconds) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function MemoryCard({ memory, index = 0 }: { memory: Memory; index?: number }) {
  const { personById, placeById } = useFamily();
  const author = personById(memory.authorId);
  const place = placeById(memory.placeId);
  const Icon = KIND_ICON[memory.kind];
  const processing = memory.status === "processing";

  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 6) * 0.05, duration: 0.35 }}
      className={cn(
        "rounded-2xl p-4",
        processing ? "border border-dashed border-line-strong bg-surface/55" : "glass-solid",
      )}
    >
      <div className="flex items-center gap-2.5">
        {author ? <Avatar id={author.id} name={author.name} className="size-8 text-xs" /> : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{author?.name ?? "Someone"}</p>
          <p className="text-xs text-ink-faint">
            {relativeTime(memory.createdAt)}
            {place ? ` · ${place.shortName}` : ""}
          </p>
        </div>
        <span className="flex items-center gap-2 text-ink-faint">
          <Icon className="size-4" />
          {memory.kind === "voice" ? (
            <span className="text-xs tabular-nums">{duration(memory.durationSec)}</span>
          ) : null}
          <MemoryOrb emotion={memory.emotion} intensity={memory.intensity ?? 0.7} size={22} />
        </span>
      </div>

      {memory.title ? (
        <h3 className="mt-3 font-serif text-[1.15rem] leading-snug text-ink">{memory.title}</h3>
      ) : null}

      {memory.kind === "voice" ? (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-surface-sunk/70 px-3 py-2.5">
          <button
            aria-label={`Play ${memory.title ?? "recording"}`}
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ink text-canvas transition-transform active:scale-95"
          >
            <Play className="size-4 translate-x-px" fill="currentColor" />
          </button>
          <Waveform seed={memory.id} />
        </div>
      ) : null}

      {memory.body ? (
        <p
          className={cn(
            "mt-3 text-[0.94rem] leading-relaxed text-ink-soft",
            memory.kind === "voice" && "border-l-2 pl-3 italic",
          )}
          style={
            memory.kind === "voice"
              ? { borderColor: emotionSpec(memory.emotion).core }
              : undefined
          }
        >
          {memory.body}
        </p>
      ) : null}

      <div className="mt-3.5 flex flex-wrap items-center gap-2">
        {processing ? (
          <Badge tone="neutral">
            <Loader2 className="size-3 animate-spin" />
            Keepsake is listening…
          </Badge>
        ) : memory.derivedEventIds.length > 0 ? (
          <Badge tone="canon">
            {memory.derivedEventIds.length}{" "}
            {memory.derivedEventIds.length === 1 ? "moment" : "moments"} added to the timeline
          </Badge>
        ) : (
          <Badge tone="gap">Nothing extracted yet</Badge>
        )}
      </div>
    </motion.article>
  );
}

/** Deterministic fake waveform — same memory always draws the same shape. */
function Waveform({ seed }: { seed: string }) {
  const bars = Array.from({ length: 34 }, (_, i) => {
    const n = Math.abs(Math.sin((seed.charCodeAt(i % seed.length) + i * 7.3) * 1.7));
    return 0.25 + n * 0.75;
  });
  return (
    <div className="flex h-7 flex-1 items-center gap-[3px]" aria-hidden>
      {bars.map((h, i) => (
        <span
          key={i}
          className="w-[3px] shrink-0 rounded-full bg-line-strong"
          style={{ height: `${h * 100}%` }}
        />
      ))}
    </div>
  );
}
