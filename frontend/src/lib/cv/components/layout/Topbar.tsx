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
        {NAV_LINKS.map((link) => (
          <a
            key={link.id}
            href={link.href}
            className={activeSection === link.id ? 'cur' : undefined}
          >
            {link.label}
          </a>
        ))}
      </nav>
      <span className="tb-acts">
        <span className="cv-toxpill" role="status">
          <span className="dot" /> Air · nominal
        </span>
        <span className="tb-role">Cobalt-114 · Utilisateur</span>
        <button className="cv-iconbtn" type="button" aria-label={`Panier, ${cartCount} articles`}>
          ▤<span className="cnt">{cartCount}</span>
        </button>
      </span>
    </header>
  );
}
