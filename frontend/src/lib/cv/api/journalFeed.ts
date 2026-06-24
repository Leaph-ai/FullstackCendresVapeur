import { JOURNAL_LOGS, type JournalLog } from '../types';
import type { JournalEntry } from '../types/live';

export interface RawPublicLog {
  id: number;
  message: string;
  created_at: string;
}

function deriveType(message: string): JournalLog['type'] {
  const lower = message.toLowerCase();
  if (lower.startsWith('événement:') && lower.includes('alerte rouge')) return 'alert';
  if (lower.startsWith('vote:')) return 'vote';
  if (lower.startsWith('commande:') || lower.startsWith('achat:')) return 'troc';
  if (lower.startsWith('événement:')) return 'chaudiere';
  return 'acces';
}

function stripPrefix(message: string): string {
  const idx = message.indexOf(':');
  return idx >= 0 ? message.slice(idx + 1).trim() : message;
}

function formatStamp(createdAt: string): string {
  const d = new Date(createdAt);
  if (Number.isNaN(d.getTime())) return '··:·· · cycle 14';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm} · cycle 14`;
}

export function mapFeedToEntries(raw: RawPublicLog[]): JournalEntry[] {
  return raw.map((log) => ({
    type: deriveType(log.message),
    text: stripPrefix(log.message),
    key: String(log.id),
    stamp: formatStamp(log.created_at),
  }));
}

export async function fetchJournalFeed(): Promise<RawPublicLog[]> {
  const res = await fetch('/api/logs/feed');
  if (!res.ok) throw new Error(`feed ${res.status}`);
  return (await res.json()) as RawPublicLog[];
}

/** Entrées de repli (mock) quand le feed est vide ou indisponible. */
export function fallbackEntries(): JournalEntry[] {
  return JOURNAL_LOGS.slice(0, 6).map((log, i) => ({
    ...log,
    key: `mock-${i}`,
    stamp: `14:${String((i * 7) % 60).padStart(2, '0')} · cycle 14`,
  }));
}
