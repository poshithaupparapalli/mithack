import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** Renders a partial date ("1968", "1968-04", "1968-04-12") for humans. */
export function formatPartialDate(date: string, precision: "year" | "month" | "day") {
  const [year, month, day] = date.split("-");
  if (precision === "year" || !month) return year;
  const monthName = new Date(Number(year), Number(month) - 1, 1).toLocaleString("en-US", {
    month: "long",
  });
  if (precision === "month" || !day) return `${monthName} ${year}`;
  return `${monthName} ${Number(day)}, ${year}`;
}

export function yearOf(date: string) {
  return Number(date.slice(0, 4));
}

export function lifespan(birthYear?: number, deathYear?: number | null) {
  if (!birthYear) return "";
  return deathYear ? `${birthYear} – ${deathYear}` : `b. ${birthYear}`;
}

export function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
