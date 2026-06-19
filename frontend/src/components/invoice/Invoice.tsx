import { forwardRef } from 'react';
import type { CartItem } from '../context/CartContext';
import type { CheckoutFormData } from '../pages/Checkout/checkout';
import './Invoice.css';

interface InvoiceProps {
  items: CartItem[];
  formData: CheckoutFormData;
  subtotal: number;
  discount: number;
  discountAmount: number;
  tax: number;
  total: number;
}

export const Invoice = forwardRef<HTMLDivElement, InvoiceProps>(
  ({ items, formData, subtotal, discount, discountAmount, tax, total }, ref) => {
    const invoiceNumber = `ORD-${Date.now().toString().slice(-8)}`;
    const invoiceDate = new Date().toLocaleDateString('fr-FR');

    return (
      <div ref={ref} className="invoice-document">
        <div className="invoice-header">
          <div className="header-brand">
            <h1>CENDRES & VAPEUR</h1>
            <p className="tagline">Maison de Commerce · Négoce de Raffinerie</p>
          </div>
          <div className="header-info">
            <div className="company-info">
              <p><strong>Établissement Principal</strong></p>
              <p>123 Rue de la Vapeur</p>
              <p>75001 Paris, France</p>
              <p>Tel: +33 (0)1 23 45 67 89</p>
              <p>SIRET: 123 456 789 000 12</p>
            </div>
          </div>
        </div>

        <div className="invoice-meta">
          <div className="meta-item">
            <span className="label">Facture N°</span>
            <span className="value">{invoiceNumber}</span>
          </div>
          <div className="meta-item">
            <span className="label">Date</span>
            <span className="value">{invoiceDate}</span>
          </div>
          <div className="meta-item">
            <span className="label">Statut</span>
            <span className="value status">Payée</span>
          </div>
        </div>

        <div className="invoice-parties">
          <div className="party">
            <h4>Facturé à</h4>
            <p className="name">{formData.firstName} {formData.lastName}</p>
            <p>{formData.address}</p>
            <p>{formData.postalCode} {formData.city}</p>
            <p>{formData.country}</p>
            <p className="contact">Email: {formData.email}</p>
            <p className="contact">Tel: {formData.phone}</p>
          </div>
          <div className="party">
            <h4>Livraison à</h4>
            <p className="name">{formData.firstName} {formData.lastName}</p>
            <p>{formData.address}</p>
            <p>{formData.postalCode} {formData.city}</p>
            <p>{formData.country}</p>
          </div>
        </div>

        <table className="invoice-items">
          <thead>
            <tr>
              <th className="col-desc">Description</th>
              <th className="col-qty">Quantité</th>
              <th className="col-unit">Prix unitaire</th>
              <th className="col-total">Montant</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.productId}>
                <td className="col-desc">
                  <div className="item-name">{item.name}</div>
                  <div className="item-cat">{item.category}</div>
                </td>
                <td className="col-qty">{item.quantity}</td>
                <td className="col-unit">ⵟ {item.price.toFixed(2)}</td>
                <td className="col-total">ⵟ {(item.price * item.quantity).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="invoice-calculations">
          <div className="calc-row">
            <span className="label">Sous-total</span>
            <span className="value">ⵟ {subtotal.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div className="calc-row discount">
              <span className="label">Réduction ({discount}%)</span>
              <span className="value">-ⵟ {discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="calc-row">
            <span className="label">TVA (20%)</span>
            <span className="value">ⵟ {tax.toFixed(2)}</span>
          </div>
          <div className="calc-row total">
            <span className="label">Total TTC</span>
            <span className="value">ⵟ {total.toFixed(2)}</span>
          </div>
        </div>

        <div className="invoice-notes">
          <h5>Conditions générales</h5>
          <ul>
            <li>Paiement effectué par carte bancaire sécurisée</li>
            <li>Délai de livraison: 3 à 5 jours ouvrables</li>
            <li>Garantie produit: 12 mois</li>
            <li>Droit de rétractation: 14 jours après réception</li>
          </ul>
        </div>

        <div className="invoice-footer">
          <p className="footer-text">Merci pour votre confiance</p>
          <p className="footer-legal">Cette facture a été générée automatiquement. Elle fait foi pour la comptabilité.</p>
          <p className="footer-timestamp">Généré le {new Date().toLocaleString('fr-FR')}</p>
        </div>
      </div>
    );
  }
);

Invoice.displayName = 'Invoice';
