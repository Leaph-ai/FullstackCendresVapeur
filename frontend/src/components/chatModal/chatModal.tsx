import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './chatModal.css';
import { useChat } from './useChat';

const TYPING_PING_INTERVAL_MS = 2000;

function formatTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function statusLabel(status: string, onlineCount: number): string {
  switch (status) {
    case 'connecting':
      return 'Connexion au télégraphe…';
    case 'open':
      return `En ligne · ${onlineCount} participant${onlineCount > 1 ? 's' : ''}`;
    case 'no-token':
      return 'Connexion requise';
    case 'forbidden':
      return 'Accès réservé';
    case 'closed':
      return 'Déconnecté';
    case 'error':
      return 'Erreur de connexion';
    default:
      return '';
  }
}

export function ChatModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const {
    status,
    messages,
    online,
    typingUsers,
    myId,
    error,
    sendMessage,
    sendTyping,
  } = useChat(isOpen);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const lastTypingSent = useRef(0);

  // Auto-scroll vers le bas à chaque nouveau message / frappe.
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const canSend = status === 'open' && inputValue.trim().length > 0;

  const handleSendMessage = () => {
    if (!canSend) return;
    sendMessage(inputValue);
    setInputValue('');
    sendTyping(false);
    lastTypingSent.current = 0;
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (status !== 'open') return;
    const now = Date.now();
    if (now - lastTypingSent.current > TYPING_PING_INTERVAL_MS) {
      sendTyping(true);
      lastTypingSent.current = now;
    }
  };

  const renderBody = () => {
    if (status === 'no-token') {
      return (
        <p className="chat-state-notice">
          Le Télégraphe de l'Ombre est réservé aux membres connectés. Veuillez vous
          authentifier au réseau de la colonie.
        </p>
      );
    }
    if (status === 'forbidden') {
      return (
        <p className="chat-state-notice">
          Canal restreint aux Éditeurs et Administrateurs de la colonie.
        </p>
      );
    }
    // Tant qu'aucun message n'est chargé, on reflète l'état de connexion. Dès
    // qu'on en a, on les garde affichés même pendant une reconnexion (à la
    // réouverture du modal) : l'historique ne doit pas clignoter ni disparaître.
    if (messages.length === 0) {
      if (status === 'connecting') {
        return <p className="chat-state-notice">Établissement de la liaison…</p>;
      }
      if (status === 'closed' || status === 'error') {
        return (
          <p className="chat-state-notice">
            {error ?? 'Liaison interrompue. Rouvrez le télégraphe pour réessayer.'}
          </p>
        );
      }
      return <p className="chat-state-notice">Aucun message pour le moment.</p>;
    }

    return (
      <>
        {messages.map((message) => {
          const isOwn = message.sender_id === myId;
          const roleClass = isOwn ? 'admin' : 'editor';
          return (
            <div key={message.id} className={`chat-message ${roleClass}`}>
              <div className="message-avatar">
                <span className="avatar-badge">
                  {message.sender_username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="message-content">
                <div className="message-header">
                  <strong className={`message-author ${roleClass}`}>
                    {isOwn ? 'Vous' : message.sender_username}
                  </strong>
                  <span className="message-time">{formatTime(message.created_at)}</span>
                </div>
                <p className="message-text">{message.content}</p>
              </div>
            </div>
          );
        })}
        {typingUsers.length > 0 && (
          <p className="chat-typing" aria-live="polite">
            {typingUsers.join(', ')} {typingUsers.length > 1 ? 'écrivent' : 'écrit'}…
          </p>
        )}
        <div ref={messagesEndRef} />
      </>
    );
  };

  const onlineCount = online.length;

  return createPortal(
    <>
      {/* Bouton flottant pour ouvrir le chat */}
      <button
        className={`chat-toggle-button ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Ouvrir le chat"
        title="Télégraphe de l'Ombre"
      >
        <svg className="chat-icon" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3.01 1.01 4.34L2 22l6.66-1.01C8.99 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"
            strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
          <circle cx="8" cy="12" r="1" fill="currentColor" />
          <circle cx="16" cy="12" r="1" fill="currentColor" />
        </svg>
      </button>

      {/* Modal du chat */}
      {isOpen && (
        <div className="chat-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="chat-header">
              <div className="chat-header-content">
                <h3>Télégraphe de l'Ombre</h3>
                <p className="chat-status">{statusLabel(status, onlineCount)}</p>
              </div>
              <button
                className="chat-close-button"
                onClick={() => setIsOpen(false)}
                aria-label="Fermer le chat"
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div className="chat-messages">{renderBody()}</div>

            {/* Input */}
            <div className="chat-input-area">
              <input
                type="text"
                className="chat-input"
                placeholder={status === 'open' ? 'Écrire un message…' : 'Indisponible'}
                value={inputValue}
                disabled={status !== 'open'}
                aria-label="Message à envoyer"
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
              />
              <button
                className="chat-send-button"
                onClick={handleSendMessage}
                disabled={!canSend}
                aria-label="Envoyer le message"
              >
                ✉
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}
