"use client";

import { CalendarClock, Home, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { MemoryCard } from "@/components/memory/memory-card";
import { useFamily } from "@/lib/family-context";
import type { ID } from "@/lib/types";
import { lifespan } from "@/lib/utils";

/** Slides up from the bottom on phones, in from the right on wider screens. */
export function PersonPanel({
  personId,
  onOpenChange,
}: {
  personId: ID | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { personById, placeById, memoriesFor, timelineFor, openGaps, childrenOf } = useFamily();
  const person = personId ? personById(personId) : undefined;

  // Parent unmounts us to close, so Radix keeps ownership of the exit animation.
  if (!person) return null;

  const birthPlace = placeById(person.birthPlaceId);
  const currentPlace = placeById(person.currentPlaceId);
  const memories = memoriesFor(person.id);
  const events = timelineFor(person.id);
  const gap = openGaps.find((g) => g.subjectPersonId === person.id);
  const parents = person.parentIds.map(personById).filter(Boolean);
  const kids = childrenOf(person.id);

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent title={person.name} description={person.bio} className="overflow-y-auto">
        <div className="px-5 pb-8 pt-5">
          <div className="flex items-start gap-4">
            <Avatar
              id={person.id}
              name={person.name}
              deceased={!person.isLiving}
              className="size-16 text-xl"
            />
            <div className="min-w-0 flex-1 pr-8">
              <h2 className="font-serif text-2xl leading-tight text-ink">
                {person.fullName ?? person.name}
              </h2>
              <p className="mt-0.5 text-sm text-ink-soft">
                {lifespan(person.birthYear, person.deathYear)}
                {!person.isLiving ? " · in memory" : ""}
              </p>
              {person.nickname ? (
                <p className="mt-1.5 font-serif italic text-ink-soft">
                  the family calls {person.isLiving ? "her" : "them"} &ldquo;{person.nickname}&rdquo;
                </p>
              ) : null}
            </div>
          </div>

          {person.bio ? (
            <p className="mt-4 text-[0.97rem] leading-relaxed text-ink-soft">{person.bio}</p>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            {birthPlace ? (
              <Badge tone="neutral">
                <MapPin className="size-3" />
                born in {birthPlace.shortName}
              </Badge>
            ) : null}
            {currentPlace ? (
              <Badge tone="canon">
                <Home className="size-3" />
                lives in {currentPlace.shortName}
              </Badge>
            ) : null}
            {person.prefersVoice ? <Badge tone="individual">joined by voice</Badge> : null}
          </div>

          {gap ? (
            <div className="mt-5 rounded-2xl border border-gap/25 bg-gap-soft/70 p-4">
              <Badge tone="gap">
                <Sparkles className="size-3" />
                Keepsake wants to know
              </Badge>
              <p className="mt-2.5 font-serif text-[1.05rem] leading-snug text-ink">
                &ldquo;{gap.question}&rdquo;
              </p>
              <Button size="sm" className="mt-3 w-full" asChild>
                <Link href="/chat">Ask now</Link>
              </Button>
            </div>
          ) : null}

          <Button variant="secondary" size="md" className="mt-5 w-full justify-between" asChild>
            <Link href={`/timeline?person=${person.id}`}>
              <span className="flex items-center gap-2">
                <CalendarClock className="size-[18px]" />
                View individual timeline
              </span>
              <span className="text-sm text-ink-faint">{events.length}</span>
            </Link>
          </Button>

          {(parents.length > 0 || kids.length > 0) && (
            <div className="mt-6 grid grid-cols-2 gap-4">
              <Relations label="Parents" people={parents.map((p) => p!.name)} />
              <Relations label="Children" people={kids.map((p) => p.name)} />
            </div>
          )}

          {memories.length > 0 ? (
            <section className="mt-7">
              <h3 className="font-serif text-lg text-ink">
                {memories.length} {memories.length === 1 ? "story" : "stories"}
              </h3>
              <div className="mt-3 flex flex-col gap-3">
                {memories.map((memory, i) => (
                  <MemoryCard key={memory.id} memory={memory} index={i} />
                ))}
              </div>
            </section>
          ) : (
            <p className="mt-7 rounded-2xl border border-dashed border-line-strong p-4 text-sm text-ink-faint">
              Nobody has recorded anything about {person.name.split(" ")[0]} yet.
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Relations({ label, people }: { label: string; people: string[] }) {
  if (people.length === 0) return <div />;
  return (
    <div>
      <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
      <ul className="mt-1.5 flex flex-col gap-0.5">
        {people.map((name) => (
          <li key={name} className="text-sm text-ink-soft">
            {name}
          </li>
        ))}
      </ul>
    </div>
  );
}
