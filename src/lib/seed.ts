import type { ChatMessage, Family, Gap, ID, Person, Place } from "@/lib/types";

/**
 * Keepsake starts empty.
 *
 * There is no sample family and no demo data — the first thing anyone sees is
 * their own blank sky. Everything in here exists to get a real family from
 * nothing to their first memory.
 */

let counter = 0;
export function newId(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`;
}

/** Readable invite codes, so someone can say one down the phone. */
const CODE_WORDS = [
  "lemon", "amber", "willow", "harbour", "kettle", "linen", "orchard",
  "compass", "saffron", "marble", "thimble", "lantern",
];

export function newInviteCode() {
  const pick = () => CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)];
  const a = pick();
  let b = pick();
  while (b === a) b = pick();
  return `${a}-${b}`.toUpperCase();
}

export function emptyFamily(): Family {
  return {
    id: "",
    name: "",
    inviteCode: "",
    people: [],
    places: [],
    events: [],
    memories: [],
    gaps: [],
  };
}

export function hasFamily(family: Family) {
  return family.id !== "";
}

export function createPerson(input: {
  name: string;
  nickname?: string;
  birthYear?: number;
  deathYear?: number | null;
  isLiving?: boolean;
  generation?: number;
  parentIds?: ID[];
  spouseIds?: ID[];
  birthPlaceId?: ID;
  currentPlaceId?: ID;
  prefersVoice?: boolean;
}): Person {
  return {
    id: newId("p"),
    name: input.name.trim(),
    nickname: input.nickname?.trim() || undefined,
    birthYear: input.birthYear,
    deathYear: input.deathYear ?? null,
    isLiving: input.isLiving ?? true,
    generation: input.generation ?? 0,
    parentIds: input.parentIds ?? [],
    spouseIds: input.spouseIds ?? [],
    birthPlaceId: input.birthPlaceId,
    currentPlaceId: input.currentPlaceId,
    contributedCount: 0,
    prefersVoice: input.prefersVoice,
  };
}

export function createPlace(input: {
  name: string;
  lat: number;
  lng: number;
  kind: Place["kind"];
}): Place {
  const shortName = input.name.split(",")[0]?.trim() || input.name.trim();
  return {
    id: newId("pl"),
    name: input.name.trim(),
    shortName,
    lat: input.lat,
    lng: input.lng,
    kind: input.kind,
  };
}

/**
 * The questions Keepsake opens with when it knows nothing at all.
 *
 * Deliberately answerable by anyone, in one breath, with no preparation —
 * the first answer is the hardest to get, so it has to be the easiest to give.
 */
const OPENING_QUESTIONS: Array<{ question: string; rationale: string; priority: number }> = [
  {
    question: "Who is the oldest person in your family that you can remember?",
    rationale: "The furthest back anyone can personally reach — everything else hangs off this.",
    priority: 100,
  },
  {
    question: "Tell me about someone in your family who isn't here any more.",
    rationale: "The memories most at risk of being lost are the ones nobody has been asked for.",
    priority: 92,
  },
  {
    question: "What's a story your family tells over and over?",
    rationale: "The stories a family repeats are the ones it has decided matter. Easy to answer, rich to parse.",
    priority: 84,
  },
  {
    question: "Where did your family come from, as far back as anyone knows?",
    rationale: "Establishes the first places on the map and usually surfaces a migration.",
    priority: 76,
  },
  {
    question: "What's the earliest thing you can remember?",
    rationale: "Anchors the timeline at its shallow end and tends to unlock sensory detail.",
    priority: 68,
  },
];

export function openingGaps(askPersonId: ID): Gap[] {
  return OPENING_QUESTIONS.map((q) => ({
    id: newId("g"),
    question: q.question,
    rationale: q.rationale,
    subjectPersonId: askPersonId,
    askPersonId,
    priority: q.priority,
    status: "open" as const,
  }));
}

/** Someone was added to the tree and nobody has told a story about them yet. */
export function gapForPerson(person: Person, askPersonId: ID): Gap {
  return {
    id: newId("g"),
    question: person.isLiving
      ? `Tell me something about ${person.name.split(" ")[0]}.`
      : `What do you remember about ${person.name.split(" ")[0]}?`,
    rationale: `${person.name} is on the tree, but there isn't a single story attached to them yet.`,
    subjectPersonId: person.id,
    askPersonId,
    priority: person.isLiving ? 72 : 88,
    status: "open",
  };
}

export function welcomeChat(firstName: string, question?: string): ChatMessage[] {
  const now = new Date().toISOString();
  const messages: ChatMessage[] = [
    {
      id: newId("c"),
      role: "agent",
      text: `Hello ${firstName}. There's nothing here yet — that's the point. Whatever you tell me, I'll keep.`,
      createdAt: now,
    },
  ];
  if (question) {
    messages.push({
      id: newId("c"),
      role: "agent",
      text: question,
      createdAt: now,
    });
  }
  return messages;
}
