import { Link } from 'react-router-dom';
import './register.css';
import { MachineRail } from '@cv/components/layout/MachineRail';
import { SteamChimney } from '@cv/components/layout/SteamChimney';
import { Topbar } from '@cv/components/layout/Topbar';
import { useScrollRail } from '@cv/hooks/useScrollRail';

function Register() {
  const railRef = useScrollRail();

  return (
    <>
      <MachineRail railRef={railRef} />
      <SteamChimney />
      <div className="auth-shell">
        <Topbar cartCount={0} activeSection="register" />

        <section className="register-page">
          <div className="register-container">

          <h1>Rejoindre la Colonie</h1>

          <p className="subtitle">
            Création d'un nouveau citoyen
          </p>

          <form className="register-form">

            <input
              type="text"
              placeholder="Nom complet"
              aria-label="Nom complet"
            />

            <input
              type="email"
              placeholder="Adresse email"
              aria-label="Adresse email"
            />

            <input
              type="password"
              placeholder="Mot de passe"
              aria-label="Mot de passe"
            />

            <input
              type="password"
              placeholder="Confirmation"
              aria-label="Confirmation du mot de passe"
            />

            <button type="submit">
              S'enregistrer
            </button>

            <div className="auth-links">
              <Link to="/login">Déjà citoyen ? Se connecter</Link>
              <Link to="/forgot-password">Mot de passe oublié ?</Link>
            </div>

          </form>

        </div>
        </section>
      </div>
    </>
  );
}

export default Register