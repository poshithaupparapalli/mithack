"use client";

import { motion } from "framer-motion";
import { ArrowRight, Check, Mic, Trees } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MemoryOrb } from "@/components/orb/memory-orb";
import { MeshBackdrop } from "@/components/orb/mesh-backdrop";
import { useFamily } from "@/lib/family-context";
import { createPerson } from "@/lib/seed";
import { useSettings } from "@/lib/settings-context";
import { cn } from "@/lib/utils";

type Choice = "standard" | "elder";

/**
 * The invite fork — and the moment Elderly Mode is chosen, once, at the door,
 * by the person themselves. An Elder never has to find a settings screen.
 */
export default function JoinPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const { family, hasFamily, hydrated, addPerson, personById } = useFamily();
  const { join, currentUserId } = useSettings();

  const [name, setName] = useState("");
  const [choice, setChoice] = useState<Choice | null>(null);

  // An invite is only meaningful once a family exists to join.
  useEffect(() => {
    if (hydrated && !hasFamily) router.replace("/setup");
  }, [hasFamily, hydrated, router]);

  if (!hydrated || !hasFamily) return <div className="min-h-dvh" aria-hidden />;

  const inviter = personById(currentUserId) ?? family.people[0];
  const living = family.people.filter((p) => p.isLiving).slice(0, 5);

  function confirm() {
    if (!choice || !name.trim()) return;
    const elderly = choice === "elder";
    const person = createPerson({ name: name.trim(), prefersVoice: elderly });

    addPerson(person, person.id);
    join({ elderly, userId: person.id });
    router.push(elderly ? "/elder" : "/home");
  }

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] pt-[calc(env(safe-area-inset-top,0px)+3rem)]">
      <MeshBackdrop />

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-ember">
          Invitation · {decodeURIComponent(params.code ?? "")}
        </p>
        <h1 className="mt-4 font-serif text-[2rem] leading-tight text-ink">
          {inviter ? `${inviter.name.split(" ")[0]} invited you to ` : "You've been invited to "}
          {family.name}
        </h1>

        {living.length > 0 ? (
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
              {family.people.length} {family.people.length === 1 ? "person" : "people"},{" "}
              {family.memories.length}{" "}
              {family.memories.length === 1 ? "story" : "stories"} so far
            </p>
          </div>
        ) : null}

        {family.memories.length > 0 ? (
          <div className="mt-5 flex items-center gap-1.5">
            {family.memories.slice(0, 6).map((memory, i) => (
              <MemoryOrb
                key={memory.id}
                emotion={memory.emotion}
                intensity={memory.intensity ?? 0.7}
                size={22 + (i % 3) * 8}
              />
            ))}
          </div>
        ) : null}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.45 }}
        className="mt-8"
      >
        <label
          htmlFor="join-name"
          className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-faint"
        >
          Your name
        </label>
        <input
          id="join-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="What does the family call you?"
          className="glass-solid mt-2 h-14 w-full rounded-2xl px-4 text-[1.1rem] text-ink outline-none placeholder:text-ink-faint"
        />

        <h2 className="mt-8 font-serif text-xl text-ink">How would you like to use it?</h2>
        <p className="mt-1 text-sm text-ink-soft">You can change this any time.</p>

        <div className="mt-4 flex flex-col gap-3">
          <ChoiceCard
            selected={choice === "standard"}
            onSelect={() => setChoice("standard")}
            icon={<Trees className="size-6" />}
            title="Show me everything"
            body="The constellation, the family tree, the maps and timelines. Add photos and stories whenever you like."
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
        <Button
          size="lg"
          className="w-full justify-between rounded-2xl"
          disabled={!choice || !name.trim()}
          onClick={confirm}
        >
          {choice === "elder" ? "Take me in" : "Join the family"}
          <ArrowRight />
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
        "relative w-full rounded-2xl border p-4 text-left backdrop-blur-xl transition-all",
        selected
          ? "border-ember bg-ember-soft/70 shadow-[0_0_0_1px_var(--color-ember)]"
          : "border-white/55 bg-surface/50 hover:border-white/80",
      )}
    >
      <div className="flex items-start gap-3.5">
        <span className={cn("mt-0.5 shrink-0", selected ? "text-ember" : "text-ink-faint")}>
          {icon}
        </span>
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
