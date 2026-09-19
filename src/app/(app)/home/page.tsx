"use client";

import { motion } from "framer-motion";
import { ArrowRight, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MemoryCard } from "@/components/memory/memory-card";
import { useFamily } from "@/lib/family-context";
import { useSettings } from "@/lib/settings-context";
import { yearOf } from "@/lib/utils";

export default function HomePage() {
  const { family, openGaps, personById } = useFamily();
  const { currentUserId } = useSettings();
  const me = personById(currentUserId);

  const years = family.events.map((e) => yearOf(e.date)).filter(Boolean);
  const span = years.length ? `${Math.min(...years)}–${Math.max(...years)}` : "—";
  const topGap = openGaps[0];
  const target = topGap ? personById(topGap.askPersonId) : undefined;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pt-5">
      <h2 className="font-serif text-2xl leading-tight text-ink">
        {greeting()}, {me?.name.split(" ")[0] ?? "there"}.
      </h2>
      <p className="mt-1 text-[0.95rem] text-ink-soft">
        Keepsake has been working while you were away.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="relatives" value={family.people.length} />
        <Stat label="stories" value={family.memories.length} />
        <Stat label="years covered" value={span} />
      </div>

      {topGap && target ? (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-6 overflow-hidden rounded-2xl border border-gap/25 bg-gap-soft/70"
        >
          <div className="p-4">
            <Badge tone="gap">
              <Sparkles className="size-3" />
              The biggest hole in your family&apos;s story
            </Badge>
            <p className="mt-3 font-serif text-[1.3rem] leading-snug text-ink">
              &ldquo;{topGap.question}&rdquo;
            </p>
            <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">{topGap.rationale}</p>

            <div className="mt-4 flex items-center gap-3">
              <Avatar id={target.id} name={target.name} className="size-9 text-xs" />
              <p className="flex-1 text-sm text-ink-soft">
                Only <span className="font-medium text-ink">{target.name}</span> can answer this.
              </p>
            </div>

            <div className="mt-4 flex gap-2">
              <Button size="sm" className="flex-1" asChild>
                <Link href="/chat">
                  <Send className="size-4" />
                  Ask {target.name.split(" ")[0]}
                </Link>
              </Button>
              <Button size="sm" variant="secondary" asChild>
                <Link href="/timeline">See the gap</Link>
              </Button>
            </div>
          </div>
        </motion.section>
      ) : null}

      <section className="mt-8">
        <div className="flex items-end justify-between">
          <h3 className="font-serif text-xl text-ink">Lately</h3>
          <Link
            href="/timeline"
            className="flex items-center gap-1 text-sm font-medium text-ember hover:underline"
          >
            Whole timeline
            <ArrowRight className="size-3.5" />
          </Link>
        </div>

        <div className="mt-3 flex flex-col gap-3">
          {family.memories.slice(0, 5).map((memory, i) => (
            <MemoryCard key={memory.id} memory={memory} index={i} />
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h3 className="font-serif text-xl text-ink">Still missing</h3>
        <p className="mt-1 text-sm text-ink-soft">
          {openGaps.length} questions Keepsake would like to ask the family.
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {openGaps.slice(1).map((gap) => {
            const person = personById(gap.askPersonId);
            return (
              <li key={gap.id}>
                <Link
                  href="/chat"
                  className="flex items-start gap-3 rounded-2xl border border-line bg-surface p-3.5 transition-colors hover:border-line-strong"
                >
                  {person ? (
                    <Avatar id={person.id} name={person.name} className="mt-0.5 size-8 text-xs" />
                  ) : null}
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.94rem] leading-snug text-ink">
                      {gap.question}
                    </span>
                    <span className="mt-1 block text-xs text-ink-faint">
                      for {person?.name ?? "the family"}
                    </span>
                  </span>
                  <ArrowRight className="mt-1 size-4 shrink-0 text-ink-faint" />
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
      <p className="font-serif text-xl leading-none text-ink">{value}</p>
      <p className="mt-1 text-[0.7rem] uppercase tracking-wide text-ink-faint">{label}</p>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}
