import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MONTH_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const DAY_NAMES = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export function formatDayTitle(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const dt = new Date(Date.UTC(y, m, d, 12, 0, 0));
  const dayName = DAY_NAMES[dt.getUTCDay()];
  const monthName = MONTH_SHORT[dt.getUTCMonth()];
  return `${dayName}, ${monthName} ${d}, ${y}`;
}

/**
 * Formats an ISO 8601 timestamp with pinpoint accuracy into the user's local timezone.
 * Returns exact 12-hour format with hours, minutes, and seconds (e.g., "12:45:10 PM")
 */
export function formatExactTime(timestamp?: string, fallback?: string): string {
  if (!timestamp) return fallback || '';
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return fallback || '';
    return d.toLocaleTimeString([], {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  } catch {
    return fallback || '';
  }
}

/**
 * Returns the exact full date and time with local timezone code for tooltip or detail view
 * e.g. "Sep 25, 2026 at 12:45:10 PM PDT"
 */
export function formatExactDateTimeWithZone(timestamp?: string): string {
  if (!timestamp) return '';
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    });
  } catch {
    return '';
  }
}

/**
 * Converts an ISO timestamp to local YYYY-MM-DD matching the user's actual browser date
 */
export function getLocalDateKey(timestamp?: string): string {
  if (!timestamp) return '';
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '';
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  } catch {
    return '';
  }
}
