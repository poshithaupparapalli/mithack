"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSettings } from "@/lib/settings-context";

/**
 * Elderly Mode's own root. No navigation bar, no header, no tabs — there is
 * nothing here to get lost in, which is the entire point.
 */
export default function ElderLayout({ children }: { children: React.ReactNode }) {
  const { isElderlyMode, hydrated } = useSettings();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !isElderlyMode) router.replace("/home");
  }, [hydrated, isElderlyMode, router]);

  if (!hydrated) return <div className="min-h-dvh bg-canvas" aria-hidden />;

  return (
    <div
      data-elder="true"
      className="min-h-dvh bg-canvas px-6 pb-[calc(env(safe-area-inset-bottom,0px)+2rem)] pt-[calc(env(safe-area-inset-top,0px)+2.5rem)]"
    >
      {children}
    </div>
  );
}
