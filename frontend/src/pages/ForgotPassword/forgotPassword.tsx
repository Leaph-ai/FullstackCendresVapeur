import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './forgotPassword.css';
import { MachineRail } from '@cv/components/layout/MachineRail';
import { SteamChimney } from '@cv/components/layout/SteamChimney';
import { Topbar } from '@cv/components/layout/Topbar';
import { useScrollRail } from '@cv/hooks/useScrollRail';
import { apiPost } from '../../api/client';
import ErrorBanner from '../../components/feedback/ErrorBanner';

interface MessageResponse {
  message: string;
}

function ForgotPassword() {
  const railRef = useScrollRail();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      await apiPost<MessageResponse>('/auth/forgot-password', { email });
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MachineRail railRef={railRef} />
      <SteamChimney />
      <div className="auth-shell">
        <Topbar cartCount={0} activeSection="forgot" />

        <main className="forgot-page" id="contenu">
          <div className="forgot-container">

          <h1>Mot de passe oublié</h1>

          <p>
            Un code de récupération sera envoyé.
          </p>

          <form className="forgot-form" onSubmit={handleSubmit}>

            <ErrorBanner error={error} />

            <input
              type="email"
              placeholder="citoyen@colonie.fr"
              aria-label="Adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <button type="submit" disabled={loading}>
              {loading ? 'Envoi...' : 'Envoyer'}
            </button>

            <div className="auth-links">
              <Link to="/login">Retour à la connexion</Link>
              <Link to="/register">Créer un compte</Link>
            </div>

          </form>

        </div>
        </main>
      </div>
    </>
  );
}

export default ForgotPassword
