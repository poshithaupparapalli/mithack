import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";

export async function detectGaps(familyId: string, personIds: string[], askPersonId: string) {
  for (const personId of personIds) {
    const events = await prisma.event.findMany({ where: { familyId, people: { some: { personId } } }, orderBy: { date: "asc" } });
    for (let index = 1; index < events.length; index += 1) {
      const before = Number(events[index - 1].date.slice(0, 4));
      const after = Number(events[index].date.slice(0, 4));
      if (after - before < 20) continue;
      const exists = await prisma.informationGap.findFirst({ where: { familyId, subjectPersonId: personId, relatedEventId: events[index].id, status: "OPEN" } });
      if (!exists) await prisma.informationGap.create({ data: { id: `g-${randomUUID()}`, familyId, subjectPersonId: personId, askPersonId, relatedEventId: events[index].id, priority: 7, question: `What do you remember about the years between ${before} and ${after}?`, rationale: "There is a long gap between two known family events." } });
    }
  }
}
