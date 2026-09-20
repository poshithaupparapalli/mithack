"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Mic, Trees } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MemoryOrb } from "@/components/orb/memory-orb";
import { MeshBackdrop } from "@/components/orb/mesh-backdrop";
import { useFamily } from "@/lib/family-context";
import { createPerson } from "@/lib/seed";
import { useSettings } from "@/lib/settings-context";
import { cn } from "@/lib/utils";

type Step = "you" | "family" | "mode";
type Mode = "standard" | "elder";

/**
 * Nothing exists yet. This is the only place a family comes into being, so it
 * asks for the three things Keepsake genuinely cannot work without: who you
 * are, what to call the family, and how you'd rather use it.
 */
export default function SetupPage() {
  const router = useRouter();
  const { createFamily } = useFamily();
  const { join } = useSettings();

  const [step, setStep] = useState<Step>("you");
  const [name, setName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [mode, setMode] = useState<Mode | null>(null);

  const firstName = name.trim().split(" ")[0] ?? "";
  const surname = name.trim().split(" ").slice(1).join(" ");
  const suggested = surname ? `The ${surname} Family` : "";

  function goToFamily() {
    if (!name.trim()) return;
    if (!familyName) setFamilyName(suggested);
    setStep("family");
  }

  function finish() {
    if (!mode) return;
    const elderly = mode === "elder";
    const founder = createPerson({ name: name.trim(), prefersVoice: elderly });

    createFamily(familyName.trim() || suggested || `${firstName}'s Family`, founder);
    join({ elderly, userId: founder.id });
    router.push(elderly ? "/elder" : "/home");
  }

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] pt-[calc(env(safe-area-inset-top,0px)+2.5rem)]">
      <MeshBackdrop />

      <div className="flex items-center gap-3">
        {step !== "you" ? (
          <button
            onClick={() => setStep(step === "mode" ? "family" : "you")}
            aria-label="Back"
            className="glass flex size-9 items-center justify-center rounded-full text-ink-soft"
          >
            <ArrowLeft className="size-4" />
          </button>
        ) : null}
        <div className="flex gap-1.5">
          {(["you", "family", "mode"] as Step[]).map((s) => (
            <span
              key={s}
              className={cn(
                "h-1 rounded-full transition-all",
                s === step ? "w-6 bg-ember" : "w-1.5 bg-line-strong",
              )}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === "you" ? (
          <Panel key="you">
            <Title>First — who are you?</Title>
            <Sub>
              Your name goes on the memories you record, so the people who come after know who was
              talking.
            </Sub>
            <TextField
              id="your-name"
              label="Your name"
              value={name}
              onChange={setName}
              placeholder="e.g. Maya Chen"
              autoFocus
              onEnter={goToFamily}
            />
            <Next disabled={!name.trim()} onClick={goToFamily}>
              Continue
            </Next>
          </Panel>
        ) : null}

        {step === "family" ? (
          <Panel key="family">
            <Title>What should we call the family?</Title>
            <Sub>This is what everyone sees at the top. You can change it later.</Sub>
            <TextField
              id="family-name"
              label="Family name"
              value={familyName}
              onChange={setFamilyName}
              placeholder={suggested || "Your family's name"}
              autoFocus
              onEnter={() => setStep("mode")}
            />
            <Next disabled={false} onClick={() => setStep("mode")}>
              Continue
            </Next>
          </Panel>
        ) : null}

        {step === "mode" ? (
          <Panel key="mode">
            <Title>How would you like to use it?</Title>
            <Sub>You can change this any time.</Sub>

            <div className="mt-6 flex flex-col gap-3">
              <ModeCard
                selected={mode === "standard"}
                onSelect={() => setMode("standard")}
                icon={<Trees className="size-6" />}
                title="Show me everything"
                body="The constellation, the family tree, the maps and timelines. Add photos and stories whenever you like."
              />
              <ModeCard
                selected={mode === "elder"}
                onSelect={() => setMode("elder")}
                icon={<Mic className="size-6" />}
                title="I'd rather just talk"
                body="No menus, no typing. Large text and one big button. Keepsake asks you a question, you answer out loud, and it takes care of the rest."
              />
            </div>

            <Next disabled={!mode} onClick={finish}>
              {mode === "elder" ? "Take me in" : "Create our Keepsake"}
            </Next>
          </Panel>
        ) : null}
      </AnimatePresence>

      <div className="pointer-events-none mt-auto flex items-end justify-center gap-3 pt-10 opacity-70">
        <MemoryOrb emotion="joy" intensity={0.22} size={34} />
        <MemoryOrb emotion="love" intensity={0.18} size={26} />
        <MemoryOrb emotion="longing" intensity={0.2} size={44} />
        <MemoryOrb emotion="pride" intensity={0.16} size={22} />
      </div>
      <p className="pointer-events-none mt-3 text-center text-xs text-ink-faint">
        Your sky is empty. It fills up the first time someone talks.
      </p>
    </main>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.25 }}
      className="mt-9"
    >
      {children}
    </motion.div>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return <h1 className="font-serif text-[2.1rem] leading-[1.12] text-ink">{children}</h1>;
}

function Sub({ children }: { children: React.ReactNode }) {
  return <p className="mt-3 text-[1rem] leading-relaxed text-ink-soft">{children}</p>;
}

function TextField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoFocus,
  onEnter,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onEnter?: () => void;
}) {
  return (
    <div className="mt-7">
      <label htmlFor={id} className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onEnter?.();
        }}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="glass-solid mt-2 h-14 w-full rounded-2xl px-4 text-[1.1rem] text-ink outline-none placeholder:text-ink-faint"
      />
    </div>
  );
}

function Next({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button size="lg" className="mt-7 w-full justify-between rounded-2xl" disabled={disabled} onClick={onClick}>
      {children}
      <ArrowRight />
    </Button>
  );
}

function ModeCard({
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
        "w-full rounded-2xl border p-4 text-left backdrop-blur-xl transition-all",
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
