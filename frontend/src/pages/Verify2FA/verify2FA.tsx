import { useScrollRail } from '@cv/hooks/useScrollRail';
import './verify2FA.css';

import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SteamChimney } from '@cv/components/layout/SteamChimney';
import { MachineRail } from '@cv/components/layout/MachineRail';
import { Topbar } from '@cv/components/layout/Topbar';
import { AUTH_CHANGED_EVENT } from '../../context/authEvents';
import ErrorBanner from '../../components/feedback/ErrorBanner';

function Verify2FA() {
  const railRef = useScrollRail();
    const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectParam = searchParams.get('redirect');
  const redirectTo =
    redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
      ? redirectParam
      : '/';


  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);


  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError(null);

    const challenge_token =
      localStorage.getItem('challenge_token');

    if (!challenge_token) {
      setError(new Error('Session expirée. Veuillez vous reconnecter.'));
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        'http://127.0.0.1:8000/auth/verify-2fa',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            challenge_token,
            code,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || 'Code invalide'
        );
      }

      localStorage.setItem(
        'access_token',
        data.access_token
      );

      localStorage.removeItem(
        'challenge_token'
      );

      window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
      navigate(redirectTo);
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
        <Topbar cartCount={0} activeSection="2fa" />

        <main className="verify-page" id="contenu">
          <div className="verify-container">
            <h1>Vérification 2FA</h1>

        <p>
          Entrez le code envoyé par email ou
          généré par votre application.
        </p>

        <form onSubmit={handleSubmit}>
          <ErrorBanner error={error} />

          <label htmlFor="code-2fa">Code de vérification</label>
          <input
            type="text"
            id="code-2fa"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="350285"
            value={code}
            onChange={(e) =>
              setCode(e.target.value)
            }
            maxLength={6}
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? 'Vérification...'
              : 'Valider'}
          </button>
        </form>
          </div>
        </main>
      </div>
    </>
  );
}

export default Verify2FA;