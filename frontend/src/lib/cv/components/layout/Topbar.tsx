import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NAV_LINKS } from '../../types';
import { useAuthRole } from '../../hooks/useAuthRole';
import { AUTH_CHANGED_EVENT } from '../../../../context/authEvents';

interface TopbarProps {
  cartCount: number;
  activeSection?: string;
}

export function Topbar({ cartCount, activeSection = 'vitrine' }: TopbarProps) {
  const role = useAuthRole();
  const isConnected = role !== null;
  const isAdmin = role === 3;
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('challenge_token');
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    setDropdownOpen(false);
    navigate('/');
  };

  return (
    <header className="topbar">
      <span className="tb-logo">
        <b>CENDRES</b> &amp; VAPEUR
        <small>comptoir de la zone franche · secteur 12</small>
      </span>
      <nav className="tb-nav" aria-label="Navigation principale">
        {!isConnected && (
          <Link to="/catalogue" className={activeSection === 'catalogue' ? 'cur' : undefined}>
            Catalogue
          </Link>
        )}
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
        
        {!isConnected && (
          <Link to="/login" className="tb-user" aria-label="Se connecter">
            <span className="tb-user-icon">⚙</span>
            <span>Se connecter</span>
          </Link>
        )}

        {isConnected && (
          <div className="tb-dropdown-container" ref={dropdownRef}>
            <button
              className="cv-iconbtn profile-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-label="Menu profil"
            >
              <svg
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
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </button>

            {dropdownOpen && (
              <div className="tb-dropdown-menu">
                {isAdmin && (
                  <Link to="/admin" className="tb-dropdown-item" onClick={() => setDropdownOpen(false)}>
                    <span className="tb-admin-icon">⚙</span> Admin
                  </Link>
                )}
                <Link to="/catalogue" className="tb-dropdown-item" onClick={() => setDropdownOpen(false)}>
                  <span className="tb-admin-icon">📋</span> Catalogue
                </Link>
                <button className="tb-dropdown-item tb-logout" onClick={handleLogout}>
                  <span className="tb-admin-icon">↩</span> Se déconnecter
                </button>
              </div>
            )}
          </div>
        )}

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
