"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Emotion } from "@/lib/types";

/* Minimal shape of the Web Speech API — not in lib.dom, and vendor-prefixed. */
interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const recognition = new Ctor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";
  return recognition;
}

export type VoiceStatus = "idle" | "recording" | "transcribing" | "done" | "error";

export interface VoiceResult {
  text: string;
  durationSec: number;
  confidence: number;
  /** What the pipeline heard in it. Colours the orb this becomes. */
  emotion?: Emotion;
  intensity?: number;
}

async function asMetaWav(input: Blob): Promise<Blob> {
  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData(await input.arrayBuffer());
    const frames = Math.ceil(decoded.duration * 24_000);
    const offline = new OfflineAudioContext(1, frames, 24_000);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();
    const rendered = await offline.startRendering();
    const pcm = new Int16Array(rendered.length);
    const samples = rendered.getChannelData(0);
    for (let i = 0; i < samples.length; i += 1) pcm[i] = Math.max(-1, Math.min(1, samples[i])) * 0x7fff;
    const wav = new ArrayBuffer(44 + pcm.byteLength);
    const view = new DataView(wav);
    const text = (offset: number, value: string) => [...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
    text(0, "RIFF"); view.setUint32(4, 36 + pcm.byteLength, true); text(8, "WAVE"); text(12, "fmt ");
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true); view.setUint32(24, 24_000, true);
    view.setUint32(28, 48_000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true); text(36, "data"); view.setUint32(40, pcm.byteLength, true);
    new Uint8Array(wav, 44).set(new Uint8Array(pcm.buffer));
    return new Blob([wav], { type: "audio/wav" });
  } finally { await context.close(); }
}

/**
 * Hold-to-speak capture.
 *
 * Live captions come from the browser's own recogniser when it exists (so the
 * speaker sees their words land immediately, even offline). The authoritative
 * transcript always comes from /api/transcribe — the Muse swap point.
 *
 * If the microphone is unavailable or denied, it degrades to a simulated
 * recording rather than failing: a demo must never dead-end on a permissions
 * dialog.
 */
export function useVoiceCapture({ onComplete }: { onComplete?: (result: VoiceResult) => void } = {}) {
  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const [partial, setPartial] = useState("");
  const [level, setLevel] = useState(0);
  const [result, setResult] = useState<VoiceResult | null>(null);
  const [simulated, setSimulated] = useState(false);

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const raf = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const startedAt = useRef(0);
  const recognition = useRef<SpeechRecognitionLike | null>(null);

  const cleanup = useCallback(() => {
    if (raf.current) cancelAnimationFrame(raf.current);
    if (timer.current) clearInterval(timer.current);
    raf.current = null;
    timer.current = null;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    void audioCtx.current?.close();
    audioCtx.current = null;
    try {
      recognition.current?.stop();
    } catch {
      /* already stopped */
    }
    recognition.current = null;
    setLevel(0);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const transcribe = useCallback(
    async (blob: Blob | null, durationSec: number) => {
      setStatus("transcribing");
      try {
        const form = new FormData();
        if (blob) form.append("audio", await asMetaWav(blob), "memory.wav");
        form.append("durationSec", String(durationSec));

        const response = await fetch("/api/transcribe", { method: "POST", body: form });
        if (!response.ok) throw new Error(`transcribe failed: ${response.status}`);
        const data = (await response.json()) as VoiceResult;

        setResult(data);
        setStatus("done");
        onComplete?.(data);
      } catch {
        setStatus("error");
      }
    },
    [onComplete],
  );

  const start = useCallback(async () => {
    setPartial("");
    setResult(null);
    setElapsedMs(0);
    startedAt.current = Date.now();
    timer.current = setInterval(() => setElapsedMs(Date.now() - startedAt.current), 100);

    // Live captions, best effort.
    const rec = getRecognition();
    if (rec) {
      rec.onresult = (event) => {
        let text = "";
        for (let i = 0; i < event.results.length; i += 1) text += event.results[i][0].transcript;
        setPartial(text.trim());
      };
      rec.onerror = () => undefined;
      try {
        rec.start();
        recognition.current = rec;
      } catch {
        /* some browsers throw on a double start */
      }
    }

    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.current = media;
      setSimulated(false);

      // Amplitude drives the button's pulse, so it reacts to the actual voice.
      const ctx = new AudioContext();
      audioCtx.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      ctx.createMediaStreamSource(media).connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);

      const tick = () => {
        analyser.getByteTimeDomainData(data);
        let peak = 0;
        for (const v of data) peak = Math.max(peak, Math.abs(v - 128) / 128);
        setLevel((prev) => prev * 0.7 + peak * 0.3);
        raf.current = requestAnimationFrame(tick);
      };
      tick();

      chunks.current = [];
      const recorder = new MediaRecorder(media);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.current.push(event.data);
      };
      recorder.start();
      mediaRecorder.current = recorder;
      setStatus("recording");
    } catch {
      // No microphone, or permission refused — keep going with a fake level.
      setSimulated(true);
      setStatus("recording");
      const tick = () => {
        const t = (Date.now() - startedAt.current) / 1000;
        setLevel(0.25 + 0.2 * Math.abs(Math.sin(t * 3.1)) + 0.15 * Math.abs(Math.sin(t * 7.7)));
        raf.current = requestAnimationFrame(tick);
      };
      tick();
    }
  }, []);

  const stop = useCallback(async () => {
    const durationSec = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
    const recorder = mediaRecorder.current;

    if (recorder && recorder.state !== "inactive") {
      const blob = await new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks.current, { type: "audio/webm" }));
        recorder.stop();
      });
      mediaRecorder.current = null;
      cleanup();
      await transcribe(blob, durationSec);
      return;
    }

    cleanup();
    await transcribe(null, durationSec);
  }, [cleanup, transcribe]);

  const reset = useCallback(() => {
    cleanup();
    setStatus("idle");
    setPartial("");
    setResult(null);
    setElapsedMs(0);
  }, [cleanup]);

  return { status, elapsedMs, partial, level, result, simulated, start, stop, reset };
}

export function formatElapsed(ms: number) {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
