"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import {
  emptyFamily,
  gapForPerson,
  hasFamily as familyExists,
  newInviteCode,
  openingGaps,
} from "@/lib/seed";
import type { Family, FamilyEvent, Gap, ID, Memory, Person, Place } from "@/lib/types";

/** How a new person hangs off someone already on the tree. */
export type RelationLink = { personId: ID; relation: "parent" | "child" | "partner" };

const STORAGE_KEY = "keepsake.family.v1";

/**
 * The family record. Starts genuinely empty and is built up entirely by the
 * people using it, then persisted to localStorage so a family's memories
 * survive closing the tab.
 *
 * Swapping in the API means replacing the hydrate/persist effects with fetch
 * and PATCH; every selector below stays exactly as it is.
 */

type Action =
  | { type: "hydrate"; family: Family }
  | { type: "createFamily"; name: string; founder: Person }
  | { type: "addPerson"; person: Person; askPersonId: ID; link?: RelationLink }
  | { type: "addPlace"; place: Place }
  | { type: "addMemory"; memory: Memory }
  | { type: "resolveMemory"; id: ID; events: FamilyEvent[] }
  | { type: "answerGap"; gapId: ID; memory: Memory }
  | { type: "skipGap"; gapId: ID }
  | { type: "reset" };

function reducer(state: Family, action: Action): Family {
  switch (action.type) {
    case "hydrate":
      return action.family;

    case "createFamily":
      return {
        ...emptyFamily(),
        id: `fam-${Date.now().toString(36)}`,
        name: action.name,
        inviteCode: newInviteCode(),
        people: [action.founder],
        gaps: openingGaps(action.founder.id),
      };

    case "addPerson": {
      // Relationships are two-sided: adding a mother also makes someone a child.
      let people = state.people;
      let person = action.person;
      const other = action.link
        ? state.people.find((p) => p.id === action.link!.personId)
        : undefined;

      if (other && action.link) {
        if (action.link.relation === "parent") {
          person = { ...person, generation: other.generation - 1 };
          people = people.map((p) =>
            p.id === other.id ? { ...p, parentIds: [...p.parentIds, person.id] } : p,
          );
        } else if (action.link.relation === "child") {
          person = {
            ...person,
            generation: other.generation + 1,
            parentIds: [other.id, ...other.spouseIds],
          };
        } else {
          person = { ...person, generation: other.generation, spouseIds: [other.id] };
          people = people.map((p) =>
            p.id === other.id ? { ...p, spouseIds: [...p.spouseIds, person.id] } : p,
          );
        }
      }

      return {
        ...state,
        people: [...people, person],
        // A new face with no stories is itself a question worth asking.
        gaps: [...state.gaps, gapForPerson(person, action.askPersonId)],
      };
    }

    case "addPlace":
      return { ...state, places: [...state.places, action.place] };

    case "addMemory":
      return {
        ...state,
        memories: [action.memory, ...state.memories],
        people: state.people.map((p) =>
          p.id === action.memory.authorId
            ? { ...p, contributedCount: p.contributedCount + 1 }
            : p,
        ),
      };

    case "resolveMemory":
      // The pipeline came back: mark the memory ready and fold in what it found.
      return {
        ...state,
        memories: state.memories.map((m) =>
          m.id === action.id
            ? { ...m, status: "ready", derivedEventIds: action.events.map((e) => e.id) }
            : m,
        ),
        events: [...state.events, ...action.events],
      };

    case "answerGap":
      return {
        ...state,
        memories: [action.memory, ...state.memories],
        people: state.people.map((p) =>
          p.id === action.memory.authorId
            ? { ...p, contributedCount: p.contributedCount + 1 }
            : p,
        ),
        gaps: state.gaps.map((g) => (g.id === action.gapId ? { ...g, status: "answered" } : g)),
      };

    case "skipGap":
      return {
        ...state,
        gaps: state.gaps.map((g) => (g.id === action.gapId ? { ...g, status: "skipped" } : g)),
      };

    case "reset":
      return emptyFamily();

    default:
      return state;
  }
}

