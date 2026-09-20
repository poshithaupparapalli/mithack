import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import type { Family, FamilyEvent, Memory, Person, Place } from "@/lib/types";

const familyInclude = {
  people: { include: { parentLinks: true, spouseLinks: true, spouseOfLinks: true }, orderBy: { generation: "asc" } },
  places: true,
  events: { include: { people: true, memories: true }, orderBy: { date: "asc" } },
  memories: { include: { people: true, eventLinks: true }, orderBy: { createdAt: "desc" } },
  gaps: { orderBy: { priority: "desc" } },
} as const;

export async function ensureDemoFamily() {
  const id = "fam-demo";
  await prisma.family.upsert({
    where: { id },
    update: {},
    create: { id, name: "New family", inviteCode: "NEW-FAMILY" },
  });
  return id;
}

export async function familyRecord(familyId: string) {
  return prisma.family.findUnique({ where: { id: familyId }, include: familyInclude });
}

export async function familyDto(familyId: string): Promise<Family | null> {
  const record = await familyRecord(familyId);
  if (!record) return null;
  return {
    id: record.id, name: record.name, inviteCode: record.inviteCode,
    people: record.people.map((person): Person => ({
      id: person.id, name: person.name, fullName: person.fullName ?? undefined, nickname: person.nickname ?? undefined,
      photoUrl: person.photoUrl, birthYear: person.birthYear ?? undefined, deathYear: person.deathYear,
      isLiving: person.isLiving, bio: person.bio ?? undefined, generation: person.generation,
      parentIds: person.parentLinks.map((link) => link.parentId),
      spouseIds: [...person.spouseLinks.map((link) => link.rightId), ...person.spouseOfLinks.map((link) => link.leftId)],
      birthPlaceId: person.birthPlaceId ?? undefined, currentPlaceId: person.currentPlaceId ?? undefined,
      contributedCount: person.contributedCount, prefersVoice: person.prefersVoice,
    })),
    places: record.places.map((place): Place => ({ ...place, kind: place.kind as Place["kind"] })),
    events: record.events.map((event): FamilyEvent => ({
      id: event.id, title: event.title, date: event.date, datePrecision: event.datePrecision.toLowerCase() as FamilyEvent["datePrecision"],
      scope: event.scope.toLowerCase() as FamilyEvent["scope"], category: event.category.toLowerCase() as FamilyEvent["category"],
      personIds: event.people.map((link) => link.personId), placeId: event.placeId ?? undefined, summary: event.summary,
      sourceMemoryIds: event.memories.map((link) => link.memoryId), confidence: event.confidence,
    })),
    memories: record.memories.map((memory): Memory => ({
      id: memory.id, kind: memory.kind.toLowerCase() as Memory["kind"], authorId: memory.authorId,
      createdAt: memory.createdAt.toISOString(), title: memory.title ?? undefined, body: memory.body ?? undefined,
      mediaUrl: memory.mediaUrl, durationSec: memory.durationSec ?? undefined, personIds: memory.people.map((link) => link.personId),
      placeId: memory.placeId ?? undefined, derivedEventIds: memory.eventLinks.map((link) => link.eventId),
      status: memory.status === "READY" ? "ready" : "processing",
    })),
    gaps: record.gaps.map((gap) => ({
      id: gap.id, question: gap.question, rationale: gap.rationale, subjectPersonId: gap.subjectPersonId,
      askPersonId: gap.askPersonId, relatedEventId: gap.relatedEventId ?? undefined, priority: gap.priority,
      status: gap.status.toLowerCase() as Family["gaps"][number]["status"],
    })),
  };
}

export async function resolvePeople(familyId: string, people: { name: string; relationship?: string }[]) {
  const resolved: string[] = [];
  for (const entry of people) {
    const name = entry.name.trim();
    if (!name) continue;
    const existing = await prisma.person.findFirst({ where: { familyId, name: { equals: name } } });
    const person = existing ?? await prisma.person.create({
      data: { id: `p-${randomUUID()}`, familyId, name, fullName: name, isLiving: true, bio: entry.relationship ? `${entry.relationship} in the family.` : undefined },
    });
    resolved.push(person.id);
  }
  return [...new Set(resolved)];
}
