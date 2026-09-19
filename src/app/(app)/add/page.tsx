"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, FileText, ImageIcon, Loader2, MapPin, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState, type DragEvent } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RecordControl } from "@/components/memory/record-control";
import { useFamily } from "@/lib/family-context";
import { useSettings } from "@/lib/settings-context";
import type { FamilyEvent, Memory } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function AddMemoryPage() {
  const router = useRouter();
  const { family, addMemory, resolveMemory } = useFamily();
  const { currentUserId } = useSettings();

  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [people, setPeople] = useState<string[]>([]);
  const [placeId, setPlaceId] = useState<string>("");
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    setFiles((prev) => [...prev, ...Array.from(incoming)].slice(0, 8));
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    addFiles(event.dataTransfer.files);
  }

  const canSave = text.trim().length > 0 || files.length > 0;

  function save() {
    if (!canSave) return;
    setSaving(true);

    const id = `m-${Date.now()}`;
    const memory: Memory = {
      id,
      kind: files.length > 0 ? "photo" : "text",
      authorId: currentUserId,
      createdAt: new Date().toISOString(),
      title: text.trim().split("\n")[0]?.slice(0, 64) || files[0]?.name,
      body: text.trim() || undefined,
      mediaUrl: null,
      personIds: people,
      placeId: placeId || undefined,
      derivedEventIds: [],
      status: "processing",
    };

    addMemory(memory);

    // Stand-in for the pipeline coming back with structured events.
    window.setTimeout(() => {
      const derived: FamilyEvent[] = [
        {
          id: `e-${id}`,
          title: memory.title ?? "A new memory",
          date: String(new Date().getFullYear()),
          datePrecision: "year",
          scope: "individual",
          category: "anecdote",
          personIds: people.length > 0 ? people : [currentUserId],
          placeId: placeId || undefined,
          summary: (memory.body ?? "").slice(0, 160),
          sourceMemoryIds: [id],
          confidence: 0.81,
        },
      ];
      resolveMemory(id, derived);
    }, 2600);

    window.setTimeout(() => router.push("/home"), 700);
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-8 pt-5">
      <RecordControl
        onTranscript={(result) =>
          setText((prev) => (prev ? `${prev.trim()}\n\n${result.text}` : result.text))
        }
      />

      <div className="my-5 flex items-center gap-3">
        <span className="h-px flex-1 bg-line" />
        <span className="text-xs uppercase tracking-widest text-ink-faint">or write it</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <label htmlFor="memory-text" className="sr-only">
        What do you remember?
      </label>
      <textarea
        id="memory-text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={6}
        placeholder="What do you remember? A room, a smell, something someone always said…"
        className="glass-solid w-full resize-y rounded-2xl p-4 text-[1rem] leading-relaxed text-ink outline-none placeholder:text-ink-faint"
      />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "mt-4 cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
          dragging ? "border-ember bg-ember-soft/60" : "border-line-strong bg-surface/40 backdrop-blur-sm hover:border-ink-faint",
        )}
      >
        <UploadCloud className={cn("mx-auto size-7", dragging ? "text-ember" : "text-ink-faint")} />
        <p className="mt-2 text-[0.95rem] font-medium text-ink">
          Drop photos, letters or recordings
        </p>
        <p className="mt-0.5 text-xs text-ink-faint">or tap to choose from this device</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,audio/*,.pdf"
          className="hidden"
          onChange={(event) => addFiles(event.target.files)}
        />
      </div>

      <AnimatePresence initial={false}>
        {files.length > 0 ? (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 flex flex-col gap-2 overflow-hidden"
          >
            {files.map((file, i) => (
              <li
                key={`${file.name}-${i}`}
                className="glass-solid flex items-center gap-3 rounded-xl px-3 py-2.5"
              >
                {file.type.startsWith("image/") ? (
                  <ImageIcon className="size-4 shrink-0 text-ink-faint" />
                ) : (
                  <FileText className="size-4 shrink-0 text-ink-faint" />
                )}
                <span className="min-w-0 flex-1 truncate text-sm text-ink">{file.name}</span>
                <span className="shrink-0 text-xs tabular-nums text-ink-faint">
                  {(file.size / 1024).toFixed(0)} KB
                </span>
                <button
                  type="button"
                  aria-label={`Remove ${file.name}`}
                  onClick={(event) => {
                    event.stopPropagation();
                    setFiles((prev) => prev.filter((_, index) => index !== i));
                  }}
                  className="text-ink-faint hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>

      <section className="mt-7">
        <h2 className="text-sm font-semibold text-ink">Who is in this memory?</h2>
        <div className="-mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4 pb-1">
          {family.people.map((person) => {
            const active = people.includes(person.id);
            return (
              <button
                key={person.id}
                type="button"
                onClick={() =>
                  setPeople((prev) =>
                    active ? prev.filter((id) => id !== person.id) : [...prev, person.id],
                  )
                }
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-sm transition-colors",
                  active
                    ? "border-ember bg-ember-soft text-ember"
                    : "border-line bg-surface text-ink-soft hover:border-line-strong",
                )}
              >
                <Avatar
                  id={person.id}
                  name={person.name}
                  deceased={!person.isLiving}
                  className="size-6 text-[0.6rem]"
                />
                {person.name.split(" ")[0]}
                {active ? <Check className="size-3.5" strokeWidth={3} /> : null}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-ink">Where was this?</h2>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {family.places.map((place) => {
            const active = place.id === placeId;
            return (
              <button
                key={place.id}
                type="button"
                onClick={() => setPlaceId(active ? "" : place.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "border-canon bg-canon-soft text-canon"
                    : "border-line bg-surface text-ink-soft hover:border-line-strong",
                )}
              >
                <MapPin className="size-3.5" />
                {place.shortName}
              </button>
            );
          })}
        </div>
      </section>

      <Button size="lg" className="mt-8 w-full" disabled={!canSave || saving} onClick={save}>
        {saving ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            Saving to the family record…
          </>
        ) : (
          "Add to our story"
        )}
      </Button>
      <p className="mt-2.5 text-center text-xs leading-relaxed text-ink-faint">
        Keepsake will read this, work out who and when it is about, and place it on the timeline.
      </p>
    </div>
  );
}
