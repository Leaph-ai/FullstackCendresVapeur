import type { JournalLog } from './homeContent';

export interface JournalEntry extends JournalLog {
  key: string;
  stamp: string;
}
