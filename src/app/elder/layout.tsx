"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useFamily } from "@/lib/family-context";
import { useSettings } from "@/lib/settings-context";

/**
 * Elderly Mode's own root. No navigation bar, no header, no tabs — there is
 * nothing here to get lost in, which is the entire point.
 */
export default function ElderLayout({ children }: { children: React.ReactNode }) {
  const { isElderlyMode, hydrated } = useSettings();
  const { hasFamily, hydrated: familyReady } = useFamily();
  const router = useRouter();
  const ready = hydrated && familyReady;

  useEffect(() => {
    if (!ready) return;
    if (!hasFamily) router.replace("/setup");
    else if (!isElderlyMode) router.replace("/home");
  }, [hasFamily, isElderlyMode, ready, router]);

  if (!ready || !hasFamily) return <div className="min-h-dvh bg-canvas" aria-hidden />;

  return (
    <div
      data-elder="true"
      className="min-h-dvh px-6 pb-[calc(env(safe-area-inset-bottom,0px)+2rem)] pt-[calc(env(safe-area-inset-top,0px)+2.5rem)]"
    >
      {children}
    </div>
  );
}
