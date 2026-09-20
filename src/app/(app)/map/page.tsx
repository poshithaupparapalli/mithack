"use client";

import { MapPinPlus, X } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useFamily } from "@/lib/family-context";
import { createPlace } from "@/lib/seed";
import { cn } from "@/lib/utils";

// Leaflet touches `window` on import, so it can never render on the server.
const FamilyMap = dynamic(() => import("@/components/map/family-map"), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-center justify-center bg-surface-sunk">
      <p className="text-sm text-ink-faint">Drawing the map…</p>
    </div>
  ),
});

export default function MapPage() {
  const { family, addPlace } = useFamily();

  const [picking, setPicking] = useState(false);
  const [draft, setDraft] = useState<{ lat: number; lng: number } | null>(null);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"current" | "historical">("historical");

  const current = family.places.filter((p) => p.kind === "current").length;
  const historical = family.places.length - current;
  const empty = family.places.length === 0;

  function cancel() {
    setPicking(false);
    setDraft(null);
    setName("");
  }

  function save() {
    if (!draft || !name.trim()) return;
    addPlace(createPlace({ name: name.trim(), lat: draft.lat, lng: draft.lng, kind }));
    cancel();
  }

  return (
    <div className="relative h-[calc(100dvh-10rem)] w-full overflow-hidden">
      <FamilyMap
        picking={picking}
        draft={draft}
        onPick={(lat, lng) => setDraft({ lat, lng })}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] p-4">
        {picking ? (
          <div className="glass pointer-events-auto flex items-center gap-3 rounded-2xl p-3.5">
            <MapPinPlus className="size-5 shrink-0 text-gap" />
            <p className="flex-1 text-sm leading-snug text-ink">
              {draft ? "Move it by tapping again." : "Tap the map where this place is."}
            </p>
            <button onClick={cancel} aria-label="Cancel" className="text-ink-faint hover:text-ink">
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <div className="glass pointer-events-auto rounded-2xl p-3.5">
            <p className="font-serif text-[1.05rem] leading-tight text-ink">
              {empty ? "Nowhere on the map yet" : "Where your family has been"}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">
              {empty
                ? "Add the places that matter — where your family came from, and where everyone ended up."
                : "Orange pins are where people live now. Pale pins are where the family has been. Lines show the journeys between them."}
            </p>
            {!empty ? (
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-soft">
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded-full border-2 border-ember bg-ember" />
                  {current} lived in today
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-3 rounded-full border-2 border-line-strong bg-surface" />
                  {historical} in the past
                </span>
              </div>
            ) : null}
            <Button
              size="sm"
              className="mt-3.5 w-full rounded-xl"
              onClick={() => setPicking(true)}
            >
              <MapPinPlus className="size-4" />
              Add a place
            </Button>
          </div>
        )}
      </div>

      {draft ? (
        <div className="absolute inset-x-0 bottom-0 z-[500] p-4">
          <div className="glass rounded-2xl p-4">
            <label
              htmlFor="place-name"
              className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-faint"
            >
              What is this place called?
            </label>
            <input
              id="place-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && save()}
              placeholder="e.g. Oaxaca de Juárez, Mexico"
              className="glass-solid mt-2 h-12 w-full rounded-xl px-3.5 text-[1rem] text-ink outline-none placeholder:text-ink-faint"
            />

            <div className="mt-3 flex gap-2">
              {(
                [
                  { value: "current", label: "Family lives here now" },
                  { value: "historical", label: "Somewhere in the past" },
                ] as const
              ).map((option) => (
                <button
                  key={option.value}
                  onClick={() => setKind(option.value)}
                  className={cn(
                    "flex-1 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                    kind === option.value
                      ? "border-ember bg-ember-soft text-ember"
                      : "border-line bg-surface/60 text-ink-soft",
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <Button size="md" className="mt-3.5 w-full rounded-xl" disabled={!name.trim()} onClick={save}>
              Add this place
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
