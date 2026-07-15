import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDollar(value: number | null): string {
  if (value == null) return '$0';
  return '$' + value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

export function formatPct(value: number | null): string {
  if (value == null) return '0%';
  return value.toFixed(1) + '%';
}

export function formatNumber(value: number | null): string {
  if (value == null) return '0';
  return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
}
