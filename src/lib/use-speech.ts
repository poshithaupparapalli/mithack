"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

/**
 * Reads the question out loud. For a user who finds screens hard, hearing the
 * question is the difference between an app and a conversation.
 *
 * Browsers gate speech behind a user gesture, so this never assumes it worked:
 * the UI always shows the question in large type as well.
 */
export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const voice = useRef<SpeechSynthesisVoice | null>(null);

  // Read straight from the platform rather than mirroring it into state —
  // the server snapshot is simply `false`, so hydration stays consistent.
  const supported = useSyncExternalStore(
    () => () => undefined,
    () => typeof window !== "undefined" && "speechSynthesis" in window,
    () => false,
  );

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const pick = () => {
      const voices = window.speechSynthesis.getVoices();
      // Prefer a natural local English voice; fall back to whatever exists.
      voice.current =
        voices.find((v) => /samantha|serena|karen|natural/i.test(v.name) && v.lang.startsWith("en")) ??
        voices.find((v) => v.lang.startsWith("en")) ??
        voices[0] ??
        null;
    };

    pick();
    window.speechSynthesis.addEventListener("voiceschanged", pick);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", pick);
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    if (voice.current) utterance.voice = voice.current;
    utterance.rate = 0.92; // unhurried, but not patronising
    utterance.pitch = 1;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking, supported };
}
