"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMapEvents } from "react-leaflet";
import { useFamily } from "@/lib/family-context";
import type { FamilyEvent, Person, Place } from "@/lib/types";
import { formatPartialDate } from "@/lib/utils";

function pinIcon(kind: Place["kind"], count: number, pending = false) {
  const current = kind === "current";
  const bg = pending ? "var(--color-gap)" : current ? "var(--color-ember)" : "var(--color-surface)";
  const fg = pending || current ? "#ffffff" : "var(--color-ink-soft)";
  const border = pending
    ? "var(--color-gap)"
    : current
      ? "var(--color-ember)"
      : "var(--color-line-strong)";

  return L.divIcon({
    className: "keepsake-pin",
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16],
    html: `
      <span style="
        display:flex;align-items:center;justify-content:center;
        width:34px;height:34px;border-radius:999px;
        background:${bg};color:${fg};
        border:2px solid ${border};
        box-shadow:0 2px 8px rgba(28,25,23,.22);
        font:600 13px/1 ui-sans-serif,system-ui,sans-serif;
      ">${pending ? "?" : count || ""}</span>`,
  });
}

/** Turns a tap on the map into a coordinate, only while we're expecting one. */
function DropPin({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export default function FamilyMap({
  picking = false,
  draft = null,
  onPick,
}: {
  picking?: boolean;
  draft?: { lat: number; lng: number } | null;
  onPick?: (lat: number, lng: number) => void;
}) {
  const { family, placeById } = useFamily();

  const { migration, dispersal, peopleAt, eventsAt, centre } = useMemo(() => {
    const migrationEvents = family.events
      .filter((e) => e.category === "migration" && e.placeId)
      .sort((a, b) => a.date.localeCompare(b.date));

    const migration = migrationEvents
      .map((e) => placeById(e.placeId))
      .filter((p): p is Place => Boolean(p));

    const migrationPairs = new Set(
      migration.slice(0, -1).map((p, i) => `${p.id}->${migration[i + 1].id}`),
    );

    // Everyone who has moved away from where they were born, minus the
    // original journey we've already drawn.
    const dispersal = family.people
      .filter(
        (p) =>
          p.isLiving &&
          p.birthPlaceId &&
          p.currentPlaceId &&
          p.birthPlaceId !== p.currentPlaceId &&
          !migrationPairs.has(`${p.birthPlaceId}->${p.currentPlaceId}`),
      )
      .map((p) => ({
        person: p,
        from: placeById(p.birthPlaceId),
        to: placeById(p.currentPlaceId),
      }))
      .filter((d): d is { person: Person; from: Place; to: Place } => Boolean(d.from && d.to));

    const peopleAt = new Map<string, string[]>();
    for (const person of family.people) {
      if (!person.isLiving || !person.currentPlaceId) continue;
      const list = peopleAt.get(person.currentPlaceId) ?? [];
      list.push(person.name);
      peopleAt.set(person.currentPlaceId, list);
    }

    const eventsAt = new Map<string, FamilyEvent[]>();
    for (const event of family.events) {
      if (!event.placeId) continue;
      const list = eventsAt.get(event.placeId) ?? [];
      list.push(event);
      eventsAt.set(event.placeId, list);
    }

    // Open on the family's own places once there are any.
    const centre: [number, number] = family.places.length
      ? [
          family.places.reduce((sum, p) => sum + p.lat, 0) / family.places.length,
          family.places.reduce((sum, p) => sum + p.lng, 0) / family.places.length,
        ]
      : [25, -20];

    return { migration, dispersal, peopleAt, eventsAt, centre };
  }, [family.events, family.people, family.places, placeById]);

  return (
    <MapContainer
      center={centre}
      zoom={family.places.length ? 4 : 2}
      scrollWheelZoom
      zoomControl={false}
      className="size-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {picking && onPick ? <DropPin onPick={onPick} /> : null}

      {draft ? (
        <Marker position={[draft.lat, draft.lng]} icon={pinIcon("historical", 0, true)} />
      ) : null}

      {/* The journey — whatever migrations the family has recorded, in order. */}
      {migration.length > 1 ? (
        <Polyline
          positions={migration.map((p) => [p.lat, p.lng] as [number, number])}
          pathOptions={{ color: "var(--color-ember)", weight: 3, dashArray: "1 8", lineCap: "round" }}
        />
      ) : null}

      {/* Where the next generations went. */}
      {dispersal.map(({ person, from, to }) => (
        <Polyline
          key={person.id}
          positions={[
            [from.lat, from.lng],
            [to.lat, to.lng],
          ]}
          pathOptions={{ color: "var(--color-canon)", weight: 1.5, dashArray: "3 6", opacity: 0.75 }}
        />
      ))}

      {family.places.map((place) => {
        const residents = peopleAt.get(place.id) ?? [];
        const events = eventsAt.get(place.id) ?? [];
        return (
          <Marker
            key={place.id}
            position={[place.lat, place.lng]}
            icon={pinIcon(place.kind, residents.length)}
          >
            <Popup>
              <span className="block font-serif text-[1.05rem] leading-tight text-ink">
                {place.name}
              </span>
              {residents.length > 0 ? (
                <span className="mt-1 block text-[0.8rem] text-ink-soft">
                  {residents.join(", ")} {residents.length === 1 ? "lives" : "live"} here now
                </span>
              ) : (
                <span className="mt-1 block text-[0.8rem] text-ink-faint">
                  {place.kind === "current" ? "No one here yet" : "No one lives here any more"}
                </span>
              )}
              {events.length > 0 ? (
                <span className="mt-2 block border-t border-line pt-2 text-[0.8rem] text-ink-soft">
                  {events.slice(0, 3).map((e) => (
                    <span key={e.id} className="block">
                      <span className="tabular-nums text-ink-faint">
                        {formatPartialDate(e.date, "year")}
                      </span>{" "}
                      {e.title}
                    </span>
                  ))}
                  {events.length > 3 ? (
                    <span className="block text-ink-faint">+{events.length - 3} more</span>
                  ) : null}
                </span>
              ) : null}
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
