"use client";

import { motion } from "framer-motion";
import {
  Baby,
  Heart,
  HelpCircle,
  MapPin,
  Plane,
  Sparkles,
  Star,
  Quote,
} from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useFamily } from "@/lib/family-context";
import type { EventCategory, FamilyEvent, Gap } from "@/lib/types";
import { orbSurface } from "@/lib/emotions";
import { cn, formatPartialDate, yearOf } from "@/lib/utils";

const CATEGORY_ICON: Record<EventCategory, typeof Baby> = {
  birth: Baby,
  marriage: Heart,
  migration: Plane,
  death: Star,
  milestone: Sparkles,
  anecdote: Quote,
};

/**
 * One vertical timeline, used for both the Family Canon and an individual's
 * thread. Open gaps are interleaved in date order so a hole in the record
 * reads as part of the story rather than a separate to-do list.
 */
export function Timeline({
  events,
  gaps = [],
  emptyMessage = "Nothing recorded yet.",
}: {
  events: FamilyEvent[];
  gaps?: Gap[];
  emptyMessage?: string;
}) {
  const { personById, placeById } = useFamily();

  if (events.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line-strong p-6 text-center text-sm text-ink-faint">
        {emptyMessage}
      </p>
    );
  }

  // Place each gap just after the event it questions.
  const rows: Array<{ kind: "event"; event: FamilyEvent } | { kind: "gap"; gap: Gap }> = [];
  for (const event of events) {
    rows.push({ kind: "event", event });
    for (const gap of gaps) {
      if (gap.relatedEventId === event.id) rows.push({ kind: "gap", gap });
    }
  }

  let lastDecade: number | null = null;

  return (
    <ol className="relative">
      {/* The rail. */}
      <span aria-hidden className="absolute bottom-4 left-[14px] top-3 w-px bg-line-strong" />

      {rows.map((row, index) => {
        if (row.kind === "gap") {
          const gap = row.gap;
          const asking = personById(gap.askPersonId);
          return (
            <li key={gap.id} className="relative pb-5 pl-11">
              <span
                className="absolute left-[3px] top-1 flex size-[23px] items-center justify-center rounded-full text-white/85"
                style={{
                  backgroundImage:
                    "radial-gradient(circle at 32% 26%, rgba(255,255,255,.85), rgba(199,187,168,.9) 48%, rgba(143,131,113,1) 100%)",
                  boxShadow: "inset 0 -4px 10px -3px rgba(0,0,0,.28)",
                }}
              >
                <HelpCircle className="size-3" strokeWidth={3} />
              </span>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.3 }}
                className="rounded-2xl border border-dashed border-gap/40 bg-gap-soft/60 p-3.5 backdrop-blur-sm"
              >
                <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-gap">
                  Missing from the record
                </p>
                <p className="mt-1.5 font-serif text-[1.02rem] leading-snug text-ink">
                  &ldquo;{gap.question}&rdquo;
                </p>
                <Link
                  href="/chat"
                  className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-medium text-ember hover:underline"
                >
                  {asking ? `Ask ${asking.name.split(" ")[0]}` : "Ask the family"}
                </Link>
              </motion.div>
            </li>
          );
        }

        const event = row.event;
        const Icon = CATEGORY_ICON[event.category];
        const place = placeById(event.placeId);
        const people = event.personIds.map(personById).filter(Boolean);
        const unconfirmed = event.confidence < 0.6;
        const decade = Math.floor(yearOf(event.date) / 10) * 10;
        const showDecade = decade !== lastDecade;
        lastDecade = decade;

        return (
          <li key={event.id} className="relative">
            {showDecade ? (
              <p className="relative -ml-0.5 mb-2 pl-11 pt-1 font-serif text-sm text-ink-faint">
                <span className="bg-canvas pr-2">{decade}s</span>
              </p>
            ) : null}

            <div className="relative pb-5 pl-11">
              <span
                className="absolute left-[3px] top-1 flex size-[23px] items-center justify-center rounded-full text-white"
                style={orbSurface(event.emotion, event.intensity ?? 0.7)}
              >
                <Icon className="size-3 drop-shadow-[0_1px_1px_rgba(0,0,0,.35)]" strokeWidth={3} />
              </span>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: Math.min(index, 8) * 0.02, duration: 0.3 }}
                className={cn(
                  "rounded-2xl p-4",
                  unconfirmed ? "border border-dashed border-line-strong bg-surface/55" : "glass-solid",
                )}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-serif text-[1.15rem] leading-snug text-ink">{event.title}</h3>
                  <span className="shrink-0 text-xs tabular-nums text-ink-faint">
                    {formatPartialDate(event.date, event.datePrecision)}
                  </span>
                </div>

                {event.summary ? (
                  <p className="mt-1.5 text-[0.94rem] leading-relaxed text-ink-soft">
                    {event.summary}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {place ? (
                    <Badge tone="neutral">
                      <MapPin className="size-3" />
                      {place.shortName}
                    </Badge>
                  ) : null}
                  {event.scope === "canon" ? (
                    <Badge tone="canon">family canon</Badge>
                  ) : (
                    <Badge tone="individual">personal</Badge>
                  )}
                  {unconfirmed ? <Badge tone="gap">unconfirmed</Badge> : null}

                  {people.length > 0 ? (
                    <span className="ml-auto flex -space-x-1.5">
                      {people.slice(0, 4).map((p) => (
                        <Avatar
                          key={p!.id}
                          id={p!.id}
                          name={p!.name}
                          deceased={!p!.isLiving}
                          className="size-6 border-2 border-surface text-[0.6rem]"
                        />
                      ))}
                    </span>
                  ) : null}
                </div>

                {event.sourceMemoryIds.length > 0 ? (
                  <p className="mt-2.5 text-xs text-ink-faint">
                    from {event.sourceMemoryIds.length}{" "}
                    {event.sourceMemoryIds.length === 1 ? "recording" : "recordings"}
                  </p>
                ) : null}
              </motion.div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
