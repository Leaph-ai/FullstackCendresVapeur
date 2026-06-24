import { Link } from 'react-router-dom';
import { MachineRail } from '@cv/components/layout/MachineRail';
import { SteamChimney } from '@cv/components/layout/SteamChimney';
import { Topbar } from '@cv/components/layout/Topbar';
import { useScrollRail } from '@cv/hooks/useScrollRail';
import { useCart } from '../../context/CartContext';
import './cart.css';

function Cart() {
  const { items, loading, error, removeItem, updateQuantity, getTotal, getItemCount } = useCart();
  const railRef = useScrollRail();

  const handleQuantityChange = (productId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const quantity = Math.max(1, parseInt(e.target.value) || 1);
    void updateQuantity(productId, quantity);
  };

  const handleRemove = (productId: number) => {
    void removeItem(productId);
  };

  return (
    <>
      <MachineRail railRef={railRef} />
      <SteamChimney />
      <div className="auth-shell">
        <Topbar cartCount={getItemCount()} activeSection="cart" />

        <section className="cart-page">
          <div className="cart-container">
            <div className="cart-header">
              <h1>Panier · Voûte Marchande</h1>
              <p>Gestion des commandes en circuit fermé</p>
            </div>

            {error && (
              <div className="cv-alert is-danger" style={{ marginBottom: '1rem' }}>
                {error}
              </div>
            )}

            {loading && items.length === 0 ? (
              <div className="cart-empty">
                <p>Chargement du panier…</p>
              </div>
            ) : items.length === 0 ? (
              <div className="cart-empty">
                <div className="empty-icon">⬚</div>
                <h2>Panier vide</h2>
                <p>Aucun article actuellement. Retournez à la vitrine.</p>
                <Link to="/" className="cv-btn">
                  Consulter la vitrine
                </Link>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  <div className="cart-items-header">
                    <div className="col-product">Article</div>
                    <div className="col-price">Prix unit.</div>
                    <div className="col-qty">Quantité</div>
                    <div className="col-subtotal">Sous-total</div>
                    <div className="col-action">Action</div>
                  </div>

                  {items.map((item) => (
                    <div key={item.productId} className="cart-item">
                      <div className="col-product">
                        <div className="item-name">{item.name}</div>
                        <div className="item-cat">{item.category}</div>
                      </div>
                      <div className="col-price">
                        <span className="amt">
                          <span className="cur">ⵟ</span> {item.price.toFixed(2)}
                        </span>
                      </div>
                      <div className="col-qty">
                        <input
                          type="number"
                          min="1"
                          max="99"
                          value={item.quantity}
                          onChange={(e) => handleQuantityChange(item.productId, e)}
                          className="cv-control qty-input"
                        />
                      </div>
                      <div className="col-subtotal">
                        <span className="amt">
                          <span className="cur">ⵟ</span> {(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      <div className="col-action">
                        <button
                          type="button"
                          className="cv-btn is-sm is-danger"
                          onClick={() => handleRemove(item.productId)}
                          disabled={loading}
                          title="Retirer du panier"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-summary">
                  <div className="summary-box">
                    <div className="summary-row">
                      <span className="label">Sous-total</span>
                      <span className="value">ⵟ {getTotal().toFixed(2)}</span>
                    </div>
                    <div className="summary-row is-total">
                      <span className="label">Total TTC</span>
                      <span className="value">ⵟ {getTotal().toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                      <span className="label">dont TVA (20%)</span>
                      <span className="value">ⵟ {(getTotal() - getTotal() / 1.2).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="cart-actions">
                    <Link to="/" className="cv-btn is-ghost">
                      Continuer les courses
                    </Link>
                    <Link to="/checkout" className="cv-btn is-block">
                      Passer la commande →
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

export default Cart;
