import { createContext } from 'react';

export type ToastContextValue = { showError: (e: unknown) => void };

export const ToastContext = createContext<ToastContextValue | null>(null);
