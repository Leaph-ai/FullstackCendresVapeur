import { useState } from 'react';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [liked, setLiked] = useState(false);
  const [votes, setVotes] = useState(product.votes);
  const [added, setAdded] = useState(false);

  const handleLike = () => {
    setLiked((prev) => {
      setVotes((v) => v + (prev ? -1 : 1));
      return !prev;
    });
  };

  const handleAdd = () => {
    onAddToCart(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1300);
  };

  return (
    <article className="cv-pcard">
      <div className="cv-ph">objet · photo</div>
      <div>
        <div className="pname">{product.name}</div>
        <div className="pcat">{product.category}</div>
      </div>
      <div className="cv-row between center">
        <span className="cv-price">
          <span className="amt">
            <span className="cur">ⵟ</span> {product.price}
          </span>{' '}
          <span className={`cv-trend ${product.trend}`}>
            <span className="arw">{product.trend === 'up' ? '▲' : '▼'}</span>
          </span>
        </span>
        <button
          type="button"
          className={`cv-like${liked ? ' is-liked' : ''}`}
          aria-pressed={liked}
          onClick={handleLike}
        >
          <span className="heart">{liked ? '♥' : '♡'}</span>{' '}
          <span className="n">{votes}</span>
        </button>
      </div>
      <button type="button" className="cv-btn is-sm is-block" onClick={handleAdd}>
        {added ? 'Ajouté ✓' : 'Ajouter au panier'}
      </button>
    </article>
  );
}
