"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BottomNav } from "@/components/nav/bottom-nav";
import { TopBar } from "@/components/nav/top-bar";
import { useSettings } from "@/lib/settings-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isElderlyMode, hydrated } = useSettings();
  const router = useRouter();

  // Elderly Mode is a separate route tree, not a set of hidden classes.
  // Anyone who lands here in that mode is sent home to the voice experience.
  useEffect(() => {
    if (hydrated && isElderlyMode) router.replace("/elder");
  }, [hydrated, isElderlyMode, router]);

  if (!hydrated || isElderlyMode) {
    return <div className="min-h-dvh bg-canvas" aria-hidden />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <TopBar />
      <main className="flex-1 pb-[calc(env(safe-area-inset-bottom,0px)+5.5rem)]">{children}</main>
      <BottomNav />
    </div>
  );
}
