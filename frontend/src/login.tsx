import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './login.css';
import { MachineRail } from '@cv/components/layout/MachineRail';
import { SteamChimney } from '@cv/components/layout/SteamChimney';
import { Topbar } from '@cv/components/layout/Topbar';
import { useScrollRail } from '@cv/hooks/useScrollRail';

function Login() {
  const railRef = useScrollRail();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const response = await fetch('http://127.0.0.1:8000/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Identifiants invalides');
      }
      console.log('Login response:', data);
      console.log('Requires 2FA:', data.requires_2fa);
      console.log("tedtttttttttttt")

      if (data.requires_2fa) {
        localStorage.setItem('challenge_token', data.challenge_token);
        navigate('/verify-2fa');
      } else {
        localStorage.setItem('access_token', data.access_token);
        navigate('/');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erreur de connexion');
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