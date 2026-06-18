import { useCallback, useEffect, useState } from 'react';
import { JOURNAL_LOGS, TOX_GAUGES, type JournalLog } from '../types';
import type { GaugeState, JournalEntry } from '../types/live';

const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function jitter(center: number, amp: number) {
  return Math.max(4, Math.min(96, center + (Math.random() * 2 - 1) * amp));
}

let minute = 2;
function nextStamp() {
  minute = (minute + Math.floor(Math.random() * 3) + 1) % 60;
  return `14:${String(minute).padStart(2, '0')} · cycle 14`;
}

function makeEntry(log: JournalLog): JournalEntry {
  return { ...log, key: `${Date.now()}-${Math.random()}`, stamp: nextStamp() };
}

export function useLiveData() {
  const [bourseIdx, setBourseIdx] = useState(248);
  const [bourseTrend, setBourseTrend] = useState({ up: true, delta: 2 });
  const [bourseSpark, setBourseSpark] = useState<number[]>(() =>
    Array.from({ length: 14 }, () => 40 + Math.random() * 50),
  );
  const [toxSpark, setToxSpark] = useState<number[]>(() =>
    Array.from({ length: 16 }, () => 35 + Math.random() * 35),
  );
  const [gauges, setGauges] = useState<GaugeState[]>(() =>
    TOX_GAUGES.map((g) => ({
      id: g.id,
      value: g.center,
      warn: g.initialWarn ?? false,
      danger: false,
    })),
  );
  const [journal, setJournal] = useState<JournalEntry[]>(() =>
    JOURNAL_LOGS.slice(0, 6).map(makeEntry),
  );
  const [nixieValues, setNixieValues] = useState<Record<string, string>>({
    citizens: '1 284',
    orders: '96',
  });

  const shiftSpark = useCallback((prev: number[], lo: number, hi: number) => {
    const next = prev.slice(1);
    next.push(lo + Math.random() * (hi - lo));
    return next;
  }, []);

  useEffect(() => {
    if (REDUCED_MOTION) return;

    const bourseTimer = window.setInterval(() => {
      const d = Math.round((Math.random() * 2 - 1) * 6);
      setBourseIdx((idx) => Math.max(180, Math.min(320, idx + d)));
      setBourseTrend({ up: d >= 0, delta: d });
      setBourseSpark((prev) => shiftSpark(prev, 30, 92));
    }, 3200);

    const toxGaugeTimer = window.setInterval(() => {
      setGauges((prev) =>
        prev.map((g, i) => {
          const cfg = TOX_GAUGES[i];
          const value = Math.round(jitter(cfg.center, 6));
          return {
            id: g.id,
            value,
            warn: value >= cfg.warn && value < cfg.danger,
            danger: value >= cfg.danger,
          };
        }),
      );
    }, 2600);

    const toxSparkTimer = window.setInterval(() => {
      setToxSpark((prev) => shiftSpark(prev, 35, 80));
    }, 1400);

    const journalTimer = window.setInterval(() => {
      const log = JOURNAL_LOGS[Math.floor(Math.random() * JOURNAL_LOGS.length)];
      setJournal((prev) => [makeEntry(log), ...prev].slice(0, 6));
    }, 3800);

    const nixieTimer = window.setInterval(() => {
      setNixieValues((prev) => {
        const next = { ...prev };
        if (Math.random() < 0.5) {
          const raw = (prev.citizens ?? '1284').replace(/\s/g, '');
          next.citizens = (parseInt(raw, 10) + 1).toLocaleString('fr-FR');
        }
        if (Math.random() < 0.5) {
          next.orders = String(parseInt(prev.orders ?? '96', 10) + 1);
        }
        return next;
      });
    }, 5200);

    return () => {
      window.clearInterval(bourseTimer);
      window.clearInterval(toxGaugeTimer);
      window.clearInterval(toxSparkTimer);
      window.clearInterval(journalTimer);
      window.clearInterval(nixieTimer);
    };
  }, [shiftSpark]);

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
