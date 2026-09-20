"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, MessageCircleHeart, Plus, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MemoryOrb } from "@/components/orb/memory-orb";
import { MemorySheet } from "@/components/orb/memory-sheet";
import { placeOrbs } from "@/lib/constellation";
import { EMOTIONS, EMOTION_ORDER, emotionSpec } from "@/lib/emotions";
import { useFamily } from "@/lib/family-context";
import { useSettings } from "@/lib/settings-context";
import type { Emotion } from "@/lib/types";
import { cn, yearOf } from "@/lib/utils";

export default function HomePage() {
  const { family, openGaps, personById } = useFamily();
  const { currentUserId } = useSettings();
  const me = personById(currentUserId);

  const [filter, setFilter] = useState<Emotion | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const years = family.events.map((e) => yearOf(e.date)).filter(Boolean);
  const span = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : "—";
  const topGap = openGaps[0];
  const target = topGap ? personById(topGap.askPersonId) : undefined;

  const placements = useMemo(
    () =>
      placeOrbs(
        family.memories.map((m) => m.id),
        family.memories.map((m) => m.intensity ?? 0.7),
      ),
    [family.memories],
  );

  const counts = useMemo(() => {
    const map = new Map<Emotion, number>();
    for (const memory of family.memories) {
      if (!memory.emotion) continue;
      map.set(memory.emotion, (map.get(memory.emotion) ?? 0) + 1);
    }
    return map;
  }, [family.memories]);

  const open = family.memories.find((m) => m.id === openId) ?? null;
  const empty = family.memories.length === 0;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-3">
      <header>
        <p className="font-serif text-[1.9rem] leading-[1.15] text-ink">
          {greeting()}, {me?.name.split(" ")[0] ?? "there"}.
        </p>
        <p className="mt-1.5 text-[0.98rem] leading-relaxed text-ink-soft">
          {empty
            ? "Nothing here yet. The sky fills up the first time someone talks."
            : `${family.memories.length} ${family.memories.length === 1 ? "memory" : "memories"}${
                years.length ? `, ${span}` : ""
              }. Every one of them is a colour now.`}
        </p>
      </header>

      {/* Legend and filter in one control — tap a feeling to isolate it. */}
      <div className={cn("-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1", empty && "hidden")}>
        {EMOTION_ORDER.map((emotion) => {
          const spec = EMOTIONS[emotion];
          const count = counts.get(emotion) ?? 0;
          const active = filter === emotion;
          return (
            <button
              key={emotion}
              onClick={() => setFilter(active ? null : emotion)}
              disabled={count === 0}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border py-1.5 pl-2 pr-3.5 text-sm transition-all disabled:opacity-35",
                active ? "border-transparent" : "border-white/50 bg-surface/45 text-ink-soft backdrop-blur-sm",
              )}
              style={
                active
                  ? { background: spec.wash, color: spec.ink, boxShadow: `0 0 0 1px ${spec.core}` }
                  : undefined
              }
            >
              <MemoryOrb emotion={emotion} intensity={0.9} size={18} variant="solid" halo={false} />
              {spec.label}
              <span className="text-xs opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── The constellation ── */}
      <section
        aria-label="Your family's memories"
        className="relative mt-4 h-[58dvh] min-h-[380px] w-full"
      >
        {empty ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            {/* One unlit orb: clear glass, waiting for a voice to colour it. */}
            <motion.span
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: [1, 1.035, 1] }}
              transition={{
                opacity: { duration: 0.6 },
                scale: { duration: 6, repeat: Infinity, ease: "easeInOut" },
              }}
              className="size-40 rounded-full border border-white/55"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 30% 24%, rgba(255,255,255,.75), rgba(255,255,255,.05) 45%), radial-gradient(circle at 70% 76%, rgba(168,156,138,.2), transparent 62%)",
                backdropFilter: "blur(7px) saturate(180%)",
                WebkitBackdropFilter: "blur(7px) saturate(180%)",
                boxShadow:
                  "inset 0 2px 6px rgba(255,255,255,.9), inset -10px -14px 30px -12px rgba(120,108,92,.55), 0 16px 44px -16px rgba(76,48,34,.25)",
              }}
            />

            <p className="mt-8 font-serif text-[1.45rem] leading-snug text-ink">
              Your first memory goes here.
            </p>
            <p className="mt-2 max-w-xs text-[0.95rem] leading-relaxed text-ink-soft">
              Say something out loud, or write it down. Keepsake turns it into a light you can
              come back to.
            </p>

            <div className="mt-7 flex w-full max-w-xs flex-col gap-2.5">
              <Button size="lg" className="w-full justify-between rounded-2xl" asChild>
                <Link href="/add">
                  <span className="flex items-center gap-2">
                    <Plus className="size-5" />
                    Record your first memory
                  </span>
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Link
                href="/chat"
                className="glass flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl text-[0.95rem] font-medium text-ink"
              >
                <MessageCircleHeart className="size-[18px]" />
                Let Keepsake ask me something
              </Link>
            </div>
          </div>
        ) : null}

        {family.memories.map((memory, i) => {
          const place = placements[i];
          const spec = emotionSpec(memory.emotion);
          const dimmed = filter !== null && memory.emotion !== filter;
          const author = personById(memory.authorId);

          return (
            <motion.button
              key={memory.id}
              onClick={() => setOpenId(memory.id)}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: dimmed ? 0.14 : 1, scale: dimmed ? 0.8 : 1 }}
              transition={{
                delay: Math.min(i, 8) * 0.08,
                type: "spring",
                stiffness: 170,
                damping: 19,
              }}
              whileTap={{ scale: 0.92 }}
              aria-label={`${memory.title ?? "A memory"} — ${spec.label}, from ${author?.name ?? "the family"}`}
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ left: `${place.left}%`, top: `${place.top}%` }}
            >
              <MemoryOrb
                emotion={memory.emotion}
                intensity={memory.intensity ?? 0.7}
                size={place.size}
                drift
                driftDelay={place.driftDelay}
              />
              {memory.status === "processing" ? (
                <span className="absolute inset-0 animate-ping rounded-full border-2 border-white/70" />
              ) : null}
            </motion.button>
          );
        })}

        <AnimatePresence mode="wait">
          <motion.p
            key={filter ?? "hint"}
            hidden={empty}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-x-0 bottom-0 text-center text-sm text-ink-faint"
          >
            {filter
              ? `${counts.get(filter) ?? 0} ${EMOTIONS[filter].label} — ${EMOTIONS[filter].phrase}`
              : "Tap an orb to open it"}
          </motion.p>
        </AnimatePresence>
      </section>

      {/* ── The one thing still dark ── */}
      {topGap && target ? (
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="glass relative mt-5 overflow-hidden rounded-3xl"
        >
          {/* An unanswered question is an unlit orb — clear glass, no colour. */}
          <span
            aria-hidden
            className="absolute -right-12 -top-14 size-44 rounded-full border border-white/50"
            style={{
              backgroundImage:
                "radial-gradient(circle at 32% 26%, rgba(255,255,255,.7), rgba(255,255,255,.06) 44%), radial-gradient(circle at 68% 74%, rgba(168,156,138,.22), transparent 62%)",
              boxShadow:
                "inset 0 2px 6px rgba(255,255,255,.85), inset -10px -14px 30px -12px rgba(120,108,92,.5)",
            }}
          />
          <div className="relative p-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ink/85 px-2.5 py-1 text-[0.68rem] font-medium uppercase tracking-wider text-canvas">
              <Sparkles className="size-3" />
              still dark
            </span>
            <p className="mt-3.5 max-w-[88%] font-serif text-[1.35rem] leading-snug text-ink">
              &ldquo;{topGap.question}&rdquo;
            </p>
            <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">{topGap.rationale}</p>

            <div className="mt-4 flex items-center gap-2.5">
              <Avatar id={target.id} name={target.name} className="size-8 text-xs" />
              <p className="flex-1 text-sm text-ink-soft">
                Only <span className="font-medium text-ink">{target.name}</span> can light this one.
              </p>
            </div>

            <Button size="md" className="mt-4 w-full justify-between rounded-2xl" asChild>
              <Link href="/chat">
                <span className="flex items-center gap-2">
                  <Send className="size-4" />
                  Ask {target.name.split(" ")[0]}
                </span>
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </motion.section>
      ) : null}

      <div className="mt-4 flex items-center justify-between pb-2 text-sm">
        <Link href="/chat" className="font-medium text-ember hover:underline">
          {Math.max(0, openGaps.length - 1)} more{" "}
          {openGaps.length === 2 ? "question" : "questions"}
        </Link>
        <Link
          href="/timeline"
          className="flex items-center gap-1 font-medium text-ink-soft hover:text-ink"
        >
          Whole timeline
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <MemorySheet memory={open} onOpenChange={(next) => !next && setOpenId(null)} />
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
