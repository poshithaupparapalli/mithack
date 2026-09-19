"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { HoldToSpeak } from "@/components/elder/hold-to-speak";
import { useFamily } from "@/lib/family-context";
import { INITIATOR_ID } from "@/lib/mock-data";
import { useSettings } from "@/lib/settings-context";
import { useInterview } from "@/lib/use-interview";
import { useSpeech } from "@/lib/use-speech";
import { useVoiceCapture } from "@/lib/use-voice-capture";

type Stage = "asking" | "saving" | "saved" | "finished";

export default function ElderHome() {
  const { personById } = useFamily();
  const { currentUserId } = useSettings();
  const { currentGap, answer, skip } = useInterview();
  const { speak, speaking, supported: canSpeak } = useSpeech();

  const [stage, setStage] = useState<Stage>("asking");
  const [saved, setSaved] = useState("");

  const me = personById(currentUserId);
  const asker = personById(INITIATOR_ID);
  const firstName = me?.name.split(" ")[0] ?? "there";

  const voice = useVoiceCapture({
    onComplete: (result) => {
      answer(result.text, "voice", result.durationSec);
      setSaved(result.text);
      setStage("saved");
    },
  });

  const recording = voice.status === "recording";
  // Transcription state belongs to the recorder, so read it rather than mirror it.
  const view: Stage = voice.status === "transcribing" ? "saving" : stage;

  // Read the question out loud when it appears — but never over the top of
  // someone who is mid-answer, or while their saved words are on screen.
  useEffect(() => {
    if (view !== "asking" || recording || !currentGap) return;
    const timeout = window.setTimeout(() => speak(currentGap.question), 600);
    return () => window.clearTimeout(timeout);
  }, [currentGap, recording, speak, view]);

  function askAnother() {
    voice.reset();
    setSaved("");
    setStage("asking");
  }

  if (view === "finished") {
    return (
      <Centered>
        <p className="font-serif text-[2.6rem] leading-[1.15] text-ink">
          Thank you, {firstName}.
        </p>
        <p className="mt-6 text-ink-soft">
          {asker?.name.split(" ")[0] ?? "Your family"} will hear this tonight.
        </p>
        <button
          onClick={askAnother}
          className="mt-12 min-h-[72px] w-full rounded-3xl border-2 border-line-strong bg-surface px-8 text-[1.5rem] text-ink"
        >
          Actually, one more thing
        </button>
      </Centered>
    );
  }

  if (view === "saving") {
    return (
      <Centered>
        <Loader2 className="size-16 animate-spin text-ember" />
        <p className="mt-8 font-serif text-[2rem] leading-tight text-ink">Writing it down…</p>
        <p className="mt-4 text-ink-soft">One moment. Don&apos;t go anywhere.</p>
      </Centered>
    );
  }

  if (view === "saved") {
    return (
      <div className="mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-xl flex-col">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-serif text-[2.2rem] leading-tight text-ink">
            I&apos;ve got it, {firstName}.
          </p>
          <p className="mt-4 text-ink-soft">This is what I wrote down:</p>

          <blockquote className="mt-6 border-l-4 border-ember pl-6 font-serif text-[1.6rem] leading-[1.45] text-ink">
            {saved}
          </blockquote>

          {voice.simulated ? (
            <p className="mt-4 text-[0.9rem] text-ink-faint">
              (Demo mode — no microphone was available, so this is a sample answer.)
            </p>
          ) : null}
        </motion.div>

        <div className="mt-auto flex flex-col gap-4 pt-12">
          <button
            onClick={askAnother}
            className="min-h-[72px] w-full rounded-3xl bg-ember px-8 text-[1.5rem] font-medium text-white"
          >
            Tell one more story
          </button>
          <button
            onClick={() => setStage("finished")}
            className="min-h-[72px] w-full rounded-3xl border-2 border-line-strong bg-surface px-8 text-[1.5rem] text-ink"
          >
            That&apos;s enough for today
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-xl flex-col">
      <AnimatePresence mode="wait">
        {recording ? (
          <motion.div
            key="listening"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-[1.15rem] font-medium uppercase tracking-widest text-ember">
              I&apos;m listening
            </p>
            <p className="mt-5 font-serif text-[1.5rem] leading-snug text-ink-faint">
              {currentGap?.question}
            </p>
            {voice.partial ? (
              <p className="mt-7 font-serif text-[1.9rem] leading-[1.4] text-ink">
                {voice.partial}
              </p>
            ) : (
              <p className="mt-7 text-[1.3rem] text-ink-faint">
                Take all the time you need. I&apos;m not going anywhere.
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="asking"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <p className="font-serif text-[2.6rem] leading-[1.1] text-ink">Hello, {firstName}.</p>

            {asker ? (
              <div className="mt-8 flex items-center gap-3.5">
                <Avatar id={asker.id} name={asker.name} className="size-14 text-lg" />
                <p className="text-[1.25rem] leading-snug text-ink-soft">
                  {asker.name.split(" ")[0]} would like to know
                </p>
              </div>
            ) : null}

            <p className="mt-6 font-serif text-[2.1rem] leading-[1.28] text-ink">
              {currentGap?.question ?? "Is there a story you'd like to tell me today?"}
            </p>

            {canSpeak ? (
              <button
                onClick={() => currentGap && speak(currentGap.question)}
                className="mt-6 inline-flex min-h-[56px] items-center gap-3 rounded-2xl border-2 border-line-strong bg-surface px-5 text-[1.15rem] text-ink-soft"
              >
                <Volume2 className={speaking ? "size-6 text-ember" : "size-6"} />
                {speaking ? "Reading it to you…" : "Read it to me"}
              </button>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-auto flex flex-col items-center pt-10">
        <HoldToSpeak
          recording={recording}
          level={voice.level}
          onStart={() => void voice.start()}
          onStop={() => void voice.stop()}
        />

        {!recording ? (
          <>
            <p className="mt-6 text-center text-[1.15rem] leading-relaxed text-ink-faint">
              Hold the button and answer out loud.
              <br />
              Or press it once and take your time.
            </p>
            <button
              onClick={skip}
              className="mt-6 min-h-[56px] px-4 text-[1.15rem] text-ink-faint underline underline-offset-4"
            >
              Ask me something else
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[calc(100dvh-6rem)] w-full max-w-xl flex-col items-center justify-center text-center">
      {children}
    </div>
  );
}
