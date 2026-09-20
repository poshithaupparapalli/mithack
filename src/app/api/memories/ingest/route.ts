import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { detectGaps } from "@/lib/server/gaps";
import { extractEvents } from "@/lib/server/muse";
import { familyDto, resolvePeople } from "@/lib/server/family";

const inputSchema = z.object({
  familyId: z.string().min(1), authorId: z.string().min(1), text: z.string().min(1).max(20000),
  kind: z.enum(["text", "voice", "photo"]).default("text"), durationSec: z.number().int().positive().optional(),
  people: z.array(z.object({ name: z.string().min(1), relationship: z.string().optional() })).default([]),
  placeId: z.string().optional(), mediaUrl: z.string().url().optional(),
});

export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const input = parsed.data;
  const family = await prisma.family.findUnique({ where: { id: input.familyId } });
  if (!family) return NextResponse.json({ error: "Family not found" }, { status: 404 });
  await prisma.user.upsert({ where: { id: input.authorId }, update: {}, create: { id: input.authorId, name: "Family member" } });
  const roster = await prisma.person.findMany({
    where: { familyId: input.familyId },
    include: { parentLinks: true, childLinks: true, spouseLinks: true, spouseOfLinks: true },
  });
  const author = roster.find((person) => person.id === input.authorId);
  const impliedIds = new Set<string>(author ? [author.id] : []);
  const addRelated = (ids: string[]) => ids.forEach((id) => impliedIds.add(id));

  // Explicit names win. Relationship language supplies candidates when the
  // contributor naturally says “my dad” or “our children” instead of a name.
  for (const person of roster) {
    const firstName = person.name.split(" ")[0].toLocaleLowerCase();
    if (firstName.length > 2 && new RegExp(`\\b${firstName.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`, "i").test(input.text)) impliedIds.add(person.id);
  }
  if (author) {
    if (/\b(mother|mom|father|dad|parent|parents)\b/i.test(input.text)) addRelated(author.parentLinks.map((link) => link.parentId));
    if (/\b(husband|wife|spouse|partner)\b/i.test(input.text)) addRelated([...author.spouseLinks.map((link) => link.rightId), ...author.spouseOfLinks.map((link) => link.leftId)]);
    if (/\b(child|children|kids|son|daughter)\b/i.test(input.text)) addRelated(author.childLinks.map((link) => link.childId));
  }
  const impliedPeople = roster.filter((person) => impliedIds.has(person.id)).map((person) => ({ name: person.name }));
  const people = [...input.people, ...impliedPeople].filter((person, index, all) => all.findIndex((other) => other.name.toLocaleLowerCase() === person.name.toLocaleLowerCase()) === index);
  const personIds = await resolvePeople(input.familyId, people);
  const memoryId = `m-${randomUUID()}`;
  await prisma.memory.create({ data: { id: memoryId, familyId: input.familyId, authorId: input.authorId, kind: input.kind.toUpperCase() as "TEXT" | "VOICE" | "PHOTO", title: input.text.split("\n")[0].slice(0, 80), body: input.text, durationSec: input.durationSec, mediaUrl: input.mediaUrl, placeId: input.placeId, people: { create: personIds.map((personId) => ({ personId })) } } });
  try {
    const familyContext = roster.map((person) => ({
      name: person.name,
      parents: person.parentLinks.map((link) => roster.find((candidate) => candidate.id === link.parentId)?.name).filter(Boolean),
      spouses: [...person.spouseLinks.map((link) => roster.find((candidate) => candidate.id === link.rightId)?.name), ...person.spouseOfLinks.map((link) => roster.find((candidate) => candidate.id === link.leftId)?.name)].filter(Boolean),
      children: person.childLinks.map((link) => roster.find((candidate) => candidate.id === link.childId)?.name).filter(Boolean),
    }));
    const extracted = await extractEvents(input.text, people, JSON.stringify(familyContext));
    for (const item of extracted) {
      // Never create an orphan event: the contributor and all inferred people
      // belong on its individual timelines unless the model names others too.
      const eventPeople = await resolvePeople(input.familyId, [...people, ...item.people]);
      await prisma.event.create({ data: {
        id: `e-${randomUUID()}`, familyId: input.familyId, title: item.title, date: item.date,
        datePrecision: item.datePrecision.toUpperCase() as "YEAR" | "MONTH" | "DAY", scope: item.scope.toUpperCase() as "CANON" | "INDIVIDUAL",
        category: item.category.toUpperCase() as "BIRTH" | "MARRIAGE" | "MIGRATION" | "DEATH" | "MILESTONE" | "ANECDOTE", summary: item.summary, confidence: item.confidence,
        people: { create: eventPeople.map((personId) => ({ personId })) }, memories: { create: { memoryId } },
      } });
    }
    await prisma.memory.update({ where: { id: memoryId }, data: { status: "READY" } });
    await detectGaps(input.familyId, personIds, input.authorId);
  } catch {
    await prisma.memory.update({ where: { id: memoryId }, data: { status: "FAILED" } });
    return NextResponse.json({ error: "Memory saved, but extraction failed", memoryId }, { status: 202 });
  }
  return NextResponse.json({ memoryId, family: await familyDto(input.familyId) }, { status: 201 });
}
