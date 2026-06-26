const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;

export const API_BASE_URL = (rawApiBaseUrl?.trim() || '/api').replace(/\/+$/, '');
const FALLBACK_API_BASE_URLS = ['http://127.0.0.1:8000', 'http://localhost:8000'];

export interface CopperSnapshotDto {
  index: number;
  delta: number;
  trend: 'up' | 'down' | 'flat';
  spark: number[];
  timestamp: string;
}

export interface ColonyStatsDto {
  citizens: number;
  orders: number;
  air: {
    sulfur: number;
    monoxide: number;
    particulate: number;
    boiler_pressure: number;
    alert_red: boolean;
  };
}

export async function fetchCopper(signal?: AbortSignal): Promise<CopperSnapshotDto> {
  return fetchFromApi<CopperSnapshotDto>('/copper/current', { signal });
}

export async function fetchColonyStats(signal?: AbortSignal): Promise<ColonyStatsDto> {
  return fetchFromApi<ColonyStatsDto>('/colony/stats', { signal });
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
