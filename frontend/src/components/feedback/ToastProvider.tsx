import { useCallback, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ApiError } from '../../api/client';
import { ToastContext } from './ToastContext';
import './toast.css';

type Toast = { id: number; message: string; code: string };

export default function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const showError = useCallback(
    (e: unknown) => {
      const id = nextId.current++;
      const message = e instanceof Error ? e.message : 'Erreur inconnue.';
      const code = e instanceof ApiError ? e.code : 'UNKNOWN';
      setToasts((list) => [...list, { id, message, code }]);
      window.setTimeout(() => dismiss(id), 6000);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ showError }}>
      {children}
      <div className="cv-toast-stack" aria-live="assertive" aria-atomic="false">
        {toasts.map((t) => (
          <div key={t.id} className="cv-toast" role="alert">
            <span className="cv-toast__code">ERR · {t.code}</span>
            <span className="cv-toast__msg">{t.message}</span>
            <button
              type="button"
              className="cv-toast__close"
              aria-label="Fermer la notification"
              onClick={() => dismiss(t.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
