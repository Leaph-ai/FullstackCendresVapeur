import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './register.css';
import { MachineRail } from '@cv/components/layout/MachineRail';
import { SteamChimney } from '@cv/components/layout/SteamChimney';
import { Topbar } from '@cv/components/layout/Topbar';
import { useScrollRail } from '@cv/hooks/useScrollRail';
import ErrorBanner from '../../components/feedback/ErrorBanner';

function Register() {
  const railRef = useScrollRail();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

const handleSubmit = async (e: any) => {
  e.preventDefault();

    setError(null);

    if (password !== confirmPassword) {
      setError(new Error('Les mots de passe ne correspondent pas.'));
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        'http://127.0.0.1:8000/auth/register',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Erreur lors de l'inscription"
        );
      }

      navigate('/login', {
        state: {
          message: 'Compte créé avec succès',
        },
      });

    } catch (err) {
      console.error(err);
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
        <Topbar cartCount={0} activeSection="register" />

        <main className="register-page" id="contenu">
          <div className="register-container">
            <h1>Rejoindre la Colonie</h1>

            <p className="subtitle">
              Création d'un nouveau citoyen
            </p>

            <form
              className="register-form"
              onSubmit={handleSubmit}
            >
              <ErrorBanner error={error} />

              <label htmlFor="register-email">Adresse email</label>
              <input
                type="email"
                id="register-email"
                placeholder="Adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <label htmlFor="register-password">Mot de passe</label>
              <input
                type="password"
                id="register-password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <label htmlFor="register-confirm">Confirmation du mot de passe</label>
              <input
                type="password"
                id="register-confirm"
                placeholder="Confirmation"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                required
              />

              <button
                type="submit"
                disabled={loading}
              >
                {loading
                  ? 'Création...'
                  : "S'enregistrer"}
              </button>

              <div className="auth-links">
                <Link to="/login">
                  Déjà citoyen ? Se connecter
                </Link>

                <Link to="/forgot-password">
                  Mot de passe oublié ?
                </Link>
              </div>
            </form>
          </div>
        </main>
      </div>
    </>
  );
}

export default Register;