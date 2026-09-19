"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Segmented } from "@/components/ui/segmented";
import { Timeline } from "@/components/timeline/timeline";
import { useFamily } from "@/lib/family-context";
import { useSettings } from "@/lib/settings-context";
import { cn } from "@/lib/utils";

type Scope = "canon" | "individual";

function TimelineView() {
  const params = useSearchParams();
  const { family, timelineFor, openGaps, personById } = useFamily();
  const { currentUserId } = useSettings();

  const requested = params.get("person");
  const [scope, setScope] = useState<Scope>(requested ? "individual" : "canon");
  const [personId, setPersonId] = useState(requested ?? currentUserId);

  const canonCount = timelineFor("canon").length;
  const individualCount = timelineFor(personId).length;
  const events = scope === "canon" ? timelineFor("canon") : timelineFor(personId);
  const person = personById(personId);

  // Only surface gaps on the thread they belong to.
  const gaps =
    scope === "canon"
      ? openGaps
      : openGaps.filter((g) => g.subjectPersonId === personId || g.askPersonId === personId);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-5">
      <Segmented<Scope>
        layoutId="timeline-scope"
        value={scope}
        onChange={setScope}
        options={[
          { value: "canon", label: "Family canon", count: canonCount },
          { value: "individual", label: "One person", count: individualCount },
        ]}
      />

      {scope === "canon" ? (
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          The moments the whole family shares — births, marriages, the move north, the losses.
        </p>
      ) : (
        <>
          <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1">
            {family.people.map((p) => {
              const active = p.id === personId;
              return (
                <button
                  key={p.id}
                  onClick={() => setPersonId(p.id)}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-sm transition-colors",
                    active
                      ? "border-ember bg-ember-soft text-ember"
                      : "border-line bg-surface text-ink-soft hover:border-line-strong",
                  )}
                >
                  <Avatar
                    id={p.id}
                    name={p.name}
                    deceased={!p.isLiving}
                    className="size-6 text-[0.6rem]"
                  />
                  {p.name.split(" ")[0]}
                </button>
              );
            })}
          </div>
          {person ? (
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {person.name}&apos;s own thread — the stories that belong to{" "}
              {person.isLiving ? "them" : "their memory"} alone.
            </p>
          ) : null}
        </>
      )}

      <div className="mt-6">
        <Timeline
          events={events}
          gaps={gaps}
          emptyMessage={
            scope === "individual" && person
              ? `Nothing recorded about ${person.name.split(" ")[0]} yet. Ask them a question to start.`
              : "Nothing recorded yet."
          }
        />
      </div>
    </div>
  );
}

export default function TimelinePage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-ink-faint">Loading the timeline…</div>}>
      <TimelineView />
    </Suspense>
  );
}
