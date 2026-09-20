"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy, Mic, RotateCcw, Settings2, Trees, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useFamily } from "@/lib/family-context";
import { useSettings } from "@/lib/settings-context";

/**
 * The only settings surface in the app: switch between the two experiences,
 * hand someone the invite code, or wipe everything and start again.
 *
 * Deliberately a small chip rather than a nav item — Elderly Mode has no
 * navigation, and this must not become the exception that reintroduces it.
 */
export function QuickSettings() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const { isElderlyMode, currentUserId, hydrated, toggleMode, reset: resetSettings } = useSettings();
  const { family, hasFamily, personById, reset: resetFamily } = useFamily();
  const router = useRouter();
  const pathname = usePathname();

  if (!hydrated || !hasFamily) return null;
  if (pathname === "/" || pathname.startsWith("/join") || pathname === "/setup") return null;

  const me = personById(currentUserId);

  function switchMode() {
    toggleMode();
    setOpen(false);
    router.push(isElderlyMode ? "/home" : "/elder");
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/join/${family.inviteCode}`,
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — the code is on screen to read out instead */
    }
  }

  function startOver() {
    resetFamily();
    resetSettings();
    setOpen(false);
    router.push("/");
  }

  return (
    <div className="pointer-events-none fixed left-3 z-[60] bottom-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]">
      <AnimatePresence initial={false} mode="wait">
        {open ? (
          <motion.div
            key="panel"
            initial={{ opacity: 0, scale: 0.94, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 6 }}
            transition={{ duration: 0.16 }}
            className="glass pointer-events-auto w-68 rounded-2xl p-2"
          >
            <div className="flex items-center justify-between px-2 py-1">
              <span className="truncate text-[0.7rem] font-semibold uppercase tracking-widest text-ink-faint">
                {me?.name ?? "You"}
              </span>
              <button onClick={() => setOpen(false)} aria-label="Close settings">
                <X className="size-4 text-ink-faint" />
              </button>
            </div>

            <button
              onClick={switchMode}
              className="mt-1 flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface/70"
            >
              {isElderlyMode ? (
                <Trees className="mt-0.5 size-4 shrink-0 text-ink-soft" />
              ) : (
                <Mic className="mt-0.5 size-4 shrink-0 text-ink-soft" />
              )}
              <span>
                <span className="block text-sm font-medium text-ink">
                  {isElderlyMode ? "Show me everything" : "I'd rather just talk"}
                </span>
                <span className="block text-xs text-ink-faint">
                  {isElderlyMode ? "Tree, maps and timelines" : "Voice only, no navigation"}
                </span>
              </span>
            </button>

            <button
              onClick={copyInvite}
              className="flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface/70"
            >
              {copied ? (
                <Check className="mt-0.5 size-4 shrink-0 text-canon" />
              ) : (
                <Copy className="mt-0.5 size-4 shrink-0 text-ink-soft" />
              )}
              <span>
                <span className="block text-sm font-medium text-ink">
                  {copied ? "Link copied" : "Invite someone"}
                </span>
                <span className="block font-mono text-xs tracking-wide text-ink-faint">
                  {family.inviteCode}
                </span>
              </span>
            </button>

            <div className="mt-1 border-t border-line pt-1">
              {confirming ? (
                <div className="px-3 py-2">
                  <p className="text-xs leading-relaxed text-ink-soft">
                    This erases {family.memories.length}{" "}
                    {family.memories.length === 1 ? "memory" : "memories"} and everyone on the tree.
                    It can&apos;t be undone.
                  </p>
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={startOver}
                      className="flex-1 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-canvas"
                    >
                      Erase everything
                    </button>
                    <button
                      onClick={() => setConfirming(false)}
                      className="rounded-lg px-3 py-1.5 text-xs text-ink-soft"
                    >
                      Keep it
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirming(true)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm text-ink-soft transition-colors hover:bg-surface/70"
                >
                  <RotateCcw className="size-4 shrink-0" />
                  Start over
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="chip"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(true)}
            aria-label="Settings"
            className="glass pointer-events-auto flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[0.7rem] font-medium text-ink-faint transition-colors hover:text-ink"
          >
            <Settings2 className="size-3" />
            {me?.name.split(" ")[0] ?? "You"}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
