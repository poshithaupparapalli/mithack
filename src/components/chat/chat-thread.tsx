"use client";

import { motion } from "framer-motion";
import { Mic, Sparkles } from "lucide-react";
import { useEffect, useRef } from "react";
import { Avatar } from "@/components/ui/avatar";
import type { ChatMessage } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ChatThread({
  messages,
  thinking,
  authorName,
  authorId,
}: {
  messages: ChatMessage[];
  thinking: boolean;
  authorName: string;
  authorId: string;
}) {
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, thinking]);

  return (
    <div className="flex flex-col gap-4">
      {messages.map((message) => {
        const fromAgent = message.role === "agent";
        return (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className={cn("flex items-end gap-2.5", fromAgent ? "justify-start" : "justify-end")}
          >
            {fromAgent ? (
              <span className="mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-canvas">
                <Sparkles className="size-4" />
              </span>
            ) : null}

            <div
              className={cn(
                "max-w-[78%] rounded-2xl px-4 py-3 text-[0.97rem] leading-relaxed",
                fromAgent
                  ? "glass-solid rounded-bl-sm text-ink"
                  : "rounded-br-sm bg-ink text-canvas",
              )}
            >
              {message.kind === "voice" ? (
                <span className="mb-1.5 flex items-center gap-1.5 text-xs opacity-70">
                  <Mic className="size-3" />
                  spoken{message.durationSec ? ` · ${message.durationSec}s` : ""}
                </span>
              ) : null}
              {message.text}
            </div>

            {!fromAgent ? (
              <Avatar id={authorId} name={authorName} className="mb-0.5 size-8 shrink-0 text-xs" />
            ) : null}
          </motion.div>
        );
      })}

      {thinking ? (
        <div className="flex items-end gap-2.5">
          <span className="mb-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-ink text-canvas">
            <Sparkles className="size-4" />
          </span>
          <div className="glass-solid flex gap-1 rounded-2xl rounded-bl-sm px-4 py-3.5">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="size-1.5 rounded-full bg-ink-faint"
                animate={{ opacity: [0.25, 1, 0.25] }}
                transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div ref={end} />
    </div>
  );
}
