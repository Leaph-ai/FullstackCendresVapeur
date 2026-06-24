import { ApiError } from '../../api/client';
import './errorBanner.css';

export default function ErrorBanner({ error }: { error: unknown | null }) {
  if (!error) return null;
  const message = error instanceof Error ? error.message : 'Erreur inconnue.';
  const code = error instanceof ApiError ? error.code : 'UNKNOWN';
  const fields = error instanceof ApiError ? error.fields : undefined;

  return (
    <div className="cv-banner" role="alert" aria-live="assertive">
      <span className="cv-banner__code">ERR · {code}</span>
      <p className="cv-banner__msg">{message}</p>
      {fields && fields.length > 0 && (
        <ul className="cv-banner__fields">
          {fields.map((f) => (
            <li key={f.field}>
              <strong>{f.field}</strong> : {f.msg}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
