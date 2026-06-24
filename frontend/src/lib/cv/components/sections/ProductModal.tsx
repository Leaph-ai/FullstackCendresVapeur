import { useEffect, useState } from 'react';
import { fetchProduct, likeProduct } from '../../api/products';
import type { ProductDto } from '../../api/products';
import type { Product } from '../../types';

interface ProductModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export function ProductModal({ product, onClose, onAddToCart }: ProductModalProps) {
  const [detail, setDetail] = useState<ProductDto | null>(null);
  const [votes, setVotes] = useState(product.votes);
  const [liked, setLiked] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [added, setAdded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchProduct(product.id, controller.signal)
      .then((dto) => {
        setDetail(dto);
        setVotes(dto.likes_count);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error('Impossible de charger le détail du produit.', error);
      });
    return () => controller.abort();
  }, [product.id]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const handleLike = async () => {
    if (liked || isVoting) return;
    setIsVoting(true);
    try {
      const status = await likeProduct(product.id);
      setVotes(status.likes_count);
      setLiked(status.liked);
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

  const stock = detail?.stock ?? null;
  const inStock = stock === null || stock > 0;
  const hasImage = Boolean(product.url && !imageFailed);

  return (
    <div
      className="cv-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Détail — ${product.name}`}
      onClick={onClose}
    >
      <div className="cv-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="cv-modal-close" aria-label="Fermer" onClick={onClose}>
          ✕
        </button>
        <div className="cv-modal-grid">
          <div className={`cv-modal-photo${hasImage ? ' has-image' : ''}`}>
            {hasImage ? (
              <img
                src={product.url ?? ''}
                alt={product.name}
                onError={() => setImageFailed(true)}
              />
            ) : (
              'objet · photo'
            )}
          </div>
          <div className="cv-modal-body">
            <span className="cv-modal-cat">{product.category}</span>
            <h2 className="cv-modal-title">{product.name}</h2>
            <p className="cv-modal-desc">
              {detail ? detail.description ?? 'Aucune description disponible.' : 'Chargement…'}
            </p>
            <div className="cv-modal-meta">
              <span className="cv-price">
                <span className="amt">
                  <span className="cur">ⵟ</span> {product.price}
                </span>{' '}
                <span className={`cv-trend ${product.trend}`}>
                  <span className="arw">{product.trend === 'up' ? '▲' : '▼'}</span>
                </span>
              </span>
              <span className={`cv-badge${inStock ? '' : ' is-solid'}`}>
                {stock === null ? '—' : inStock ? `En stock · ${stock}` : 'Rupture'}
              </span>
            </div>
            <div className="cv-modal-actions">
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
              <button
                type="button"
                className="cv-btn is-block"
                disabled={!inStock}
                onClick={handleAdd}
              >
                {added ? 'Ajouté ✓' : inStock ? 'Ajouter au panier' : 'Indisponible'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