interface FamilyContextValue {
  family: Family;
  /** False until localStorage has been read — screens must not flash empty. */
  hydrated: boolean;
  /** True once someone has actually started a family. */
  hasFamily: boolean;
  personById: (id: ID) => Person | undefined;
  placeById: (id?: ID) => Place | undefined;
  eventById: (id: ID) => FamilyEvent | undefined;
  /** Canon events, or one person's individual thread, oldest first. */
  timelineFor: (scope: "canon" | ID) => FamilyEvent[];
  memoriesFor: (personId: ID) => Memory[];
  openGaps: Gap[];
  /** The next question the interviewer should ask this person. */
  nextGapFor: (personId: ID) => Gap | undefined;
  childrenOf: (id: ID) => Person[];
  createFamily: (name: string, founder: Person) => void;
  addPerson: (person: Person, askPersonId: ID, link?: RelationLink) => void;
  addPlace: (place: Place) => void;
  addMemory: (memory: Memory) => void;
  resolveMemory: (id: ID, events: FamilyEvent[]) => void;
  answerGap: (gapId: ID, memory: Memory) => void;
  skipGap: (gapId: ID) => void;
  reset: () => void;
}

const FamilyContext = createContext<FamilyContextValue | null>(null);

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [family, dispatch] = useReducer(reducer, emptyFamily());
  const [hydrated, setHydrated] = useReducer(() => true, false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "hydrate", family: JSON.parse(raw) as Family });
    } catch {
      /* corrupt or unavailable storage — start fresh rather than crash */
    }
    setHydrated();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(family));
    } catch {
      /* private browsing — memories just won't survive the tab */
    }
  }, [family, hydrated]);

  const byId = useMemo(
    () => ({
      people: new Map(family.people.map((p) => [p.id, p])),
      places: new Map(family.places.map((p) => [p.id, p])),
      events: new Map(family.events.map((e) => [e.id, e])),
    }),
    [family.people, family.places, family.events],
  );

  const personById = useCallback((id: ID) => byId.people.get(id), [byId]);
  const placeById = useCallback((id?: ID) => (id ? byId.places.get(id) : undefined), [byId]);
  const eventById = useCallback((id: ID) => byId.events.get(id), [byId]);

  const timelineFor = useCallback(
    (scope: "canon" | ID) => {
      const matches =
        scope === "canon"
          ? family.events.filter((e) => e.scope === "canon")
          : family.events.filter((e) => e.personIds.includes(scope));
      return [...matches].sort((a, b) => a.date.localeCompare(b.date));
    },
    [family.events],
  );

  const memoriesFor = useCallback(
    (personId: ID) =>
      family.memories.filter((m) => m.authorId === personId || m.personIds.includes(personId)),
    [family.memories],
  );

  const openGaps = useMemo(
    () => family.gaps.filter((g) => g.status === "open").sort((a, b) => b.priority - a.priority),
    [family.gaps],
  );

  const nextGapFor = useCallback(
    (personId: ID) => openGaps.find((g) => g.askPersonId === personId) ?? openGaps[0],
    [openGaps],
  );

  const childrenOf = useCallback(
    (id: ID) => family.people.filter((p) => p.parentIds.includes(id)),
    [family.people],
  );

  const value = useMemo<FamilyContextValue>(
    () => ({
      family,
      hydrated,
      hasFamily: familyExists(family),
      personById,
      placeById,
      eventById,
      timelineFor,
      memoriesFor,
      openGaps,
      nextGapFor,
      childrenOf,
      createFamily: (name, founder) => dispatch({ type: "createFamily", name, founder }),
      addPerson: (person, askPersonId, link) =>
        dispatch({ type: "addPerson", person, askPersonId, link }),
      addPlace: (place) => dispatch({ type: "addPlace", place }),
      addMemory: (memory) => dispatch({ type: "addMemory", memory }),
      resolveMemory: (id, events) => dispatch({ type: "resolveMemory", id, events }),
      answerGap: (gapId, memory) => dispatch({ type: "answerGap", gapId, memory }),
      skipGap: (gapId) => dispatch({ type: "skipGap", gapId }),
      reset: () => dispatch({ type: "reset" }),
    }),
    [
      family,
      hydrated,
      personById,
      placeById,
      eventById,
      timelineFor,
      memoriesFor,
      openGaps,
      nextGapFor,
      childrenOf,
    ],
  );

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}

export function useFamily() {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error("useFamily must be used inside <FamilyProvider>");
  return ctx;
}
