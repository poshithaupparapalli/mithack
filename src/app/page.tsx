"use client";

import { motion } from "framer-motion";
import { ArrowRight, Link2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MemoryOrb } from "@/components/orb/memory-orb";
import { MeshBackdrop } from "@/components/orb/mesh-backdrop";
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

/** A loose handful of orbs behind the wordmark — the idea, before any words. */
const HERO_ORBS = [
  { emotion: "joy", intensity: 0.9, size: 116, left: "8%", top: "2%", delay: 0 },
  { emotion: "love", intensity: 0.95, size: 78, left: "63%", top: "-4%", delay: 2 },
  { emotion: "longing", intensity: 0.7, size: 54, left: "84%", top: "24%", delay: 4 },
  { emotion: "grief", intensity: 0.8, size: 62, left: "36%", top: "16%", delay: 6 },
  { emotion: "pride", intensity: 0.85, size: 44, left: "-2%", top: "30%", delay: 8 },
] as const;

export default function LandingPage() {
  const router = useRouter();
  const { join } = useSettings();

  function createFamily() {
    join({ elderly: false });
    router.push("/home");
  }

  return (
    <main className="relative flex min-h-dvh flex-col px-6 pb-[calc(env(safe-area-inset-bottom,0px)+2rem)] pt-[calc(env(safe-area-inset-top,0px)+3rem)]">
      <MeshBackdrop />

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col">
        <div className="pointer-events-none relative h-40">
          {HERO_ORBS.map((orb, i) => (
            <motion.span
              key={orb.emotion}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + i * 0.1, type: "spring", stiffness: 150, damping: 17 }}
              className="absolute"
              style={{ left: orb.left, top: orb.top }}
            >
              <MemoryOrb
                emotion={orb.emotion}
                intensity={orb.intensity}
                size={orb.size}
                drift
                driftDelay={orb.delay}
              />
            </motion.span>
          ))}
        </div>

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
          className="mt-4 font-serif text-[2.5rem] leading-[1.06] tracking-[-0.02em] text-ink"
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
          keeps every memory as a small bead of light you can hold up and look through.
        </motion.p>

        <motion.div
          custom={3}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-8 flex flex-col gap-3"
        >
          <Button size="lg" onClick={createFamily} className="w-full justify-between rounded-2xl">
            Start my family&apos;s Keepsake
            <ArrowRight />
          </Button>
          <button
            onClick={() => router.push(`/join/${mockFamily.inviteCode}`)}
            className="glass flex min-h-14 w-full items-center justify-between rounded-2xl px-6 text-lg font-medium text-ink"
          >
            I have an invite link
            <Link2 className="size-5" />
          </button>
        </motion.div>

        <motion.div
          custom={4}
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="mt-auto pt-12"
        >
          <div className="glass rounded-3xl p-5">
            <p className="font-serif text-[1.05rem] leading-snug text-ink">
              &ldquo;For sixty years I have had no pictures of that day. I remember the dress
              though. I made it myself.&rdquo;
            </p>
            <div className="mt-3.5 flex items-center gap-2.5">
              <MemoryOrb emotion="love" intensity={0.95} size={26} />
              <p className="text-sm text-ink-faint">
                Rosa, 85 — recorded on her kitchen phone, no app to learn
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
