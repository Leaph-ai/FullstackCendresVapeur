import { PRODUCTS } from '../../types';
import { PanelBody, PanelHead, ScrollPanel } from '../primitives/ScrollPanel';
import { SparkChart } from '../primitives/SparkChart';
import { ProductCard } from './ProductCard';

interface VitrineSectionProps {
  locked: boolean;
  clanking: boolean;
  bourseIdx: number;
  bourseTrend: { up: boolean; delta: number };
  bourseSpark: number[];
  onAddToCart: () => void;
}

export function VitrineSection({
  locked,
  clanking,
  bourseIdx,
  bourseTrend,
  bourseSpark,
  onAddToCart,
}: VitrineSectionProps) {
  return (
    <ScrollPanel id="vitrine" locked={locked} clanking={clanking}>
      <PanelHead
        sector="SECTEUR 01"
        title="Vitrine — pièces en vedette"
        right={
          <a className="cv-btn is-ghost is-sm" href="#">
            Tout le catalogue →
          </a>
        }
      />
      <PanelBody>
        <div className="bourse" aria-label="Bourse du cuivre">
          <span className="tag">⛁ Cours du cuivre</span>
          <span className="idx">{bourseIdx}</span>
          <span className={`cv-trend ${bourseTrend.up ? 'up' : 'down'}`}>
            <span className="arw">{bourseTrend.up ? '▲' : '▼'}</span>{' '}
            {bourseTrend.up ? '+' : ''}
            {bourseTrend.delta}%
          </span>
          <SparkChart values={bourseSpark} className="bourse-spark" />
          <span className="tag">offre / demande simulée</span>
        </div>
        <div className="home-pgrid">
          {PRODUCTS.map((p) => (
            <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
          ))}
        </div>
      </PanelBody>
    </ScrollPanel>
  );
}
