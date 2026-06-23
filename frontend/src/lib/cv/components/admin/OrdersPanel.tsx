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
    const [orders, setOrders] = useState<Order[]>(DEMO_ORDERS);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [formData, setFormData] = useState({
        orderNumber: '',
        customer: '',
        total: 0,
        status: 'pending' as const,
    });

    const filteredOrders = orders.filter(
        (order) =>
            order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleEditOrder = (order: Order) => {
        setEditingOrder(order);
        setFormData({
            orderNumber: order.orderNumber,
            customer: order.customer,
            total: order.total,
            status: order.status,
        });
        setShowModal(true);
    };

    const handleDeleteOrder = (id: number) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette commande ?')) {
            setOrders(orders.filter((o) => o.id !== id));
        }
    };

    const handleSaveOrder = () => {
        if (!formData.orderNumber || !formData.customer || formData.total < 0) {
            alert('Veuillez remplir tous les champs correctement');
            return;
        }

        if (editingOrder) {
            setOrders(
                orders.map((o) =>
                    o.id === editingOrder.id
                        ? {
                            ...o,
                            orderNumber: formData.orderNumber,
                            customer: formData.customer,
                            total: formData.total,
                            status: formData.status,
                        }
                        : o
                )
            );
        }
        setShowModal(false);
    };

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
                        placeholder="Rechercher une commande..."
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
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
                        {filteredOrders.map((order) => (
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
                                    <button
                                        className="btn-small btn-edit"
                                        title="Modifier le statut"
                                        onClick={() => handleEditOrder(order)}
                                    >
                                        ✎
                                    </button>
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

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Modifier la commande</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>N° de commande</label>
                                <input
                                    type="text"
                                    value={formData.orderNumber}
                                    onChange={(e) =>
                                        setFormData({ ...formData, orderNumber: e.target.value })
                                    }
                                    className="form-input"
                                    disabled
                                />
                            </div>
                            <div className="form-group">
                                <label>Client</label>
                                <input
                                    type="text"
                                    value={formData.customer}
                                    onChange={(e) =>
                                        setFormData({ ...formData, customer: e.target.value })
                                    }
                                    className="form-input"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Total (ⵟ)</label>
                                    <input
                                        type="number"
                                        value={formData.total}
                                        onChange={(e) =>
                                            setFormData({ ...formData, total: parseFloat(e.target.value) })
                                        }
                                        className="form-input"
                                        min="0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Statut</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                status: e.target.value as
                                                    | 'pending'
                                                    | 'processing'
                                                    | 'shipped'
                                                    | 'delivered',
                                            })
                                        }
                                        className="form-input"
                                    >
                                        <option value="pending">En attente</option>
                                        <option value="processing">En traitement</option>
                                        <option value="shipped">Expédié</option>
                                        <option value="delivered">Livré</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowModal(false)}>
                                Annuler
                            </button>
                            <button className="btn-save" onClick={handleSaveOrder}>
                                Modifier
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
