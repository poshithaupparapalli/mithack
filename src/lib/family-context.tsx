"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { mockFamily } from "@/lib/mock-data";
import type { Family, FamilyEvent, Gap, ID, Memory, Person, Place } from "@/lib/types";

/**
 * Holds the family record. Today it's seeded from mock JSON; swapping in the
 * real API means replacing `initial` with a fetch and keeping every selector.
 */

type Action =
  | { type: "addMemory"; memory: Memory }
  | { type: "resolveMemory"; id: ID; events: FamilyEvent[] }
  | { type: "answerGap"; gapId: ID; memory: Memory }
  | { type: "skipGap"; gapId: ID };

function reducer(state: Family, action: Action): Family {
  switch (action.type) {
    case "addMemory":
      return { ...state, memories: [action.memory, ...state.memories] };

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
        gaps: state.gaps.map((g) => (g.id === action.gapId ? { ...g, status: "answered" } : g)),
      };

    case "skipGap":
      return {
        ...state,
        gaps: state.gaps.map((g) => (g.id === action.gapId ? { ...g, status: "skipped" } : g)),
      };

    default:
      return state;
  }
}

interface FamilyContextValue {
  family: Family;
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
  addMemory: (memory: Memory) => void;
  resolveMemory: (id: ID, events: FamilyEvent[]) => void;
  answerGap: (gapId: ID, memory: Memory) => void;
  skipGap: (gapId: ID) => void;
}

const FamilyContext = createContext<FamilyContextValue | null>(null);

export function FamilyProvider({ children }: { children: ReactNode }) {
  const [family, dispatch] = useReducer(reducer, mockFamily);

  const byId = useMemo(() => {
    return {
      people: new Map(family.people.map((p) => [p.id, p])),
      places: new Map(family.places.map((p) => [p.id, p])),
      events: new Map(family.events.map((e) => [e.id, e])),
    };
  }, [family.people, family.places, family.events]);

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
      personById,
      placeById,
      eventById,
      timelineFor,
      memoriesFor,
      openGaps,
      nextGapFor,
      childrenOf,
      addMemory: (memory) => dispatch({ type: "addMemory", memory }),
      resolveMemory: (id, events) => dispatch({ type: "resolveMemory", id, events }),
      answerGap: (gapId, memory) => dispatch({ type: "answerGap", gapId, memory }),
      skipGap: (gapId) => dispatch({ type: "skipGap", gapId }),
    }),
    [family, personById, placeById, eventById, timelineFor, memoriesFor, openGaps, nextGapFor, childrenOf],
  );

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}

export function useFamily() {
  const ctx = useContext(FamilyContext);
  if (!ctx) throw new Error("useFamily must be used inside <FamilyProvider>");
  return ctx;
}
