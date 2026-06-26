import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SteampunkPageShell, UsersPanel, ProductsPanel, OrdersPanel } from '@cv';
import './admin.css';

type PanelType = 'users' | 'products' | 'orders';

const ADMIN_PANELS = [
    { id: 'users' as PanelType, label: 'Utilisateurs', icon: '👤' },
    { id: 'products' as PanelType, label: 'Produits', icon: '⚙' },
    { id: 'orders' as PanelType, label: 'Commandes', icon: '📦' },
];

export function Admin() {
    const [activePanel, setActivePanel] = useState<PanelType>('users');
    const [cartCount] = useState(3);

    const renderPanel = () => {
        switch (activePanel) {
            case 'users':
                return <UsersPanel />;
            case 'products':
                return <ProductsPanel />;
            case 'orders':
                return <OrdersPanel />;
            default:
                return <UsersPanel />;
        }
    };

    return (
        <SteampunkPageShell cartCount={cartCount}>
            <div className="admin-container">
                <div className="admin-header">
                    <h1>Panneau d'Administration</h1>
                    <Link to="/" className="admin-back-link">
                        ← Retour à l'accueil
                    </Link>
                </div>

                <div className="admin-layout">
                    {/* Sidebar de navigation */}
                    <aside className="admin-sidebar">
                        <div className="admin-sidebar-header">
                            <h2>Gestion</h2>
                        </div>
                        <nav className="admin-nav">
                            {ADMIN_PANELS.map((panel) => (
                                <button
                                    key={panel.id}
                                    className={`admin-nav-button ${activePanel === panel.id ? 'active' : ''}`}
                                    onClick={() => setActivePanel(panel.id)}
                                >
                                    <span className="admin-nav-icon">{panel.icon}</span>
                                    <span className="admin-nav-label">{panel.label}</span>
                                </button>
                            ))}
                        </nav>
                    </aside>

                    {/* Contenu principal */}
                    <section className="admin-content">
                        <div className="admin-panel-wrapper">
                            {renderPanel()}
                        </div>
                    </section>
                </div>
            </div>
        </SteampunkPageShell>
    );
}
