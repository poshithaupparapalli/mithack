import type { Person } from "@/lib/types";

export const NODE_W = 168;
export const NODE_H = 92;
const GAP_X = 40;
const GAP_Y = 108;

export interface LaidOutPerson {
  person: Person;
  x: number;
  y: number;
}

/**
 * Generational layout: one row per generation, spouses kept adjacent, then a
 * bottom-up pass that re-centres each parent over their children. Good enough
 * for a family-sized graph; swap for dagre if the tree ever gets wide.
 */
export function layoutFamily(people: Person[]): LaidOutPerson[] {
  const generations = [...new Set(people.map((p) => p.generation))].sort((a, b) => a - b);
  const placed = new Map<string, { x: number; y: number }>();
  const rows = new Map<number, string[]>();

  // Pass 1 — stable order per row, pulling each spouse in beside their partner.
  for (const gen of generations) {
    const inGen = people.filter((p) => p.generation === gen);
    const order: string[] = [];
    const seen = new Set<string>();

    for (const person of inGen) {
      if (seen.has(person.id)) continue;
      order.push(person.id);
      seen.add(person.id);
      for (const spouseId of person.spouseIds) {
        const spouse = inGen.find((p) => p.id === spouseId);
        if (spouse && !seen.has(spouse.id)) {
          order.push(spouse.id);
          seen.add(spouse.id);
        }
      }
    }

    rows.set(gen, order);
    order.forEach((id, i) => {
      placed.set(id, { x: i * (NODE_W + GAP_X), y: gen * (NODE_H + GAP_Y) });
    });
  }

  // Pass 2 — bottom-up, pull parents over the midpoint of their children.
  for (const gen of [...generations].reverse()) {
    const order = rows.get(gen) ?? [];
    for (const id of order) {
      const children = people.filter((p) => p.parentIds.includes(id));
      if (children.length === 0) continue;
      const xs = children.map((c) => placed.get(c.id)?.x ?? 0);
      const centre = (Math.min(...xs) + Math.max(...xs)) / 2;

      const self = placed.get(id);
      if (!self) continue;
      // Couples move together so they stay side by side.
      const partnerId = people
        .find((p) => p.id === id)
        ?.spouseIds.find((s) => rows.get(gen)?.includes(s));
      const partner = partnerId ? placed.get(partnerId) : undefined;

      if (partner) {
        const pairCentre = (self.x + partner.x) / 2;
        const delta = centre - pairCentre;
        placed.set(id, { ...self, x: self.x + delta });
        placed.set(partnerId!, { ...partner, x: partner.x + delta });
      } else {
        placed.set(id, { ...self, x: centre });
      }
    }

    // De-overlap the row, left to right.
    const sorted = [...order].sort((a, b) => (placed.get(a)?.x ?? 0) - (placed.get(b)?.x ?? 0));
    for (let i = 1; i < sorted.length; i += 1) {
      const prev = placed.get(sorted[i - 1])!;
      const cur = placed.get(sorted[i])!;
      const minX = prev.x + NODE_W + GAP_X;
      if (cur.x < minX) placed.set(sorted[i], { ...cur, x: minX });
    }
  }

  return people.map((person) => ({
    person,
    x: placed.get(person.id)?.x ?? 0,
    y: placed.get(person.id)?.y ?? 0,
  }));
}
