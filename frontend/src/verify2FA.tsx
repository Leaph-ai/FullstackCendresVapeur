import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function Verify2FA() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    const challenge_token =
      localStorage.getItem('challenge_token');

    if (!challenge_token) {
      alert('Session expirée');
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

      navigate('/');
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Erreur'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="verify-page">
      <div className="verify-container">
        <h1>Vérification 2FA</h1>

        <p>
          Entrez le code envoyé par email ou
          généré par votre application.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
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
    </div>
  );
}

export default Verify2FA;