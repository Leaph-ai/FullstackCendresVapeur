import { useEffect, useState } from 'react';

export interface GaugeReading {
  id: string;
  label: string;
  value: number;
  unit: string;
  warn: boolean;
  danger: boolean;
}

export interface AirState {
  gauges: GaugeReading[];
  sulfurSpark: number[];
  sulfurLevel: number;
  alertRed: boolean;
  threshold: number;
}

interface RawSnapshot {
  gauges: GaugeReading[];
  sulfur_spark: number[];
  sulfur_level: number;
  alert_red: boolean;
  threshold: number;
  timestamp: string;
}

function normalize(raw: RawSnapshot): AirState {
  return {
    gauges: raw.gauges,
    sulfurSpark: raw.sulfur_spark,
    sulfurLevel: raw.sulfur_level,
    alertRed: raw.alert_red,
    threshold: raw.threshold,
  };
}

const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useAirQuality(): AirState | null {
  const [state, setState] = useState<AirState | null>(null);

  useEffect(() => {
    let cancelled = false;
    let source: EventSource | null = null;

    // État initial (et fallback si le flux SSE est indisponible).
    fetch('/api/air/current')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((raw: RawSnapshot) => {
        if (!cancelled) setState(normalize(raw));
      })
      .catch(() => {
        /* l'UI garde le dernier snapshot connu (ou null) */
      });

    if (!REDUCED_MOTION && typeof EventSource !== 'undefined') {
      source = new EventSource('/api/air/stream');
      source.onmessage = (event) => {
        try {
          const raw = JSON.parse(event.data) as RawSnapshot;
          if (!cancelled) setState(normalize(raw));
        } catch {
          /* ignore les keepalives / payloads non-JSON */
        }
      };
      source.onerror = () => {
        source?.close();
      };
    }

    return () => {
      cancelled = true;
      source?.close();
    };
  }, []);

  return state;
}
