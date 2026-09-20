import { NextResponse } from "next/server";
import { ensureDemoFamily, familyDto } from "@/lib/server/family";

export async function GET() {
  const familyId = await ensureDemoFamily();
  return NextResponse.json(await familyDto(familyId));
}
