"use client";

import { motion } from "framer-motion";
import { CalendarClock, House, MapPinned, Plus, Trees } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/home", label: "Home", icon: House, primary: false },
  { href: "/tree", label: "Tree", icon: Trees, primary: false },
  { href: "/add", label: "Add", icon: Plus, primary: true },
  { href: "/map", label: "Map", icon: MapPinned, primary: false },
  { href: "/timeline", label: "Timeline", icon: CalendarClock, primary: false },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/45 bg-canvas/60 backdrop-blur-xl backdrop-saturate-150"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto flex w-full max-w-2xl items-stretch justify-between px-2 py-1.5">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          if (item.primary) {
            return (
              <li key={item.href} className="flex flex-1 justify-center">
                <Link
                  href={item.href}
                  aria-label="Add a memory"
                  className="-mt-5 flex size-14 items-center justify-center rounded-2xl bg-ember text-white shadow-lg shadow-ember/25 transition-transform active:scale-95"
                >
                  <Icon className="size-6" strokeWidth={2.5} />
                </Link>
              </li>
            );
          }

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-xl text-[0.68rem] font-medium transition-colors",
                  active ? "text-ember" : "text-ink-faint hover:text-ink-soft",
                )}
              >
                <Icon className="size-[22px]" />
                {item.label}
                {active ? (
                  <motion.span
                    layoutId="nav-dot"
                    transition={{ type: "spring", stiffness: 500, damping: 36 }}
                    className="absolute -bottom-0.5 size-1 rounded-full bg-ember"
                  />
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
