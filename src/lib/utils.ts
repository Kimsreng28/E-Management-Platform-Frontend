import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine Tailwind classes conditionally
 * - `clsx` handles conditional joining
 * - `tailwind-merge` removes conflicting Tailwind classes
 */
export function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}
