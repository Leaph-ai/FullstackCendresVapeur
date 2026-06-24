import { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Link, useNavigate } from 'react-router-dom';
import { MachineRail } from '@cv/components/layout/MachineRail';
import { SteamChimney } from '@cv/components/layout/SteamChimney';
import { Topbar } from '@cv/components/layout/Topbar';
import { useScrollRail } from '@cv/hooks/useScrollRail';
import { useCart } from '../../context/CartContext';
import type { CartItem } from '../../context/CartContext';
import { AUTH_CHANGED_EVENT } from '../../context/authEvents';
import { apiPost, getUserIdFromToken } from '../../api/client';
import { Invoice } from '../../components/invoice/Invoice';
import { createOrder, validateDiscountCode } from '../../api/orders';
import './checkout.css';

interface LoginResponse {
  requires_2fa: boolean;
  challenge_token?: string;
  access_token?: string;
}

interface OrderSnapshot {
  orderId: number;
  items: CartItem[];
  subtotal: number;
  discount: number;
  discountAmount: number;
  tax: number;
  total: number;
}

/** Génère un mot de passe robuste (≥ 12 caractères). */
function generateStrongPassword(): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
  const values = new Uint32Array(16);
  crypto.getRandomValues(values);
  return Array.from(values, (n) => charset[n % charset.length]).join('');
}

export interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvc: string;
  discountCode?: string;
}

