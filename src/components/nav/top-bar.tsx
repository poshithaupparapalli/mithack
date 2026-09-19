"use client";

import { MessageCircleHeart } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/ui/avatar";
import { useFamily } from "@/lib/family-context";
import { useSettings } from "@/lib/settings-context";

const TITLES: Record<string, string> = {
  "/home": "Home",
  "/tree": "Family tree",
  "/map": "Where we've been",
  "/timeline": "Timeline",
  "/add": "Add a memory",
  "/chat": "Keepsake",
};

export function TopBar() {
  const pathname = usePathname();
  const { family, openGaps } = useFamily();
  const { currentUserId } = useSettings();
  const me = family.people.find((p) => p.id === currentUserId);

  return (
    <header className="sticky top-0 z-30 border-b border-white/45 bg-canvas/55 backdrop-blur-xl backdrop-saturate-150">
      <div
        className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 pb-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.75rem)" }}
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-ember">
            {family.name}
          </p>
          <h1 className="truncate font-serif text-xl leading-tight text-ink">
            {TITLES[pathname] ?? "Keepsake"}
          </h1>
        </div>

        <Link
          href="/chat"
          aria-label={`Keepsake has ${openGaps.length} questions for the family`}
          className="glass relative flex size-10 items-center justify-center rounded-full text-ink-soft transition-colors hover:text-ink"
        >
          <MessageCircleHeart className="size-5" />
          {openGaps.length > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-ember text-[0.65rem] font-semibold text-white">
              {openGaps.length}
            </span>
          ) : null}
        </Link>

        {me ? <Avatar id={me.id} name={me.name} className="size-10 text-sm" /> : null}
      </div>
    </header>
  );
}
