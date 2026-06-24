import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchProducts, toCardProduct } from '../../api/products';
import type { Product } from '../../types';
import { PanelBody, PanelHead, ScrollPanel } from '../primitives/ScrollPanel';
import { SparkChart } from '../primitives/SparkChart';
import { ProductCard } from './ProductCard';

/** Nombre de pièces mises en avant sur la page d'accueil. */
const FEATURED_COUNT = 6;

interface VitrineSectionProps {
  locked: boolean;
  clanking: boolean;
  bourseIdx: number;
  bourseTrend: { up: boolean; delta: number };
  bourseSpark: number[];
  onAddToCart: (product: Product) => void;
}

export function VitrineSection({
  locked,
  clanking,
  bourseIdx,
  bourseTrend,
  bourseSpark,
  onAddToCart,
}: VitrineSectionProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setLoadError(false);

    fetchProducts({ sort: 'likes', limit: FEATURED_COUNT, signal: controller.signal })
      .then((apiProducts) => {
        setProducts(apiProducts.map(toCardProduct));
        setLoadError(false);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('Impossible de charger les produits depuis /products/.', error);
        setProducts([]);
        setLoadError(true);
      });

    return () => controller.abort();
  }, []);

  return (
    <ScrollPanel id="vitrine" locked={locked} clanking={clanking}>
      <PanelHead
        sector="SECTEUR 01"
        title="Vitrine — pièces en vedette"
        right={
          <Link className="cv-btn is-ghost is-sm" to="/catalogue">
            Tout le catalogue →
          </Link>
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
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
          ))}
          {loadError && (
            <p className="cv-note">
              Impossible de charger les produits. Vérifie que l'API backend tourne sur le port 8000.
            </p>
          )}
        </div>
      </PanelBody>
    </ScrollPanel>
  );
}
