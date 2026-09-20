"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useFamily, type RelationLink } from "@/lib/family-context";
import { createPerson } from "@/lib/seed";
import { useSettings } from "@/lib/settings-context";
import { cn } from "@/lib/utils";

type Relation = RelationLink["relation"];

const RELATIONS: Array<{ value: Relation; label: string }> = [
  { value: "parent", label: "their parent" },
  { value: "child", label: "their child" },
  { value: "partner", label: "their partner" },
];

/**
 * Adding a relative. Only a name is required — a family tree that demands a
 * birth certificate before it will accept a grandmother is useless.
 */
export function AddPersonSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { family, addPerson } = useFamily();
  const { currentUserId } = useSettings();

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [deathYear, setDeathYear] = useState("");
  const [isLiving, setIsLiving] = useState(true);
  const [relation, setRelation] = useState<Relation>("parent");
  const [anchorId, setAnchorId] = useState(currentUserId || family.people[0]?.id || "");

  const anchor = family.people.find((p) => p.id === anchorId);

  function submit() {
    if (!name.trim()) return;

    const person = createPerson({
      name,
      nickname,
      birthYear: birthYear ? Number(birthYear) : undefined,
      deathYear: !isLiving && deathYear ? Number(deathYear) : null,
      isLiving,
    });

    addPerson(
      person,
      currentUserId,
      anchor ? { personId: anchor.id, relation } : undefined,
    );

    setName("");
    setNickname("");
    setBirthYear("");
    setDeathYear("");
    setIsLiving(true);
    onOpenChange(false);
  }

  if (!open) return null;

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent
        title="Add someone to the tree"
        description="Add a relative to your family tree"
        className="overflow-y-auto"
      >
        <div className="px-5 pb-10 pt-6">
          <h2 className="font-serif text-2xl leading-tight text-ink">Who are we adding?</h2>
          <p className="mt-1.5 text-sm text-ink-soft">
            A name is enough. Everything else can come later, or never.
          </p>

          <Field id="person-name" label="Name">
            <input
              id="person-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Rosa Alvarez"
              className={inputClass}
            />
          </Field>

          <Field id="person-nickname" label="What the family calls them (optional)">
            <input
              id="person-nickname"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder="e.g. Abuela"
              className={inputClass}
            />
          </Field>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Field id="person-born" label="Born" tight>
              <input
                id="person-born"
                value={birthYear}
                onChange={(event) => setBirthYear(event.target.value.replace(/\D/g, "").slice(0, 4))}
                inputMode="numeric"
                placeholder="1941"
                className={inputClass}
              />
            </Field>
            {!isLiving ? (
              <Field id="person-died" label="Died" tight>
                <input
                  id="person-died"
                  value={deathYear}
                  onChange={(event) =>
                    setDeathYear(event.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  inputMode="numeric"
                  placeholder="2019"
                  className={inputClass}
                />
              </Field>
            ) : null}
          </div>

          <div className="mt-4 flex gap-2">
            {[
              { value: true, label: "Living" },
              { value: false, label: "No longer with us" },
            ].map((option) => (
              <button
                key={String(option.value)}
                onClick={() => setIsLiving(option.value)}
                className={cn(
                  "flex-1 rounded-xl border px-3 py-2.5 text-sm transition-colors",
                  isLiving === option.value
                    ? "border-ember bg-ember-soft text-ember"
                    : "border-line bg-surface/60 text-ink-soft",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {family.people.length > 0 ? (
            <>
              <p className="mt-7 text-[0.7rem] font-semibold uppercase tracking-wide text-ink-faint">
                How are they related?
              </p>

              <div className="-mx-5 mt-2.5 flex gap-2 overflow-x-auto px-5 pb-1">
                {family.people.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => setAnchorId(person.id)}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-sm transition-colors",
                      person.id === anchorId
                        ? "border-ember bg-ember-soft text-ember"
                        : "border-line bg-surface/60 text-ink-soft",
                    )}
                  >
                    <Avatar
                      id={person.id}
                      name={person.name}
                      deceased={!person.isLiving}
                      className="size-6 text-[0.6rem]"
                    />
                    {person.name.split(" ")[0]}
                  </button>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                {RELATIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setRelation(option.value)}
                    className={cn(
                      "flex-1 rounded-xl border px-2 py-2.5 text-sm transition-colors",
                      relation === option.value
                        ? "border-canon bg-canon-soft text-canon"
                        : "border-line bg-surface/60 text-ink-soft",
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {anchor ? (
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  <span className="font-medium text-ink">{name.trim() || "They"}</span> will be{" "}
                  {RELATIONS.find((r) => r.value === relation)?.label.replace("their", "")} of{" "}
                  <span className="font-medium text-ink">{anchor.name}</span>.
                </p>
              ) : null}
            </>
          ) : null}

          <Button size="lg" className="mt-8 w-full rounded-2xl" disabled={!name.trim()} onClick={submit}>
            Add to the tree
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

const inputClass =
  "glass-solid mt-2 h-12 w-full rounded-xl px-3.5 text-[1rem] text-ink outline-none placeholder:text-ink-faint";

function Field({
  id,
  label,
  children,
  tight,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  tight?: boolean;
}) {
  return (
    <div className={tight ? "" : "mt-5"}>
      <label htmlFor={id} className="text-[0.7rem] font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </label>
      {children}
    </div>
  );
}
