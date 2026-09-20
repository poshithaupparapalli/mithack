import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { interviewerQuestion } from "@/lib/server/muse";

const inputSchema = z.object({ familyId: z.string().min(1), personId: z.string().min(1), gapId: z.string().optional() });

export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const { familyId, personId, gapId } = parsed.data;
  const gap = await prisma.informationGap.findFirst({ where: { familyId, status: "OPEN", ...(gapId ? { id: gapId } : { askPersonId: personId }) }, orderBy: { priority: "desc" } });
  if (!gap) return NextResponse.json({ question: "Is there a story from your family that you would like to save today?", gapId: null });
  const subject = await prisma.person.findUnique({ where: { id: gap.subjectPersonId }, select: { name: true } });
  const question = await interviewerQuestion(gap.question, `The missing story concerns ${subject?.name ?? "a family member"}.`);
  return NextResponse.json({ question, gapId: gap.id, subjectPersonId: gap.subjectPersonId });
}
