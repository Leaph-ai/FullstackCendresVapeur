import { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Link, useNavigate } from 'react-router-dom';
import { MachineRail } from '@cv/components/layout/MachineRail';
import { SteamChimney } from '@cv/components/layout/SteamChimney';
import { Topbar } from '@cv/components/layout/Topbar';
import { useScrollRail } from '@cv/hooks/useScrollRail';
import { useCart } from '../../context/CartContext';
import { getUserIdFromToken } from '../../api/client';
import { Invoice } from '../../components/invoice/Invoice';
import { createOrder, validateDiscountCode } from '../../api/orders';
import './checkout.css';

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
  const { items, getTotal, getItemCount, clearCart } = useCart();
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
          <section className="checkout-page">
            <div className="checkout-container">
              <div className="empty-state">
                <h2>Panier vide</h2>
                <p>Impossible de procéder au paiement sans articles.</p>
                <Link to="/" className="cv-btn">Retour au catalogue</Link>
              </div>
            </div>
          </section>
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

  const handleProcessPayment = async () => {
    // La commande est rattachée à un compte : on exige une connexion au paiement.
    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
      return;
    }
    setIsProcessing(true);
    setOrderError(null);
    try {
      const order = await createOrder(formData.discountCode || null);
      setConfirmedOrderId(order.id);
      clearCart();
      setStep('success');
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Erreur lors de la commande.');
    } finally {
      setIsProcessing(false);
    }
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

  const subtotal = getTotal();
  const discountAmount = (subtotal * discount) / 100;
  const subtotalAfterDiscount = subtotal - discountAmount;
  const tax = subtotalAfterDiscount * 0.20;
  const total = subtotalAfterDiscount + tax;

  return (
    <>
      <MachineRail railRef={railRef} />
      <SteamChimney />
      <div className="auth-shell">
        <Topbar cartCount={getItemCount()} activeSection="checkout" />

        <section className="checkout-page">
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
                  <div className="total-line">
                    <span>TVA</span>
                    <span>ⵟ {tax.toFixed(2)}</span>
                  </div>
                  <div className="total-line is-final">
                    <span>Total</span>
                    <span>ⵟ {total.toFixed(2)}</span>
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
                          <div className="summary-line">
                            <span>TVA (20%)</span>
                            <span>ⵟ {tax.toFixed(2)}</span>
                          </div>
                          <div className="summary-line total">
                            <span>Total TTC</span>
                            <span>ⵟ {total.toFixed(2)}</span>
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
                        <>
                          {!isAuthenticated && (
                            <p className="hint" style={{ marginBottom: '0.5rem' }}>
                              Connecte-toi pour finaliser ta commande — ton panier est conservé.
                            </p>
                          )}
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
                            {isProcessing
                              ? 'Traitement...'
                              : isAuthenticated
                                ? 'Confirmer le paiement'
                                : 'Se connecter pour payer'}
                          </button>
                        </>
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
        </section>
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
              items={items}
              formData={formData}
              subtotal={subtotal}
              discount={discount}
              discountAmount={discountAmount}
              tax={tax}
              total={total}
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
