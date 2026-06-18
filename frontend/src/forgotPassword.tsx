import { Link } from 'react-router-dom';
import './forgotPassword.css';
import { MachineRail } from '@cv/components/layout/MachineRail';
import { SteamChimney } from '@cv/components/layout/SteamChimney';
import { Topbar } from '@cv/components/layout/Topbar';
import { useScrollRail } from '@cv/hooks/useScrollRail';

function ForgotPassword() {
  const railRef = useScrollRail();

  return (
    <>
      <MachineRail railRef={railRef} />
      <SteamChimney />
      <div className="auth-shell">
        <Topbar cartCount={0} activeSection="forgot" />

        <section className="forgot-page">
          <div className="forgot-container">

          <h1>Mot de passe oublié</h1>

          <p>
            Un code de récupération sera envoyé.
          </p>

          <form className="forgot-form">

            <input
              type="email"
              placeholder="citoyen@colonie.fr"
              aria-label="Adresse email"
            />

            <button type="submit">
              Envoyer
            </button>

            <div className="auth-links">
              <Link to="/login">Retour à la connexion</Link>
              <Link to="/register">Créer un compte</Link>
            </div>

          </form>

        </div>
        </section>
      </div>
    </>
  );
}

export default ForgotPassword