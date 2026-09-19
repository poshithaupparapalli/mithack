"use client";

import { Loader2, Mic, Send, Square } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatThread } from "@/components/chat/chat-thread";
import { useFamily } from "@/lib/family-context";
import { useSettings } from "@/lib/settings-context";
import { useInterview } from "@/lib/use-interview";
import { formatElapsed, useVoiceCapture } from "@/lib/use-voice-capture";
import { cn } from "@/lib/utils";

export default function ChatPage() {
  const { messages, thinking, currentGap, answer, skip } = useInterview();
  const { personById, openGaps } = useFamily();
  const { currentUserId } = useSettings();
  const me = personById(currentUserId);
  const [draft, setDraft] = useState("");

  const voice = useVoiceCapture({
    onComplete: (result) =>
      answer(result.text, {
        kind: "voice",
        durationSec: result.durationSec,
        emotion: result.emotion,
        intensity: result.intensity,
      }),
  });

  const recording = voice.status === "recording";
  const transcribing = voice.status === "transcribing";

  function send() {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    answer(text);
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col px-4 pt-4">
      <div className="glass rounded-2xl p-3.5">
        <div className="flex items-start gap-2.5">
          <Badge tone="gap">{openGaps.length} open</Badge>
          <p className="flex-1 text-xs leading-relaxed text-ink-soft">
            Keepsake works through what&apos;s missing from the family record, one question at a
            time. Answer by typing or by speaking — it makes no difference.
          </p>
        </div>
      </div>

      <div className="flex-1 py-5">
        <ChatThread
          messages={messages}
          thinking={thinking}
          authorId={currentUserId}
          authorName={me?.name ?? "You"}
        />
      </div>

      {recording && voice.partial ? (
        <p className="mb-2 rounded-2xl border border-ember/30 bg-ember-soft/60 px-4 py-3 text-[0.95rem] italic leading-relaxed text-ink-soft">
          {voice.partial}
        </p>
      ) : null}

      <div className="sticky bottom-[calc(env(safe-area-inset-bottom,0px)+4.75rem)] -mx-4 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur">
        {currentGap ? (
          <button
            onClick={skip}
            className="mb-2 text-xs text-ink-faint underline underline-offset-4 hover:text-ink-soft"
          >
            Not today — ask me something else
          </button>
        ) : null}

        <div className="flex items-end gap-2">
          <label htmlFor="chat-input" className="sr-only">
            Your answer
          </label>
          <textarea
            id="chat-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder={recording ? "Listening…" : "Type your answer…"}
            disabled={recording || transcribing}
            className="glass-solid max-h-32 min-h-11 flex-1 resize-none rounded-2xl px-4 py-2.5 text-[0.97rem] leading-relaxed text-ink outline-none placeholder:text-ink-faint disabled:opacity-60"
          />

          {draft.trim() ? (
            <Button size="icon" onClick={send} aria-label="Send answer">
              <Send />
            </Button>
          ) : (
            <Button
              size="icon"
              variant={recording ? "secondary" : "primary"}
              onClick={() => (recording ? void voice.stop() : void voice.start())}
              disabled={transcribing}
              aria-label={recording ? "Stop recording" : "Answer out loud"}
              className={cn(recording && "!bg-ink !text-canvas")}
            >
              {transcribing ? (
                <Loader2 className="animate-spin" />
              ) : recording ? (
                <Square fill="currentColor" className="!size-3.5" />
              ) : (
                <Mic />
              )}
            </Button>
          )}
        </div>

        {recording ? (
          <p className="mt-1.5 text-center text-xs tabular-nums text-ink-faint">
            {formatElapsed(voice.elapsedMs)} · tap the square when you&apos;re done
          </p>
        ) : null}
      </div>
    </div>
  );
}
