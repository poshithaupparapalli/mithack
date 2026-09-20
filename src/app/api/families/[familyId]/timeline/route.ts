import { NextResponse } from "next/server";
import { familyDto } from "@/lib/server/family";
export async function GET(_request: Request, context: { params: Promise<{ familyId: string }> }) {
  const family = await familyDto((await context.params).familyId);
  return family ? NextResponse.json({ familyId: family.id, events: family.events }) : NextResponse.json({ error: "Family not found" }, { status: 404 });
}
