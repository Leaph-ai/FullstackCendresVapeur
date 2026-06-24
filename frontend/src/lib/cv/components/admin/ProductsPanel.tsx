import { useState, useEffect } from 'react';
import './panels.css';

interface Product {
    id: number;
    name: string;
    description: string;
    category_id: number;
    price: number;
    stock: number;
    status: 'active' | 'inactive';
}

const API_BASE = 'http://127.0.0.1:8000';

const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('access_token') ?? ''}`,
});

export function ProductsPanel() {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category_id: 0,
        price: 0,
        stock: 0,
        status: 'active' as 'active' | 'inactive',
    });

    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/products`);
            if (!res.ok) throw new Error(`Erreur ${res.status}`);
            const data = await res.json();
            setProducts(data);
        } catch (err) {
            setError('Impossible de charger les produits.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const filteredProducts = products.filter(
        (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            String(p.category_id).includes(searchQuery)
    );

    const resetForm = () => {
        setFormData({ name: '', description: '', category_id: 0, price: 0, stock: 0, status: 'active' });
    };

    const handleAddProduct = () => {
        setEditingProduct(null);
        resetForm();
        setShowModal(true);
    };

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description ?? '',
            category_id: product.category_id,
            price: product.price,
            stock: product.stock,
            status: product.status,
        });
        setShowModal(true);
    };

    const handleDeleteProduct = async (id: number) => {
        if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;
        try {
            const res = await fetch(`${API_BASE}/products/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });
            if (!res.ok) throw new Error(`Erreur ${res.status}`);
            setProducts((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
            alert('Erreur lors de la suppression.');
            console.error(err);
        }
    };

    const handleSaveProduct = async () => {
        if (!formData.name || formData.price <= 0 || formData.stock < 0) {
            alert('Veuillez remplir tous les champs correctement');
            return;
        }

        const body = {
            name: formData.name,
            description: formData.description,
            category_id: formData.category_id,
            price: formData.price,
            stock: formData.stock,
        };

        try {
            if (editingProduct) {
                const res = await fetch(`${API_BASE}/products/${editingProduct.id}`, {
                    method: 'PUT',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(body),
                });
                if (!res.ok) throw new Error(`Erreur ${res.status}`);
                const updated = await res.json();
                setProducts((prev) =>
                    prev.map((p) => (p.id === editingProduct.id ? { ...p, ...updated } : p))
                );
            } else {
                const res = await fetch(`${API_BASE}/products`, {
                    method: 'POST',
                    headers: getAuthHeaders(),
                    body: JSON.stringify(body),
                });
                if (!res.ok) throw new Error(`Erreur ${res.status}`);
                const created = await res.json();
                setProducts((prev) => [...prev, created]);
            }
            setShowModal(false);
        } catch (err) {
            alert('Erreur lors de la sauvegarde.');
            console.error(err);
        }
    };

    return (
        <div className="panel-content">
            <div className="panel-header">
                <h2>Gestion des Produits</h2>
                <p className="panel-subtitle">
                    {filteredProducts.length} produit(s) affiché(s)
                </p>
            </div>

            <div className="panel-controls">
                <button className="btn-primary" onClick={handleAddProduct}>+ Ajouter un produit</button>
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Rechercher un produit..."
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {loading && <p className="panel-feedback">Chargement...</p>}
            {error && <p className="panel-feedback panel-error">{error}</p>}

            {!loading && !error && (
                <div className="panel-table-wrapper" tabIndex={0} role="region" aria-label="Tableau des produits">
                    <table className="panel-table">
                        <thead>
                            <tr>
                                <th scope="col">Nom</th>
                                <th scope="col">Cat. ID</th>
                                <th scope="col">Description</th>
                                <th scope="col">Prix (ⵟ)</th>
                                <th scope="col">Stock</th>
                                <th scope="col">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((product) => (
                                <tr key={product.id}>
                                    <td className="product-name">{product.name}</td>
                                    <td>{product.category_id}</td>
                                    <td>{product.description}</td>
                                    <td className="price-cell">{product.price}</td>
                                    <td>
                                        <span className={`stock-indicator ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}>
                                            {product.stock > 0 ? `${product.stock} unités` : 'Rupture'}
                                        </span>
                                    </td>
                                    <td className="actions-cell">
                                        <button className="btn-small btn-edit" title="Modifier" onClick={() => handleEditProduct(product)}>✎</button>
                                        <button className="btn-small btn-delete" title="Supprimer" onClick={() => handleDeleteProduct(product.id)}>✕</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingProduct ? 'Modifier un produit' : 'Ajouter un produit'}</h3>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group">
                                <label>Nom du produit</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label>Category ID</label>
                                <input
                                    type="number"
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({ ...formData, category_id: parseInt(e.target.value) || 0 })}
                                    className="form-input"
                                    min="0"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Prix (ⵟ)</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                                        className="form-input"
                                        min="1"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Stock</label>
                                    <input
                                        type="number"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                                        className="form-input"
                                        min="0"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowModal(false)}>Annuler</button>
                            <button className="btn-save" onClick={handleSaveProduct}>
                                {editingProduct ? 'Modifier' : 'Ajouter'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}