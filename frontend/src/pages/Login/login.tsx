import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './login.css';
import { MachineRail } from '@cv/components/layout/MachineRail';
import { SteamChimney } from '@cv/components/layout/SteamChimney';
import { Topbar } from '@cv/components/layout/Topbar';
import { useScrollRail } from '@cv/hooks/useScrollRail';
import { apiPost } from '../../api/client';
import ErrorBanner from '../../components/feedback/ErrorBanner';

interface LoginResponse {
  requires_2fa: boolean;
  challenge_token?: string;
  access_token?: string;
}

function Login() {
  const railRef = useScrollRail();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const data = await apiPost<LoginResponse>('/auth/login', { email, password });

      if (data.requires_2fa) {
        localStorage.setItem('challenge_token', data.challenge_token ?? '');
        navigate('/verify-2fa');
      } else {
        localStorage.setItem('access_token', data.access_token ?? '');
        navigate('/');
      }
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

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
              <p>Authentification au réseau de la colonie</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>

              <ErrorBanner error={error} />

              <div className="form-group">
                <label htmlFor="email">Identifiant Citoyen</label>
                <input
                  type="email"
                  id="email"
                  placeholder="citoyen@colonie.fr"
                  aria-label="Adresse email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Clé d'accès</label>
                <input
                  type="password"
                  id="password"
                  placeholder="********"
                  aria-label="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button type="submit" disabled={loading}>
                {loading ? 'Connexion...' : 'Ouvrir la Valve'}
              </button>

              <div className="auth-links">
                <Link to="/forgot-password">Mot de passe oublié ?</Link>
                <Link to="/register">Créer un compte</Link>
              </div>

            </form>

            <div className="security-box">
              <h3>🔒 Transmission sécurisée</h3>
              <p>Certains secteurs nécessitent une double authentification (2FA).</p>
            </div>

          </div>
        </section>
      </div>
    </>
  );
}

export default Login;
