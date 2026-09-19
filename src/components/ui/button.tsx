"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-ember text-white hover:bg-ember/90 active:bg-ember/95",
        secondary: "bg-surface text-ink border border-line-strong hover:bg-surface-sunk",
        ghost: "text-ink-soft hover:bg-surface-sunk hover:text-ink",
        quiet: "text-ink-soft underline underline-offset-4 hover:text-ink",
        canon: "bg-canon text-white hover:bg-canon/90",
      },
      size: {
        sm: "h-9 rounded-lg px-3 text-sm [&_svg]:size-4",
        md: "h-11 rounded-xl px-4 text-[0.95rem] [&_svg]:size-[18px]",
        lg: "h-14 rounded-2xl px-6 text-lg [&_svg]:size-5",
        /* Elderly Mode floor: 72px tall, never smaller. */
        xl: "min-h-[72px] rounded-3xl px-8 text-2xl [&_svg]:size-7",
        icon: "size-11 rounded-xl [&_svg]:size-5",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
