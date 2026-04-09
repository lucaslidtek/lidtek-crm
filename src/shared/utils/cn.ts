import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with clsx.
 * Resolves conflicts (e.g., `p-4` + `p-6` → `p-6`).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
