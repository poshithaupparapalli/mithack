"use client";

import { useCallback, useRef, useState } from "react";
import { useFamily } from "@/lib/family-context";
import { useSettings } from "@/lib/settings-context";
import { newId, welcomeChat } from "@/lib/seed";
import type { ChatMessage, Emotion, Memory } from "@/lib/types";

/**
 * The AI Interviewer.
 *
 * Owns the conversation: it acknowledges what it just heard, files it as a
 * memory against the gap it was asking about, and moves to the next gap.
 * Both the chat screen and Elderly Mode drive the same engine, so the two
 * experiences can never drift apart.
 */

const ACKS = [
  "Thank you. I've written that down exactly as you said it.",
  "That's the part nobody had. I've added it to the family's story.",
  "I've saved that. Your grandchildren will be able to read it.",
];

const HANDOFFS = [
  "May I ask you one more?",
  "There's one more thing I've been wondering about.",
  "While I have you — one last question.",
];

const nextId = () => newId("c");

export function useInterview() {
  const { openGaps, answerGap, skipGap, personById } = useFamily();
  const { currentUserId } = useSettings();

  // Built once, on mount, from whatever the family already knows. Both
  // layouts wait for hydration before rendering, so the gaps are real by now.
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const me = personById(currentUserId);
    const first = openGaps[0];
    const thread = welcomeChat(me?.name.split(" ")[0] ?? "there");
    if (first) {
      thread.push({
        id: newId("c"),
        role: "agent",
        text: first.question,
        gapId: first.id,
        createdAt: new Date().toISOString(),
      });
    }
    return thread;
  });
  const [thinking, setThinking] = useState(false);
  const timers = useRef<number[]>([]);

  const askedGapId = [...messages].reverse().find((m) => m.gapId)?.gapId;
  const currentGap = openGaps.find((g) => g.id === askedGapId) ?? openGaps[0];

  const push = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  /** Record an answer to the gap currently on the table, then move on. */
  const answer = useCallback(
    (
      text: string,
      {
        kind = "text",
        durationSec,
        emotion,
        intensity,
      }: {
        kind?: "text" | "voice";
        durationSec?: number;
        emotion?: Emotion;
        intensity?: number;
      } = {},
    ) => {
      const gap = currentGap;

      push({
        id: nextId(),
        role: "user",
        text,
        kind,
        durationSec,
        createdAt: new Date().toISOString(),
      });

      if (gap) {
        const memory: Memory = {
          id: `m-${Date.now()}`,
          kind: kind === "voice" ? "voice" : "text",
          authorId: currentUserId,
          createdAt: new Date().toISOString(),
          title: gap.question.replace(/\?$/, ""),
          body: text,
          durationSec,
          personIds: [gap.subjectPersonId],
          derivedEventIds: gap.relatedEventId ? [gap.relatedEventId] : [],
          status: "ready",
          emotion,
          intensity,
        };
        answerGap(gap.id, memory);
      }

      setThinking(true);
      later(() => {
        setThinking(false);
        push({
          id: nextId(),
          role: "agent",
          text: ACKS[Math.floor(Math.random() * ACKS.length)],
          createdAt: new Date().toISOString(),
        });

        const remaining = openGaps.filter((g) => g.id !== gap?.id);
        const next = remaining.find((g) => g.askPersonId === currentUserId) ?? remaining[0];

        if (next) {
          later(() => {
            push({
              id: nextId(),
              role: "agent",
              text: `${HANDOFFS[Math.floor(Math.random() * HANDOFFS.length)]} ${next.question}`,
              gapId: next.id,
              createdAt: new Date().toISOString(),
            });
          }, 900);
        } else {
          later(() => {
            push({
              id: nextId(),
              role: "agent",
              text: "That's everything I was missing. The family will see all of this the next time they open Keepsake.",
              createdAt: new Date().toISOString(),
            });
          }, 900);
        }
      }, 1100);
    },
    [answerGap, currentGap, currentUserId, later, openGaps, push],
  );

  /** "Not today" — never a dead end, always an offer to come back. */
  const skip = useCallback(() => {
    if (!currentGap) return;
    skipGap(currentGap.id);
    const remaining = openGaps.filter((g) => g.id !== currentGap.id);
    const next = remaining[0];
    push({
      id: nextId(),
      role: "agent",
      text: next
        ? `Of course. ${next.question}`
        : "That's alright. I'll be here whenever you feel like talking.",
      gapId: next?.id,
      createdAt: new Date().toISOString(),
    });
  }, [currentGap, openGaps, push, skipGap]);

  return {
    messages,
    thinking,
    currentGap,
    subject: currentGap ? personById(currentGap.subjectPersonId) : undefined,
    answer,
    skip,
  };
}
