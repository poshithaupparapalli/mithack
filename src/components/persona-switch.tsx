"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Repeat, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { ELDER_ID, INITIATOR_ID } from "@/lib/mock-data";
import { useFamily } from "@/lib/family-context";
import { useSettings } from "@/lib/settings-context";

/**
 * Demo affordance, not a product feature: jump between the Initiator and the
 * Elder in one tap so the two experiences can be shown back to back. Hidden
 * behind a small chip so it never reads as part of either interface.
 */
export function PersonaSwitch() {
  const [open, setOpen] = useState(false);
  const { isElderlyMode, currentUserId, join, hydrated } = useSettings();
  const { personById } = useFamily();
  const router = useRouter();
  const pathname = usePathname();

  // Nothing to switch between until someone is actually inside the app.
  if (!hydrated || pathname === "/" || pathname.startsWith("/join")) return null;

  function switchTo(elderly: boolean) {
    join({ elderly, userId: elderly ? ELDER_ID : INITIATOR_ID });
    setOpen(false);
    router.push(elderly ? "/elder" : "/home");
  }

  const current = personById(currentUserId);

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
            className="pointer-events-auto w-60 rounded-2xl border border-line bg-surface p-2 shadow-xl"
          >
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-[0.7rem] font-semibold uppercase tracking-widest text-ink-faint">
                Demo persona
              </span>
              <button onClick={() => setOpen(false)} aria-label="Close persona switcher">
                <X className="size-4 text-ink-faint" />
              </button>
            </div>
            <button
              onClick={() => switchTo(false)}
              className={`mt-1 w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                !isElderlyMode ? "bg-ember-soft text-ember" : "hover:bg-surface-sunk"
              }`}
            >
              <span className="block font-medium">Maya — the Initiator</span>
              <span className="block text-xs text-ink-faint">Full app, tree and maps</span>
            </button>
            <button
              onClick={() => switchTo(true)}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                isElderlyMode ? "bg-ember-soft text-ember" : "hover:bg-surface-sunk"
              }`}
            >
              <span className="block font-medium">Rosa — the Elder</span>
              <span className="block text-xs text-ink-faint">Voice only, no navigation</span>
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="chip"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(true)}
            className="pointer-events-auto flex items-center gap-1.5 rounded-full border border-line bg-surface/85 px-2.5 py-1.5 text-[0.7rem] font-medium text-ink-faint shadow-sm backdrop-blur transition-opacity hover:text-ink"
          >
            <Repeat className="size-3" />
            {current?.name.split(" ")[0] ?? "Demo"}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
