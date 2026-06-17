import type { GaugeState } from '../../types';
import { TOX_GAUGES } from '../../types';
import { PanelBody, PanelHead, ScrollPanel } from '../primitives/ScrollPanel';
import { SparkChart } from '../primitives/SparkChart';

interface ToxicitySectionProps {
  locked: boolean;
  clanking: boolean;
  gauges: GaugeState[];
  toxSpark: number[];
}

export function ToxicitySection({ locked, clanking, gauges, toxSpark }: ToxicitySectionProps) {
  return (
    <ScrollPanel id="toxicite" locked={locked} clanking={clanking}>
      <PanelHead
        sector="SECTEUR 02"
        title="Moniteur de toxicité"
        lamp="amber"
        right={
          <span className="cv-badge">
            <span className="led" />
            Atmosphère nominale
          </span>
        }
      />
      <PanelBody>
        <div className="tox-grid">
          <div className="tox-screen">
            <span className="lab">Concentration en soufre — temps réel (ppm)</span>
            <SparkChart values={toxSpark} variant="tox" className="tox-spark-chart" />
            <p className="cv-note" style={{ color: '#9a8c72', marginTop: 12 }}>
              Données générées côté Forge (Python). Au-delà du seuil, la colonie passe en alerte
              rouge.
            </p>
          </div>
          <div className="tox-gauges">
            {gauges.map((g, i) => {
              const cfg = TOX_GAUGES[i];
              const classes = ['cv-gauge', g.warn ? 'warn' : '', g.danger ? 'danger' : '']
                .filter(Boolean)
                .join(' ');
              return (
                <div key={g.id} className={classes}>
                  <div className="gtop">
                    <span className="cv-label">{cfg.label}</span>
                    <span className="gval">
                      {g.value} {cfg.unit}
                    </span>
                  </div>
                  <div className="track">
                    <i className="fill" style={{ width: `${g.value}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </PanelBody>
    </ScrollPanel>
  );
}
