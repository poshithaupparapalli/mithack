/**
 * Keepsake data contract.
 *
 * This file is the agreed shape between the frontend (Machine 1) and the
 * Muse pipeline (Machine 2). Everything the UI renders comes from here.
 * If the backend needs to change a field, change it here first — the
 * TypeScript errors will show exactly which screens are affected.
 */

export type ID = string;

/** How precise a date we managed to extract. Family memory is fuzzy by nature. */
export type DatePrecision = "year" | "month" | "day";

/** Partial ISO: "1968" | "1968-04" | "1968-04-12" */
export type PartialDate = string;

export interface Place {
  id: ID;
  /** Display label, e.g. "Oaxaca de Juárez, Mexico" */
  name: string;
  shortName: string;
  lat: number;
  lng: number;
  /** "current" = a living relative is there now. "historical" = ancestors lived/passed through. */
  kind: "current" | "historical";
}

export interface Person {
  id: ID;
  name: string;
  fullName?: string;
  /** What the family actually calls them — used in Elderly Mode greetings. */
  nickname?: string;
  photoUrl?: string | null;
  birthYear?: number;
  deathYear?: number | null;
  isLiving: boolean;
  /** One or two sentences, written by the agent from the memories on file. */
  bio?: string;
  /** 0 = oldest documented generation. Drives tree layout. */
  generation: number;
  parentIds: ID[];
  spouseIds: ID[];
  birthPlaceId?: ID;
  currentPlaceId?: ID;
  /** How many memories this person has contributed. Fuels the home feed. */
  contributedCount: number;
  /** True when they joined through a voice-first invite. */
  prefersVoice?: boolean;
}

export type EventScope = "canon" | "individual";

export type EventCategory =
  | "birth"
  | "marriage"
  | "migration"
  | "death"
  | "milestone"
  | "anecdote";

export interface FamilyEvent {
  id: ID;
  title: string;
  date: PartialDate;
  datePrecision: DatePrecision;
  /** "canon" = a milestone the whole family shares. "individual" = one person's story. */
  scope: EventScope;
  category: EventCategory;
  personIds: ID[];
  placeId?: ID;
  summary: string;
  /** Which raw memories this event was extracted from. */
  sourceMemoryIds: ID[];
  /** 0–1. Below ~0.6 the UI shows it as unconfirmed. */
  confidence: number;
}

export type MemoryKind = "voice" | "photo" | "text";

export interface Memory {
  id: ID;
  kind: MemoryKind;
  authorId: ID;
  createdAt: string;
  title?: string;
  /** Transcript for voice, caption for photo, the note itself for text. */
  body?: string;
  mediaUrl?: string | null;
  durationSec?: number;
  personIds: ID[];
  placeId?: ID;
  derivedEventIds: ID[];
  status: "processing" | "ready";
}

/**
 * A hole in the family record that the agent wants filled.
 * This is the engine behind the AI Interviewer.
 */
export interface Gap {
  id: ID;
  /** The question, phrased the way a grandchild would ask it. */
  question: string;
  /** Why we're asking — shown to the Initiator, never to the Elder. */
  rationale: string;
  subjectPersonId: ID;
  /** Who is best placed to answer. */
  askPersonId: ID;
  relatedEventId?: ID;
  /** Higher = ask sooner. */
  priority: number;
  status: "open" | "answered" | "skipped";
}

export interface ChatMessage {
  id: ID;
  role: "agent" | "user";
  text: string;
  createdAt: string;
  kind?: "text" | "voice";
  /** Set when the agent is working a specific gap. */
  gapId?: ID;
  /** Voice messages show a duration chip. */
  durationSec?: number;
  pending?: boolean;
}

export interface Family {
  id: ID;
  name: string;
  inviteCode: string;
  people: Person[];
  places: Place[];
  events: FamilyEvent[];
  memories: Memory[];
  gaps: Gap[];
}
