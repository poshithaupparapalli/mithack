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
    text: "It was my mother who decided, really. There was no work left after the drought, and her brother had gone to Chicago two years before and written to say come. Tomás did not want to leave her. He argued for a month. In the end she told him, you go, or I will never forgive you.",
    emotion: "grief",
    intensity: 0.85,
  },
  {
    text: "The first thing I made was rice. Only rice, because that is what the corner store had at nine o'clock at night. We ate it standing up. Tomás said it was the best thing he ever tasted and he was lying, but I have never forgotten him saying it.",
    emotion: "love",
    intensity: 0.92,
  },
  {
    text: "That is my cousin Arturo. He came the year after us and slept on our floor for eleven months. He moved to Los Angeles in 1975 and we lost him.",
    emotion: "longing",
    intensity: 0.78,
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
