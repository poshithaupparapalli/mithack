"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MeshBackdrop } from "@/components/orb/mesh-backdrop";
import { BottomNav } from "@/components/nav/bottom-nav";
import { TopBar } from "@/components/nav/top-bar";
import { useFamily } from "@/lib/family-context";
import { useSettings } from "@/lib/settings-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isElderlyMode, hydrated } = useSettings();
  const { hasFamily, hydrated: familyReady } = useFamily();
  const router = useRouter();
  const ready = hydrated && familyReady;

  // Elderly Mode is a separate route tree, not a set of hidden classes.
  // Anyone who lands here in that mode is sent home to the voice experience.
  useEffect(() => {
    if (!ready) return;
    if (!hasFamily) router.replace("/setup");
    else if (isElderlyMode) router.replace("/elder");
  }, [hasFamily, isElderlyMode, ready, router]);

  if (!ready || isElderlyMode || !hasFamily) {
    return <div className="min-h-dvh bg-canvas" aria-hidden />;
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <MeshBackdrop />
      <TopBar />
      <main className="flex-1 pb-[calc(env(safe-area-inset-bottom,0px)+5.5rem)]">{children}</main>
      <BottomNav />
    </div>
  );
}
