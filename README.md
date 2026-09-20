# Keepsake

Capture, organise and visualise family history using AI. Built for HackMIT 2026
(Meta — *Bringing People Closer Together with AI*; Long Lake — *Convince a Non-Believer*).

This repo is the **frontend**. It runs entirely on local state, so it never
blocks on the Muse pipeline.

```bash
npm install
npm run dev     # http://localhost:3000
```

---

## It starts empty

There is no sample family and no demo data. The first thing anyone sees is
their own blank sky, and every person, place and memory in the app was put
there by someone using it. Everything persists to `localStorage`, so a family's
memories survive closing the tab.

**First run:** `/` → *Start my family's Keepsake* → `/setup` asks three things
(your name, the family's name, and which of the two experiences you want) →
you land in an empty constellation with one unlit orb and a prompt to record.

**Everything is created in-app:**

| To add | Where | How |
|---|---|---|
| A memory | `/add` | Record, type, or drop files in |
| A relative | `/tree` | *Add someone* — a name is the only required field; parent/child/partner links are applied to both sides and set the generation |
| A place | `/map` | *Add a place*, then tap the map to drop a pin. No geocoding API, so nothing to key or rate-limit |
| Another person on this device | `/join/[code]` | The invite fork, where Elderly Mode gets chosen |

**Start over** is in the settings chip at bottom-left — it wipes the family and
the settings and returns you to the landing page.

---

## The two experiences

| | Standard Mode | Elderly Mode |
|---|---|---|
| Route tree | `src/app/(app)/*` | `src/app/elder/*` |
| Navigation | Bottom nav: Home · Tree · Add · Map · Timeline | None. There is one button. |
| Base type size | 14–16px | 22px floor, questions at 34px |
| Entry point | Setup/invite → "Show me everything" | Setup/invite → "I'd rather just talk" |

Elderly Mode is a **separate route tree**, not conditional rendering. Each
layout redirects anyone who lands in the wrong one (and both send you to
`/setup` if no family exists yet), so navigation can never leak into the voice
experience.

---

## For the backend / Muse team

There are exactly **two** integration points. Everything else is internal.

### 1. The data contract — [`src/lib/types.ts`](src/lib/types.ts)

This file is the agreed shape between frontend and pipeline. The UI reads
nothing that isn't declared here.

| Type | What it is |
|---|---|
| `Person` | A relative. `generation` drives tree layout; `parentIds` / `spouseIds` draw the edges. |
| `Place` | `kind: "current"` = a living relative is there now; `"historical"` = ancestors only. Drives the map pins. |
| `FamilyEvent` | `scope: "canon"` = shared family milestone, `"individual"` = one person's story. This is the Canon/Individual timeline toggle. `confidence < 0.6` renders as *unconfirmed*. |
| `Memory` | A raw artefact — voice, photo or text. `status: "processing"` shows the "Keepsake is listening…" state. |
| `Gap` | A hole in the record. This is what the AI Interviewer asks about, and what gets interleaved into the timeline as "Missing from the record". |
| `Emotion` | `joy \| love \| pride \| longing \| grief`. **This is the one inferred field the UI genuinely depends on** — it colours every orb in the interface. Ships with an `intensity` (0–1) that drives orb size and glow. A missing emotion falls back to joy at low intensity rather than hiding the memory. |

Dates are **partial ISO strings** (`"1968"`, `"1968-04"`, `"1968-04-12"`) paired
with a `datePrecision`, because family memory genuinely is that fuzzy. Don't
force them into `Date`.

Change this file first; TypeScript will point at every screen affected.

[`src/lib/family-context.tsx`](src/lib/family-context.tsx) holds the record and
hydrates it from `localStorage`. Going live means replacing the two
hydrate/persist effects with `fetch` and `PATCH`; every selector below them
stays exactly as it is.

### 2. Speech-to-text — [`src/app/api/transcribe/route.ts`](src/app/api/transcribe/route.ts)

The single place the frontend talks to STT. Swap the handler body for Muse
Voice, keep the shape, and no component changes.

```
POST /api/transcribe    multipart/form-data { audio: Blob, durationSec: string }
→ 200                   { text, durationSec, confidence, emotion, intensity }
```

`emotion` has to come back **with** the transcript, not in a later pass — in
Elderly Mode the speaker watches her orb bloom into its colour the moment she
stops talking, and that moment is the whole pitch.

Live captions during recording come from the browser's own `SpeechRecognition`
where it exists (instant, on-device); the POST response is authoritative. If
there's no microphone or permission is refused, the recorder degrades to a
simulated take rather than dead-ending — see
[`src/lib/use-voice-capture.ts`](src/lib/use-voice-capture.ts).

**Still stubbed on the frontend side**, if you'd rather own it:

- **Gap generation** ([`src/lib/seed.ts`](src/lib/seed.ts)) is rule-based: five
  opening questions that work when Keepsake knows nothing at all, plus one
  auto-generated per person who lands on the tree without a story attached.
  Real gap-finding over the graph is yours if you want it.
- `useInterview` ([`src/lib/use-interview.ts`](src/lib/use-interview.ts)) picks
  the next gap by priority and uses canned acknowledgements. Swap it for a Muse
  Agent call and the chat UI and Elderly Mode both upgrade at once.
- `/add` fakes event extraction with a `setTimeout` that calls
  `resolveMemory(id, events)`. Point that at the real pipeline response.

---

## The orb system

Every memory is a bead of liquid glass, coloured by how it felt. This is the
one visual idea the whole interface runs on, so it's worth not diluting:

- **Colour lives only in orbs.** Parchment ground, warm neutral type, glass
  chrome — none of it is ever tinted. If something is saturated, it's a memory.
  The palette is in [`src/lib/emotions.ts`](src/lib/emotions.ts) and nowhere else.
- **`glassOrbSurface()`** is the liquid-glass recipe: a real `backdrop-filter`
  bending the mesh behind it, a bright inset rim where light enters top-left, a
  saturated bloom where it pools bottom-right, and an off-centre specular
  highlight. `orbSurface()` is the solid fallback — use it under ~28px or
  wherever an icon sits on top, because glass that small turns to mud.
- **Home is a constellation, not a feed.** Orbs are laid out on a phyllotaxis
  spiral ([`src/lib/constellation.ts`](src/lib/constellation.ts)) — even spacing
  with no collision pass, identical on server and client. Tap to open; tap a
  feeling in the legend to isolate it.
- **A gap is an unlit orb.** Clear glass, no colour — the same treatment as the
  empty state's single waiting orb. Answering one lights it.
- **The mesh** ([`mesh-backdrop.tsx`](src/components/orb/mesh-backdrop.tsx)) is
  four very large CSS radial washes over parchment, tintable per screen. No
  image assets, so nothing to license and nothing to fail on a projector.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Tailwind v4** — tokens in [`src/app/globals.css`](src/app/globals.css)
- **shadcn/ui conventions** on Radix primitives ([`src/components/ui/`](src/components/ui/))
- **@xyflow/react** — family tree, custom layout in [`src/lib/tree-layout.ts`](src/lib/tree-layout.ts)
- **React Leaflet** + Carto light tiles — no API key required
- **Framer Motion**, **Lucide**

## Accessibility notes (Long Lake)

These are deliberate and worth not regressing:

- Elderly Mode targets are `min-height: 72px`; the record button is 272px.
- Every button carries a word, never an icon alone.
- Questions are read aloud via `speechSynthesis`, with a manual "Read it to me".
- `maximum-scale=5` — pinch-zoom is never disabled.
- Focus rings are visible everywhere; `prefers-reduced-motion` is respected.
- Elderly Mode never uses the words "AI", "transcribe", or "data". The question
  comes from whoever set the family up, not from a model.
- The record button is an orb, not a microphone. At rest it's clear, unlit
  glass; her voice's amplitude feeds its intensity, so it warms as she speaks
  and blooms into its emotion when it saves. She never sees a waveform, a
  timer, or the word "recording".
