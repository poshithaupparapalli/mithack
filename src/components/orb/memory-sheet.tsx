"use client";

import { Loader2, MapPin, Volume2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { MemoryOrb } from "@/components/orb/memory-orb";
import { emotionSpec } from "@/lib/emotions";
import { useFamily } from "@/lib/family-context";
import { useSpeech } from "@/lib/use-speech";
import type { Memory } from "@/lib/types";
import { relativeTime } from "@/lib/utils";

export function MemorySheet({
  memory,
  onOpenChange,
}: {
  memory: Memory | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { personById, placeById, eventById } = useFamily();
  const { speak, stop, speaking, supported } = useSpeech();

  if (!memory) return null;

  const author = personById(memory.authorId);
  const place = placeById(memory.placeId);
  const spec = emotionSpec(memory.emotion);
  const events = memory.derivedEventIds.map(eventById).filter(Boolean);

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) stop();
        onOpenChange(open);
      }}
    >
      <SheetContent
        title={memory.title ?? "A memory"}
        description={memory.body}
        className="overflow-y-auto"
      >
        {/* The orb bleeds up out of the top of the sheet, as in the reference. */}
        <div className="relative h-36 overflow-hidden">
          <span
            aria-hidden
            className="absolute -top-16 left-1/2 size-72 -translate-x-1/2 rounded-full"
            style={{
              background: `radial-gradient(circle, ${spec.wash} 0%, transparent 70%)`,
              filter: "blur(18px)",
            }}
          />
          <MemoryOrb
            emotion={memory.emotion}
            intensity={memory.intensity ?? 0.8}
            size={220}
            className="absolute -top-20 left-1/2 -translate-x-1/2"
          />
        </div>

        <div className="-mt-6 px-5 pb-10">
          <div className="flex items-center justify-center gap-2">
            <span
              className="text-[0.72rem] font-semibold uppercase tracking-[0.2em]"
              style={{ color: spec.ink }}
            >
              {spec.label}
            </span>
          </div>

          <h2 className="mt-3 text-center font-serif text-[1.7rem] leading-tight text-ink">
            {memory.title}
          </h2>

          <div className="mt-4 flex items-center justify-center gap-2.5">
            {author ? <Avatar id={author.id} name={author.name} className="size-8 text-xs" /> : null}
            <p className="text-sm text-ink-soft">
              {author?.name}
              <span className="text-ink-faint"> · {relativeTime(memory.createdAt)}</span>
            </p>
          </div>

          {memory.status === "processing" ? (
            <p className="mt-6 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-line-strong py-4 text-sm text-ink-faint">
              <Loader2 className="size-4 animate-spin" />
              Keepsake is still listening to this one
            </p>
          ) : null}

          {memory.body ? (
            <blockquote
              className="mt-6 border-l-[3px] pl-5 font-serif text-[1.18rem] leading-[1.6] text-ink"
              style={{ borderColor: spec.core }}
            >
              {memory.body}
            </blockquote>
          ) : null}

          {supported && memory.body ? (
            <button
              onClick={() => (speaking ? stop() : speak(memory.body ?? ""))}
              className="glass mt-6 flex w-full items-center justify-center gap-2.5 rounded-2xl py-3.5 text-[0.95rem] font-medium text-ink"
            >
              <Volume2 className="size-[18px]" style={{ color: speaking ? spec.core : undefined }} />
              {speaking ? "Stop" : "Read it aloud"}
            </button>
          ) : null}

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {place ? (
              <Badge tone="neutral">
                <MapPin className="size-3" />
                {place.shortName}
              </Badge>
            ) : null}
            {memory.durationSec ? (
              <Badge tone="neutral">{Math.round(memory.durationSec / 60) || 1} min spoken</Badge>
            ) : null}
          </div>

          {events.length > 0 ? (
            <div className="mt-7">
              <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-faint">
                What Keepsake took from this
              </p>
              <ul className="mt-2.5 flex flex-col gap-2">
                {events.map((event) => (
                  <li
                    key={event!.id}
                    className="glass-solid flex items-center gap-3 rounded-2xl px-3.5 py-3"
                  >
                    <MemoryOrb
                      emotion={event!.emotion}
                      intensity={event!.intensity ?? 0.7}
                      size={26}
                      halo={false}
                    />
                    <span className="min-w-0 flex-1 text-sm text-ink">{event!.title}</span>
                    <span className="shrink-0 text-xs tabular-nums text-ink-faint">
                      {event!.date.slice(0, 4)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
