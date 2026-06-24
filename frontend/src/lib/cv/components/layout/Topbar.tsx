import { Link } from 'react-router-dom';
import { NAV_LINKS } from '../../types';

interface TopbarProps {
  cartCount: number;
  activeSection?: string;
}

export function Topbar({ cartCount, activeSection = 'vitrine' }: TopbarProps) {
  return (
    <header className="topbar">
      <span className="tb-logo">
        <b>CENDRES</b> &amp; VAPEUR
        <small>comptoir de la zone franche · secteur 12</small>
      </span>
      <nav className="tb-nav" aria-label="Navigation principale">
        <Link to="/catalogue" className={activeSection === 'catalogue' ? 'cur' : undefined}>
          Catalogue
        </Link>
        {NAV_LINKS.map((link) => (
          <Link
            key={link.id}
            to={`/#${link.id}`}
            className={activeSection === link.id ? 'cur' : undefined}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <span className="tb-acts">
        <span className="cv-toxpill" role="status">
          <span className="dot" /> Air · nominal
        </span>
        <Link to="/admin" className="tb-admin" aria-label="Panneau d'administration">
          <span className="tb-admin-icon">⚙</span>
          <span>Admin</span>
        </Link>
        <Link to="/login" className="tb-user" aria-label="Se connecter">
          <span className="tb-user-icon">⚙</span>
          <span>Se connecter</span>
        </Link>
        <Link
          to="/cart"
          className="cv-iconbtn"
          aria-label={`Panier, ${cartCount} articles`}
        >
          <svg
            className="cart-glyph"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2.5 3h2.2l1.2 12.2a1.8 1.8 0 0 0 1.8 1.6h8.9a1.8 1.8 0 0 0 1.8-1.5l1.3-7.3H6" />
            <circle cx="9" cy="20" r="1.4" />
            <circle cx="17" cy="20" r="1.4" />
          </svg>
          <span className="cnt">{cartCount}</span>
        </Link>
      </span>
    </header>
  );
}
