"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Bottom sheet on phones, right-hand panel from `sm` up.
 * Radix handles the focus trap and Escape — do not hand-roll this.
 */
export function Sheet({ children, ...props }: Dialog.DialogProps & { children: ReactNode }) {
  return <Dialog.Root {...props}>{children}</Dialog.Root>;
}

export const SheetTrigger = Dialog.Trigger;
export const SheetClose = Dialog.Close;

export function SheetContent({
  className,
  children,
  title,
  description,
  ...props
}: ComponentProps<typeof Dialog.Content> & { title: string; description?: string }) {
  return (
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-[2px] data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:animate-in data-[state=open]:fade-in" />
      <Dialog.Content
        className={cn(
          "fixed z-50 flex flex-col bg-surface shadow-2xl outline-none",
          "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-3xl",
          "data-[state=closed]:animate-out data-[state=open]:animate-in",
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
          "sm:inset-y-0 sm:right-0 sm:left-auto sm:max-h-none sm:w-[26rem] sm:rounded-none sm:rounded-l-3xl",
          "sm:data-[state=closed]:slide-out-to-right sm:data-[state=open]:slide-in-from-right",
          "duration-300 ease-out",
          className,
        )}
        {...props}
      >
        <Dialog.Title className="sr-only">{title}</Dialog.Title>
        {description ? (
          <Dialog.Description className="sr-only">{description}</Dialog.Description>
        ) : null}
        {/* Grab handle, phone only. */}
        <div className="mx-auto mt-3 h-1.5 w-10 rounded-full bg-line-strong sm:hidden" />
        <Dialog.Close
          aria-label="Close"
          className="absolute right-4 top-4 hidden size-9 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-surface-sunk hover:text-ink sm:flex"
        >
          <X className="size-5" />
        </Dialog.Close>
        {children}
      </Dialog.Content>
    </Dialog.Portal>
  );
}
