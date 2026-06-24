import { COLONY_STATS } from '../../types';
import { PanelBody, PanelHead, ScrollPanel } from '../primitives/ScrollPanel';

interface ChiffresSectionProps {
  locked: boolean;
  clanking: boolean;
  nixieValues: Record<string, string>;
}

export function ChiffresSection({ locked, clanking, nixieValues }: ChiffresSectionProps) {
  return (
    <ScrollPanel id="chiffres" locked={locked} clanking={clanking}>
      <PanelHead sector="SECTEUR 04" title="Chiffres de la colonie" lamp="amber" />
      <PanelBody>
        <div className="chiffres-grid">
          {COLONY_STATS.map((stat) => {
            // Toutes les valeurs proviennent du backend ; « — » tant qu'elles chargent.
            const display = nixieValues[stat.id] ?? '—';

            return (
              <div key={stat.id} className="chiffre">
                <span className="nixie">
                  <b>{display}</b>
                </span>
                <span className="lab">{stat.label}</span>
                {'stable' in stat && stat.stable ? (
                  <span className="cv-badge">
                    <span className="led" />
                    stable
                  </span>
                ) : (
                  <span className={`cv-trend ${stat.trend}`}>
                    <span className="arw">{stat.trend === 'up' ? '▲' : '▼'}</span> {stat.trendVal}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </PanelBody>
    </ScrollPanel>
  );
}
