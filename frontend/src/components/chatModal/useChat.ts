import { useCallback, useEffect, useRef, useState } from 'react';
import { getUserIdFromToken } from '../../api/client';
import {
  buildChatWsUrl,
  CHAT_MIN_ROLE_LEVEL,
  getMessages,
  getRoleLevelFromToken,
  type ChatMessageResponse,
  type ChatServerFrame,
  type PresenceUser,
} from '../../api/chat';

export type ChatStatus =
  | 'idle' // hook désactivé (modal fermé)
  | 'no-token' // pas connecté
  | 'connecting'
  | 'open'
  | 'forbidden' // token présent mais rôle insuffisant / rejeté
  | 'error'
  | 'closed';

const TYPING_TIMEOUT_MS = 4000;

export interface UseChatResult {
  status: ChatStatus;
  messages: ChatMessageResponse[];
  online: PresenceUser[];
  typingUsers: string[];
  myId: number | null;
  error: string | null;
  sendMessage: (content: string) => void;
  sendTyping: (isTyping: boolean) => void;
}

/**
 * Gère la connexion temps réel au Télégraphe de l'Ombre : charge l'historique
 * via REST puis ouvre le WebSocket. Actif uniquement quand `enabled` est vrai
 * (modal ouvert), et ferme proprement la socket sinon.
 */
export function useChat(enabled: boolean): UseChatResult {
  const [status, setStatus] = useState<ChatStatus>('idle');
  const [messages, setMessages] = useState<ChatMessageResponse[]>([]);
  const [online, setOnline] = useState<PresenceUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const myIdRef = useRef<number | null>(getUserIdFromToken());
  const typingTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const appendMessage = useCallback((msg: ChatMessageResponse) => {
    setMessages((prev) =>
      prev.some((m) => m.id === msg.id) ? prev : [...prev, msg],
    );
  }, []);

  const clearTypingFor = useCallback((userId: number) => {
    const timer = typingTimers.current.get(userId);
    if (timer) {
      clearTimeout(timer);
      typingTimers.current.delete(userId);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setStatus('idle');
      return;
    }

    const token = localStorage.getItem('access_token');
    myIdRef.current = getUserIdFromToken();
    if (!token) {
      setStatus('no-token');
      return;
    }
    // Le backend rejette le WS avec close(4403) AVANT accept() : le navigateur
    // ne voit alors qu'un code 1006, pas 4403. On gate donc sur le role_level du
    // JWT pour afficher le bon message (le backend reste l'autorité de sécurité).
    const roleLevel = getRoleLevelFromToken();
    if (roleLevel !== null && roleLevel < CHAT_MIN_ROLE_LEVEL) {
      setStatus('forbidden');
      return;
    }

    let cancelled = false;
    const timers = typingTimers.current;
    setStatus('connecting');
    setError(null);

    // 1) Historique via REST, puis 2) WebSocket pour le temps réel.
    getMessages()
      .then((history) => {
        if (cancelled) return;
        setMessages(history);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        // 403 = rôle insuffisant ; on laisse le WS confirmer, mais on note l'erreur.
        setError(e instanceof Error ? e.message : 'Erreur de chargement');
      })
      .finally(() => {
        if (cancelled) return;
        openSocket(token);
      });

    function openSocket(authToken: string) {
      const ws = new WebSocket(buildChatWsUrl(authToken));
      wsRef.current = ws;

      ws.onopen = () => {
        if (!cancelled) setStatus('open');
      };

      ws.onmessage = (event) => {
        if (cancelled) return;
        let frame: ChatServerFrame;
        try {
          frame = JSON.parse(event.data);
        } catch {
          return;
        }
        switch (frame.type) {
          case 'message':
            appendMessage(frame.data);
            break;
          case 'presence':
            setOnline(frame.data.online);
            break;
          case 'typing': {
            const { user_id, username, is_typing } = frame.data;
            if (user_id === myIdRef.current) break;
            clearTypingFor(user_id);
            if (is_typing) {
              setTypingUsers((prev) =>
                prev.includes(username) ? prev : [...prev, username],
              );
              const timer = setTimeout(() => {
                setTypingUsers((prev) => prev.filter((u) => u !== username));
                timers.delete(user_id);
              }, TYPING_TIMEOUT_MS);
              timers.set(user_id, timer);
            } else {
              setTypingUsers((prev) => prev.filter((u) => u !== username));
            }
            break;
          }
          case 'error':
            setError(frame.data.detail);
            break;
        }
      };

      ws.onclose = (event) => {
        if (cancelled) return;
        if (event.code === 4401) {
          setStatus('no-token');
        } else if (event.code === 4403) {
          setStatus('forbidden');
        } else {
          setStatus('closed');
        }
      };

      ws.onerror = () => {
        if (!cancelled) setError('Connexion au télégraphe interrompue.');
      };
    }

    return () => {
      cancelled = true;
      timers.forEach((t) => clearTimeout(t));
      timers.clear();
      setTypingUsers([]);
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        ws.close();
      }
    };
  }, [enabled, appendMessage, clearTypingFor]);

  const sendMessage = useCallback((content: string) => {
    const ws = wsRef.current;
    const trimmed = content.trim();
    if (!trimmed || !ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'message', content: trimmed }));
  }, []);

  const sendTyping = useCallback((isTyping: boolean) => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'typing', is_typing: isTyping }));
  }, []);

  return {
    status,
    messages,
    online,
    typingUsers,
    myId: myIdRef.current,
    error,
    sendMessage,
    sendTyping,
  };
}
