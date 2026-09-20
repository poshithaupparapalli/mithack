import { NextResponse } from "next/server";
import { familyDto } from "@/lib/server/family";

export async function GET(_request: Request, context: { params: Promise<{ familyId: string }> }) {
  const { familyId } = await context.params;
  const family = await familyDto(familyId);
  return family ? NextResponse.json(family) : NextResponse.json({ error: "Family not found" }, { status: 404 });
}
