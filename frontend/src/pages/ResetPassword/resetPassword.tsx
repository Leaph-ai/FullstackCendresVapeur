import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../ForgotPassword/forgotPassword.css';
import { MachineRail } from '@cv/components/layout/MachineRail';
import { SteamChimney } from '@cv/components/layout/SteamChimney';
import { Topbar } from '@cv/components/layout/Topbar';
import { useScrollRail } from '@cv/hooks/useScrollRail';
import { apiPost } from '../../api/client';
import ErrorBanner from '../../components/feedback/ErrorBanner';

interface MessageResponse {
  message: string;
}

interface LocationState {
  email?: string;
}

function ResetPassword() {
  const railRef = useScrollRail();
  const navigate = useNavigate();
  const location = useLocation();
  const initialEmail = (location.state as LocationState | null)?.email ?? '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      await apiPost<MessageResponse>('/auth/reset-password', {
        email,
        code,
        new_password: newPassword,
      });

      navigate('/login', {
        state: { message: 'Mot de passe réinitialisé. Vous pouvez vous connecter.' },
      });
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

        <section className="forgot-page">
          <div className="forgot-container">

            <h1>Nouveau mot de passe</h1>

            <p>
              Entrez le code reçu par email et choisissez un nouveau mot de passe.
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

              <input
                type="text"
                placeholder="Code à 6 chiffres"
                aria-label="Code de récupération"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
                pattern="\d{6}"
                required
              />

              <input
                type="password"
                placeholder="Nouveau mot de passe"
                aria-label="Nouveau mot de passe"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />

              <button type="submit" disabled={loading}>
                {loading ? 'Réinitialisation...' : 'Réinitialiser'}
              </button>

              <div className="auth-links">
                <Link to="/login">Retour à la connexion</Link>
                <Link to="/forgot-password">Renvoyer un code</Link>
              </div>

            </form>

          </div>
        </section>
      </div>
    </>
  );
}

export default ResetPassword;
