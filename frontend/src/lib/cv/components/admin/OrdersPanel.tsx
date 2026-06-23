import { useState, useEffect } from 'react';
import './panels.css';

interface OrderItem {
    id: number;
    product_id: number;
    quantity: number;
    unit_price: number;
}

interface ApiOrder {
    id: number;
    user_id: number;
    discount_code_id: number | null;
    total_amount: string;
    status: string;
    created_at: string;
    items: OrderItem[];
}

const API_BASE = 'http://127.0.0.1:8000';

const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('access_token') ?? ''}`,
});

export function OrdersPanel() {
    const [orders, setOrders] = useState<ApiOrder[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAllOrders = async () => {
            setLoading(true);
            setError(null);
            try {
                // 1. Récupère tous les users
                const usersRes = await fetch(`${API_BASE}/users`, { headers: getAuthHeaders() });
                if (!usersRes.ok) throw new Error(`Erreur users ${usersRes.status}`);
                const users: { id: number }[] = await usersRes.json();

                // 2. Fetch les commandes de chaque user en parallèle
                const results = await Promise.allSettled(
                    users.map((u) =>
                        fetch(`${API_BASE}/orders/user/${u.id}`, { headers: getAuthHeaders() })
                            .then((r) => (r.ok ? r.json() : []))
                    )
                );

                const allOrders = results.flatMap((r) =>
                    r.status === 'fulfilled' ? r.value : []
                );

                // Tri par date desc
                allOrders.sort(
                    (a: ApiOrder, b: ApiOrder) =>
                        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                );

                setOrders(allOrders);
            } catch (err) {
                setError('Impossible de charger les commandes.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllOrders();
    }, []);

const handleDeleteOrder = async (id: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) return;
    try {
        const res = await fetch(`${API_BASE}/orders/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token') ?? ''}`,
            },
        });
        if (!res.ok) throw new Error(`Erreur ${res.status}`);
        setOrders((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
        alert('Erreur lors de la suppression.');
        console.error(err);
    }
};

    const filteredOrders = orders.filter(
        (o) =>
            String(o.id).includes(searchQuery) ||
            String(o.user_id).includes(searchQuery) ||
            o.status.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="panel-content">
            <div className="panel-header">
                <h2>Gestion des Commandes</h2>
                <p className="panel-subtitle">
                    {filteredOrders.length} commande(s) {searchQuery ? 'trouvée(s)' : 'au total'}
                </p>
            </div>

            <div className="panel-controls">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Rechercher par ID, user, statut..."
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {loading && <p className="panel-feedback">Chargement...</p>}
            {error && <p className="panel-feedback panel-error">{error}</p>}

            {!loading && !error && (
                <div className="panel-table-wrapper">
                    <table className="panel-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>User ID</th>
                                <th>Total (ⵟ)</th>
                                <th>Statut</th>
                                <th>Articles</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.map((order) => (
                                <tr key={order.id}>
                                    <td className="order-number">#{order.id}</td>
                                    <td>{order.user_id}</td>
                                    <td className="price-cell">
                                        {parseFloat(order.total_amount).toFixed(2)}
                                    </td>
                                    <td>
                                        <span className={`order-status status-${order.status}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td>{order.items.length} article(s)</td>
                                    <td>{new Date(order.created_at).toLocaleDateString('fr-FR')}</td>
                                    <td className="actions-cell">
                                        <button
                                            className="btn-small btn-delete"
                                            title="Supprimer"
                                            onClick={() => handleDeleteOrder(order.id)}
                                        >
                                            ✕
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}