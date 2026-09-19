"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Mic } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import type { Person } from "@/lib/types";
import { cn, lifespan } from "@/lib/utils";

export type PersonNodeData = {
  person: Person;
  isMe: boolean;
  hasOpenGap: boolean;
};

const dot = "!size-1.5 !border-0 !bg-line-strong";

export function PersonNode({ data, selected }: NodeProps & { data: PersonNodeData }) {
  const { person, isMe, hasOpenGap } = data;

  return (
    <div
      className={cn(
        "relative w-[168px] cursor-pointer rounded-2xl border bg-surface px-3 py-2.5 text-left transition-all",
        "hover:-translate-y-0.5 hover:shadow-md",
        selected ? "border-ember shadow-[0_0_0_2px_var(--color-ember)]" : "border-line shadow-sm",
        !person.isLiving && "bg-surface-sunk/60",
      )}
    >
      <Handle id="top" type="target" position={Position.Top} className={dot} />
      <Handle id="left" type="target" position={Position.Left} className="!size-1 !border-0 !bg-transparent" />

      <div className="flex items-center gap-2.5">
        <Avatar
          id={person.id}
          name={person.name}
          deceased={!person.isLiving}
          className="size-9 text-xs"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.88rem] font-medium leading-tight text-ink">{person.name}</p>
          <p className="truncate text-[0.72rem] text-ink-faint">
            {lifespan(person.birthYear, person.deathYear)}
          </p>
        </div>
      </div>

      {person.nickname ? (
        <p className="mt-1.5 truncate font-serif text-[0.78rem] italic text-ink-soft">
          &ldquo;{person.nickname}&rdquo;
        </p>
      ) : null}

      {isMe ? (
        <span className="absolute -right-1.5 -top-1.5 rounded-full bg-ink px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-canvas">
          You
        </span>
      ) : null}

      {hasOpenGap ? (
        <span
          title="Keepsake has a question about this person"
          className="absolute -left-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-gap text-white"
        >
          <Mic className="size-3" />
        </span>
      ) : null}

      <Handle id="right" type="source" position={Position.Right} className="!size-1 !border-0 !bg-transparent" />
      <Handle id="bottom" type="source" position={Position.Bottom} className={dot} />
    </div>
  );
}
