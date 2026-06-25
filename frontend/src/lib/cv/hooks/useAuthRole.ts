import { useState, useEffect } from 'react';
import { getRoleLevelFromToken } from '../../../api/chat';
import { AUTH_CHANGED_EVENT } from '../../../context/authEvents';

export function useAuthRole() {
  const [role, setRole] = useState<number | null>(getRoleLevelFromToken());

  useEffect(() => {
    const handleAuthChange = () => {
      setRole(getRoleLevelFromToken());
    };

    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  return role;
}