function Checkout() {
  const { items, getTotal, getItemCount, clearCart, refreshCart } = useCart();
  const railRef = useScrollRail();
  const navigate = useNavigate();
  const isAuthenticated = getUserIdFromToken() !== null;
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<'info' | 'payment' | 'review' | 'success'>('info');
  const [isProcessing, setIsProcessing] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState<number | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [snapshot, setSnapshot] = useState<OrderSnapshot | null>(null);
  const [accountPassword, setAccountPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'France',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    discountCode: '',
  });

  if (items.length === 0 && step !== 'success') {
    return (
      <>
        <MachineRail railRef={railRef} />
        <SteamChimney />
        <div className="auth-shell">
          <Topbar cartCount={0} activeSection="checkout" />
          <main className="checkout-page" id="contenu">
            <div className="checkout-container">
              <div className="empty-state">
                <h2>Panier vide</h2>
                <p>Impossible de procéder au paiement sans articles.</p>
                <Link to="/" className="cv-btn">Retour au catalogue</Link>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep = (currentStep: typeof step): boolean => {
    if (currentStep === 'info') {
      return !!(
        formData.firstName &&
        formData.lastName &&
        formData.email &&
        formData.phone &&
        formData.address &&
        formData.city &&
        formData.postalCode
      );
    }
    if (currentStep === 'payment') {
      return !!(
        formData.cardNumber &&
        formData.cardExpiry &&
        formData.cardCvc
      );
    }
    return true;
  };

  const handleApplyDiscount = async (code: string) => {
    if (!code.trim()) return;
    setDiscountError(null);
    try {
      const result = await validateDiscountCode(code);
      if (!result.active) {
        setDiscountError('Ce code de réduction est inactif.');
        setDiscount(0);
        return;
      }
      const percentage = parseFloat(result.percentage);
      setDiscount(percentage);
      setFormData((prev) => ({ ...prev, discountCode: code }));
    } catch {
      setDiscountError('Code de réduction invalide ou introuvable.');
      setDiscount(0);
    }
  };

  const handleNextStep = () => {
    if (!validateStep(step)) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    if (step === 'info') setStep('payment');
    else if (step === 'payment') setStep('review');
  };

  const handlePrevStep = () => {
    if (step === 'payment') setStep('info');
    else if (step === 'review') setStep('payment');
  };

  // Crée la commande puis fige un instantané (le panier est vidé juste après).
  const finalizeOrder = async () => {
    const order = await createOrder(formData.discountCode || null);
    setSnapshot({ orderId: order.id, items, subtotal, discount, discountAmount, tax, total });
    setConfirmedOrderId(order.id);
    clearCart();
    setStep('success');
  };

  const handleProcessPayment = async () => {
    if (!isAuthenticated) return; // le panneau invité gère ce cas
    setIsProcessing(true);
    setOrderError(null);
    try {
      await finalizeOrder();
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Erreur lors de la commande.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Création de compte express depuis les infos du checkout, puis paiement.
  const handleQuickRegisterAndPay = async () => {
    if (accountPassword.length < 8) {
      setOrderError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setIsProcessing(true);
    setOrderError(null);
    try {
      await apiPost('/auth/register', { email: formData.email, password: accountPassword });
      const login = await apiPost<LoginResponse>('/auth/login', {
        email: formData.email,
        password: accountPassword,
      });
      if (login.requires_2fa) {
        localStorage.setItem('challenge_token', login.challenge_token ?? '');
        navigate('/verify-2fa?redirect=/checkout');
        return;
      }
      localStorage.setItem('access_token', login.access_token ?? '');
      // On fusionne le panier invité dans le panier serveur AVANT de commander
      // (await direct : éviter la course avec l'écouteur d'auth global).
      await refreshCart();
      window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
      await finalizeOrder();
    } catch (err) {
      setOrderError(
        err instanceof Error ? err.message : 'Impossible de créer le compte et la commande.',
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGeneratePassword = () => {
    setAccountPassword(generateStrongPassword());
    setShowPassword(true);
  };

  const handlePrintInvoice = () => {
    if (invoiceRef.current) {
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write(invoiceRef.current.innerHTML);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownloadInvoice = async () => {
    if (!invoiceRef.current) return;
    const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = (canvas.height * pageWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight);
    pdf.save(`facture-${Date.now()}.pdf`);
  };

  // Les prix produits sont TTC : le total facturé = sous-total − remise (comme l'API).
  // La TVA (20%) est donc déjà comprise et affichée à titre informatif.
  const subtotal = getTotal();
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal - discountAmount;
  const tax = total - total / 1.2;

  return (
    <>
      <MachineRail railRef={railRef} />
      <SteamChimney />
      <div className="auth-shell">
        <Topbar cartCount={getItemCount()} activeSection="checkout" />

        <main className="checkout-page" id="contenu">
          <div className="checkout-container">
            <div className="checkout-header">
              <h1>Tunnel d'achat</h1>
              <p>Commande sécurisée · Circuit fermé</p>
            </div>

            <div className="checkout-wrapper">
              {/* Étapes */}
              <div className="steps-indicator">
                <div className={`step ${step === 'info' ? 'active' : step === 'payment' || step === 'review' || step === 'success' ? 'done' : ''}`}>
                  <div className="step-num">1</div>
                  <div className="step-label">Adresse</div>
                </div>
                <div className="step-connector" />
                <div className={`step ${step === 'payment' ? 'active' : step === 'review' || step === 'success' ? 'done' : ''}`}>
                  <div className="step-num">2</div>
                  <div className="step-label">Paiement</div>
                </div>
                <div className="step-connector" />
                <div className={`step ${step === 'review' ? 'active' : step === 'success' ? 'done' : ''}`}>
                  <div className="step-num">3</div>
                  <div className="step-label">Confirmation</div>
                </div>
              </div>

              {/* Résumé latéral - PANIER À GAUCHE */}
              <aside className="checkout-summary">
                <h3>Panier</h3>
                <div className="summary-items">
                  {items.map((item) => (
                    <div key={item.productId} className="summary-item">
                      <div className="item-info">
                        <div className="item-title">{item.name}</div>
                        <div className="item-qty">×{item.quantity}</div>
                      </div>
                      <div className="item-price">ⵟ {(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                <div className="summary-totals">
                  <div className="total-line">
                    <span>Sous-total</span>
                    <span>ⵟ {subtotal.toFixed(2)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="total-line discount">
                      <span>Réduction</span>
                      <span>-ⵟ {discountAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="total-line is-final">
                    <span>Total TTC</span>
                    <span>ⵟ {total.toFixed(2)}</span>
                  </div>
                  <div className="total-line">
                    <span>dont TVA (20%)</span>
                    <span>ⵟ {tax.toFixed(2)}</span>
                  </div>
                </div>

                <Link to="/cart" className="cv-btn is-ghost is-sm is-block">
                  Modifier le panier
                </Link>
              </aside>

              {/* Formulaire à droite */}
              <div className="checkout-content">
                {step === 'success' ? (
                  <div className="success-state">
                    <div className="success-icon">✓</div>
                    <h2>Commande confirmée</h2>
                    <p className="order-number">Numéro de commande: #ORD-{confirmedOrderId}</p>
                    <p>Votre commande a été traitée avec succès. Vous recevrez une confirmation par email.</p>

                    <button
                      type="button"
                      className="cv-btn"
                      onClick={() => setShowInvoice(true)}
                    >
                      📄 Voir la facture
                    </button>
                  </div>
                ) : (
                  <form className="checkout-form">
                    {step === 'info' && (
                      <div className="form-section">
                        <h3 className="section-title">Adresse de livraison</h3>
                        <div className="form-row">
                          <div className="form-group half">
                            <label htmlFor="firstName" className="cv-label">Prénom</label>
                            <input
                              type="text"
                              id="firstName"
                              name="firstName"
                              placeholder="Jean"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              className="cv-control"
                            />
                          </div>
                          <div className="form-group half">
                            <label htmlFor="lastName" className="cv-label">Nom</label>
                            <input
                              type="text"
                              id="lastName"
                              name="lastName"
                              placeholder="Dupont"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              className="cv-control"
                            />
                          </div>
                        </div>

                        <div className="form-row">
                          <div className="form-group half">
                            <label htmlFor="email" className="cv-label">Email</label>
                            <input
                              type="email"
                              id="email"
                              name="email"
                              placeholder="jean@exemple.fr"
                              value={formData.email}
                              onChange={handleInputChange}
                              className="cv-control"
                            />
                          </div>
                          <div className="form-group half">
                            <label htmlFor="phone" className="cv-label">Téléphone</label>
                            <input
                              type="tel"
                              id="phone"
                              name="phone"
                              placeholder="+33 6 12 34 56 78"
                              value={formData.phone}
                              onChange={handleInputChange}
                              className="cv-control"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor="address" className="cv-label">Adresse</label>
                          <input
                            type="text"
                            id="address"
                            name="address"
                            placeholder="123 Rue de la Vapeur"
                            value={formData.address}
                            onChange={handleInputChange}
                            className="cv-control"
                          />
                        </div>

                        <div className="form-row">
                          <div className="form-group half">
                            <label htmlFor="city" className="cv-label">Ville</label>
                            <input
                              type="text"
                              id="city"
                              name="city"
                              placeholder="Paris"
                              value={formData.city}
                              onChange={handleInputChange}
                              className="cv-control"
                            />
                          </div>
                          <div className="form-group half">
                            <label htmlFor="postalCode" className="cv-label">Code postal</label>
                            <input
                              type="text"
                              id="postalCode"
                              name="postalCode"
                              placeholder="75001"
                              value={formData.postalCode}
                              onChange={handleInputChange}
                              className="cv-control"
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor="country" className="cv-label">Pays</label>
                          <select
                            id="country"
                            name="country"
                            value={formData.country}
                            onChange={handleInputChange}
                            className="cv-control"
                          >
                            <option>France</option>
                            <option>Belgique</option>
                            <option>Suisse</option>
                            <option>Luxembourg</option>
                            <option>Autre</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {step === 'payment' && (
                      <div className="form-section">
                        <h3 className="section-title">Informations de paiement</h3>

                        <div className="form-group">
                          <label htmlFor="cardNumber" className="cv-label">Numéro de carte</label>
                          <input
                            type="text"
                            id="cardNumber"
                            name="cardNumber"
                            placeholder="1234 5678 9012 3456"
                            value={formData.cardNumber}
                            onChange={handleInputChange}
                            className="cv-control"
                            maxLength={19}
                          />
                        </div>

                        <div className="form-row">
                          <div className="form-group half">
                            <label htmlFor="cardExpiry" className="cv-label">Expiration (MM/AA)</label>
                            <input
                              type="text"
                              id="cardExpiry"
                              name="cardExpiry"
                              placeholder="12/25"
                              value={formData.cardExpiry}
                              onChange={handleInputChange}
                              className="cv-control"
                              maxLength={5}
                            />
                          </div>
                          <div className="form-group half">
                            <label htmlFor="cardCvc" className="cv-label">CVC</label>
                            <input
                              type="text"
                              id="cardCvc"
                              name="cardCvc"
                              placeholder="123"
                              value={formData.cardCvc}
                              onChange={handleInputChange}
                              className="cv-control"
                              maxLength={4}
                            />
                          </div>
                        </div>

                        <div className="form-group">
                          <label htmlFor="discountCode" className="cv-label">Code de réduction</label>
                          <div className="discount-input">
                            <input
                              type="text"
                              id="discountCode"
                              name="discountCode"
                              placeholder="Ex: VAPEUR10"
                              value={formData.discountCode}
                              onChange={handleInputChange}
                              className="cv-control"
                            />
                            <button
                              type="button"
                              className="cv-btn is-sm"
                              onClick={() => handleApplyDiscount(formData.discountCode || '')}
                            >
                              Appliquer
                            </button>
                          </div>
                          {discountError && <p className="hint" style={{ color: 'var(--cv-danger, #c0392b)' }}>{discountError}</p>}
                          {discount > 0 && <p className="hint" style={{ color: 'green' }}>Code appliqué : -{discount}%</p>}
                        </div>
                      </div>
                    )}

                    {step === 'review' && (
                      <div className="form-section">
                        <h3 className="section-title">Résumé de la commande</h3>

                        <div className="review-items">
                          {items.map((item) => (
                            <div key={item.productId} className="review-item">
                              <span className="item-name">{item.name} × {item.quantity}</span>
                              <span className="item-price">ⵟ {(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="review-summary">
                          <div className="summary-line">
                            <span>Sous-total</span>
                            <span>ⵟ {subtotal.toFixed(2)}</span>
                          </div>
                          {discount > 0 && (
                            <div className="summary-line discount">
                              <span>Réduction ({discount}%)</span>
                              <span>-ⵟ {discountAmount.toFixed(2)}</span>
                            </div>
                          )}
                          <div className="summary-line total">
                            <span>Total TTC</span>
                            <span>ⵟ {total.toFixed(2)}</span>
                          </div>
                          <div className="summary-line">
                            <span>dont TVA (20%)</span>
                            <span>ⵟ {tax.toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="review-address">
                          <h4>Livraison à</h4>
                          <p>{formData.firstName} {formData.lastName}</p>
                          <p>{formData.address}</p>
                          <p>{formData.postalCode} {formData.city}</p>
                        </div>
                      </div>
                    )}

                    <div className="form-actions">
                      {step !== 'info' && (
                        <button
                          type="button"
                          className="cv-btn is-ghost"
                          onClick={handlePrevStep}
                        >
                          ← Retour
                        </button>
                      )}
                      {step === 'review' ? (
                        isAuthenticated ? (
                          <>
                            {orderError && (
                              <p style={{ color: 'var(--cv-danger, #c0392b)', marginBottom: '0.5rem' }}>{orderError}</p>
                            )}
                            <button
                              type="button"
                              className="cv-btn is-block"
                              onClick={handleProcessPayment}
                              disabled={isProcessing}
                              data-loading={isProcessing}
                            >
                              {isProcessing ? 'Traitement...' : 'Confirmer le paiement'}
                            </button>
                          </>
                        ) : (
                          <div className="guest-account">
                            <h4 className="section-title">Créez votre compte pour finaliser</h4>
                            <p className="hint">
                              On réutilise vos informations. Choisissez un mot de passe (ou
                              générez-en un) : votre panier est conservé.
                            </p>
                            <div className="form-group">
                              <label htmlFor="accountEmail" className="cv-label">Email du compte</label>
                              <input
                                type="email"
                                id="accountEmail"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className="cv-control"
                              />
                            </div>
                            <div className="form-group">
                              <label htmlFor="accountPassword" className="cv-label">Mot de passe</label>
                              <div className="discount-input">
                                <input
                                  type={showPassword ? 'text' : 'password'}
                                  id="accountPassword"
                                  value={accountPassword}
                                  onChange={(e) => setAccountPassword(e.target.value)}
                                  placeholder="8 caractères minimum"
                                  className="cv-control"
                                  autoComplete="new-password"
                                />
                                <button
                                  type="button"
                                  className="cv-btn is-sm is-ghost"
                                  onClick={() => setShowPassword((v) => !v)}
                                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                                >
                                  {showPassword ? 'Masquer' : 'Afficher'}
                                </button>
                                <button
                                  type="button"
                                  className="cv-btn is-sm"
                                  onClick={handleGeneratePassword}
                                >
                                  Générer
                                </button>
                              </div>
                            </div>
                            {orderError && (
                              <p style={{ color: 'var(--cv-danger, #c0392b)', marginBottom: '0.5rem' }}>{orderError}</p>
                            )}
                            <button
                              type="button"
                              className="cv-btn is-block"
                              onClick={handleQuickRegisterAndPay}
                              disabled={isProcessing}
                              data-loading={isProcessing}
                            >
                              {isProcessing ? 'Traitement...' : 'Créer le compte et payer'}
                            </button>
                            <p className="hint" style={{ marginTop: '0.6rem' }}>
                              Déjà un compte ?{' '}
                              <Link to="/login?redirect=/checkout">Se connecter</Link>
                            </p>
                          </div>
                        )
                      ) : (
                        <button
                          type="button"
                          className="cv-btn is-block"
                          onClick={handleNextStep}
                        >
                          Suivant →
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal de facture */}
      {showInvoice && (
        <div className="modal-overlay" onClick={() => setShowInvoice(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close"
              onClick={() => setShowInvoice(false)}
            >
              ✕
            </button>
            <Invoice
              ref={invoiceRef}
              items={snapshot?.items ?? items}
              formData={formData}
              subtotal={snapshot?.subtotal ?? subtotal}
              discount={snapshot?.discount ?? discount}
              discountAmount={snapshot?.discountAmount ?? discountAmount}
              tax={snapshot?.tax ?? tax}
              total={snapshot?.total ?? total}
              orderId={snapshot?.orderId ?? confirmedOrderId}
            />
            <div className="modal-actions">
              <button
                type="button"
                className="cv-btn is-sm"
                onClick={handlePrintInvoice}
              >
                🖨️ Imprimer
              </button>
              <button
                type="button"
                className="cv-btn is-sm"
                onClick={handleDownloadInvoice}
              >
                ⬇️ Télécharger
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Checkout;
