import { apiGet } from './client';

/** Niveau de rôle minimal requis pour le chat (cf. RoleLevel.EDITOR backend). */
export const CHAT_MIN_ROLE_LEVEL = 2;

/** Lit le `role_level` encodé dans le JWT en localStorage (ou null). */
export function getRoleLevelFromToken(): number | null {
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return typeof payload.role_level === 'number' ? payload.role_level : null;
  } catch {
    return null;
  }
}

// ── Types miroirs des schemas Pydantic backend (app/chat/schemas.py) ─────────

export interface ChatMessageResponse {
  id: number;
  sender_id: number;
  sender_username: string;
  content: string;
  created_at: string;
}

export interface PresenceUser {
  user_id: number;
  username: string;
}

// ── Trames WebSocket reçues du backend (app/routes/chat.py) ──────────────────

export type ChatServerFrame =
  | { type: 'message'; data: ChatMessageResponse }
  | { type: 'typing'; data: { user_id: number; username: string; is_typing: boolean } }
  | { type: 'presence'; data: { online: PresenceUser[] } }
  | { type: 'error'; data: { detail: string } };

// ── Trames WebSocket envoyées au backend ─────────────────────────────────────

export type ChatClientFrame =
  | { type: 'message'; content: string }
  | { type: 'typing'; is_typing: boolean };

// ── Appels API ───────────────────────────────────────────────────────────────

/** GET /chat/messages — historique récent (rôle Éditeur+ requis). */
export function getMessages(afterId?: number, limit = 50): Promise<ChatMessageResponse[]> {
  const params = new URLSearchParams();
  if (afterId !== undefined) params.set('after_id', String(afterId));
  params.set('limit', String(limit));
  return apiGet<ChatMessageResponse[]>(`/chat/messages?${params.toString()}`);
}

/**
 * Construit l'URL du WebSocket chat, en passant le JWT en query param.
 * Passe par le proxy Vite `/api` (ws: true) → backend `/chat/ws`, donc même
 * origine que la page (pas de souci CORS / mixed-content).
 */
export function buildChatWsUrl(token: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
  return `${protocol}://${window.location.host}/api/chat/ws?token=${encodeURIComponent(token)}`;
}
