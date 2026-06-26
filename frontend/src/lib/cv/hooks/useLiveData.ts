import { useEffect, useState } from 'react';
import { TOX_GAUGES } from '../types';
import type { GaugeState, JournalEntry } from '../types/live';
import { fetchJournal, toJournalEntry } from '../api/journal';
import { fetchColonyStats, fetchCopper } from '../api/colony';

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const JOURNAL_WINDOW = 6;
const JOURNAL_POLL_MS = 5000;
const COPPER_POLL_MS = 3200;
const COLONY_POLL_MS = 5000;
const TOX_SPARK_WINDOW = 16;

function isAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

/** Crée une boucle « fetch initial + polling » (le polling est coupé en mouvement réduit). */
function usePolledData(load: (signal: AbortSignal) => void, intervalMs: number) {
  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    const timer = REDUCED_MOTION
      ? null
      : window.setInterval(() => load(controller.signal), intervalMs);
    return () => {
      controller.abort();
      if (timer !== null) window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

export function useLiveData() {
  const [bourseIdx, setBourseIdx] = useState(0);
  const [bourseTrend, setBourseTrend] = useState({ up: true, delta: 0 });
  const [bourseSpark, setBourseSpark] = useState<number[]>([]);
  const [toxSpark, setToxSpark] = useState<number[]>([]);
  const [gauges, setGauges] = useState<GaugeState[]>(() =>
    TOX_GAUGES.map((g) => ({ id: g.id, value: 0, warn: false, danger: false })),
  );
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [nixieValues, setNixieValues] = useState<Record<string, string>>({});

  // Bourse du cuivre — simulateur backend (/copper/current).
  usePolledData((signal) => {
    fetchCopper(signal)
      .then((snap) => {
        setBourseIdx(Math.round(snap.index));
        setBourseTrend({ up: snap.trend !== 'down', delta: Math.round(snap.delta) });
        setBourseSpark(snap.spark);
        setNixieValues((prev) => ({
          ...prev,
          copper: Math.round(snap.index).toLocaleString('fr-FR'),
        }));
      })
      .catch((error: unknown) => {
        if (isAbort(error)) return;
        console.error('Impossible de charger la bourse du cuivre.', error);
      });
  }, COPPER_POLL_MS);

  // Métriques de la colonie — jauges de toxicité + compteurs (/colony/stats).
  usePolledData((signal) => {
    fetchColonyStats(signal)
      .then((stats) => {
        const values = [
          stats.air.sulfur,
          stats.air.monoxide,
          stats.air.particulate,
          stats.air.boiler_pressure,
        ];
        setGauges(
          TOX_GAUGES.map((cfg, i) => {
            const value = Math.round(values[i] ?? 0);
            return {
              id: cfg.id,
              value,
              warn: value >= cfg.warn && value < cfg.danger,
              danger: value >= cfg.danger,
            };
          }),
        );
        setToxSpark((prev) => {
          const next = [...prev, stats.air.sulfur].slice(-TOX_SPARK_WINDOW);
          // Garantit une courbe visible dès la première mesure.
          return next.length === 1 ? [stats.air.sulfur, stats.air.sulfur] : next;
        });
        setNixieValues((prev) => ({
          ...prev,
          citizens: stats.citizens.toLocaleString('fr-FR'),
          orders: String(stats.orders),
          pressure: ((stats.air.boiler_pressure / 100) * 10).toFixed(1),
        }));
      })
      .catch((error: unknown) => {
        if (isAbort(error)) return;
        console.error('Impossible de charger les métriques de la colonie.', error);
      });
  }, COLONY_POLL_MS);

  // Journal des survivants — flux réel (/journal/).
  usePolledData((signal) => {
    fetchJournal(JOURNAL_WINDOW, signal)
      .then((dtos) => setJournal(dtos.map(toJournalEntry)))
      .catch((error: unknown) => {
        if (isAbort(error)) return;
        console.error('Impossible de charger le journal des survivants.', error);
      });
  }, JOURNAL_POLL_MS);

  return {
    bourseIdx,
    bourseTrend,
    bourseSpark,
    toxSpark,
    gauges,
    journal,
    nixieValues,
  };
}
