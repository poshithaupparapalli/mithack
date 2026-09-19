"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  ReactFlowProvider,
  type Edge,
  type Node,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Info } from "lucide-react";
import { useMemo, useState } from "react";
import { PersonNode, type PersonNodeData } from "@/components/tree/person-node";
import { PersonPanel } from "@/components/tree/person-panel";
import { useFamily } from "@/lib/family-context";
import { useSettings } from "@/lib/settings-context";
import { layoutFamily } from "@/lib/tree-layout";
import type { Emotion, ID } from "@/lib/types";

const nodeTypes = { person: PersonNode };

function TreeCanvas() {
  const { family, openGaps, memoriesFor } = useFamily();
  const { currentUserId } = useSettings();
  const [selected, setSelected] = useState<ID | null>(null);

  const { nodes, edges } = useMemo(() => {
    const laidOut = layoutFamily(family.people);

    /** Whichever feeling carries the most weight across someone's memories. */
    const dominant = (id: ID) => {
      const memories = memoriesFor(id);
      const tally = new Map<Emotion, number>();
      for (const memory of memories) {
        if (!memory.emotion) continue;
        tally.set(memory.emotion, (tally.get(memory.emotion) ?? 0) + (memory.intensity ?? 0.7));
      }
      const best = [...tally.entries()].sort((a, b) => b[1] - a[1])[0];
      return {
        emotion: best?.[0],
        intensity: best ? Math.min(1, best[1] / Math.max(1, memories.length)) : undefined,
        memoryCount: memories.length,
      };
    };

    const xOf = new Map(laidOut.map((l) => [l.person.id, l.x]));

    const nodes: Node<PersonNodeData>[] = laidOut.map(({ person, x, y }) => ({
      id: person.id,
      type: "person",
      position: { x, y },
      data: {
        person,
        isMe: person.id === currentUserId,
        hasOpenGap: openGaps.some((g) => g.subjectPersonId === person.id),
        ...dominant(person.id),
      },
    }));

    const edges: Edge[] = [];

    for (const person of family.people) {
      for (const parentId of person.parentIds) {
        edges.push({
          id: `${parentId}->${person.id}`,
          source: parentId,
          sourceHandle: "bottom",
          target: person.id,
          targetHandle: "top",
          type: "smoothstep",
          style: { stroke: "var(--color-line-strong)", strokeWidth: 1.5 },
        });
      }
    }

    // One spouse edge per couple, always drawn left-to-right.
    const drawn = new Set<string>();
    for (const person of family.people) {
      for (const spouseId of person.spouseIds) {
        const key = [person.id, spouseId].sort().join("|");
        if (drawn.has(key)) continue;
        drawn.add(key);
        const leftFirst = (xOf.get(person.id) ?? 0) <= (xOf.get(spouseId) ?? 0);
        const [left, right] = leftFirst ? [person.id, spouseId] : [spouseId, person.id];
        edges.push({
          id: `spouse-${key}`,
          source: left,
          sourceHandle: "right",
          target: right,
          targetHandle: "left",
          type: "straight",
          style: { stroke: "var(--color-ember)", strokeWidth: 1.5, strokeDasharray: "4 4" },
        });
      }
    }

    return { nodes, edges };
  }, [family.people, currentUserId, openGaps, memoriesFor]);

  const onNodeClick: NodeMouseHandler = (_, node) => setSelected(node.id);

  return (
    <>
      <div className="relative h-[calc(100dvh-10rem)] w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.22, maxZoom: 1 }}
          minZoom={0.3}
          maxZoom={1.6}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable
          proOptions={{ hideAttribution: true }}
          className="!bg-transparent [&_.react-flow__pane]:cursor-grab [&_.react-flow__pane:active]:cursor-grabbing"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={26}
            size={1.2}
            color="rgba(140,125,105,0.35)"
          />
          <Controls
            showInteractive={false}
            className="!bottom-4 !left-auto !right-4 !shadow-sm [&_button]:!border-line [&_button]:!bg-surface [&_button]:!text-ink-soft"
          />
        </ReactFlow>

        <div className="glass pointer-events-none absolute left-4 top-4 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-ink-faint">
          <Info className="size-3.5" />
          Tap anyone to open their story
        </div>
      </div>

      <PersonPanel personId={selected} onOpenChange={(open) => !open && setSelected(null)} />
    </>
  );
}

export default function TreePage() {
  return (
    <ReactFlowProvider>
      <TreeCanvas />
    </ReactFlowProvider>
  );
}
