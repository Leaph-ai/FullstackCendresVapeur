import { Link } from 'react-router-dom';
import './login.css';
import { MachineRail } from '@cv/components/layout/MachineRail';
import { SteamChimney } from '@cv/components/layout/SteamChimney';
import { Topbar } from '@cv/components/layout/Topbar';
import { useScrollRail } from '@cv/hooks/useScrollRail';

function Login() {
  const railRef = useScrollRail();

  return (
    <>
      <MachineRail railRef={railRef} />
      <SteamChimney />
      <div className="auth-shell">
        <Topbar cartCount={0} activeSection="login" />

        <section className="login-page">
          <div className="login-container">

          <div className="login-header">
            <h1>CENDRES & VAPEUR</h1>
            <p>
              Authentification au réseau de la colonie
            </p>
          </div>

          <form className="login-form">

            <div className="form-group">
              <label htmlFor="email">
                Identifiant Citoyen
              </label>

              <input
                type="email"
                id="email"
                placeholder="citoyen@colonie.fr"
                aria-label="Adresse email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Clé d'accès
              </label>

              <input
                type="password"
                id="password"
                placeholder="********"
                aria-label="Mot de passe"
              />
            </div>

            <button type="submit">
              Ouvrir la Valve
            </button>

            <div className="auth-links">
              <Link to="/forgot-password">Mot de passe oublié ?</Link>
              <Link to="/register">Créer un compte</Link>
            </div>

          </form>

          <div className="security-box">
            <h3>🔒 Transmission sécurisée</h3>
            <p>
              Certains secteurs nécessitent une
              double authentification (2FA).
            </p>
          </div>

          </div>
        </section>
      </div>
    </>
  );
}

export default Login