import type { JournalEntry } from '../../types';
import { PanelBody, PanelHead, ScrollPanel } from '../primitives/ScrollPanel';

interface JournalSectionProps {
  locked: boolean;
  clanking: boolean;
  entries: JournalEntry[];
}

export function JournalSection({ locked, clanking, entries }: JournalSectionProps) {
  return (
    <ScrollPanel id="journal" locked={locked} clanking={clanking}>
      <PanelHead
        sector="SECTEUR 03"
        title="Journal des survivants"
        right={
          <span className="cv-badge">
            <span className="led" />● flux live
          </span>
        }
      />
      <PanelBody>
        <div className="journal">
          <ul className="cv-feed" aria-live="polite">
            {entries.map((entry) => (
              <li
                key={entry.key}
                className={`cv-fitem${entry.type === 'alert' ? ' alert' : ''}`}
              >
                <div className="ts">{entry.stamp}</div>
                <div className="act">{entry.text}</div>
              </li>
            ))}
          </ul>
        </div>
      </PanelBody>
    </ScrollPanel>
  );
}
