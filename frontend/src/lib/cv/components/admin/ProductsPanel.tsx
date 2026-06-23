import { useState } from 'react';
import './panels.css';

interface Product {
    id: number;
    name: string;
    category: string;
    price: number;
    stock: number;
    status: 'active' | 'inactive';
}

type ProductFormData = Omit<Product, 'id'>;

const DEMO_PRODUCTS: Product[] = [
    {
        id: 1,
        name: 'Régulateur de pression Mk.III',
        category: 'Mécanique lourde',
        price: 48,
        stock: 12,
        status: 'active',
    },
    {
        id: 2,
        name: 'Valve d\'appoint laiton',
        category: 'Vapeur',
        price: 31,
        stock: 8,
        status: 'active',
    },
    {
        id: 3,
        name: 'Lentille optique cuivrée',
        category: 'Optique',
        price: 76,
        stock: 5,
        status: 'active',
    },
    {
        id: 4,
        name: 'Manomètre de quart',
        category: 'Mesure',
        price: 22,
        stock: 0,
        status: 'inactive',
    },
    {
        id: 5,
        name: 'Détendeur à soupape',
        category: 'Mécanique',
        price: 54,
        stock: 15,
        status: 'active',
    },
];

export function ProductsPanel() {
    const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
    const [searchQuery, setSearchQuery] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [formData, setFormData] = useState<ProductFormData>({
        name: '',
        category: '',
        price: 0,
        stock: 0,
        status: 'active',
    });

    const filteredProducts = products.filter(
        (product) =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddProduct = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            category: '',
            price: 0,
            stock: 0,
            status: 'active',
        });
        setShowModal(true);
    };

    const handleEditProduct = (product: Product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            category: product.category,
            price: product.price,
            stock: product.stock,
            status: product.status,
        });
        setShowModal(true);
    };

    const handleDeleteProduct = (id: number) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
            setProducts(products.filter((p) => p.id !== id));
        }
    };

    const handleSaveProduct = () => {
        if (!formData.name || !formData.category || formData.price < 0 || formData.stock < 0) {
            alert('Veuillez remplir tous les champs correctement');
            return;
        }

        if (editingProduct) {
            setProducts(
                products.map((p) =>
                    p.id === editingProduct.id
                        ? {
                            ...p,
                            name: formData.name,
                            category: formData.category,
                            price: formData.price,
                            stock: formData.stock,
                            status: formData.status,
                        }
                        : p
                )
            );
        } else {
            const newProduct: Product = {
                id: Math.max(...products.map((p) => p.id), 0) + 1,
                ...formData,
            };
            setProducts([...products, newProduct]);
        }
        setShowModal(false);
    };

    return (
        <div className="panel-content">
            <div className="panel-header">
                <h2>Gestion des Produits</h2>
                <p className="panel-subtitle">
                    {filteredProducts.filter((p) => p.status === 'active').length} produit(s) actif(s)
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

            <div className="panel-table-wrapper">
                <table className="panel-table">
                    <thead>
                        <tr>
                            <th>Nom</th>
                            <th>Catégorie</th>
                            <th>Prix (ⵟ)</th>
                            <th>Stock</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProducts.map((product) => (
                            <tr key={product.id}>
                                <td className="product-name">{product.name}</td>
                                <td>{product.category}</td>
                                <td className="price-cell">{product.price}</td>
                                <td>
                                    <span
                                        className={`stock-indicator ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}`}
                                    >
                                        {product.stock > 0 ? `${product.stock} unités` : 'Rupture'}
                                    </span>
                                </td>
                                <td>
                                    <span className={`status-badge status-${product.status}`}>
                                        {product.status === 'active' ? 'Actif' : 'Inactif'}
                                    </span>
                                </td>
                                <td className="actions-cell">
                                    <button
                                        className="btn-small btn-edit"
                                        title="Modifier"
                                        onClick={() => handleEditProduct(product)}
                                    >
                                        ✎
                                    </button>
                                    <button
                                        className="btn-small btn-delete"
                                        title="Supprimer"
                                        onClick={() => handleDeleteProduct(product.id)}
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
                                <label>Catégorie</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="form-input"
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Prix (ⵟ)</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) =>
                                            setFormData({ ...formData, price: parseFloat(e.target.value) })
                                        }
                                        className="form-input"
                                        min="0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Stock</label>
                                    <input
                                        type="number"
                                        value={formData.stock}
                                        onChange={(e) =>
                                            setFormData({ ...formData, stock: parseInt(e.target.value) })
                                        }
                                        className="form-input"
                                        min="0"
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Statut</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            status: e.target.value as 'active' | 'inactive',
                                        })
                                    }
                                    className="form-input"
                                >
                                    <option value="active">Actif</option>
                                    <option value="inactive">Inactif</option>
                                </select>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowModal(false)}>
                                Annuler
                            </button>
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
