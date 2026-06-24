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
          ▤<span className="cnt">{cartCount}</span>
        </Link>
      </span>
    </header>
  );
}
