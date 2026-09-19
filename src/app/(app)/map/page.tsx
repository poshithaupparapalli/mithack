"use client";

import dynamic from "next/dynamic";
import { useFamily } from "@/lib/family-context";

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
  const { family } = useFamily();
  const current = family.places.filter((p) => p.kind === "current").length;
  const historical = family.places.length - current;

  return (
    <div className="relative h-[calc(100dvh-10rem)] w-full overflow-hidden">
      <FamilyMap />

      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] p-4">
        <div className="pointer-events-auto rounded-2xl border border-line bg-surface/90 p-3.5 shadow-sm backdrop-blur">
          <p className="font-serif text-[1.05rem] leading-tight text-ink">
            One family, two thousand miles
          </p>
          <p className="mt-1 text-xs leading-relaxed text-ink-soft">
            The dotted orange line is the journey Rosa and Tomás made in 1968. The green lines are
            where their grandchildren went.
          </p>
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
        </div>
      </div>
    </div>
  );
}
