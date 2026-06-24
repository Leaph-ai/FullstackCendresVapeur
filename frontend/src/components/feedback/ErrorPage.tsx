import { Link } from 'react-router-dom';
import './errorPage.css';

export default function ErrorPage({
  code,
  title,
  detail,
}: {
  code: string;
  title: string;
  detail?: string;
}) {
  return (
    <main className="cv-errpage" role="main">
      <p className="cv-errpage__plate" aria-label={`Code d'erreur ${code}`}>
        {code}
      </p>
      <h1 className="cv-errpage__title">{title}</h1>
      {detail && <p className="cv-errpage__detail">{detail}</p>}
      <Link className="cv-errpage__home" to="/" aria-label="Retour à l'accueil">
        ⟵ Retour à l'accueil
      </Link>
    </main>
  );
}
