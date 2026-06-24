import { useEffect, useState } from 'react';
import { likeProduct } from '../../api/products';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onOpenDetail?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart, onOpenDetail }: ProductCardProps) {
  const [liked, setLiked] = useState(false);
  const [votes, setVotes] = useState(product.votes);
  const [added, setAdded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const hasImage = Boolean(product.url && !imageFailed);

  useEffect(() => {
    setVotes(product.votes);
    setLiked(false);
    setImageFailed(false);
    setIsVoting(false);
  }, [product.id, product.url, product.votes]);

  const handleLike = async () => {
    if (liked || isVoting) return;

    setIsVoting(true);
    try {
      const voteStatus = await likeProduct(product.id);
      setVotes(voteStatus.likes_count);
      setLiked(voteStatus.liked);
    } catch (error) {
      console.error('Impossible de liker ce produit.', error);
    } finally {
      setIsVoting(false);
    }
  };

  const handleAdd = () => {
    onAddToCart(product);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1300);
  };

  const openDetail = () => onOpenDetail?.(product);
  const detailable = Boolean(onOpenDetail);

  return (
    <article className="cv-pcard">
      <div
        className={`cv-ph${hasImage ? ' has-image' : ''}${detailable ? ' is-clickable' : ''}`}
        onClick={detailable ? openDetail : undefined}
        role={detailable ? 'button' : undefined}
        tabIndex={detailable ? 0 : undefined}
        onKeyDown={
          detailable
            ? (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  openDetail();
                }
              }
            : undefined
        }
      >
        {hasImage ? (
          <img src={product.url ?? ''} alt={product.name} onError={() => setImageFailed(true)} />
        ) : (
          'objet · photo'
        )}
      </div>
      <div>
        {detailable ? (
          <button type="button" className="pname pname-link" onClick={openDetail}>
            {product.name}
          </button>
        ) : (
          <div className="pname">{product.name}</div>
        )}
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
          disabled={isVoting}
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
