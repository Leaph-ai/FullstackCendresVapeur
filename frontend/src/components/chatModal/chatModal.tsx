import { useState } from 'react';
import { createPortal } from 'react-dom';
import './chatModal.css';

interface ChatMessage {
    id: number;
    author: string;
    role: 'admin' | 'editor';
    content: string;
    timestamp: string;
}

const DEMO_MESSAGES: ChatMessage[] = [
    {
        id: 1,
        author: 'Administrateur',
        role: 'admin',
        content: 'Bonjour à tous ! Avez-vous des questions sur les dernières mises à jour ?',
        timestamp: '10:30',
    },
    {
        id: 2,
        author: 'Éditeur 1',
        role: 'editor',
        content: 'Salut ! Je voulais vérifier la section Toxicité, est-ce correctement mis à jour ?',
        timestamp: '10:32',
    },
    {
        id: 3,
        author: 'Administrateur',
        role: 'admin',
        content: 'Oui, tout est à jour. Merci de ta vérification !',
        timestamp: '10:33',
    },
    {
        id: 4,
        author: 'Éditeur 2',
        role: 'editor',
        content: 'Je pense que nous devrions ajouter plus de détails dans la section Journal',
        timestamp: '10:35',
    },
    {
        id: 5,
        author: 'Administrateur',
        role: 'admin',
        content: 'Bonne idée ! Peux-tu proposer une structure ?',
        timestamp: '10:36',
    },
];

export function ChatModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>(DEMO_MESSAGES);
    const [inputValue, setInputValue] = useState('');

    const handleSendMessage = () => {
        if (inputValue.trim()) {
            const newMessage: ChatMessage = {
                id: messages.length + 1,
                author: 'Vous',
                role: 'admin',
                content: inputValue,
                timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages([...messages, newMessage]);
            setInputValue('');
        }
    };

    return createPortal(
        <>
            {/* Bouton flottant pour ouvrir le chat */}
            <button
                className={`chat-toggle-button ${isOpen ? 'open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Ouvrir le chat"
                title="Chat Admin-Éditeurs"
            >
                <svg className="chat-icon" viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 3.01 1.01 4.34L2 22l6.66-1.01C8.99 21.64 10.46 22 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2z"
                        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="1" fill="currentColor" />
                    <circle cx="8" cy="12" r="1" fill="currentColor" />
                    <circle cx="16" cy="12" r="1" fill="currentColor" />
                </svg>
                <span className="chat-notification-badge">3</span>
            </button>

            {/* Modal du chat */}
            {isOpen && (
                <div className="chat-modal-overlay" onClick={() => setIsOpen(false)}>
                    <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="chat-header">
                            <div className="chat-header-content">
                                <h3>Chat Administration</h3>
                                <p className="chat-status">En ligne · 3 participants</p>
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
                        <div className="chat-messages">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`chat-message ${message.role === 'admin' ? 'admin' : 'editor'}`}
                                >
                                    <div className="message-avatar">
                                        <span className="avatar-badge">{message.author.charAt(0)}</span>
                                    </div>
                                    <div className="message-content">
                                        <div className="message-header">
                                            <strong className={`message-author ${message.role}`}>
                                                {message.author}
                                            </strong>
                                            <span className="message-time">{message.timestamp}</span>
                                        </div>
                                        <p className="message-text">{message.content}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Input */}
                        <div className="chat-input-area">
                            <input
                                type="text"
                                className="chat-input"
                                placeholder="Écrire un message..."
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSendMessage();
                                    }
                                }}
                            />
                            <button
                                className="chat-send-button"
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim()}
                            >
                                ✉
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>,
        document.body
    );
}
