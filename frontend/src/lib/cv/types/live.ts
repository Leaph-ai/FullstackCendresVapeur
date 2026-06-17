import type { JournalLog } from './homeContent';

export interface GaugeState {
  id: string;
  value: number;
  warn: boolean;
  danger: boolean;
}

export interface JournalEntry extends JournalLog {
  key: string;
  stamp: string;
}
