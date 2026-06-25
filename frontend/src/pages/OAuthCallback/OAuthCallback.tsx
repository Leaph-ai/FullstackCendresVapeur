import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AUTH_CHANGED_EVENT } from '../../context/authEvents';

/**
 * Page intermédiaire appelée après le callback Google OAuth.
 * Le backend redirige ici avec ?token=<jwt>.
 * On stocke le token et on redirige vers l'accueil.
 */
export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('access_token', token);
      window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
      navigate('/', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', color: '#d8975b' }}>
      Connexion en cours…
    </div>
  );
}
