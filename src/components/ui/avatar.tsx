import { cn, initials } from "@/lib/utils";

/**
 * Initials avatar with a hue derived from the person's id, so the same
 * relative is always the same colour across tree, timeline and map.
 */
const PALETTE = [
  "bg-[#e8d5c4] text-[#7a4a25]",
  "bg-[#d8e3dc] text-[#2f5a4c]",
  "bg-[#e6dcea] text-[#5a3f6b]",
  "bg-[#f0e0d0] text-[#8a5a2b]",
  "bg-[#dce4ee] text-[#35506e]",
  "bg-[#eee0dd] text-[#8a4a42]",
];

function hue(id: string) {
  let sum = 0;
  for (let i = 0; i < id.length; i += 1) sum += id.charCodeAt(i);
  return PALETTE[sum % PALETTE.length];
}

export function Avatar({
  id,
  name,
  className,
  deceased = false,
}: {
  id: string;
  name: string;
  className?: string;
  deceased?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-serif font-semibold",
        hue(id),
        deceased && "ring-1 ring-inset ring-line-strong grayscale-[35%]",
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
