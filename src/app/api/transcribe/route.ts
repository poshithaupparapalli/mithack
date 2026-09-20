import { NextResponse } from "next/server";

/**
 * ─── MUSE SWAP POINT ──────────────────────────────────────────────────────
 * The only place the frontend talks to speech-to-text. Replace the body of
 * this handler with a Meta Muse Voice call; keep the response shape and no
 * UI needs to change.
 *
 * Request:  multipart/form-data { audio: Blob, durationSec: string }
 * Response: { text, durationSec, confidence, emotion, intensity }
 *
 * `emotion` is what colours the orb the speaker watches bloom the moment
 * they finish talking, so it has to come back with the transcript rather
 * than in a later pass.
 * ──────────────────────────────────────────────────────────────────────────
 */

const CANNED = [
  {
    text: "She kept every letter anyone ever sent her, in a biscuit tin on top of the wardrobe. After she died we found forty years of them, in order, with the newest on top.",
    emotion: "longing",
    intensity: 0.82,
  },
  {
    text: "He worked nights for eleven years so he could pick us up from school. I only understood what that cost him after I had my own kids.",
    emotion: "pride",
    intensity: 0.9,
  },
  {
    text: "We ate standing up in the kitchen because there was no table yet. He said it was the best thing he'd ever tasted and he was lying, but I've never forgotten him saying it.",
    emotion: "love",
    intensity: 0.92,
  },
] as const;

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  const durationSec = Number(form?.get("durationSec") ?? 0);

  // Stand-in for real inference latency, so the UI's waiting states get exercised.
  await new Promise((resolve) => setTimeout(resolve, 900));

  const pick = CANNED[Math.floor(Math.random() * CANNED.length)];

  return NextResponse.json({
    text: pick.text,
    emotion: pick.emotion,
    intensity: pick.intensity,
    durationSec: durationSec || 42,
    confidence: 0.92,
    bytes: audio instanceof Blob ? audio.size : 0,
  });
}
