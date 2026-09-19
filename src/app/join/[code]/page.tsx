"use client";

import { motion } from "framer-motion";
import { Check, Mic, Trees } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { ELDER_ID, INITIATOR_ID, mockFamily } from "@/lib/mock-data";
import { useSettings } from "@/lib/settings-context";
import { cn } from "@/lib/utils";

type Choice = "standard" | "elder";

/**
 * The invite fork. This is where Elderly Mode is chosen — once, at the door,
 * by the person themselves — so the Elder never has to find a settings screen.
 */
export default function JoinPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const { join } = useSettings();
  const [choice, setChoice] = useState<Choice | null>(null);

  const living = mockFamily.people.filter((p) => p.isLiving).slice(0, 5);

  function confirm() {
    if (!choice) return;
    const elderly = choice === "elder";
    join({ elderly, userId: elderly ? ELDER_ID : INITIATOR_ID });
    router.push(elderly ? "/elder" : "/home");
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] pt-[calc(env(safe-area-inset-top,0px)+3rem)]">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ember">
          Invitation · {decodeURIComponent(params.code ?? "")}
        </p>
        <h1 className="mt-4 font-serif text-[2rem] leading-tight text-ink">
          Maya invited you to {mockFamily.name}
        </h1>

        <div className="mt-5 flex items-center gap-3">
          <div className="flex -space-x-2">
            {living.map((person) => (
              <Avatar
                key={person.id}
                id={person.id}
                name={person.name}
                className="size-9 border-2 border-canvas text-xs"
              />
            ))}
          </div>
          <p className="text-sm text-ink-soft">
            {living.length} relatives, {mockFamily.memories.length} stories so far
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.45 }}
        className="mt-10"
      >
        <h2 className="font-serif text-xl text-ink">How would you like to use it?</h2>
        <p className="mt-1 text-sm text-ink-soft">You can change this any time.</p>

        <div className="mt-4 flex flex-col gap-3">
          <ChoiceCard
            selected={choice === "standard"}
            onSelect={() => setChoice("standard")}
            icon={<Trees className="size-6" />}
            title="Show me everything"
            body="The family tree, the maps, the timelines. Add photos and stories whenever you like."
          />
          <ChoiceCard
            selected={choice === "elder"}
            onSelect={() => setChoice("elder")}
            icon={<Mic className="size-6" />}
            title="I'd rather just talk"
            body="No menus, no typing. Large text and one big button. Keepsake asks you a question, you answer out loud, and it takes care of the rest."
          />
        </div>
      </motion.div>

      <div className="mt-auto pt-10">
        <Button size="lg" className="w-full" disabled={!choice} onClick={confirm}>
          {choice === "elder" ? "Take me in" : "Join the family"}
        </Button>
      </div>
    </main>
  );
}

function ChoiceCard({
  selected,
  onSelect,
  icon,
  title,
  body,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <button
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "relative w-full rounded-2xl border p-4 text-left transition-all",
        selected
          ? "border-ember bg-ember-soft/60 shadow-[0_0_0_1px_var(--color-ember)]"
          : "border-line bg-surface hover:border-line-strong",
      )}
    >
      <div className="flex items-start gap-3.5">
        <span className={cn("mt-0.5 shrink-0", selected ? "text-ember" : "text-ink-faint")}>{icon}</span>
        <span className="flex-1">
          <span className="block font-serif text-lg text-ink">{title}</span>
          <span className="mt-1 block text-sm leading-relaxed text-ink-soft">{body}</span>
        </span>
        {selected ? (
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-ember text-white">
            <Check className="size-3.5" strokeWidth={3} />
          </span>
        ) : null}
      </div>
    </button>
  );
}
