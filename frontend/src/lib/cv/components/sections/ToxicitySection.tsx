import type { AirState } from '../../hooks/useAirQuality';
import { PanelBody, PanelHead, ScrollPanel } from '../primitives/ScrollPanel';
import { SparkChart } from '../primitives/SparkChart';

interface ToxicitySectionProps {
  locked: boolean;
  clanking: boolean;
  air: AirState | null;
}

export function ToxicitySection({ locked, clanking, air }: ToxicitySectionProps) {
  const gauges = air?.gauges ?? [];
  const sulfurSpark = air?.sulfurSpark ?? [];
  const alertRed = air?.alertRed ?? false;

  return (
    <ScrollPanel id="toxicite" locked={locked} clanking={clanking} className={alertRed ? 'cv-alert-red' : ''}>
      <PanelHead
        sector="SECTEUR 02"
        title="Moniteur de toxicité"
        lamp="amber"
        right={
          <span className={`cv-badge${alertRed ? ' is-alert is-solid' : ''}`}>
            <span className="led" />
            {alertRed ? 'ALERTE ROUGE' : 'Atmosphère nominale'}
          </span>
        }
      />
      <PanelBody>
        <div className="tox-grid">
          <div className="tox-screen">
            <span className="lab">Concentration en soufre — temps réel (ppm)</span>
            <SparkChart values={sulfurSpark} variant="tox" className="tox-spark-chart" />
            <p className="cv-note" style={{ color: '#9a8c72', marginTop: 12 }}>
              Données générées côté Forge (Python). Au-delà du seuil, la colonie passe en alerte
              rouge.
            </p>
          </div>
          <div className="tox-gauges">
            {gauges.map((g) => {
              const classes = ['cv-gauge', g.warn ? 'warn' : '', g.danger ? 'danger' : '']
                .filter(Boolean)
                .join(' ');
              return (
                <div key={g.id} className={classes}>
                  <div className="gtop">
                    <span className="cv-label">{g.label}</span>
                    <span className="gval">
                      {g.value} {g.unit}
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
