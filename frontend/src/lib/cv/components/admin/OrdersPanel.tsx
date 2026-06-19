import { useState } from 'react';
import './panels.css';

interface Order {
    id: number;
    orderNumber: string;
    customer: string;
    total: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered';
    date: string;
}

const DEMO_ORDERS: Order[] = [
    {
        id: 1,
        orderNumber: 'CMD-2024-001',
        customer: 'Jean Dupont',
        total: 125,
        status: 'delivered',
        date: '2024-06-15',
    },
    {
        id: 2,
        orderNumber: 'CMD-2024-002',
        customer: 'Marie Martin',
        total: 87,
        status: 'shipped',
        date: '2024-06-18',
    },
    {
        id: 3,
        orderNumber: 'CMD-2024-003',
        customer: 'Pierre Lefevre',
        total: 234,
        status: 'processing',
        date: '2024-06-19',
    },
    {
        id: 4,
        orderNumber: 'CMD-2024-004',
        customer: 'Sophie Bernard',
        total: 156,
        status: 'pending',
        date: '2024-06-19',
    },
];

const STATUS_LABELS = {
    pending: 'En attente',
    processing: 'En traitement',
    shipped: 'Expédié',
    delivered: 'Livré',
};

export function OrdersPanel() {
    const [orders] = useState<Order[]>(DEMO_ORDERS);

    return (
        <div className="panel-content">
            <div className="panel-header">
                <h2>Gestion des Commandes</h2>
                <p className="panel-subtitle">
                    {orders.length} commande(s) au total
                </p>
            </div>

            <div className="panel-controls">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Rechercher une commande..."
                        className="search-input"
                    />
                </div>
            </div>

            <div className="panel-table-wrapper">
                <table className="panel-table">
                    <thead>
                        <tr>
                            <th>N° Commande</th>
                            <th>Client</th>
                            <th>Total (ⵟ)</th>
                            <th>Statut</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.map((order) => (
                            <tr key={order.id}>
                                <td className="order-number">{order.orderNumber}</td>
                                <td>{order.customer}</td>
                                <td className="price-cell">{order.total}</td>
                                <td>
                                    <span className={`order-status status-${order.status}`}>
                                        {STATUS_LABELS[order.status]}
                                    </span>
                                </td>
                                <td>{new Date(order.date).toLocaleDateString('fr-FR')}</td>
                                <td className="actions-cell">
                                    <button className="btn-small btn-view" title="Voir les détails">
                                        👁
                                    </button>
                                    <button className="btn-small btn-edit" title="Modifier">
                                        ✎
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
