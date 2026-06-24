import type { JournalEntry, JournalLog } from '../types';

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const API_BASE_URL = (rawApiBaseUrl?.trim() || '/api').replace(/\/+$/, '');
const FALLBACK_API_BASE_URLS = ['http://127.0.0.1:8000', 'http://localhost:8000'];

export interface JournalEntryDto {
  id: number;
  type: JournalLog['type'];
  action: string;
  created_at: string;
}

export async function fetchJournal(limit = 12, signal?: AbortSignal): Promise<JournalEntryDto[]> {
  return fetchFromApi<JournalEntryDto[]>(`/journal/?limit=${limit}`, { signal });
}

/** Convertit une entrée API en entrée d'affichage du flux. */
export function toJournalEntry(dto: JournalEntryDto): JournalEntry {
  return {
    key: String(dto.id),
    type: dto.type,
    text: dto.action,
    stamp: formatStamp(dto.created_at),
  };
}

function formatStamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm} · cycle ${date.getDate()}`;
}

async function fetchFromApi<T>(path: string, init: RequestInit = {}): Promise<T> {
  let lastError: unknown;
  const baseUrls = rawApiBaseUrl?.trim() ? [API_BASE_URL] : [API_BASE_URL, ...FALLBACK_API_BASE_URLS];

  for (const baseUrl of baseUrls) {
    try {
      const response = await fetch(`${baseUrl}${path}`, init);
      if (!response.ok) {
        throw new Error(`Erreur API ${path} (${response.status})`);
      }
      return response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
}
