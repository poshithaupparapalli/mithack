import { NextResponse } from "next/server";

/**
 * ─── MUSE SWAP POINT ──────────────────────────────────────────────────────
 * The only place the frontend talks to speech-to-text. Replace the body of
 * this handler with a Meta Muse Voice call; keep the response shape and no
 * UI needs to change.
 *
 * Request:  multipart/form-data { audio: Blob, prompt?: string }
 * Response: { text: string, durationSec: number, confidence: number }
 * ──────────────────────────────────────────────────────────────────────────
 */

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const audio = form?.get("audio");
  const durationSec = Number(form?.get("durationSec") ?? 0);
  const apiKey = process.env.MODEL_API_KEY;
  if (!(audio instanceof Blob)) return NextResponse.json({ error: "An audio recording is required." }, { status: 400 });
  if (!apiKey) return NextResponse.json({ error: "MODEL_API_KEY is not configured." }, { status: 503 });

  const upstream = new FormData();
  upstream.append("request", new Blob([JSON.stringify({
    model: "muse-voice-transcribe-1.0", mode: "PUSH_TO_TALK", audioEncoding: "WAV",
    languageBias: ["English", "Spanish"], keywords: ["Keepsake", "Alvarez", "Chen", "Oaxaca", "Pilsen"],
  })], { type: "application/json" }));
  upstream.append("audio", audio, "keepsake-recording.wav");

  const response = await fetch("https://api.meta.ai/v1/asr/transcribe", {
    method: "POST", headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" }, body: upstream,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) return NextResponse.json({ error: payload?.message ?? "Muse Voice transcription failed." }, { status: response.status });
  return NextResponse.json({
    text: payload?.transcript ?? "",
    durationSec: Math.round((payload?.audioDurationMs ?? durationSec * 1000) / 1000),
    confidence: 1,
    emotion: "love",
    intensity: 0.72,
    turns: payload?.turns ?? [],
    sessionId: payload?.sessionId,
  });
}
