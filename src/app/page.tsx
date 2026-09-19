"use client";

import { motion } from "framer-motion";
import { ArrowRight, Link2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { mockFamily } from "@/lib/mock-data";
import { useSettings } from "@/lib/settings-context";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.08 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export default function LandingPage() {
  const router = useRouter();
  const { join } = useSettings();

  function createFamily() {
    join({ elderly: false });
    router.push("/home");
  }

  return (
    <main className="relative flex min-h-dvh flex-col overflow-hidden px-6 pb-[calc(env(safe-area-inset-bottom,0px)+2rem)] pt-[calc(env(safe-area-inset-top,0px)+3.5rem)]">
      {/* Warm bloom behind the wordmark. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-[36rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(194,65,12,0.10),transparent_65%)]"
      />

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col">
        <motion.p
          custom={0}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-ember"
        >
          Keepsake
        </motion.p>

        <motion.h1
          custom={1}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-5 font-serif text-[2.6rem] leading-[1.06] tracking-[-0.02em] text-ink"
        >
          Every family has a story
          <br />
          nobody wrote down.
        </motion.h1>

        <motion.p
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-5 text-[1.05rem] leading-relaxed text-ink-soft"
        >
          Keepsake listens to your family tell it — in their own voice, on their own time — and
          quietly builds the tree, the timeline and the map nobody ever got around to making.
        </motion.p>

        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-9 flex flex-col gap-3"
        >
          <Button size="lg" onClick={createFamily} className="w-full justify-between">
            Start my family&apos;s Keepsake
            <ArrowRight />
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => router.push(`/join/${mockFamily.inviteCode}`)}
            className="w-full justify-between"
          >
            I have an invite link
            <Link2 />
          </Button>
        </motion.div>

        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-auto pt-14"
        >
          <div className="rounded-2xl border border-line bg-surface/70 p-5">
            <p className="font-serif text-[1.05rem] leading-snug text-ink">
              &ldquo;For sixty years I have had no pictures of that day. I remember the dress
              though. I made it myself.&rdquo;
            </p>
            <p className="mt-3 text-sm text-ink-faint">
              Rosa, 85 — recorded on her kitchen phone, no app to learn
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
